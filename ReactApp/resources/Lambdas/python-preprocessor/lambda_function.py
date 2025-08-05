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
    
    # Log which sheets we can process
    known_sheets = ['TEST_LOOP', 'ISOS', 'Tuberia', 'TRAC_SIEMSA', 'FIELD CONTROL', 'ISO_INST', 'Punch List']
    missing_sheets = [s for s in known_sheets if s not in excel_file.sheet_names]
    if missing_sheets:
        logger.warning(f"⚠️ Missing expected sheets: {missing_sheets}")
    
    processed_sheets = {}
    
    for sheet_name in excel_file.sheet_names:
        try:
            logger.info(f"🔄 Processing sheet: '{sheet_name}'")
            
            # Apply sheet-specific processing
            if sheet_name == 'TEST_LOOP':
                logger.info(f"🔍 Using TEST_LOOP logic")
                df = process_test_loop_sheet(excel_data, sheet_name)
            elif sheet_name == 'ISOS':
                logger.info(f"🔍 Using ISOS logic")
                df = process_isos_sheet(excel_data, sheet_name)
            elif sheet_name == 'Tuberia':
                logger.info(f"🔍 Using INSULATION logic")
                df = process_insulation_sheet(excel_data, sheet_name)
            elif sheet_name == 'TRAC_SIEMSA':
                logger.info(f"🔍 Using TRACING logic")
                df = process_tracing_sheet(excel_data, sheet_name)
            elif sheet_name == 'FIELD CONTROL':
                logger.info(f"🔍 Using FIELD CONTROL logic")
                df = process_field_control_sheet(excel_data, sheet_name)
            elif sheet_name == 'ISO_INST':
                logger.info(f"🔍 Using ISO_INST logic")
                df = process_iso_inst_sheet(excel_data, sheet_name)
            elif sheet_name == 'Punch List':
                logger.info(f"🔍 Using PUNCH LIST logic")
                df = process_punch_list_sheet(excel_data, sheet_name)
            else:
                logger.warning(f"⚠️ Unknown sheet '{sheet_name}', using default processing")
                df = process_default_sheet(excel_data, sheet_name)
            
            if df is not None and not df.empty:
                processed_sheets[sheet_name] = df
                logger.info(f"✅ Sheet '{sheet_name}' processed: {len(df)} rows, {len(df.columns)} columns")
            else:
                logger.warning(f"⚠️ Sheet '{sheet_name}' resulted in empty dataframe - skipping")
            
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

def process_tracing_sheet(excel_data, sheet_name):
    """Process TRAC_SIEMSA (TRACING) sheet with specific logic"""
    df = read_excel_sheet(excel_data, sheet_name, skiprows=7, usecols='B:AG')
    df = apply_type_inference(df)
    
    # TRACING specific transformations
    df.columns = [col if col == "SUBSYSTEM" else f"{col}_TRACING" for col in df.columns]
    
    # Drop rows where SUBSYSTEM is null
    df = df.dropna(subset=['SUBSYSTEM'])
    
    if 'SUBSYSTEM' in df.columns:
        df['record'] = (df.groupby(['SUBSYSTEM']).cumcount() + 1).astype(int)
    
    return clean_column_names(df)

def process_punch_list_sheet(excel_data, sheet_name):
    """Process Punch List sheet with specific logic"""
    df = read_excel_sheet(excel_data, sheet_name, skiprows=5, usecols='B:W')
    df = apply_type_inference(df)
    
    # Punch List specific transformations
    if 'SUBSISTEMA' in df.columns:
        df = df.rename(columns={'SUBSISTEMA': 'SUBSYSTEM'})
    
    # Clean SUBSYSTEM column
    if 'SUBSYSTEM' in df.columns:
        df['SUBSYSTEM'] = df['SUBSYSTEM'].str.replace('¿?', '')
        df['SUBSYSTEM'] = df['SUBSYSTEM'].replace('', pd.NA).str.strip()
        df = df.dropna(subset=['SUBSYSTEM'])
    
    df.columns = [col if col == "SUBSYSTEM" else f"{col}_PUNCH_L" for col in df.columns]
    
    df = clean_column_names(df)
    
    if 'subsystem' in df.columns:
        df['record'] = (df.groupby(['subsystem']).cumcount() + 1).astype(int)
    
    return df

