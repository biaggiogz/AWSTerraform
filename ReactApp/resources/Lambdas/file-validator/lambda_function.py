import json
import boto3
import pandas as pd
from io import BytesIO

s3 = boto3.client('s3')
lambda_client = boto3.client('lambda')

def lambda_handler(event, context):
    try:
        bucket = event['detail']['bucket']['name']
        key = event['detail']['object']['key']
        
        if not key.startswith('validation-params/'):
            return {'statusCode': 200}
            
        file_id = key.split('/')[-1].replace('.json', '')
        file_key = f'validation/{file_id}.xlsx'
        result_key = f'validation-results/{file_id}.json'
        
        # Get parameters
        param_obj = s3.get_object(Bucket=bucket, Key=key)
        parameters = json.loads(param_obj['Body'].read())
        
        # Get file
        file_obj = s3.get_object(Bucket=bucket, Key=file_key)
        file_data = file_obj['Body'].read()
        
        # Validate sheets
        errors = []
        
        try:
            excel_file = pd.ExcelFile(BytesIO(file_data))
            available_sheets = excel_file.sheet_names
            
            for sheet_config in parameters:
                sheet_name = sheet_config['sheetName']
                column_range = sheet_config['columnRange']
                skip_rows = sheet_config['skipRows']
                
                if sheet_name not in available_sheets:
                    errors.append(f"Sheet '{sheet_name}' not found")
                    continue
                    
                try:
                    df = pd.read_excel(
                        BytesIO(file_data),
                        sheet_name=sheet_name,
                        usecols=column_range if column_range else None,
                        skiprows=skip_rows,
                        nrows=1
                    )
                except Exception as e:
                    errors.append(f"Sheet '{sheet_name}': Invalid range '{column_range}' or skip rows {skip_rows}")
                    
        except Exception as e:
            errors.append(f"Cannot read Excel file: {str(e)}")
            
        # Save validation result
        result = {
            'valid': len(errors) == 0,
            'errors': errors,
            'file_id': file_id,
            'timestamp': context.aws_request_id
        }
        
        s3.put_object(
            Bucket=bucket,
            Key=result_key,
            Body=json.dumps(result),
            ContentType='application/json'
        )
        
        # If validation passes, move file to rawDataset and trigger python_preprocessor
        if len(errors) == 0:
            # Copy file from validation/ to rawDataset/
            copy_source = {'Bucket': bucket, 'Key': file_key}
            raw_key = f'rawDataset/{file_id}.xlsx'
            s3.copy_object(CopySource=copy_source, Bucket=bucket, Key=raw_key)
            
            # Trigger python_preprocessor Lambda
            preprocessor_event = {
                'detail': {
                    'bucket': {'name': bucket},
                    'object': {'key': raw_key}
                }
            }
            
            # Get the actual function name from environment or construct it properly
            function_name = f"react-python-preprocessor"  # Based on your Terraform naming
            
            lambda_client.invoke(
                FunctionName=function_name,
                InvocationType='Event',
                Payload=json.dumps(preprocessor_event)
            )
            
            print(f"✅ Validation passed - triggered python_preprocessor for {file_id}")
        else:
            print(f"❌ Validation failed for {file_id}: {errors}")
        
        return {'statusCode': 200}
        
    except Exception as e:
        print(f"Validation error: {str(e)}")
        return {'statusCode': 500}