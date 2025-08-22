use lambda_runtime::{run, service_fn, Error, LambdaEvent};
use aws_sdk_s3::Client as S3Client;
use polars::prelude::*;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tracing::info;

mod sheet_processors;
use sheet_processors::SheetProcessor;

#[derive(Debug, Deserialize)]
struct EventBridgeEvent {
    detail: EventDetail,
}

#[derive(Debug, Deserialize)]
struct EventDetail {
    bucket: BucketInfo,
    object: ObjectInfo,
}

#[derive(Debug, Deserialize)]
struct BucketInfo {
    name: String,
}

#[derive(Debug, Deserialize)]
struct ObjectInfo {
    key: String,
}

#[derive(Debug, Serialize)]
struct ProcessingResponse {
    #[serde(rename = "statusCode")]
    status_code: u16,
    body: serde_json::Value,
}

async fn function_handler(
    event: LambdaEvent<EventBridgeEvent>,
    s3_client: &S3Client,
) -> Result<ProcessingResponse, Error> {
    let bucket = &event.payload.detail.bucket.name;
    let key = &event.payload.detail.object.key;
    let file_id = key.split('/').last().unwrap_or("unknown")
        .split('.').next().unwrap_or("unknown");
    
    info!("🚀 Starting Excel processing: s3://{}/{}", bucket, key);
    
    let excel_data = download_excel_file(s3_client, bucket, key).await?;
    let processed_sheets = process_excel_sheets(&excel_data)
        .map_err(|e| format!("Excel processing failed: {}", e))?;
    
    let mut parquet_keys = Vec::new();
    
    for (sheet_name, df) in processed_sheets.iter() {
        let parquet_key = format!("processedRust/{}_{}.parquet", file_id, sheet_name);
        save_parquet_to_s3(s3_client, df, bucket, &parquet_key).await?;
        parquet_keys.push(parquet_key);
        
        info!("✅ Processed sheet '{}' with {} rows and {} columns", 
              sheet_name, df.height(), df.width());
    }
    
    Ok(ProcessingResponse {
        status_code: 200,
        body: serde_json::json!({
            "message": format!("Excel processed successfully - {} sheets", processed_sheets.len()),
            "file_id": file_id,
            "sheets_processed": processed_sheets.keys().collect::<Vec<_>>(),
            "parquet_keys": parquet_keys,
            "total_rows": processed_sheets.values().map(|df| df.height()).sum::<usize>(),
            "total_columns": processed_sheets.values().map(|df| df.width()).sum::<usize>(),
            "processing_details": {
                "rust_implementation": true,
                "sheet_specific_logic": true,
                "type_inference": false,
                "master_tables": false
            }
        }),
    })
}

fn process_excel_sheets(excel_data: &[u8]) -> Result<HashMap<String, DataFrame>, Box<dyn std::error::Error>> {
    use calamine::{Reader, Xlsx, open_workbook_from_rs};
    use std::io::Cursor;
    
    let cursor = Cursor::new(excel_data);
    let mut workbook: Xlsx<_> = open_workbook_from_rs(cursor)?;
    
    let sheet_names = workbook.sheet_names().to_vec();
    let mut processed_sheets = HashMap::new();
    let processor = SheetProcessor::new();
    
    info!("📊 Found {} sheets to process", sheet_names.len());
    
    for sheet_name in sheet_names {
        if let Ok(range) = workbook.worksheet_range(&sheet_name) {
            if !range.is_empty() {
                match processor.process_sheet(&range, &sheet_name) {
                    Ok(Some(df)) => {
                        processed_sheets.insert(sheet_name.clone(), df);
                        info!("✅ Successfully processed sheet '{}' ({} rows, {} cols)", 
                              sheet_name, 
                              processed_sheets[&sheet_name].height(), 
                              processed_sheets[&sheet_name].width());
                    }
                    Ok(None) => {
                        info!("⚠️ Sheet '{}' was empty or could not be processed", sheet_name);
                    }
                    Err(e) => {
                        info!("❌ Could not process sheet '{}': {}", sheet_name, e);
                    }
                }
            } else {
                info!("⚠️ Sheet '{}' is empty", sheet_name);
            }
        } else {
            info!("❌ Could not read sheet '{}'", sheet_name);
        }
    }
    
    info!("🎉 Processing complete: {} sheets processed successfully", processed_sheets.len());
    Ok(processed_sheets)
}

async fn download_excel_file(
    s3_client: &S3Client,
    bucket: &str,
    key: &str,
) -> Result<Vec<u8>, Error> {
    info!("📥 Downloading Excel file from s3://{}/{}", bucket, key);
    
    let response = s3_client
        .get_object()
        .bucket(bucket)
        .key(key)
        .send()
        .await
        .map_err(|e| format!("Failed to download Excel: {}", e))?;

    let data = response
        .body
        .collect()
        .await
        .map_err(|e| format!("Failed to read Excel data: {}", e))?
        .into_bytes()
        .to_vec();

    info!("✅ Downloaded {} bytes", data.len());
    Ok(data)
}

async fn save_parquet_to_s3(
    s3_client: &S3Client,
    df: &DataFrame,
    bucket: &str,
    key: &str,
) -> Result<(), Error> {
    let temp_path = format!("/tmp/{}.parquet", uuid::Uuid::new_v4());
    
    info!("💾 Saving DataFrame to temporary file: {}", temp_path);
    
    let mut file = std::fs::File::create(&temp_path)
        .map_err(|e| format!("Failed to create temp file: {}", e))?;
    
    let mut df_clone = df.clone();
    ParquetWriter::new(&mut file)
        .finish(&mut df_clone)
        .map_err(|e| format!("Failed to write Parquet: {}", e))?;
    
    let data = std::fs::read(&temp_path)
        .map_err(|e| format!("Failed to read temp file: {}", e))?;
    
    info!("☁️ Uploading {} bytes to s3://{}/{}", data.len(), bucket, key);
    
    s3_client
        .put_object()
        .bucket(bucket)
        .key(key)
        .body(data.into())
        .content_type("application/octet-stream")
        .send()
        .await
        .map_err(|e| format!("Failed to upload Parquet: {}", e))?;
    
    let _ = std::fs::remove_file(&temp_path);
    info!("✅ Successfully saved to S3: {}", key);
    Ok(())
}

#[tokio::main]
async fn main() -> Result<(), Error> {
    tracing_subscriber::fmt()
        .with_max_level(tracing::Level::INFO)
        .with_target(false)
        .without_time()
        .init();

    let config = aws_config::load_defaults(aws_config::BehaviorVersion::latest()).await;
    let s3_client = S3Client::new(&config);

    run(service_fn(|event| async {
        match function_handler(event, &s3_client).await {
            Ok(result) => {
                info!("🎉 Processing completed successfully");
                Ok::<serde_json::Value, lambda_runtime::Error>(serde_json::to_value(result).unwrap())
            }
            Err(e) => {
                info!("❌ Processing failed: {}", e);
                Ok::<serde_json::Value, lambda_runtime::Error>(serde_json::json!({
                    "statusCode": 500,
                    "body": {
                        "error": e.to_string()
                    }
                }))
            }
        }
    })).await
}