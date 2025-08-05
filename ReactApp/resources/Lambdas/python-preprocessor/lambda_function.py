import json
import boto3
import pandas as pd
import numpy as np
import pyarrow as pa
import pyarrow.parquet as pq
from io import BytesIO
from typing import Union
import re
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

s3_client = boto3.client('s3')

def lambda_handler(event, context):
    """Python Lambda for intelligent Excel preprocessing"""
    
    # Extract S3 details from EventBridge event
    bucket = event['detail']['bucket']['name']
    key = event['detail']['object']['key']
    
    logger.info(f"🚀 Starting Excel processing: s3://{bucket}/{key}")
    logger.info(f"📋 Event details: {json.dumps(event, indent=2)}")
    
    try:
        # Download Excel file
        logger.info(f"📥 Downloading Excel file from S3...")
        response = s3_client.get_object(Bucket=bucket, Key=key)
        excel_data = response['Body'].read()
        logger.info(f"✅ Downloaded {len(excel_data)} bytes")
        
        # Process all sheets from Excel
        logger.info(f"🔄 Starting Excel sheet processing...")
        processed_sheets = process_excel_with_inference(excel_data)
        logger.info(f"✅ Processed {len(processed_sheets)} sheets")
        
        # Generate file ID
        file_id = key.split('/')[-1].split('.')[0]
        logger.info(f"📝 Generated file ID: {file_id}")
        
        # Save each sheet as separate Parquet file
        parquet_keys = []
        metadata_keys = []
        
        for sheet_name, df in processed_sheets.items():
            logger.info(f"💾 Saving sheet '{sheet_name}' as Parquet...")
            # Save as Parquet
            parquet_key = f"processedPython/{file_id}_{sheet_name}.parquet"
            save_parquet_to_s3(df, bucket, parquet_key)
            parquet_keys.append(parquet_key)
            logger.info(f"✅ Saved: {parquet_key}")
            
            # Create sheet metadata
            sheet_metadata = {
                'file_id': file_id,
                'sheet_name': sheet_name,
                'original_key': key,
                'parquet_key': parquet_key,
                'rows': len(df),
                'columns': len(df.columns),
                'column_types': {col: str(df[col].dtype) for col in df.columns},
                'timestamp': datetime.utcnow().isoformat()
            }
            
            # Save sheet metadata
            metadata_key = f"processedPython/{file_id}_{sheet_name}_metadata.json"
            logger.info(f"📊 Saving metadata for sheet '{sheet_name}'...")
            s3_client.put_object(
                Bucket=bucket,
                Key=metadata_key,
                Body=json.dumps(sheet_metadata, indent=2),
                ContentType='application/json'
            )
            metadata_keys.append(metadata_key)
            logger.info(f"✅ Metadata saved: {metadata_key}")
            
            # Trigger Rust ML analysis for each sheet
            trigger_rust_analysis(bucket, parquet_key, metadata_key)

        # Create combined metadata
        combined_metadata = {
            'file_id': file_id,
            'original_key': key,
            'sheets_processed': list(processed_sheets.keys()),
            'parquet_keys': parquet_keys,
            'metadata_keys': metadata_keys,
            'total_sheets': len(processed_sheets),
            'timestamp': datetime.utcnow().isoformat()
        }

        logger.info(f"🎉 Processing complete! Summary:")
        logger.info(f"   📊 Sheets processed: {len(processed_sheets)}")
        logger.info(f"   📁 Parquet files: {len(parquet_keys)}")
        logger.info(f"   📋 Metadata files: {len(metadata_keys)}")
        print(f"🚀 Rust ML analysis triggered for: {file_id}")
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': f'Excel processed successfully - {len(processed_sheets)} sheets',
                'sheets_processed': list(processed_sheets.keys()),
                'parquet_keys': parquet_keys,
                'metadata': combined_metadata
            })
        }
        
    except Exception as e:
        logger.error(f"❌ Error processing Excel: {str(e)}")
        logger.error(f"📍 Error details: {type(e).__name__}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }

def process_excel_with_inference(excel_data):
    """Process all sheets with sheet-specific logic"""
    
    # Read all sheets from Excel file
    logger.info(f"📖 Reading Excel file structure...")
    excel_file = pd.ExcelFile(BytesIO(excel_data))
    logger.info(f"📋 Found sheets: {excel_file.sheet_names}")
    processed_sheets = {}
    
    for sheet_name in excel_file.sheet_names:
        try:
            logger.info(f"🔄 Processing sheet: {sheet_name}")
            
            # Apply sheet-specific processing
            if sheet_name == 'TEST_LOOP':
                df = process_test_loop_sheet(excel_data, sheet_name)
            elif sheet_name == 'ISOS':
                df = process_isos_sheet(excel_data, sheet_name)
            elif sheet_name == 'Tuberia':
                df = process_insulation_sheet(excel_data, sheet_name)
            else:
                logger.warning(f"⚠️ Unknown sheet '{sheet_name}', using default processing")
                df = process_default_sheet(excel_data, sheet_name)
            
            if df is not None and not df.empty:
                processed_sheets[sheet_name] = df
                logger.info(f"✅ Sheet '{sheet_name}' processed: {len(df)} rows, {len(df.columns)} columns")
            
        except Exception as e:
            logger.warning(f"⚠️ Could not process sheet '{sheet_name}': {str(e)}")
            continue
    
    return processed_sheets

def process_test_loop_sheet(excel_data, sheet_name):
    """Process TEST_LOOP sheet with specific logic"""
    df = read_excel_sheet(excel_data, sheet_name, skiprows=11, usecols='B:V')
    df = apply_type_inference(df)
    
    # TEST_LOOP specific transformations
    if 'SUBS_PRE' in df.columns:
        df = df.rename(columns={'SUBS_PRE': 'SUBSYSTEM'})
    
    df.columns = [col if col == "SUBSYSTEM" else f"{col}_TLP" for col in df.columns]
    
    if 'SUBSYSTEM' in df.columns:
        df['record'] = (df.groupby(['SUBSYSTEM']).cumcount() + 1).astype(int)
    
    return clean_column_names(df)

def process_isos_sheet(excel_data, sheet_name):
    """Process ISOS sheet with specific logic"""
    df = read_excel_sheet(excel_data, sheet_name, skiprows=1, usecols='A:AL')
    df = apply_type_inference(df)
    
    # ISOS specific transformations
    if 'SUBSYSTEM_2' in df.columns:
        df = df.rename(columns={'SUBSYSTEM_2': 'SUBSYSTEMv2'})
    
    df.columns = [col if col == "SUBSYSTEM" else f"{col}_ISOS" for col in df.columns]
    
    if 'SUBSYSTEM' in df.columns:
        df['record'] = (df.groupby(['SUBSYSTEM']).cumcount() + 1).astype(int)
    
    return clean_column_names(df)

def process_insulation_sheet(excel_data, sheet_name):
    """Process Tuberia (INSULATION) sheet with specific logic"""
    df = read_excel_sheet(excel_data, sheet_name, skiprows=8, usecols='A:BC')
    df = apply_type_inference(df)
    
    # INSULATION specific transformations
    rename_dict = {}
    if 'SUBSYSTEM_2' in df.columns:
        rename_dict['SUBSYSTEM_2'] = 'SUBSYSTEMv2'
    if 'SUBSYTEM' in df.columns:
        rename_dict['SUBSYTEM'] = 'SUBSYSTEM'
    
    if rename_dict:
        df = df.rename(columns=rename_dict)
    
    df.columns = [col if col == "SUBSYSTEM" else f"{col}_INSULATION" for col in df.columns]
    
    if 'SUBSYSTEM' in df.columns:
        df['record'] = (df.groupby(['SUBSYSTEM']).cumcount() + 1).astype(int)
    
    return clean_column_names(df)

def process_default_sheet(excel_data, sheet_name):
    """Default sheet processing"""
    df = read_excel_sheet(excel_data, sheet_name, skiprows=11, usecols='B:V')
    df = apply_type_inference(df)
    
    # Default transformations
    suffix = f"_{sheet_name.upper()}"
    df.columns = [f"{col}{suffix}" for col in df.columns]
    
    return clean_column_names(df)

# Shared functions
def read_excel_sheet(excel_data, sheet_name, skiprows=0, usecols=None):
    """Shared function to read Excel sheet"""
    df = pd.read_excel(
        BytesIO(excel_data),
        sheet_name=sheet_name,
        skiprows=skiprows,
        usecols=usecols,
        dtype=str
    )
    logger.info(f"📊 Raw data: {len(df)} rows, {len(df.columns)} columns")
    return df

def apply_type_inference(df):
    """Shared function to apply type inference"""
    logger.info(f"🧠 Applying type inference...")
    return format_dataframe_columns(df, threshold=0.95)

def clean_column_names(df):
    """Shared function to clean column names"""
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
    logger.info(f"🔍 Starting column type inference for {len(df.columns)} columns")
    formatted_df = df.copy()
    conversion_errors = {}

    for column in formatted_df.columns:
        try:
            inferred_type = infer_column_type(formatted_df[column], threshold)
            pandas_dtype = get_pandas_dtype(inferred_type)

            logger.info(f"📊 Column '{column}': {inferred_type}")

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
            logger.warning(f"⚠️ Column '{column}' conversion failed: {str(e)}")

    return formatted_df

def save_parquet_to_s3(df, bucket, key):
    """Save DataFrame as Parquet to S3"""
    logger.info(f"💾 Converting DataFrame to Parquet format...")
    buffer = BytesIO()
    df.to_parquet(buffer, index=False)
    buffer.seek(0)
    
    logger.info(f"☁️ Uploading to S3: {key}")
    s3_client.put_object(
        Bucket=bucket,
        Key=key,
        Body=buffer.getvalue(),
        ContentType='application/octet-stream'
    )
    
    logger.info(f"✅ Parquet saved: s3://{bucket}/{key} ({len(buffer.getvalue())} bytes)")

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