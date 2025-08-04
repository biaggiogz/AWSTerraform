import json
import boto3
import pandas as pd
import numpy as np
import pyarrow as pa
import pyarrow.parquet as pq
from io import BytesIO
from typing import Union
import re
from datetime import datetime

s3_client = boto3.client('s3')

def lambda_handler(event, context):
    """Python Lambda for intelligent Excel preprocessing"""
    
    # Extract S3 details from EventBridge event
    bucket = event['detail']['bucket']['name']
    key = event['detail']['object']['key']
    
    print(f"Processing: s3://{bucket}/{key}")
    
    try:
        # Download Excel file
        response = s3_client.get_object(Bucket=bucket, Key=key)
        excel_data = response['Body'].read()
        
        # Process Excel with intelligent type inference
        df = process_excel_with_inference(excel_data)
        
        # Generate file ID
        file_id = key.split('/')[-1].split('.')[0]
        
        # Save as Parquet
        parquet_key = f"preprocessed/{file_id}.parquet"
        save_parquet_to_s3(df, bucket, parquet_key)
        
        # Create processing metadata
        metadata = {
            'file_id': file_id,
            'original_key': key,
            'parquet_key': parquet_key,
            'rows': len(df),
            'columns': len(df.columns),
            'column_types': {col: str(df[col].dtype) for col in df.columns},
            'timestamp': datetime.utcnow().isoformat()
        }
        
        # Save metadata
        metadata_key = f"preprocessed/{file_id}_metadata.json"
        s3_client.put_object(
            Bucket=bucket,
            Key=metadata_key,
            Body=json.dumps(metadata, indent=2),
            ContentType='application/json'
        )
        
        # Trigger Rust ML analysis
        trigger_rust_analysis(bucket, parquet_key, metadata_key)
        
        print(f"📊 Python preprocessing complete: {parquet_key}")
        print(f"🚀 Rust ML analysis triggered for: {file_id}")
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Excel processed successfully',
                'parquet_key': parquet_key,
                'metadata': metadata
            })
        }
        
    except Exception as e:
        print(f"Error processing Excel: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }

def process_excel_with_inference(excel_data):
    """Process Excel with intelligent type inference"""
    
    # Read Excel file
    df = pd.read_excel(
        BytesIO(excel_data),
        sheet_name='TEST_LOOP',
        skiprows=11,
        usecols='B:V',
        dtype=str
    )
    
    # Apply intelligent type inference
    df = format_dataframe_columns(df, threshold=0.95)
    
    # Rename and clean columns
    df = df.rename(columns={'SUBS_PRE': 'SUBSYSTEM'})
    df.columns = [col if col == "SUBSYSTEM" else f"{col}_TLP" for col in df.columns]
    df['record'] = (df.groupby(['SUBSYSTEM']).cumcount() + 1).astype(int)
    
    # Clean column names
    df.columns = (
        df.columns
        .str.strip()
        .str.lower()
        .str.replace(' ', '_')
        .str.replace(r'[^\w_]', '', regex=True)
    )
    
    return df

def infer_column_type(col: pd.Series, threshold: float = 0.95) -> str:
    """Intelligent column type inference"""
    clean_col = col.dropna()
    if len(clean_col) == 0:
        return 'string'

    total_rows = len(clean_col)

    def check_numeric():
        try:
            # Direct numeric conversion
            numeric_converted = pd.to_numeric(clean_col, errors='coerce')
            numeric_success_rate = numeric_converted.notna().sum() / total_rows
            
            if numeric_success_rate >= threshold:
                valid_numeric = numeric_converted.dropna()
                if len(valid_numeric) > 0:
                    is_integer = (valid_numeric % 1 == 0).all()
                    return 'integer' if is_integer else 'float'
            
            # String-based numeric patterns
            str_col = clean_col.astype(str).str.strip()
            
            integer_patterns = [
                r'^-?\d+$',
                r'^-?\d{1,3}(,\d{3})*$',
                r'^-?\d+\.0+$',
            ]
            
            float_patterns = [
                r'^-?\d*\.\d+$',
                r'^-?\d+\.\d+$',
                r'^-?\d{1,3}(,\d{3})*\.\d+$',
                r'^-?\d+\.?\d*[eE][+-]?\d+$',
                r'^-?\d+\.?\d*%$',
            ]
            
            for pattern in integer_patterns:
                matches = str_col.str.match(pattern, na=False).sum()
                if matches / total_rows >= threshold:
                    return 'integer'
            
            for pattern in float_patterns:
                matches = str_col.str.match(pattern, na=False).sum()
                if matches / total_rows >= threshold:
                    return 'float'
            
            # Clean and retry
            cleaned_col = str_col.str.replace(',', '').str.replace('$', '').str.replace('%', '').str.replace(' ', '')
            cleaned_numeric = pd.to_numeric(cleaned_col, errors='coerce')
            cleaned_success_rate = cleaned_numeric.notna().sum() / total_rows
            
            if cleaned_success_rate >= threshold:
                valid_cleaned = cleaned_numeric.dropna()
                if len(valid_cleaned) > 0:
                    is_integer = (valid_cleaned % 1 == 0).all()
                    return 'integer' if is_integer else 'float'
                        
        except Exception:
            pass
        
        return None

    def check_datetime():
        try:
            str_col = clean_col.astype(str)
            numeric_pattern = r'^-?\d+\.?\d*$'
            numeric_matches = str_col.str.match(numeric_pattern).sum()
            if numeric_matches / total_rows >= 0.8:
                return None
            
            date_patterns = [
                r'\d{4}-\d{2}-\d{2}',
                r'\d{2}/\d{2}/\d{4}',
                r'\d{2}-\d{2}-\d{4}',
                r'\d{4}/\d{2}/\d{2}',
            ]
            
            looks_like_date = False
            for pattern in date_patterns:
                matches = str_col.str.contains(pattern, na=False).sum()
                if matches / total_rows >= 0.3:
                    looks_like_date = True
                    break
            
            if not looks_like_date:
                return None
            
            datetime_converted = pd.to_datetime(clean_col, errors='coerce')
            datetime_success = datetime_converted.notna().sum() / total_rows
            
            if datetime_success >= threshold:
                valid_dates = datetime_converted.dropna()
                if len(valid_dates) > 0:
                    min_year = valid_dates.dt.year.min()
                    max_year = valid_dates.dt.year.max()
                    if min_year >= 1900 and max_year <= 2100 and not (min_year == 1970 and max_year == 1970):
                        return 'datetime'
                    
        except Exception:
            pass
        return None

    def check_boolean():
        try:
            str_col = clean_col.astype(str).str.lower().str.strip()
            bool_values = {'true', 'false', '1', '0', 'yes', 'no', 't', 'f', 'y', 'n'}
            bool_success = str_col.isin(bool_values).sum() / total_rows
            if bool_success >= threshold:
                return 'boolean'
        except Exception:
            pass
        return None

    # Check in priority order
    for type_check in [check_numeric, check_boolean, check_datetime]:
        result = type_check()
        if result:
            return result

    return 'string'

def get_pandas_dtype(type_str: str) -> Union[str, np.dtype]:
    """Map inferred type to pandas dtype"""
    dtype_mapping = {
        'integer': 'Int64',
        'float': 'float64',
        'datetime': 'datetime64[ns]',
        'boolean': 'boolean',
        'string': 'string'
    }
    return dtype_mapping.get(type_str, 'string')

def format_dataframe_columns(df: pd.DataFrame, threshold: float = 0.95) -> pd.DataFrame:
    """Format DataFrame columns with intelligent type inference"""
    formatted_df = df.copy()
    conversion_errors = {}

    for column in formatted_df.columns:
        try:
            inferred_type = infer_column_type(formatted_df[column], threshold)
            pandas_dtype = get_pandas_dtype(inferred_type)

            print(f"Column '{column}': Inferred type = {inferred_type}")

            if inferred_type == 'datetime':
                formatted_df[column] = pd.to_datetime(formatted_df[column], errors='coerce')
            elif inferred_type == 'boolean':
                formatted_df[column] = formatted_df[column].astype(str).str.lower().str.strip()
                formatted_df[column] = formatted_df[column].map({
                    'true': True, 'false': False, 't': True, 'f': False,
                    '1': True, '0': False, 'yes': True, 'no': False,
                    'y': True, 'n': False
                })
            elif inferred_type in ['integer', 'float']:
                temp_col = formatted_df[column].astype(str)
                temp_col = temp_col.str.replace(',', '').str.replace('$', '').str.replace('%', '').str.replace(' ', '')
                temp_col = temp_col.replace(['', 'N/A', 'na', 'null'], pd.NA)
                
                formatted_df[column] = pd.to_numeric(temp_col, errors='coerce')
                formatted_df[column] = formatted_df[column].astype(pandas_dtype)
            else:
                formatted_df[column] = formatted_df[column].replace(['', 'N/A', 'na', 'null'], pd.NA)
                formatted_df[column] = formatted_df[column].astype(pandas_dtype)

        except Exception as e:
            conversion_errors[column] = str(e)
            print(f"Warning: Could not convert column '{column}'. Error: {str(e)}")

    return formatted_df

def save_parquet_to_s3(df, bucket, key):
    """Save DataFrame as Parquet to S3"""
    buffer = BytesIO()
    df.to_parquet(buffer, index=False)
    buffer.seek(0)
    
    s3_client.put_object(
        Bucket=bucket,
        Key=key,
        Body=buffer.getvalue(),
        ContentType='application/octet-stream'
    )
    
    print(f"Saved Parquet: s3://{bucket}/{key}")

def trigger_rust_analysis(bucket, parquet_key, metadata_key):
    """Trigger Rust Lambda for ML analysis"""
    try:
        lambda_client = boto3.client('lambda')
        
        payload = {
            'bucket': bucket,
            'parquet_key': parquet_key,
            'metadata_key': metadata_key
        }
        
        # Get function name from environment or construct it
        rust_function_name = f"{bucket.split('-')[0]}-excel-processor"
        
        lambda_client.invoke(
            FunctionName=rust_function_name,
            InvocationType='Event',  # Async invocation
            Payload=json.dumps(payload)
        )
        
        print(f"✅ Triggered Rust ML analysis: {rust_function_name}")
        
    except Exception as e:
        print(f"❌ Failed to trigger Rust analysis: {e}")