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
    df = pd.read_excel(BytesIO(excel_data), sheet_name=sheet_name, skiprows=11, usecols='B:V', dtype=str)
    return df

def process_tp_sheet(excel_data, sheet_name):
    df = pd.read_excel(BytesIO(excel_data), sheet_name=sheet_name, skiprows=4, usecols='B:AS', dtype=str)
    return df

def process_general_sheet(excel_data, sheet_name):
    df = pd.read_excel(BytesIO(excel_data), sheet_name=sheet_name, skiprows=3, dtype=str)
    return df

def process_subsystems_sheet(excel_data, sheet_name):
    df = pd.read_excel(BytesIO(excel_data), sheet_name=sheet_name, dtype=str)
    return df

def process_isos_sheet(excel_data, sheet_name):
    df = pd.read_excel(BytesIO(excel_data), sheet_name=sheet_name, skiprows=1, usecols='A:AL', dtype=str)
    return df

def process_insulation_sheet(excel_data, sheet_name):
    df = pd.read_excel(BytesIO(excel_data), sheet_name=sheet_name, skiprows=8, usecols='A:BC', dtype=str)
    return df

def process_tracing_sheet(excel_data, sheet_name):
    df = pd.read_excel(BytesIO(excel_data), sheet_name=sheet_name, skiprows=7, usecols='B:AG', dtype=str)
    return df

def process_field_control_sheet(excel_data, sheet_name):
    df = pd.read_excel(BytesIO(excel_data), sheet_name=sheet_name, skiprows=4, usecols='A:BJ', dtype=str)
    return df

def process_iso_inst_sheet(excel_data, sheet_name):
    df = pd.read_excel(BytesIO(excel_data), sheet_name=sheet_name, skiprows=4, usecols='A:AJ', dtype=str)
    return df

def process_punch_list_sheet(excel_data, sheet_name):
    df = pd.read_excel(BytesIO(excel_data), sheet_name=sheet_name, skiprows=5, usecols='B:W', dtype=str)
    return df

def process_default_sheet(excel_data, sheet_name):
    df = pd.read_excel(BytesIO(excel_data), sheet_name=sheet_name, dtype=str)
    return df

def create_master_tables(processed_sheets):
    return {}

def create_ssm_table(master_subsystem, processed_sheets, bucket, file_id=None):
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