def process_field_control_sheet(excel_data, sheet_name):
    """Process FIELD CONTROL sheet with specific logic"""
    df = read_excel_sheet(excel_data, sheet_name, skiprows=4, usecols='A:BJ')
    
    # Drop specific columns
    cols_to_drop = [
        'Design Area', 'Design Area.1', 'Unnamed: 7', 'Unnamed: 8', 
        'Unnamed: 9', 'SPS.1', 'Isometric'
    ]
    df = df.drop(columns=cols_to_drop, errors='ignore')
    
    df = apply_type_inference(df)
    
    # FIELD CONTROL specific transformations
    df.columns = [col if col == "SUBSYSTEM" else f"{col}_FC" for col in df.columns]
    
    # Drop rows where SUBSYSTEM is null
    df = df.dropna(subset=['SUBSYSTEM'])
    
    if 'SUBSYSTEM' in df.columns:
        df['record'] = (df.groupby(['SUBSYSTEM']).cumcount() + 1).astype(int)
    
    df = clean_column_names(df)
    
    # Complex includes_fc processing
    if 'includes_fc' in df.columns:
        df = process_includes_fc_column(df)
    
    return df

def process_iso_inst_sheet(excel_data, sheet_name):
    """Process ISO_INST sheet with QCF data integration"""
    df = read_excel_sheet(excel_data, sheet_name, skiprows=4, usecols='A:AJ')
    df = apply_type_inference(df)
    
    # Drop specific columns
    cols_to_drop = ['TAG INST AUX', 'Unnamed: 0']
    df = df.drop(columns=cols_to_drop, errors='ignore')
    
    # ISO_INST specific transformations
    df.columns = [col if col == "SUBSYSTEM" else f"{col}_ISOINST" for col in df.columns]
    
    if 'SUBSYSTEM' in df.columns:
        df['record'] = (df.groupby(['SUBSYSTEM']).cumcount() + 1).astype(int)
    
    df = clean_column_names(df)
    
    # Process QCF data integration
    try:
        df = integrate_qcf_data(excel_data, df)
    except Exception as e:
        logger.warning(f"Could not integrate QCF data: {str(e)}")
    
    # Final data cleaning
    if 'pid_isoinst' in df.columns:
        df['pid_isoinst'] = df['pid_isoinst'].str.strip()
        df['pid_isoinst'].replace('', pd.NA, inplace=True)
    
    if 'installed_isoinst' in df.columns:
        df['installed_isoinst'] = df['installed_isoinst'].astype(str)
        df['installed_isoinst'] = df['installed_isoinst'].replace('NaT', '')
    
    df = df.replace(["<NA>", "NaT", "NaN"], pd.NA)
    
    return df

def integrate_qcf_data(excel_data, df):
    """Integrate QCF Montaje Intr. data with ISO_INST"""
    try:
        # Read QCF sheet
        qfc_df = pd.read_excel(
            BytesIO(excel_data),
            sheet_name='QCF Montaje Intr.',
            skiprows=1,
            usecols='B:G'
        )
        
        # Process QCF data
        def get_after_penultimate_hyphen(s):
            parts = str(s).split('-')
            if len(parts) >= 2:
                return '-'.join(parts[-2:])
            else:
                return s
        
        qfc_df['codigoqcf'] = qfc_df['Código QCF'].apply(get_after_penultimate_hyphen)
        qfc_df = qfc_df.rename(columns={'codigoqcf': 'tag_inst_isoinst'})
        
        # Select relevant columns
        qfc_df = qfc_df[['Firma Cliente', 'tag_inst_isoinst']]
        
        # Convert to datetime
        qfc_df['Firma Cliente'] = pd.to_datetime(qfc_df['Firma Cliente'], errors='coerce')
        
        # Create mapping
        date_map = qfc_df.set_index('tag_inst_isoinst')['Firma Cliente']
        
        # Update installed_isoinst function
        def update_installed_isoinst(row):
            if row['scope__by_isoinst'] == 'SIEMSA' and pd.isnull(row['installed_isoinst']):
                date_value = date_map.get(row['tag_inst_isoinst'], np.nan)
                return date_value if pd.notnull(date_value) else row['installed_isoinst']
            else:
                return row['installed_isoinst']
        
        # Apply the function row-wise
        if 'installed_isoinst' in df.columns and 'scope__by_isoinst' in df.columns and 'tag_inst_isoinst' in df.columns:
            df['installed_isoinst'] = df.apply(update_installed_isoinst, axis=1)
        
    except Exception as e:
        logger.warning(f"QCF integration failed: {str(e)}")
    
    return df

