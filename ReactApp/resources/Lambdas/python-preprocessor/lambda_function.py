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

# Initialize progress tracking resources if environment variables are available
try:
    if os.environ.get('PROGRESS_TABLE'):
        dynamodb = boto3.resource('dynamodb')
        progress_table = dynamodb.Table(os.environ.get('PROGRESS_TABLE'))
    else:
        dynamodb = None
        progress_table = None
        
    if os.environ.get('WEBSOCKET_ENDPOINT'):
        apigateway_client = boto3.client('apigatewaymanagementapi', endpoint_url=os.environ.get('WEBSOCKET_ENDPOINT'))
    else:
        apigateway_client = None
except Exception as e:
    logger.warning(f"Progress tracking not available: {str(e)}")
    dynamodb = None
    progress_table = None
    apigateway_client = None

def lambda_handler(event, context):
    """Python Lambda for intelligent Excel preprocessing"""
    
    # Extract S3 details from EventBridge event
    bucket = event['detail']['bucket']['name']
    key = event['detail']['object']['key']
    file_id = key.split('/')[-1].split('.')[0]
    
    logger.info(f"🚀 Starting Excel processing: s3://{bucket}/{key}")
    logger.info(f"📋 Event details: {json.dumps(event, indent=2)}")
    
    # Initialize progress tracking
    update_progress(file_id, 0, "Starting Excel processing...")
    
    try:
        # Download Excel file
        update_progress(file_id, 10, "Downloading Excel file...")
        logger.info(f"📥 Downloading Excel file from S3...")
        response = s3_client.get_object(Bucket=bucket, Key=key)
        excel_data = response['Body'].read()
        logger.info(f"✅ Downloaded {len(excel_data)} bytes")
        
        # Process all sheets from Excel
        update_progress(file_id, 20, "Processing Excel sheets...")
        logger.info(f"🔄 Starting Excel sheet processing...")
        processed_sheets = process_excel_with_inference(excel_data, file_id)
        logger.info(f"✅ Processed {len(processed_sheets)} sheets")
        
        # Create master table if we have the required sheets
        update_progress(file_id, 60, "Creating master tables...")
        logger.info(f"🔗 Creating master table...")
        master_tables = create_master_tables(processed_sheets)
        if master_tables:
            processed_sheets.update(master_tables)
            logger.info(f"✅ Master tables created: {list(master_tables.keys())}")
            
            # Create SSM table if master_subsystem exists
            if 'master_subsystem' in master_tables:
                update_progress(file_id, 70, "Creating SSM analysis...")
                logger.info(f"📊 Creating SSM table...")
                ssm_table = create_ssm_table(master_tables['master_subsystem'], processed_sheets, bucket)
                if ssm_table is not None:
                    processed_sheets['ssm'] = ssm_table
                    logger.info(f"✅ SSM table created with {len(ssm_table)} rows")
        
        # Save each sheet as separate Parquet file
        update_progress(file_id, 80, "Saving processed files...")
        logger.info(f"📝 Generated file ID: {file_id}")
        
        parquet_keys = []
        metadata_keys = []
        
        total_files = len(processed_sheets)
        for i, (sheet_name, df) in enumerate(processed_sheets.items()):
            save_progress = 80 + (i / total_files) * 15  # Progress from 80% to 95%
            update_progress(file_id, int(save_progress), f"Saving {sheet_name}...")
            logger.info(f"💾 Saving sheet '{sheet_name}' as Parquet...")
            # Save as Parquet
            parquet_key = f"processedPython/{file_id}_{sheet_name}.parquet"
            save_parquet_to_s3(df, bucket, parquet_key)
            parquet_keys.append(parquet_key)
            logger.info(f"✅ Saved: {parquet_key}")
            
            # Save SSM as CSV as well for easier access
            if sheet_name == 'ssm':
                csv_key = f"processedPython/{file_id}_{sheet_name}.csv"
                save_csv_to_s3(df, bucket, csv_key)
                parquet_keys.append(csv_key)  # Add CSV to keys list
                logger.info(f"✅ SSM CSV saved: {csv_key}")
            
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

        update_progress(file_id, 95, "Finalizing...")
        
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
        
        update_progress(file_id, 100, "Processing completed successfully!")
        logger.info(f"🎉 Processing complete! Summary:")
        logger.info(f"   📊 Sheets processed: {len(processed_sheets)}")
        logger.info(f"   📁 Parquet files: {len(parquet_keys)}")
        logger.info(f"   📋 Metadata files: {len(metadata_keys)}")
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': f'Excel processed successfully - {len(processed_sheets)} sheets',
                'file_id': file_id,
                'sheets_processed': list(processed_sheets.keys()),
                'parquet_keys': parquet_keys,
                'metadata': combined_metadata,
                'processing_summary': summary_key
            })
        }
        
    except Exception as e:
        update_progress(file_id, -1, f"Error: {str(e)}")
        logger.error(f"❌ Error processing Excel: {str(e)}")
        logger.error(f"📍 Error details: {type(e).__name__}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }

def update_progress(file_id, progress, message):
    """Update processing progress in DynamoDB and notify via WebSocket"""
    if not progress_table:
        logger.info(f"Progress: {progress}% - {message}")  # Log to CloudWatch instead
        return
        
    try:
        # Update DynamoDB
        progress_table.put_item(
            Item={
                'file_id': file_id,
                'progress': progress,
                'message': message,
                'timestamp': datetime.utcnow().isoformat()
            }
        )
        
        # WebSocket notifications disabled - requires proper connection management
        # if apigateway_client:
        #     try:
        #         apigateway_client.post_to_connection(
        #             ConnectionId=valid_connection_id,
        #             Data=json.dumps({
        #                 'type': 'progress',
        #                 'file_id': file_id,
        #                 'progress': progress,
        #                 'message': message
        #             })
        #         )
        #     except Exception as ws_error:
        #         logger.warning(f"WebSocket notification failed: {str(ws_error)}")
                
    except Exception as e:
        logger.warning(f"Progress update failed: {str(e)}")
        logger.info(f"Progress: {progress}% - {message}")  # Fallback to CloudWatch logs

def process_excel_with_inference(excel_data, file_id=None):
    """Process all sheets with sheet-specific logic"""
    
    # Read all sheets from Excel file
    logger.info(f"📖 Reading Excel file structure...")
    excel_file = pd.ExcelFile(BytesIO(excel_data))
    logger.info(f"📋 Found sheets: {excel_file.sheet_names}")
    
    # Log which sheets we can process
    known_sheets = ['TEST_LOOP', 'TP', 'general', 'Subsystems', 'ISOS', 'Tuberia', 'TRAC_SIEMSA', 'FIELD CONTROL', 'ISO_INST', 'Punch List']
    missing_sheets = [s for s in known_sheets if s not in excel_file.sheet_names]
    if missing_sheets:
        logger.warning(f"⚠️ Missing expected sheets: {missing_sheets}")
    
    processed_sheets = {}
    total_sheets = len(excel_file.sheet_names)
    
    for i, sheet_name in enumerate(excel_file.sheet_names):
        try:
            if file_id:
                sheet_progress = 20 + (i / total_sheets) * 40  # Progress from 20% to 60%
                update_progress(file_id, int(sheet_progress), f"Processing sheet: {sheet_name}")
            logger.info(f"🔄 Processing sheet: '{sheet_name}'")
            
            # Apply sheet-specific processing
            if sheet_name == 'TEST_LOOP':
                logger.info(f"🔍 Using TEST_LOOP logic")
                df = process_test_loop_sheet(excel_data, sheet_name)
            elif sheet_name == 'TP':
                logger.info(f"🔍 Using TP logic")
                df = process_tp_sheet(excel_data, sheet_name)
            elif sheet_name == 'general':
                logger.info(f"🔍 Using GENERAL logic")
                df = process_general_sheet(excel_data, sheet_name)
            elif sheet_name == 'Subsystems':
                logger.info(f"🔍 Using SUBSYSTEMS logic")
                df = process_subsystems_sheet(excel_data, sheet_name)
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

def process_tp_sheet(excel_data, sheet_name):
    """Process TP sheet with specific logic"""
    df = read_excel_sheet(excel_data, sheet_name, skiprows=4, usecols='B:AS')
    df = apply_type_inference(df)
    
    # TP specific transformations
    df.columns = [f"{col}_TP" for col in df.columns]
    df = clean_column_names(df)
    
    # Filter out rows where dossier_id_tp is null
    if 'dossier_id_tp' in df.columns:
        df = df[df["dossier_id_tp"].notna()]
    
    return df

def process_general_sheet(excel_data, sheet_name):
    """Process general sheet with specific logic"""
    df = read_excel_sheet(excel_data, sheet_name, skiprows=3)
    
    # Select specific columns
    columns = ['SUB-SYSTEM', 'PSV Total', 'PSV Calibrated', 'PSV TO calibrate', 'Motor Tot', 'Motor Solo Run DONE', 'Solo Run PENDING']
    df = df[columns]
    
    df = apply_type_inference(df)
    
    # Rename SUB-SYSTEM to SUBSYSTEM
    df = df.rename(columns={'SUB-SYSTEM': 'SUBSYSTEM'})
    
    return clean_column_names(df)

def process_subsystems_sheet(excel_data, sheet_name):
    """Process Subsystems sheet with specific logic"""
    df = read_excel_sheet(excel_data, sheet_name)
    df = apply_type_inference(df)
    
    # SUBSYSTEM replacements
    df['SUBSYSTEM'] = df['SUBSYSTEM'].replace({
        'NI-PR12-02': 'NI-PR12-01',
        'NI-PR12-03': 'NI-PR12-01',
        'NI-PR12-04': 'NI-PR12-01'
    })
    
    # Filter out specific SUBSYSTEM
    df = df[df['SUBSYSTEM'] != 'RIPA-10003-07']
    
    df = clean_column_names(df)
    
    # Remove duplicates
    df = df.drop_duplicates(subset=['subsystem'], keep='first')
    
    # Clean description column if it exists
    if 'description' in df.columns:
        replacements = {'ó': 'o', 'ú': 'u', 'Á': 'A', ',': ';', 'é': 'e', 'í': 'i'}
        for old, new in replacements.items():
            df['description'] = df['description'].str.replace(old, new, regex=False)
    
    return df

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

def save_csv_to_s3(df, bucket, key):
    """Save DataFrame as CSV to S3"""
    logger.info(f"💾 Converting DataFrame to CSV format...")
    buffer = BytesIO()
    df.to_csv(buffer, index=False)
    buffer.seek(0)
    
    logger.info(f"☁️ Uploading CSV to S3: {key}")
    s3_client.put_object(
        Bucket=bucket,
        Key=key,
        Body=buffer.getvalue(),
        ContentType='text/csv'
    )
    
    logger.info(f"✅ CSV saved: s3://{bucket}/{key} ({len(buffer.getvalue())} bytes)")



def create_ssm_table(master_subsystem, processed_sheets, bucket):
    """Create SSM table from master_subsystem and additional data"""
    try:
        # Try to download pipelinedata.csv from temporarySource/
        logger.info(f"📎 Attempting to download pipelinedata.csv...")
        try:
            pipeline_response = s3_client.get_object(Bucket=bucket, Key='temporarySource/pipelinedata.csv')
            pipelinedata = pd.read_csv(BytesIO(pipeline_response['Body'].read()))
            logger.info(f"✅ Found pipelinedata.csv")
        except Exception as e:
            logger.warning(f"⚠️ pipelinedata.csv not found: {str(e)}")
            # Create empty dataframe with required columns
            pipelinedata = pd.DataFrame(columns=['SUBSYSTEM', 'FLUID_SUBSYSTEM'])

        # Process pipelinedata if available
        if not pipelinedata.empty and 'SUBSYSTEM' in pipelinedata.columns:
            chosen_columns = ['SUBSYSTEM', 'FLUID_SUBSYSTEM']
            available_columns = [col for col in chosen_columns if col in pipelinedata.columns]
            if available_columns:
                pipelinedata = pipelinedata[available_columns].drop_duplicates()
                pipelinedata.columns = pipelinedata.columns.str.lower()
            else:
                pipelinedata = pd.DataFrame(columns=['subsystem', 'fluid_subsystem'])
        else:
            pipelinedata = pd.DataFrame(columns=['subsystem', 'fluid_subsystem'])

        # Get hito data from ISOS sheet if available
        if 'ISOS' in processed_sheets:
            isos_df = processed_sheets['ISOS']
            if 'hito_isos' in isos_df.columns:
                columns = ['subsystem', 'hito_isos']
                hito_for_subsystem = isos_df[columns].drop_duplicates()
            else:
                hito_for_subsystem = pd.DataFrame(columns=['subsystem', 'hito_isos'])
        else:
            hito_for_subsystem = pd.DataFrame(columns=['subsystem', 'hito_isos'])

        # Execute full analysis on master_subsystem
        logger.info(f"🔍 Executing SSM analysis...")
        result2 = execute_full_analysis(master_subsystem)

        # Merge with additional data
        result3 = result2.merge(pipelinedata, on='subsystem', how='left')
        result3 = result3.merge(hito_for_subsystem, on='subsystem', how='left')
        ssm = result3.copy() 

        ssm = ssm[ssm['subsystem'] != 'NOT']
        ssm = ssm[ssm['subsystem'] != 'NI-10003-03']

        ssm = ssm.rename(columns={
            's/n':'s_n'
        })

        # TOTAL ITEMS
        ssm["total_items"] = ssm[[
            "total_insulation",
            "total_loop",
            "total_inst",
            "total_tracing",
            "total_punch"
        ]].sum(axis=1)

        # DONE ITEMS
        ssm["done_items"] = ssm[[
            "done_insulation",
            "done_loop",
            "done_inst",
            "done_tracing",
            "close_punch"  # Note: this maps to total_punch
        ]].sum(axis=1)

        # PENDING ITEMS
        ssm["pending_items"] = ssm[[
            "pending_insulation",
            "pending_loop",
            "pending_inst",
            "pending_tracing",
            "pending_punch"
        ]].sum(axis=1)

        done_sum = ssm[["done_insulation", "done_loop", "done_inst", "done_tracing", "close_punch"]].sum(axis=1)
        pending_sum = ssm[["pending_insulation", "pending_loop", "pending_inst", "pending_tracing", "pending_punch"]].sum(axis=1)

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

def get_all_subsystems(df):
    """Extract all unique subsystems that appear in any of the queries"""
    queries = []
    
    if 'iso_insulation' in df.columns:
        queries.append(df[df['iso_insulation'].notna()]['subsystem'])
    if 'code_tlp' in df.columns:
        queries.append(df[df['code_tlp'].notna()]['subsystem'])
    if 'tp_include_isoinst' in df.columns:
        queries.append(df[(df['tp_include_isoinst'].notna()) & (df['tp_include_isoinst'] != 'NOT_APPLY')]['subsystem'])
    if 'on_isoinst' in df.columns:
        queries.append(df[df['on_isoinst'] == 'PIP']['subsystem'])
    if 'isometricos_tracing' in df.columns:
        queries.append(df[df['isometricos_tracing'].notna()]['subsystem'])
    if 'punch_item_num_punch_l' in df.columns:
        queries.append(df[df['punch_item_num_punch_l'].notna()]['subsystem'])
    
    if queries:
        all_subsystems = pd.concat(queries)
        return pd.DataFrame({'subsystem': all_subsystems.unique()})
    else:
        return pd.DataFrame({'subsystem': df['subsystem'].unique()})

def query_1_insulation(df):
    """Query 1: Insulation data"""
    if 'iso_insulation' not in df.columns:
        return pd.DataFrame(columns=['subsystem', 'total_insulation', 'done_insulation', 'pending_insulation'])
    
    filtered_df = df[df['iso_insulation'].notna()].copy()
    if filtered_df.empty:
        return pd.DataFrame(columns=['subsystem', 'total_insulation', 'done_insulation', 'pending_insulation'])
    
    # Round and compare
    filtered_df['mleq_insulation_rounded'] = pd.to_numeric(filtered_df.get('mleq_insulation', 0), errors='coerce').fillna(0).round(2)
    filtered_df['total_m_avance_insulation_rounded'] = pd.to_numeric(filtered_df.get('total_m_avance_insulation', 0), errors='coerce').fillna(0).round(2)
    filtered_df['match'] = (filtered_df['mleq_insulation_rounded'] == filtered_df['total_m_avance_insulation_rounded']).astype(int)
    
    s1 = filtered_df.groupby(['subsystem', 'iso_insulation']).agg(
        n_insulation=('iso_insulation', 'count'),
        v_insulation=('match', 'sum')
    ).reset_index()
    
    s1['is_done'] = (s1['n_insulation'] == s1['v_insulation']).astype(int)
    s1['is_pending'] = (s1['n_insulation'] != s1['v_insulation']).astype(int)
    
    result = s1.groupby('subsystem').agg(
        total_insulation=('iso_insulation', 'count'),
        done_insulation=('is_done', 'sum'),
        pending_insulation=('is_pending', 'sum')
    ).reset_index()
    
    return result

def query_2_loop(df):
    """Query 2: Loop data"""
    if 'code_tlp' not in df.columns:
        return pd.DataFrame(columns=['subsystem', 'total_loop', 'done_loop', 'pending_loop'])
    
    filtered_df = df[df['code_tlp'].notna()].copy()
    if filtered_df.empty:
        return pd.DataFrame(columns=['subsystem', 'total_loop', 'done_loop', 'pending_loop'])
    
    result = filtered_df.groupby('subsystem').agg(
        total_loop=('tag_loop_tlp', 'count') if 'tag_loop_tlp' in filtered_df.columns else ('code_tlp', 'count'),
        done_loop=('ok100_tlp', lambda x: (pd.to_numeric(x, errors='coerce') == 1).sum()) if 'ok100_tlp' in filtered_df.columns else ('code_tlp', lambda x: 0),
        pending_loop=('ok100_tlp', lambda x: (pd.to_numeric(x, errors='coerce') < 1).sum()) if 'ok100_tlp' in filtered_df.columns else ('code_tlp', 'count')
    ).reset_index()
    
    return result

def query_3_tp(df):
    """Query 3: TP data"""
    if 'construc_coord_progress_fc' not in df.columns or 'includes_fc' not in df.columns:
        return pd.DataFrame(columns=['subsystem', 'n_distinct_tps', 'list_includes_tp_id', 'list_id_tp_total_progress'])
    
    filtered = df[df['construc_coord_progress_fc'].notna()].copy()
    if filtered.empty:
        return pd.DataFrame(columns=['subsystem', 'n_distinct_tps', 'list_includes_tp_id', 'list_id_tp_total_progress'])
    
    filtered['includes_fc'] = filtered['includes_fc'].fillna('').astype(str)
    filtered['includes_fc_value'] = filtered['includes_fc'].str.split('|')
    exploded = filtered.explode('includes_fc_value')
    
    exploded['includes_fc_value'] = exploded['includes_fc_value'].str.strip()
    exploded = exploded[
        exploded['includes_fc_value'].notna() &
        (exploded['includes_fc_value'] != '') &
        (exploded['includes_fc_value'].str.upper() != 'ANULADA')
    ].copy()
    
    if exploded.empty:
        return pd.DataFrame(columns=['subsystem', 'n_distinct_tps', 'list_includes_tp_id', 'list_id_tp_total_progress'])
    
    exploded['includes_fc_value'] = pd.to_numeric(exploded['includes_fc_value'], errors='coerce').fillna(0).astype(int)
    exploded['construc_coord_progress_fc'] = pd.to_numeric(exploded['construc_coord_progress_fc'], errors='coerce').fillna(0)
    
    agg = exploded.groupby(['subsystem', 'includes_fc_value'], as_index=False).agg(
        total_progress=('construc_coord_progress_fc', 'mean')
    )
    
    def make_lists(g):
        g = g.sort_values('includes_fc_value')
        return pd.Series({
            'n_distinct_tps': g['includes_fc_value'].nunique(),
            'list_includes_tp_id': '|'.join(map(str, g['includes_fc_value'])),
            'list_id_tp_total_progress': '|'.join(f"{v:.2f}" for v in g['total_progress'])
        })
    
    result = agg.groupby('subsystem').apply(make_lists).reset_index()
    return result

def query_4_installation(df):
    """Query 4: Installation data"""
    if 'on_isoinst' not in df.columns:
        return pd.DataFrame(columns=['subsystem', 'total_inst', 'done_inst', 'pending_inst'])
    
    filtered_df = df[df['on_isoinst'] == 'PIP'].copy()
    if filtered_df.empty:
        return pd.DataFrame(columns=['subsystem', 'total_inst', 'done_inst', 'pending_inst'])
    
    filtered_df['done_inst'] = filtered_df.get('qcf_released_instrument_isoinst', pd.Series()).notna().astype(int)
    filtered_df['pending_inst'] = filtered_df.get('qcf_released_instrument_isoinst', pd.Series()).isna().astype(int)
    
    result = filtered_df.groupby('subsystem').agg(
        total_inst=('tag_inst_isoinst', 'count') if 'tag_inst_isoinst' in filtered_df.columns else ('on_isoinst', 'count'),
        done_inst=('done_inst', 'sum'),
        pending_inst=('pending_inst', 'sum')
    ).reset_index()
    
    return result

def query_5_tracing(df):
    """Query 5: Tracing data"""
    if 'isometricos_tracing' not in df.columns:
        return pd.DataFrame(columns=['subsystem', 'total_tracing', 'done_tracing', 'pending_tracing'])
    
    filtered_df = df[df['isometricos_tracing'].notna()].copy()
    if filtered_df.empty:
        return pd.DataFrame(columns=['subsystem', 'total_tracing', 'done_tracing', 'pending_tracing'])
    
    progress_col = 'progress_100_liberadoa__teigatmi_kaefer_tracing'
    x2 = filtered_df.groupby(['subsystem', 'isometricos_tracing']).agg(
        n_tracing=('isometricos_tracing', 'count'),
        v_tracing=(progress_col, lambda x: (pd.to_numeric(x, errors='coerce') == 1).sum()) if progress_col in filtered_df.columns else ('isometricos_tracing', lambda x: 0)
    ).reset_index()
    
    x2['is_done'] = (x2['n_tracing'] == x2['v_tracing']).astype(int)
    x2['is_pending'] = (x2['n_tracing'] != x2['v_tracing']).astype(int)
    
    result = x2.groupby('subsystem').agg(
        total_tracing=('isometricos_tracing', 'count'),
        done_tracing=('is_done', 'sum'),
        pending_tracing=('is_pending', 'sum')
    ).reset_index()
    
    return result

def query_6_punch(df):
    """Query 6: Punch data"""
    if 'punch_item_num_punch_l' not in df.columns:
        return pd.DataFrame(columns=['subsystem', 'total_punch', 'pending_punch', 'close_punch', 'open_punch'])
    
    filtered_df = df[df['punch_item_num_punch_l'].notna()].copy()
    if filtered_df.empty:
        return pd.DataFrame(columns=['subsystem', 'total_punch', 'pending_punch', 'close_punch', 'open_punch'])
    
    status_col = 'status_punch_l'
    result = filtered_df.groupby('subsystem').agg(
        total_punch=('punch_item_num_punch_l', 'count'),
        pending_punch=(status_col, lambda x: (x == 'OUTSTANDING').sum()) if status_col in filtered_df.columns else ('punch_item_num_punch_l', lambda x: 0),
        close_punch=(status_col, lambda x: (x == 'CLOSED').sum()) if status_col in filtered_df.columns else ('punch_item_num_punch_l', lambda x: 0),
        open_punch=(status_col, lambda x: x.isna().sum()) if status_col in filtered_df.columns else ('punch_item_num_punch_l', 'count')
    ).reset_index()
    
    return result

def execute_full_analysis(df):
    """Execute all queries and perform LEFT JOINs"""
    base_df = get_all_subsystems(df)
    
    q1_result = query_1_insulation(df)
    q2_result = query_2_loop(df)
    q3_result = query_3_tp(df)
    q4_result = query_4_installation(df)
    q5_result = query_5_tracing(df)
    q6_result = query_6_punch(df)
    
    final_result = base_df
    for query_result in [q1_result, q2_result, q3_result, q4_result, q5_result, q6_result]:
        if not query_result.empty:
            final_result = final_result.merge(query_result, on='subsystem', how='left')
    
    return final_result

def create_master_tables(processed_sheets):
    """Create master tables from processed sheets"""
    try:
        # Check if we have all required sheets
        required_sheets = ['TEST_LOOP', 'ISOS', 'Tuberia', 'TRAC_SIEMSA', 'FIELD CONTROL', 'ISO_INST', 'Punch List']
        available_sheets = [sheet for sheet in required_sheets if sheet in processed_sheets]
        
        if len(available_sheets) < 2:
            logger.warning(f"Not enough sheets for master table creation: {available_sheets}")
            return {}
        
        # Get dataframes in order
        dfs = [processed_sheets[sheet] for sheet in available_sheets]
        
        # Create master table
        master_subsystem = create_table_master(*dfs)
        
        # Apply post-processing
        master_subsystem = post_process_master_table(master_subsystem, processed_sheets)
        
        # Create TP expansion table if TP sheet exists
        master_tables = {'master_subsystem': master_subsystem}
        
        if 'TP' in processed_sheets:
            df_tp_full = create_tp_expansion_table(master_subsystem, processed_sheets['TP'])
            master_tables['df_tp_full'] = df_tp_full
        
        return master_tables
        
    except Exception as e:
        logger.error(f"Error creating master tables: {str(e)}")
        return {}

def create_table_master(*dfs):
    """Create a master table by merging multiple DataFrames"""
    logger.info("Creating master table from DataFrames")
    tables = [df for df in dfs if df is not None and not df.empty]
    
    if len(tables) == 0:
        return pd.DataFrame()
    
    # Count records per subsystem in each DataFrame
    counts = []
    for i, df in enumerate(tables):
        if 'subsystem' in df.columns and 'record' in df.columns:
            count_df = df.groupby('subsystem')['record'].count().reset_index(name=f'count_{i}')
            counts.append(count_df)
    
    if not counts:
        return pd.DataFrame()
    
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
        if 'subsystem' in df.columns and 'record' in df.columns:
            result = result.merge(df, on=['subsystem', 'record'], how='left')
    
    # Sort and clean up the result
    result = result.sort_values(['subsystem', 'record']).reset_index(drop=True)
    
    # Remove columns that are all NaN
    result = result.dropna(axis=1, how='all')
    
    return result

def post_process_master_table(master_subsystem, processed_sheets):
    """Apply post-processing to master table"""
    # Remove accents
    def remove_accents(input_str):
        if isinstance(input_str, str):
            nfkd_form = unicodedata.normalize('NFKD', input_str)
            return ''.join([c for c in nfkd_form if not unicodedata.combining(c)])
        return input_str
    
    master_subsystem = master_subsystem.applymap(remove_accents)
    
    # Replace anomalies
    anomalies = ["", "", ",,", "NA", "N/A", "#NA", "na", "n/a", "#na", "--", "_?"]
    master_subsystem.replace(anomalies, np.nan, inplace=True)
    
    # Strip strings
    master_subsystem = master_subsystem.applymap(lambda x: x.strip() if isinstance(x, str) else x)
    
    # Drop empty rows
    master_subsystem.dropna(how='all', inplace=True)

    master_subsystem = master_subsystem[master_subsystem['subsystem'] != 'NOT']
    master_subsystem = master_subsystem[master_subsystem['subsystem'] != 'HOLD']


    # Clean specific columns
    if 'subsystem_description_isos' in master_subsystem.columns:
        master_subsystem['subsystem_description_isos'] = master_subsystem['subsystem_description_isos'].str.replace(',', ';')
    
    if 'tp_include_isoinst' in master_subsystem.columns:
        master_subsystem['tp_include_isoinst'] = master_subsystem['tp_include_isoinst'].str.replace(', ', '|')
        master_subsystem['tp_include_isoinst'] = master_subsystem['tp_include_isoinst'].str.replace('|X', '')
    
    # Create progress columns if TP sheet exists
    if 'TP' in processed_sheets and 'tp_include_isoinst' in master_subsystem.columns:
        tp_df = processed_sheets['TP']
        if 'dossier_id_tp' in tp_df.columns and 'tp_construct_progress__tp' in tp_df.columns:
            progress_map = dict(zip(tp_df['dossier_id_tp'].astype(str), tp_df['tp_construct_progress__tp']))
            
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
    
    # Map isometric to includes_fc
    if 'includes_fc' in master_subsystem.columns and 'isometric_fc' in master_subsystem.columns and 'tpvt_isos' in master_subsystem.columns and 'isometricos_ifc3_isos' in master_subsystem.columns:
        filtered_df = master_subsystem[['includes_fc', 'isometric_fc']].dropna(subset=['includes_fc', 'isometric_fc'])
        replace_map = dict(zip(filtered_df['isometric_fc'], filtered_df['includes_fc']))
        master_subsystem['tpvt_isos'] = master_subsystem['isometricos_ifc3_isos'].map(replace_map).combine_first(master_subsystem['tpvt_isos'])
    
    return master_subsystem

def create_tp_expansion_table(master_subsystem, tp_df):
    """Create TP expansion table"""
    if 'tpvt_isos' not in master_subsystem.columns:
        return pd.DataFrame()
    
    df_tp = master_subsystem[['subsystem', 'tpvt_isos']].dropna(subset=['tpvt_isos']).copy()
    
    df_tp['tpvt_isos'] = df_tp['tpvt_isos'].astype(str).str.split('|')
    df_tp = df_tp.explode('tpvt_isos')
    
    df_tp['tpvt_isos'] = df_tp['tpvt_isos'].str.strip()
    df_tp = df_tp[df_tp['tpvt_isos'] != 'ANULADA']
    
    if 'dossier_id_tp' in tp_df.columns:
        df_tp_full = df_tp.merge(tp_df, left_on='tpvt_isos', right_on='dossier_id_tp', how='left')
        return df_tp_full
    
    return df_tp