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
from functools import reduce
import unicodedata
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

s3_client = boto3.client('s3')

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
            print(f"Error in numeric checking: {e}")
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
            print(f"Error in datetime checking: {e}")
            return None

    def check_boolean():
        try:
            str_col = clean_col.astype(str).str.lower().str.strip()
            bool_values = {'true', 'false', '1', '0', 'yes', 'no', 't', 'f', 'y', 'n'}
            bool_success = str_col.isin(bool_values).sum() / total_rows
            if bool_success >= threshold:
                return 'boolean'
        except Exception as e:
            print(f"Error in boolean checking: {e}")
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
            print(f"Warning: Could not convert column '{column}'. Error: {str(e)}")

    if conversion_errors:
        print("\nConversion errors summary:")
        for col, error in conversion_errors.items():
            print(f"Column '{col}': {error}")

    return formatted_df

def lambda_handler(event, context):
    """Python Lambda for intelligent Excel preprocessing"""
    
    # Extract S3 details from EventBridge event
    bucket = event['detail']['bucket']['name']
    key = event['detail']['object']['key']
    file_id = key.split('/')[-1].split('.')[0]
    
    logger.info(f"🚀 Starting Excel processing: s3://{bucket}/{key}")
    
    # Initialize progress tracking
    update_progress(file_id, 0, "Starting Excel processing...", bucket)
    
    try:
        # Download Excel file
        update_progress(file_id, 10, "Downloading Excel file...", bucket)
        response = s3_client.get_object(Bucket=bucket, Key=key)
        excel_data = response['Body'].read()
        
        # Process all sheets from Excel with detailed progress
        update_progress(file_id, 20, "Processing Excel sheets...", bucket)
        processed_sheets = process_excel_with_inference(excel_data, file_id, bucket)
        
        # Create master table if we have the required sheets
        update_progress(file_id, 60, "Creating master tables...", bucket)
        master_tables = create_master_tables(processed_sheets)
        if master_tables:
            processed_sheets.update(master_tables)
            
            # Create SSM table if master_subsystem exists
            if 'master_subsystem' in master_tables:
                update_progress(file_id, 70, "Creating SSM analysis...", bucket)
                ssm_table = create_ssm_table(master_tables['master_subsystem'], processed_sheets, bucket, file_id)
                if ssm_table is not None:
                    processed_sheets['ssm'] = ssm_table
                    update_progress(file_id, 78, f"SSM analysis completed ({len(ssm_table)} subsystems)", bucket)
        
        # Save each sheet as separate Parquet file
        update_progress(file_id, 80, "Saving processed files...", bucket)
        
        parquet_keys = []
        metadata_keys = []
        
        total_files = len(processed_sheets)
        for i, (sheet_name, df) in enumerate(processed_sheets.items()):
            save_progress = 80 + (i / total_files) * 15
            update_progress(file_id, int(save_progress), f"Saving {sheet_name}...", bucket)
            
            # Save as Parquet
            parquet_key = f"processedPython/{file_id}_{sheet_name}.parquet"
            save_parquet_to_s3(df, bucket, parquet_key)
            parquet_keys.append(parquet_key)
            
            # Save SSM as CSV as well for easier access
            if sheet_name == 'ssm':
                csv_key = f"processedPython/{file_id}_{sheet_name}.csv"
                save_csv_to_s3(df, bucket, csv_key)
                parquet_keys.append(csv_key)
            
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
            s3_client.put_object(
                Bucket=bucket,
                Key=metadata_key,
                Body=json.dumps(sheet_metadata, indent=2),
                ContentType='application/json'
            )
            metadata_keys.append(metadata_key)

        update_progress(file_id, 95, "Finalizing...", bucket)
        
        # Save final processing summary
        final_summary = {
            'file_id': file_id,
            'processing_completed': datetime.utcnow().isoformat(),
            'total_sheets': len(processed_sheets),
            'parquet_files': parquet_keys,
            'metadata_files': metadata_keys
        }
        
        summary_key = f"processedPython/{file_id}_processing_summary.json"
        s3_client.put_object(
            Bucket=bucket,
            Key=summary_key,
            Body=json.dumps(final_summary, indent=2),
            ContentType='application/json'
        )
        
        update_progress(file_id, 100, "Processing completed successfully!", bucket)
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': f'Excel processed successfully - {len(processed_sheets)} sheets',
                'file_id': file_id,
                'sheets_processed': list(processed_sheets.keys()),
                'parquet_keys': parquet_keys,
                'processing_summary': summary_key
            })
        }
        
    except Exception as e:
        update_progress(file_id, -1, f"Error: {str(e)}", bucket)
        logger.error(f"❌ Error processing Excel: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }

def update_progress(file_id, progress, message, bucket):
    """Update processing progress by writing to S3"""
    logger.info(f"📊 Progress: {progress}% - {message}")
    
    try:
        progress_data = {
            'file_id': file_id,
            'progress': progress,
            'message': message,
            'timestamp': datetime.utcnow().isoformat()
        }
        
        s3_client.put_object(
            Bucket=bucket,
            Key=f"progress/{file_id}.json",
            Body=json.dumps(progress_data),
            ContentType='application/json'
        )
    except Exception as e:
        logger.warning(f"Progress update failed: {str(e)}")

def process_excel_with_inference(excel_data, file_id=None, bucket=None):
    """Process all sheets with sheet-specific logic"""
    
    # Read all sheets from Excel file
    excel_file = pd.ExcelFile(BytesIO(excel_data))
    processed_sheets = {}
    total_sheets = len(excel_file.sheet_names)
    
    for i, sheet_name in enumerate(excel_file.sheet_names):
        try:
            if file_id and bucket:
                sheet_progress = 20 + (i / total_sheets) * 40
                update_progress(file_id, int(sheet_progress), f"Processing sheet: {sheet_name}", bucket)
            
            # Apply sheet-specific processing
            if sheet_name == 'TEST_LOOP':
                df = process_test_loop_sheet(excel_data, sheet_name)
            elif sheet_name == 'TP':
                df = process_tp_sheet(excel_data, sheet_name)
            elif sheet_name == 'general':
                df = process_general_sheet(excel_data, sheet_name)
            elif sheet_name == 'Subsystems':
                df = process_subsystems_sheet(excel_data, sheet_name)
            elif sheet_name == 'ISOS':
                df = process_isos_sheet(excel_data, sheet_name)
            elif sheet_name == 'Tuberia':
                df = process_insulation_sheet(excel_data, sheet_name)
            elif sheet_name == 'TRAC_SIEMSA':
                df = process_tracing_sheet(excel_data, sheet_name)
            elif sheet_name == 'FIELD_CONTROL':
                df = process_field_control_sheet(excel_data, sheet_name)
            elif sheet_name == 'ISO_INST':
                df = process_iso_inst_sheet(excel_data, sheet_name)
            elif sheet_name == 'Punch_List':
                df = process_punch_list_sheet(excel_data, sheet_name)
            else:
                df = process_default_sheet(excel_data, sheet_name)
            
            if df is not None and not df.empty:
                processed_sheets[sheet_name] = df
                if file_id and bucket:
                    completion_progress = 20 + ((i + 1) / total_sheets) * 40
                    update_progress(file_id, int(completion_progress), f"Completed sheet: {sheet_name} ({len(df)} rows)", bucket)
            
        except Exception as e:
            logger.warning(f"⚠️ Could not process sheet '{sheet_name}': {str(e)}")
            continue
    
    return processed_sheets

# Add minimal implementations of required functions
def process_test_loop_sheet(excel_data, sheet_name):
    test_loop = pd.read_excel(BytesIO(excel_data), sheet_name=sheet_name, skiprows=11, usecols='B:V', dtype=str)
    test_loop_infer = format_dataframe_columns(test_loop, threshold=0.95)
    
    test_loop_infer = test_loop_infer.rename(columns={
        'SUBS_PRE': 'SUBSYSTEM'
    })
    
    test_loop_infer.columns = [col if col == "SUBSYSTEM" else f"{col}_TLP" for col in test_loop_infer.columns]
    
    test_loop_infer['record'] = (test_loop_infer.groupby(['SUBSYSTEM']).cumcount() + 1).astype(int)
    
    test_loop_infer.columns = (
        test_loop_infer.columns
        .str.strip()
        .str.lower()
        .str.replace(' ', '_')
        .str.replace(r'[^\w_]', '', regex=True)
    )
    
    return test_loop_infer

def process_tp_sheet(excel_data, sheet_name):
    tp = pd.read_excel(BytesIO(excel_data), sheet_name=sheet_name, skiprows=4, usecols='B:AS', dtype=str)
    tp_infer = format_dataframe_columns(tp, threshold=0.95)
    
    tp_infer.columns = [f"{col}_TP" for col in tp_infer.columns]
    tp_infer.columns = (
        tp_infer.columns
        .str.strip()
        .str.lower()
        .str.replace(' ', '_')
        .str.replace(r'[^\w_]', '', regex=True)
    )
    
    tp_infer = tp_infer[tp_infer["dossier_id_tp"].notna()]
    
    return tp_infer

def process_general_sheet(excel_data, sheet_name):
    psv = pd.read_excel(BytesIO(excel_data), sheet_name=sheet_name, skiprows=3, dtype=str)
    
    columns = ['SUB-SYSTEM', 'PSV Total', 'PSV Calibrated', 'PSV TO calibrate', 'Motor Tot', 'Motor Solo Run DONE', 'Solo Run PENDING']
    psv_motor = psv[columns]
    
    psv_motor_infer = format_dataframe_columns(psv_motor, threshold=0.95)
    
    psv_motor_infer = psv_motor_infer.rename(columns={
        'SUB-SYSTEM': 'SUBSYSTEM'
    })
    
    psv_motor_infer.columns = (
        psv_motor_infer.columns
        .str.strip()
        .str.lower()
        .str.replace(' ', '_')
        .str.replace(r'[^\w_]', '', regex=True)
    )
    
    return psv_motor_infer

def process_subsystems_sheet(excel_data, sheet_name):
    subsystem_info = pd.read_excel(BytesIO(excel_data), sheet_name=sheet_name, dtype=str)
    subsystem_info_infer = format_dataframe_columns(subsystem_info, threshold=0.95)
    
    subsystem_info_infer['SUBSYSTEM'] = subsystem_info_infer['SUBSYSTEM'].replace({
        'NI-PR12-02': 'NI-PR12-01',
        'NI-PR12-03': 'NI-PR12-01',
        'NI-PR12-04': 'NI-PR12-01'
    })
    
    subsystem_info_infer = subsystem_info_infer[subsystem_info_infer['SUBSYSTEM'] != 'RIPA-10003-07']
    
    subsystem_info_infer.columns = (
        subsystem_info_infer.columns
        .str.strip()
        .str.lower()
        .str.replace(' ', '_')
        .str.replace(r'[^\w_]', '', regex=True)
    )
    
    subsystem_info_infer = subsystem_info_infer.drop_duplicates(subset=['subsystem'], keep='first')
    
    if 'description' in subsystem_info_infer.columns:
        subsystem_info_infer['description'] = subsystem_info_infer['description'].str.replace('ó', 'o', regex=False)
        subsystem_info_infer['description'] = subsystem_info_infer['description'].str.replace('ú', 'u', regex=False)
        subsystem_info_infer['description'] = subsystem_info_infer['description'].str.replace('Á', 'A', regex=False)
        subsystem_info_infer['description'] = subsystem_info_infer['description'].str.replace(',', ';', regex=False)
        subsystem_info_infer['description'] = subsystem_info_infer['description'].str.replace('é', 'e', regex=False)
        subsystem_info_infer['description'] = subsystem_info_infer['description'].str.replace('í', 'i', regex=False)
    
    return subsystem_info_infer

def process_isos_sheet(excel_data, sheet_name):
    isos = pd.read_excel(BytesIO(excel_data), sheet_name=sheet_name, skiprows=1, usecols='A:AL', dtype=str)
    isos_infer = format_dataframe_columns(isos, threshold=0.95)
    
    isos_infer = isos_infer.rename(columns={
        'SUBSYSTEM_2': 'SUBSYSTEMv2'
    })
    
    isos_infer.columns = [col if col == "SUBSYSTEM" else f"{col}_ISOS" for col in isos_infer.columns]
    
    isos_infer['record'] = (isos_infer.groupby(['SUBSYSTEM']).cumcount() + 1).astype(int)
    
    isos_infer.columns = (
        isos_infer.columns
        .str.strip()
        .str.lower()
        .str.replace(' ', '_')
        .str.replace(r'[^\w_]', '', regex=True)
    )
    
    return isos_infer

def process_insulation_sheet(excel_data, sheet_name):
    insulation = pd.read_excel(BytesIO(excel_data), sheet_name=sheet_name, skiprows=8, usecols='A:BC', dtype=str)
    insulation_infer = format_dataframe_columns(insulation, threshold=0.95)
    
    insulation_infer = insulation_infer.rename(columns={
        'SUBSYSTEM_2': 'SUBSYSTEMv2',
        'SUBSYTEM': 'SUBSYSTEM'
    })
    
    insulation_infer.columns = [col if col == "SUBSYSTEM" else f"{col}_INSULATION" for col in insulation_infer.columns]
    
    insulation_infer['record'] = (insulation_infer.groupby(['SUBSYSTEM']).cumcount() + 1).astype(int)
    
    insulation_infer.columns = (
        insulation_infer.columns
        .str.strip()
        .str.lower()
        .str.replace(' ', '_')
        .str.replace(r'[^\w_]', '', regex=True)
    )
    
    return insulation_infer

def process_tracing_sheet(excel_data, sheet_name):
    siemsa_trac = pd.read_excel(BytesIO(excel_data), sheet_name=sheet_name, skiprows=7, usecols='B:AG', dtype=str)
    siemsa_trac_infer = format_dataframe_columns(siemsa_trac, threshold=0.95)
    
    siemsa_trac_infer.columns = [col if col == "SUBSYSTEM" else f"{col}_TRACING" for col in siemsa_trac_infer.columns]
    
    siemsa_trac_infer = siemsa_trac_infer.dropna(subset=['SUBSYSTEM'])
    siemsa_trac_infer['record'] = (siemsa_trac_infer.groupby(['SUBSYSTEM']).cumcount() + 1).astype(int)
    
    siemsa_trac_infer.columns = (
        siemsa_trac_infer.columns
        .str.strip()
        .str.lower()
        .str.replace(' ', '_')
        .str.replace(r'[^\w_]', '', regex=True)
    )
    
    return siemsa_trac_infer

def process_field_control_sheet(excel_data, sheet_name):
    fc = pd.read_excel(BytesIO(excel_data), sheet_name=sheet_name, skiprows=4, usecols='A:BJ', dtype=str)
    
    cols_to_drop = [
        'Design Area',
        'Design Area.1',
        'Unnamed: 7',
        'Unnamed: 8',
        'Unnamed: 9',
        'SPS.1',
        'Isometric'
    ]
    
    fc = fc.drop(columns=cols_to_drop, errors='ignore')
    fc_infer = format_dataframe_columns(fc, threshold=0.95)
    
    fc_infer.columns = [col if col == "SUBSYSTEM" else f"{col}_FC" for col in fc_infer.columns]
    
    fc_infer = fc_infer.dropna(subset=['SUBSYSTEM'])
    fc_infer['record'] = (fc_infer.groupby(['SUBSYSTEM']).cumcount() + 1).astype(int)
    
    fc_infer.columns = (
        fc_infer.columns
        .str.strip()
        .str.lower()
        .str.replace(' ', '_')
        .str.replace(r'[^\w_]', '', regex=True)
    )
    
    # Process includes_fc column if it exists
    if 'includes_fc' in fc_infer.columns:
        fc_infer['includes_fc'] = fc_infer['includes_fc'].astype(str)
        
        fc_infer['includes_fc'] = (
            fc_infer['includes_fc']
            .str.replace(', ', '|')
            .str.replace(r'\|X', '', regex=True)
            .str.replace('ANULADA', '')
            .str.replace(r'\|ANULADA', '', regex=True)
            .str.replace(r'ANULADA\|', '', regex=True)
        )
        
        expanded = fc_infer.copy()
        expanded['includes_fc'] = expanded['includes_fc'].astype(str)
        expanded = expanded.assign(
            test_pack_split=expanded['includes_fc'].str.split('|')
        ).explode('test_pack_split')
        
        expanded['test_pack_split'] = expanded['test_pack_split'].str.strip()
        expanded = expanded[expanded['test_pack_split'] != '']
        
        try:
            expanded['test_pack_split'] = expanded['test_pack_split'].astype(int)
            
            if 'construc_coord_progress_fc' in expanded.columns:
                avg_progress = (
                    expanded.groupby('test_pack_split')['construc_coord_progress_fc']
                    .mean()
                    .to_dict()
                )
                
                def extract_avg_values(row):
                    packs = [p.strip() for p in str(row['includes_fc']).split('|') if p.strip() != '']
                    avgs = [round(avg_progress.get(int(p), 0), 2) for p in packs if p.isdigit()]
                    return pd.Series(avgs + [''] * (3 - len(avgs)))
                
                fc_infer[['avg_fc_1', 'avg_fc_2', 'avg_fc_3']] = fc_infer.apply(extract_avg_values, axis=1)
        except:
            pass
    
    return fc_infer

def process_iso_inst_sheet(excel_data, sheet_name):
    isos_inst = pd.read_excel(BytesIO(excel_data), sheet_name=sheet_name, skiprows=4, usecols='A:AJ', dtype=str)
    isos_inst_infer = format_dataframe_columns(isos_inst, threshold=0.95)
    
    cols_to_drop = [
        'TAG INST AUX',
        'Unnamed: 0'
    ]
    
    isos_inst_infer = isos_inst_infer.drop(columns=cols_to_drop, errors='ignore')
    
    isos_inst_infer.columns = [col if col == "SUBSYSTEM" else f"{col}_ISOINST" for col in isos_inst_infer.columns]
    
    isos_inst_infer['record'] = (isos_inst_infer.groupby(['SUBSYSTEM']).cumcount() + 1).astype(int)
    
    isos_inst_infer.columns = (
        isos_inst_infer.columns
        .str.strip()
        .str.lower()
        .str.replace(' ', '_')
        .str.replace(r'[^\w_]', '', regex=True)
    )
    
    # Process QCF data if available
    try:
        # Try to read QCF sheet from the same Excel data
        excel_file = pd.ExcelFile(BytesIO(excel_data))
        if 'QCF Montaje Intr.' in excel_file.sheet_names:
            qfc_siemsa = pd.read_excel(BytesIO(excel_data), sheet_name='QCF Montaje Intr.', skiprows=1, usecols='B:G')
            
            def get_after_penultimate_hyphen(s):
                parts = str(s).split('-')
                if len(parts) >= 2:
                    return '-'.join(parts[-2:])
                else:
                    return s
            
            qfc_siemsa['codigoqcf'] = qfc_siemsa['Código QCF'].apply(get_after_penultimate_hyphen)
            qfc_siemsa = qfc_siemsa.rename(columns={'codigoqcf': 'tag_inst_isoinst'})
            
            columnsqfc = ['Firma Cliente', 'tag_inst_isoinst']
            qfc_siemsa = qfc_siemsa[columnsqfc]
            
            qfc_siemsa['Firma Cliente'] = pd.to_datetime(qfc_siemsa['Firma Cliente'], errors='coerce')
            
            date_map = qfc_siemsa.set_index('tag_inst_isoinst')['Firma Cliente']
            
            def update_installed_isoinst(row):
                if (row.get('scope__by_isoinst') == 'SIEMSA' and 
                    pd.isnull(row.get('installed_isoinst')) and
                    'tag_inst_isoinst' in row):
                    date_value = date_map.get(row['tag_inst_isoinst'], np.nan)
                    return date_value if pd.notnull(date_value) else row.get('installed_isoinst')
                else:
                    return row.get('installed_isoinst')
            
            if 'installed_isoinst' in isos_inst_infer.columns:
                isos_inst_infer['installed_isoinst'] = isos_inst_infer.apply(update_installed_isoinst, axis=1)
    except Exception as e:
        logger.warning(f"Could not process QCF data: {str(e)}")
    
    # Clean up data
    if 'pid_isoinst' in isos_inst_infer.columns:
        isos_inst_infer['pid_isoinst'] = isos_inst_infer['pid_isoinst'].str.strip()
        isos_inst_infer['pid_isoinst'].replace('', pd.NA, inplace=True)
    
    if 'installed_isoinst' in isos_inst_infer.columns:
        isos_inst_infer['installed_isoinst'] = isos_inst_infer['installed_isoinst'].astype(str)
        isos_inst_infer['installed_isoinst'] = isos_inst_infer['installed_isoinst'].replace('NaT', '')
    
    isos_inst_infer = isos_inst_infer.replace(["<NA>", "NaT", "NaN"], pd.NA)
    
    return isos_inst_infer

def process_punch_list_sheet(excel_data, sheet_name):
    punch_list = pd.read_excel(BytesIO(excel_data), sheet_name=sheet_name, skiprows=5, usecols='B:W', dtype=str)
    punch_l_infer = format_dataframe_columns(punch_list, threshold=0.95)
    
    punch_l_infer = punch_l_infer.rename(columns={'SUBSISTEMA': 'SUBSYSTEM'})
    punch_l_infer['SUBSYSTEM'] = punch_l_infer['SUBSYSTEM'].str.replace('¿?', '')
    
    punch_l_infer['SUBSYSTEM'] = punch_l_infer['SUBSYSTEM'].replace('', pd.NA).str.strip()
    punch_l_infer = punch_l_infer.dropna(subset=['SUBSYSTEM'])
    punch_l_infer.columns = [col if col == "SUBSYSTEM" else f"{col}_PUNCH_L" for col in punch_l_infer.columns]
    
    punch_l_infer.columns = (
        punch_l_infer.columns
        .str.strip()
        .str.lower()
        .str.replace(' ', '_')
        .str.replace(r'[^\w_]', '', regex=True)
    )
    punch_l_infer['record'] = (punch_l_infer.groupby(['subsystem']).cumcount() + 1).astype(int)
    
    return punch_l_infer

def process_default_sheet(excel_data, sheet_name):
    df = pd.read_excel(BytesIO(excel_data), sheet_name=sheet_name, dtype=str)
    return df

def remove_accents(input_str):
    if isinstance(input_str, str):
        nfkd_form = unicodedata.normalize('NFKD', input_str)
        return ''.join([c for c in nfkd_form if not unicodedata.combining(c)])
    return input_str

def create_table_master(df_a: pd.DataFrame, df_b: pd.DataFrame, df_c: pd.DataFrame, df_d: pd.DataFrame, df_e: pd.DataFrame, df_f: pd.DataFrame, df_g) -> pd.DataFrame:
    """
    Create a master table by merging multiple DataFrames based on subsystem and record columns.
    
    Args:
        df_a, df_b, df_c, df_d, df_e, df_f, df_g: Input DataFrames with subsystem and record columns
        
    Returns:
        Combined DataFrame with all columns from input DataFrames
    """
    logger.info("Creating master table from DataFrames")
    tables = [df_a, df_b, df_c, df_d, df_e, df_f, df_g]
    
    try:
        # Count records per subsystem in each DataFrame
        counts = [df.groupby('subsystem')['record'].count().reset_index(name=f'count_{i}')
                  for i, df in enumerate(tables)]
        
        # Merge count DataFrames and find maximum count per subsystem
        max_counts = reduce(lambda left, right: pd.merge(left, right, on='subsystem', how='outer'), counts).fillna(0)
        max_counts['max_count'] = max_counts[[col for col in max_counts.columns if col.startswith('count_')]].max(axis=1)
        
        # Create expanded DataFrame with all subsystem-record combinations
        expanded = []
        for _, row in max_counts.iterrows():
            expanded.extend([(row['subsystem'], i+1) for i in range(int(row['max_count']))])
        expanded_df = pd.DataFrame(expanded, columns=['subsystem', 'record'])
        
        # Merge all input DataFrames with the expanded DataFrame
        result = expanded_df
        for df in tables:
            result = result.merge(df, on=['subsystem', 'record'], how='left')
        
        # Sort and clean up the result
        result = result.sort_values(['subsystem', 'record']).reset_index(drop=True)
        
        # Check for duplicates
        if result.duplicated(subset=['subsystem', 'record']).any():
            logger.warning("Duplicates detected in the master table!")
        
        # Remove columns that are all NaN
        result = result.dropna(axis=1, how='all')
        
        return result
        
    except Exception as e:
        logger.error(f"Error creating master table: {str(e)}")
        raise

def create_master_tables(processed_sheets):
    master_tables = {}
    
    # Check if we have the required sheets for master table creation
    required_sheets = ['TEST_LOOP', 'ISOS', 'Tuberia', 'TRAC_SIEMSA', 'FIELD_CONTROL', 'ISO_INST', 'Punch_List']
    available_sheets = [sheet for sheet in required_sheets if sheet in processed_sheets]
    
    if len(available_sheets) >= 7:
        try:
            # Create master subsystem table
            master_subsystem = create_table_master(
                processed_sheets['TEST_LOOP'],
                processed_sheets['ISOS'],
                processed_sheets['Tuberia'],
                processed_sheets['TRAC_SIEMSA'],
                processed_sheets['FIELD_CONTROL'],
                processed_sheets['ISO_INST'],
                processed_sheets['Punch_List']
            )
            
            # Apply accent removal
            master_subsystem = master_subsystem.applymap(remove_accents)
            
            # Clean anomalies
            anomalies = ["", "", ",,", "NA", "N/A", "#NA", "na", "n/a", "#na", "--", "_?"]
            master_subsystem.replace(anomalies, np.nan, inplace=True)
            
            # Strip whitespace
            master_subsystem = master_subsystem.applymap(lambda x: x.strip() if isinstance(x, str) else x)
            
            # Drop empty rows
            master_subsystem.dropna(how='all', inplace=True)
            
            # Filter out NOT and HOLD subsystems
            if 'subsystem' in master_subsystem.columns:
                master_subsystem = master_subsystem[master_subsystem['subsystem'] != 'NOT']
                master_subsystem = master_subsystem[master_subsystem['subsystem'] != 'HOLD']
            
            # Clean specific columns
            if 'subsystem_description_isos' in master_subsystem.columns:
                master_subsystem['subsystem_description_isos'] = master_subsystem['subsystem_description_isos'].str.replace(',', ';')
            
            if 'tp_include_isoinst' in master_subsystem.columns:
                master_subsystem['tp_include_isoinst'] = master_subsystem['tp_include_isoinst'].str.replace(', ', '|')
                master_subsystem['tp_include_isoinst'] = master_subsystem['tp_include_isoinst'].str.replace('|X', '')
            
            # Process TP progress if TP sheet is available
            if 'TP' in processed_sheets and 'tp_include_isoinst' in master_subsystem.columns:
                tp_data = processed_sheets['TP']
                if 'dossier_id_tp' in tp_data.columns and 'tp_construct_progress__tp' in tp_data.columns:
                    progress_map = dict(zip(tp_data['dossier_id_tp'].astype(str), tp_data['tp_construct_progress__tp']))
                    
                    def extract_progress(isoinst):
                        if pd.isna(isoinst) or isoinst == "NOT_APPLY":
                            return []
                        dossier_ids = str(isoinst).split("|")
                        return [round(progress_map.get(did), 2) if progress_map.get(did) is not None else None for did in dossier_ids]
                    
                    master_subsystem["progress_list"] = master_subsystem["tp_include_isoinst"].apply(extract_progress)
                    
                    max_progresses = master_subsystem["progress_list"].apply(len).max()
                    
                    for i in range(max_progresses):
                        master_subsystem[f"progress_ac_tp_{i+1}"] = master_subsystem["progress_list"].apply(
                            lambda x: x[i] if i < len(x) else None
                        )
                    
                    master_subsystem.drop(columns="progress_list", inplace=True)
            
            # Process isometric mapping
            if 'includes_fc' in master_subsystem.columns and 'isometric_fc' in master_subsystem.columns:
                filtered_df = master_subsystem[['includes_fc', 'isometric_fc']].dropna(subset=['includes_fc', 'isometric_fc'])
                replace_map = dict(zip(filtered_df['isometric_fc'], filtered_df['includes_fc']))
                
                if 'isometricos_ifc3_isos' in master_subsystem.columns and 'tpvt_isos' in master_subsystem.columns:
                    master_subsystem['tpvt_isos'] = master_subsystem['isometricos_ifc3_isos'].map(replace_map).combine_first(master_subsystem['tpvt_isos'])
            
            master_tables['master_subsystem'] = master_subsystem
            
            # Create TP full table if possible
            if 'TP' in processed_sheets and 'tpvt_isos' in master_subsystem.columns:
                df_tp = master_subsystem[['subsystem', 'tpvt_isos']].dropna(subset=['tpvt_isos']).copy()
                df_tp['tpvt_isos'] = df_tp['tpvt_isos'].astype(str).str.split('|')
                df_tp = df_tp.explode('tpvt_isos')
                df_tp['tpvt_isos'] = df_tp['tpvt_isos'].str.strip()
                df_tp = df_tp[df_tp['subsystem'] != 'ANULADA']
                
                tp_data = processed_sheets['TP']
                if 'dossier_id_tp' in tp_data.columns:
                    df_tp_full = df_tp.merge(tp_data, left_on='tpvt_isos', right_on='dossier_id_tp', how='left')
                    master_tables['df_tp_full'] = df_tp_full
            
        except Exception as e:
            logger.warning(f"Could not create master tables: {str(e)}")
    
    return master_tables

def get_all_subsystems(df):
    """Extract all unique subsystems that appear in any of the queries"""
    
    # Query 1: Insulation subsystems
    q1_subsystems = df[df['iso_insulation'].notna()]['subsystem']
    
    # Query 2: Loop subsystems  
    q2_subsystems = df[df['code_tlp'].notna()]['subsystem']
    
    # Query 3: TP subsystems
    q3_subsystems = df[(df['tp_include_isoinst'].notna()) & 
                       (df['tp_include_isoinst'] != 'NOT_APPLY')]['subsystem']
    
    # Query 4: Installation subsystems
    q4_subsystems = df[df['on_isoinst'] == 'PIP']['subsystem']
    
    # Query 5: Tracing subsystems
    q5_subsystems = df[df['isometricos_tracing'].notna()]['subsystem']
    
    # Query 6: Punch subsystems
    q6_subsystems = df[df['punch_item_num_punch_l'].notna()]['subsystem']
    
    # Combine all subsystems and get unique values
    all_subsystems = pd.concat([q1_subsystems, q2_subsystems, q3_subsystems, 
                               q4_subsystems, q5_subsystems, q6_subsystems])
    
    return pd.DataFrame({'subsystem': all_subsystems.unique()})

def query_1_insulation(df):
    """Query 1: Insulation data - Computes insulation status per subsystem based on float comparison"""
    
    # Filter for valid insulation entries
    filtered_df = df[df['iso_insulation'].notna()].copy()

    # Round both float columns to 2 decimal places before comparison
    filtered_df['mleq_insulation_rounded'] = filtered_df['mleq_insulation'].astype(float).round(2)
    filtered_df['total_m_avance_insulation_rounded'] = filtered_df['total_m_avance_insulation'].astype(float).round(2)

    # Determine if they are equal (after rounding)
    filtered_df['match'] = (
        filtered_df['mleq_insulation_rounded'] == filtered_df['total_m_avance_insulation_rounded']
    ).astype(int)

    # Group by subsystem and iso_insulation (similar to CTE s1)
    s1 = filtered_df.groupby(['subsystem', 'iso_insulation']).agg(
        n_insulation=('iso_insulation', 'count'),
        v_insulation=('match', 'sum')
    ).reset_index()

    # Determine done vs pending
    s1['is_done'] = (s1['n_insulation'] == s1['v_insulation']).astype(int)
    s1['is_pending'] = (s1['n_insulation'] != s1['v_insulation']).astype(int)

    # Final aggregation by subsystem
    result = s1.groupby('subsystem').agg(
        total_insulation=('iso_insulation', 'count'),
        done_insulation=('is_done', 'sum'),
        pending_insulation=('is_pending', 'sum')
    ).reset_index()

    return result
    
def query_2_loop(df):
    """Query 2: Loop data"""
    filtered_df = df[df['code_tlp'].notna()].copy()
    
    result = filtered_df.groupby('subsystem').agg(
        total_loop=('tag_loop_tlp', 'count'),
        done_loop=('ok100_tlp', lambda x: (x == 1).sum()),
        pending_loop=('ok100_tlp', lambda x: (x < 1).sum())
    ).reset_index()
    
    return result

def query_3_tp(df):
    filtered = df[df['construc_coord_progress_fc'].notna()].copy()

    filtered['includes_fc'] = filtered['includes_fc'].fillna('').astype(str)
    filtered['includes_fc_value'] = filtered['includes_fc'].str.split('|')
    exploded = filtered.explode('includes_fc_value')

    exploded['includes_fc_value'] = exploded['includes_fc_value'].str.strip()

    exploded = exploded[
        exploded['includes_fc_value'].notna() &
        (exploded['includes_fc_value'] != '') &
        (exploded['includes_fc_value'].str.upper() != 'ANULADA')
    ].copy()

    exploded['includes_fc_value'] = exploded['includes_fc_value'].astype(float).astype(int)
    exploded['construc_coord_progress_fc'] = exploded['construc_coord_progress_fc'].astype(float)

    # Use average instead of sum
    agg = (
        exploded.groupby(['subsystem', 'includes_fc_value'], as_index=False)
        .agg(total_progress=('construc_coord_progress_fc', 'mean'))
    )

    def make_lists(g):
        g = g.sort_values('includes_fc_value')
        return pd.Series({
            'n_distinct_tps_x': g['includes_fc_value'].nunique(),
            'list_includes_tp_id_x': '|'.join(map(str, g['includes_fc_value'])),
            'list_id_tp_total_progress_x': '|'.join(f"{v:.2f}" for v in g['total_progress'])
        })

    result = agg.groupby('subsystem').apply(make_lists).reset_index()
    result2 = result.rename(columns={
        'n_distinct_tps_x':'n_distinct_tps',
        'list_includes_tp_id_x':'list_includes_tp_id',
        'list_id_tp_total_progress_x':'list_id_tp_total_progress'
    })

    return result2

def query_4_installation(df):
    """Query 4: INST data"""
    filtered_df = df[df['on_isoinst'] == 'PIP'].copy()

    qcf_done = filtered_df['qcf_released_instrument_isoinst'].notnull()
    qcf_pending = filtered_df['qcf_released_instrument_isoinst'].isnull()

    # Combine all done and pending logic (bitwise OR across sources)
    filtered_df['done_inst'] = qcf_done.astype(int)
    filtered_df['pending_inst'] = qcf_pending.astype(int)

    # Group and aggregate
    result = filtered_df.groupby('subsystem').agg(
        total_inst=('tag_inst_isoinst', 'count'),
        done_inst=('done_inst', 'sum'),
        pending_inst=('pending_inst', 'sum')
    ).reset_index()

    return result

def query_5_tracing(df):
    """Query 5: Tracing data - Fixed version"""
    filtered_df = df[df['isometricos_tracing'].notna()].copy()
    
    # First groupby (equivalent to CTE x2)
    x2 = filtered_df.groupby(['subsystem', 'isometricos_tracing']).agg(
        n_tracing=('isometricos_tracing', 'count'),
        v_tracing=('progress_100_liberadoa__teigatmi_kaefer_tracing', lambda x: (x == 1).sum())
    ).reset_index()
    
    # Create comparison columns
    x2['is_done'] = (x2['n_tracing'] == x2['v_tracing']).astype(int)
    x2['is_pending'] = (x2['n_tracing'] != x2['v_tracing']).astype(int)
    
    # Second groupby
    result = x2.groupby('subsystem').agg(
        total_tracing=('isometricos_tracing', 'count'),
        done_tracing=('is_done', 'sum'),
        pending_tracing=('is_pending', 'sum')
    ).reset_index()
    
    return result

def query_6_punch(df):
    """Query 6: Punch data"""
    filtered_df = df[df['punch_item_num_punch_l'].notna()].copy()
    
    result = filtered_df.groupby('subsystem').agg(
        total_punch=('punch_item_num_punch_l', 'count'),
        pending_punch=('status_punch_l', lambda x: (x == 'OUTSTANDING').sum()),
        close_punch=('status_punch_l', lambda x: (x == 'CLOSED').sum()),
        open_punch=('status_punch_l', lambda x: x.isna().sum())
    ).reset_index()
    
    return result

def execute_full_analysis(df):
    """Execute all queries and perform LEFT JOINs"""
    
    # Get unique subsystems as base
    base_df = get_all_subsystems(df)
    
    # Execute all queries
    q1_result = query_1_insulation(df)
    q2_result = query_2_loop(df) 
    q3_result = query_3_tp(df)
    q4_result = query_4_installation(df)
    q5_result = query_5_tracing(df)
    q6_result = query_6_punch(df)
    
    # Perform LEFT JOINs
    final_result = base_df
    final_result = final_result.merge(q1_result, on='subsystem', how='left')
    final_result = final_result.merge(q2_result, on='subsystem', how='left') 
    final_result = final_result.merge(q3_result, on='subsystem', how='left')
    final_result = final_result.merge(q4_result, on='subsystem', how='left')
    final_result = final_result.merge(q5_result, on='subsystem', how='left')
    final_result = final_result.merge(q6_result, on='subsystem', how='left')
    
    return final_result

def create_ssm_table(master_subsystem, processed_sheets, bucket, file_id=None):
    """Create SSM analysis table from master_subsystem"""
    try:
        logger.info("Creating SSM analysis table")
        
        # Execute the full analysis
        result2 = execute_full_analysis(master_subsystem)
        
        # Load pipeline data from S3
        try:
            pipeline_response = s3_client.get_object(Bucket=bucket, Key='temporarySource/pipelinedata.csv')
            pipelinedata = pd.read_csv(BytesIO(pipeline_response['Body'].read()))
            
            chosen_columns = ['SUBSYSTEM','FLUID_SUBSYSTEM']
            pipelinedata = pipelinedata[chosen_columns].drop_duplicates()
            pipelinedata.columns = pipelinedata.columns.str.lower()
        except Exception as e:
            logger.warning(f"Could not load pipeline data: {str(e)}")
            pipelinedata = pd.DataFrame(columns=['subsystem', 'fluid_subsystem'])
        
        # Get hito data if ISOS sheet is available
        if 'ISOS' in processed_sheets:
            isos_data = processed_sheets['ISOS']
            if 'hito_isos' in isos_data.columns:
                columns = ['subsystem','hito_isos']
                hito_for_subsystem = isos_data[columns].drop_duplicates()
            else:
                hito_for_subsystem = pd.DataFrame(columns=['subsystem', 'hito_isos'])
        else:
            hito_for_subsystem = pd.DataFrame(columns=['subsystem', 'hito_isos'])
        
        # Merge with pipeline and hito data
        result3 = result2.merge(pipelinedata, on='subsystem', how='left')
        result3 = result3.merge(hito_for_subsystem, on='subsystem', how='left')
        ssm = result3.copy()
        
        # Filter out specific subsystems
        ssm = ssm[ssm['subsystem'] != 'NOT']
        ssm = ssm[ssm['subsystem'] != 'NI-10003-03']
        
        # Rename columns
        ssm = ssm.rename(columns={'s/n':'s_n'})
        
        # Calculate totals
        ssm["total_items"] = ssm[[
            "total_insulation",
            "total_loop",
            "total_inst",
            "total_tracing",
            "total_punch"
        ]].sum(axis=1)
        
        ssm["done_items"] = ssm[[
            "done_insulation",
            "done_loop",
            "done_inst",
            "done_tracing",
            "close_punch"
        ]].sum(axis=1)
        
        ssm["pending_items"] = ssm[[
            "pending_insulation",
            "pending_loop",
            "pending_inst",
            "pending_tracing",
            "pending_punch"
        ]].sum(axis=1)
        
        # Calculate average progress
        ssm["avg_progress_subsystem"] = np.where(
            ssm["total_items"] > 0,
            (ssm["done_items"] / ssm["total_items"]) * 100,
            0
        )
        
        # Merge with general and subsystems data if available
        if 'general' in processed_sheets:
            ssm = ssm.merge(processed_sheets['general'], on='subsystem', how='left')
        
        if 'Subsystems' in processed_sheets:
            ssm = ssm.merge(processed_sheets['Subsystems'], on='subsystem', how='left')
        
        return ssm
        
    except Exception as e:
        logger.error(f"Error creating SSM table: {str(e)}")
        return None

def save_parquet_to_s3(df, bucket, key):
    buffer = BytesIO()
    df.to_parquet(buffer, index=False)
    buffer.seek(0)
    s3_client.put_object(
        Bucket=bucket,
        Key=key,
        Body=buffer.getvalue(),
        ContentType='application/octet-stream'
    )

def save_csv_to_s3(df, bucket, key):
    buffer = BytesIO()
    df.to_csv(buffer, index=False)
    buffer.seek(0)
    s3_client.put_object(
        Bucket=bucket,
        Key=key,
        Body=buffer.getvalue(),
        ContentType='text/csv'
    )