def process_includes_fc_column(df):
    """Process the includes_fc column with complex transformations"""
    # Convert to string and clean
    df['includes_fc'] = df['includes_fc'].astype(str)
    df['includes_fc'] = (
        df['includes_fc']
        .str.replace(', ', '|')
        .str.replace(r'\|X', '', regex=True)
        .str.replace('ANULADA', '')
        .str.replace(r'\|ANULADA', '', regex=True)
        .str.replace(r'ANULADA\|', '', regex=True)
    )
    
    # Create expanded dataframe for average calculation
    expanded = df.copy()
    expanded['includes_fc'] = expanded['includes_fc'].astype(str)
    expanded = expanded.assign(
        test_pack_split=expanded['includes_fc'].str.split('|')
    ).explode('test_pack_split')
    
    # Clean and filter
    expanded['test_pack_split'] = expanded['test_pack_split'].str.strip()
    expanded = expanded[expanded['test_pack_split'] != '']
    
    try:
        expanded['test_pack_split'] = expanded['test_pack_split'].astype(int)
        
        # Compute average progress per test pack
        if 'construc_coord_progress_fc' in expanded.columns:
            avg_progress = (
                expanded.groupby('test_pack_split')['construc_coord_progress_fc']
                .mean()
                .to_dict()
            )
            
            # Extract and map average values
            def extract_avg_values(row):
                packs = [p.strip() for p in str(row['includes_fc']).split('|') if p.strip() != '']
                avgs = [round(avg_progress.get(int(p), 0), 2) for p in packs]
                return pd.Series(avgs + [pd.NA] * (3 - len(avgs)))
            
            df[['avg_fc_1', 'avg_fc_2', 'avg_fc_3']] = df.apply(extract_avg_values, axis=1)
            
            # Ensure avg columns are float type
            for col in ['avg_fc_1', 'avg_fc_2', 'avg_fc_3']:
                df[col] = pd.to_numeric(df[col], errors='coerce')
    except Exception as e:
        logger.warning(f"Could not process includes_fc averages: {str(e)}")
    
    return df

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
    clean_col = col.dropna()
    if len(clean_col) == 0:
        return 'string'

    total_rows = len(clean_col)

    def check_numeric():
        # More aggressive numeric checking
        try:
            # First, try direct numeric conversion
            numeric_converted = pd.to_numeric(clean_col, errors='coerce')
            numeric_success_rate = numeric_converted.notna().sum() / total_rows
            
            if numeric_success_rate >= threshold:
                # Check if they're integers or floats
                valid_numeric = numeric_converted.dropna()
                if len(valid_numeric) > 0:
                    # Check if all valid numbers are integers
                    is_integer = (valid_numeric % 1 == 0).all()
                    if is_integer:
                        return 'integer'
                    else:
                        return 'float'
            
            # If direct conversion didn't work well, try string-based checks
            str_col = clean_col.astype(str).str.strip()
            
            # More comprehensive regex patterns
            integer_patterns = [
                r'^-?\d+$',                    # Basic integers: -123, 456
                r'^-?\d{1,3}(,\d{3})*$',      # Comma-separated: 1,234 or -1,234
                r'^-?\d+\.0+$',               # Integers with .0: 123.0, 456.00
            ]
            
            float_patterns = [
                r'^-?\d*\.\d+$',              # Basic floats: 123.45, .5
                r'^-?\d+\.\d+$',              # Standard floats: 123.45
                r'^-?\d{1,3}(,\d{3})*\.\d+$', # Comma-separated floats: 1,234.56
                r'^-?\d+\.?\d*[eE][+-]?\d+$', # Scientific notation: 1.23e-4
                r'^-?\d+\.?\d*%$',            # Percentages: 12.5%
            ]
            
            # Check integer patterns
            for pattern in integer_patterns:
                matches = str_col.str.match(pattern, na=False).sum()
                if matches / total_rows >= threshold:
                    return 'integer'
            
            # Check float patterns
            for pattern in float_patterns:
                matches = str_col.str.match(pattern, na=False).sum()
                if matches / total_rows >= threshold:
                    return 'float'
            
            # Try cleaning common numeric artifacts and re-checking
            cleaned_col = str_col.str.replace(',', '')  # Remove commas
            cleaned_col = cleaned_col.str.replace('$', '')  # Remove dollar signs
            cleaned_col = cleaned_col.str.replace('%', '')  # Remove percentages
            cleaned_col = cleaned_col.str.replace(' ', '')  # Remove spaces
            
            # Try numeric conversion on cleaned data
            cleaned_numeric = pd.to_numeric(cleaned_col, errors='coerce')
            cleaned_success_rate = cleaned_numeric.notna().sum() / total_rows
            
            if cleaned_success_rate >= threshold:
                valid_cleaned = cleaned_numeric.dropna()
                if len(valid_cleaned) > 0:
                    is_integer = (valid_cleaned % 1 == 0).all()
                    if is_integer:
                        return 'integer'
                    else:
                        return 'float'
                        
        except Exception as e:
            logger.warning(f"Error in numeric checking: {e}")
            return None
        
        return None

    def check_datetime():
        try:
            # First check if the column contains only numeric values
            str_col = clean_col.astype(str)
            numeric_pattern = r'^-?\d+\.?\d*$'
            numeric_matches = str_col.str.match(numeric_pattern).sum()
            if numeric_matches / total_rows >= 0.8:  # If 80%+ are purely numeric, skip datetime
                return None
            
            # Common date patterns to check first
            date_patterns = [
                r'\d{4}-\d{2}-\d{2}',         # YYYY-MM-DD
                r'\d{2}/\d{2}/\d{4}',         # MM/DD/YYYY
                r'\d{2}-\d{2}-\d{4}',         # MM-DD-YYYY
                r'\d{4}/\d{2}/\d{2}',         # YYYY/MM/DD
            ]
            
            # Check if values look like dates before trying conversion
            looks_like_date = False
            for pattern in date_patterns:
                matches = str_col.str.contains(pattern, na=False).sum()
                if matches / total_rows >= 0.3:  # At least 30% look like dates
                    looks_like_date = True
                    break
            
            if not looks_like_date:
                return None
            
            # Only proceed with datetime conversion if values look like dates
            datetime_converted = pd.to_datetime(clean_col, errors='coerce')
            datetime_success = datetime_converted.notna().sum() / total_rows
            
            if datetime_success >= threshold:
                valid_dates = datetime_converted.dropna()
                if len(valid_dates) > 0:
                    min_year = valid_dates.dt.year.min()
                    max_year = valid_dates.dt.year.max()
                    # Reject if all dates are around 1970 (likely Unix timestamp conversion)
                    if min_year >= 1900 and max_year <= 2100 and not (min_year == 1970 and max_year == 1970):
                        return 'datetime'
                    
        except Exception as e:
            logger.warning(f"Error in datetime checking: {e}")
            return None

    def check_boolean():
        try:
            str_col = clean_col.astype(str).str.lower().str.strip()
            bool_values = {'true', 'false', '1', '0', 'yes', 'no', 't', 'f', 'y', 'n'}
            bool_success = str_col.isin(bool_values).sum() / total_rows
            if bool_success >= threshold:
                return 'boolean'
        except Exception as e:
            logger.warning(f"Error in boolean checking: {e}")
            return None
        return None

    # Check in order of priority
    for type_check in [check_numeric, check_boolean, check_datetime]:
        result = type_check()
        if result:
            return result

    # Default to string if no other type matches
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
    formatted_df = df.copy()
    conversion_errors = {}

    for column in formatted_df.columns:
        try:
            inferred_type = infer_column_type(formatted_df[column], threshold)
            pandas_dtype = get_pandas_dtype(inferred_type)

            logger.info(f"Column '{column}': Inferred type = {inferred_type}")

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
                # Clean numeric data before conversion
                temp_col = formatted_df[column].astype(str)
                temp_col = temp_col.str.replace(',', '')  # Remove commas
                temp_col = temp_col.str.replace('$', '')  # Remove dollar signs
                temp_col = temp_col.str.replace('%', '')  # Remove percentages
                temp_col = temp_col.str.replace(' ', '')  # Remove spaces
                temp_col = temp_col.replace(['', 'N/A', 'na', 'null'], pd.NA)
                
                formatted_df[column] = pd.to_numeric(temp_col, errors='coerce')
                formatted_df[column] = formatted_df[column].astype(pandas_dtype)
            else:
                formatted_df[column] = formatted_df[column].replace(['', 'N/A', 'na', 'null'], pd.NA)
                formatted_df[column] = formatted_df[column].astype(pandas_dtype)

        except Exception as e:
            conversion_errors[column] = str(e)
            logger.warning(f"Warning: Could not convert column '{column}'. Error: {str(e)}")

    if conversion_errors:
        logger.warning("\nConversion errors summary:")
        for col, error in conversion_errors.items():
            logger.warning(f"Column '{col}': {error}")

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