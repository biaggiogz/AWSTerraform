use lambda_runtime::{run, service_fn, Error, LambdaEvent};
use aws_sdk_s3::Client as S3Client;
use polars::prelude::*;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tracing::info;
use calamine::{Range, Data, Reader, Xlsx, open_workbook_from_rs};
use std::io::Cursor;

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
    let mut processed_sheets = process_excel_with_inference(&excel_data)
        .map_err(|e| format!("Excel processing failed: {}", e))?;
    
    // Create master tables like Python version
    let master_tables = create_master_tables(&processed_sheets);
    for (name, df) in master_tables {
        processed_sheets.insert(name, df);
    }
    
    let mut parquet_keys = Vec::new();
    
    for (sheet_name, df) in processed_sheets.iter() {
        let parquet_key = format!("processedRust/{}_{}.parquet", file_id, sheet_name);
        save_parquet_to_s3(s3_client, df, bucket, &parquet_key).await?;
        parquet_keys.push(parquet_key.clone());
        
        // Save SSM as CSV like Python
        if sheet_name == "ssm" {
            let csv_key = format!("processedRust/{}_{}.csv", file_id, sheet_name);
            save_csv_to_s3(s3_client, df, bucket, &csv_key).await?;
            parquet_keys.push(csv_key);
        }
        
        info!("✅ Processed sheet '{}' with {} rows and {} columns", 
              sheet_name, df.height(), df.width());
    }
    
    Ok(ProcessingResponse {
        status_code: 200,
        body: serde_json::json!({
            "message": format!("Excel processed successfully - {} sheets", processed_sheets.len()),
            "file_id": file_id,
            "sheets_processed": processed_sheets.keys().collect::<Vec<_>>(),
            "parquet_keys": parquet_keys
        }),
    })
}

fn process_excel_with_inference(excel_data: &[u8]) -> Result<HashMap<String, DataFrame>, Box<dyn std::error::Error>> {
    let cursor = Cursor::new(excel_data);
    let mut workbook: Xlsx<_> = open_workbook_from_rs(cursor)?;
    
    let sheet_names = workbook.sheet_names().to_vec();
    let mut processed_sheets = HashMap::new();
    
    for sheet_name in sheet_names {
        if let Ok(range) = workbook.worksheet_range(&sheet_name) {
            if !range.is_empty() {
                let df_result = match sheet_name.as_str() {
                    "TEST_LOOP" => process_test_loop_sheet(&range),
                    "TP" => process_tp_sheet(&range),
                    "general" => process_general_sheet(&range),
                    "Subsystems" => process_subsystems_sheet(&range),
                    "ISOS" => process_isos_sheet(&range),
                    "Tuberia" => process_insulation_sheet(&range),
                    "TRAC_SIEMSA" => process_tracing_sheet(&range),
                    "FIELD_CONTROL" => process_field_control_sheet(&range),
                    "ISO_INST" => process_iso_inst_sheet(&range),
                    "Punch_List" => process_punch_list_sheet(&range),
                    _ => process_default_sheet(&range),
                };
                
                if let Ok(Some(df)) = df_result {
                    processed_sheets.insert(sheet_name, df);
                }
            }
        }
    }
    
    Ok(processed_sheets)
}

fn process_test_loop_sheet(range: &Range<Data>) -> Result<Option<DataFrame>, PolarsError> {
    let df = range_to_dataframe(range, 11, Some((1, 21)))?;
    let mut df = apply_column_transformations(df, "TEST_LOOP")?;
    Ok(Some(df))
}

fn process_tp_sheet(range: &Range<Data>) -> Result<Option<DataFrame>, PolarsError> {
    let df = range_to_dataframe(range, 4, Some((1, 44)))?;
    let mut df = apply_column_transformations(df, "TP")?;
    Ok(Some(df))
}

fn process_general_sheet(range: &Range<Data>) -> Result<Option<DataFrame>, PolarsError> {
    let df = range_to_dataframe(range, 3, None)?;
    let mut df = apply_column_transformations(df, "general")?;
    Ok(Some(df))
}

fn process_subsystems_sheet(range: &Range<Data>) -> Result<Option<DataFrame>, PolarsError> {
    let df = range_to_dataframe(range, 0, None)?;
    let mut df = apply_column_transformations(df, "Subsystems")?;
    Ok(Some(df))
}

fn process_isos_sheet(range: &Range<Data>) -> Result<Option<DataFrame>, PolarsError> {
    let df = range_to_dataframe(range, 1, Some((0, 37)))?;
    let mut df = apply_column_transformations(df, "ISOS")?;
    Ok(Some(df))
}

fn process_insulation_sheet(range: &Range<Data>) -> Result<Option<DataFrame>, PolarsError> {
    let df = range_to_dataframe(range, 8, Some((0, 54)))?;
    let mut df = apply_column_transformations(df, "Tuberia")?;
    Ok(Some(df))
}

fn process_tracing_sheet(range: &Range<Data>) -> Result<Option<DataFrame>, PolarsError> {
    let df = range_to_dataframe(range, 7, Some((1, 32)))?;
    let mut df = apply_column_transformations(df, "TRAC_SIEMSA")?;
    Ok(Some(df))
}

fn process_field_control_sheet(range: &Range<Data>) -> Result<Option<DataFrame>, PolarsError> {
    let df = range_to_dataframe(range, 4, Some((0, 61)))?;
    let mut df = apply_column_transformations(df, "FIELD_CONTROL")?;
    Ok(Some(df))
}

fn process_iso_inst_sheet(range: &Range<Data>) -> Result<Option<DataFrame>, PolarsError> {
    let df = range_to_dataframe(range, 4, Some((0, 35)))?;
    let mut df = apply_column_transformations(df, "ISO_INST")?;
    Ok(Some(df))
}

fn process_punch_list_sheet(range: &Range<Data>) -> Result<Option<DataFrame>, PolarsError> {
    let df = range_to_dataframe(range, 5, Some((1, 22)))?;
    let mut df = apply_column_transformations(df, "Punch_List")?;
    Ok(Some(df))
}

fn process_default_sheet(range: &Range<Data>) -> Result<Option<DataFrame>, PolarsError> {
    let df = range_to_dataframe(range, 0, None)?;
    Ok(Some(df))
}

fn range_to_dataframe(
    range: &Range<Data>,
    skip_rows: usize,
    col_range: Option<(usize, usize)>,
) -> Result<DataFrame, PolarsError> {
    let height = range.height();
    let width = range.width();
    let (start_col, end_col) = col_range.unwrap_or((0, width));
    
    if skip_rows >= height || start_col >= end_col {
        return Err(PolarsError::ComputeError("Invalid range".into()));
    }
    
    // Extract headers and handle duplicates
    let mut headers = Vec::new();
    let mut header_counts = std::collections::HashMap::new();
    
    for col in start_col..end_col.min(width) {
        let mut header = range.get_value((skip_rows as u32, col as u32))
            .map(|v| format!("{}", v))
            .unwrap_or_else(|| format!("col_{}", col));
        
        if header.trim().is_empty() {
            header = format!("col_{}", col);
        }
        
        let count = header_counts.entry(header.clone()).or_insert(0);
        *count += 1;
        
        if *count > 1 {
            header = format!("{}_{}", header, *count - 1);
        }
        
        headers.push(header);
    }
    
    // Extract data
    let mut columns: Vec<Vec<String>> = vec![Vec::new(); headers.len()];
    
    for row in (skip_rows + 1)..height {
        for (col_idx, col) in (start_col..end_col.min(width)).enumerate() {
            let value = range.get_value((row as u32, col as u32))
                .map(|v| format!("{}", v))
                .unwrap_or_else(|| String::new());
            columns[col_idx].push(value);
        }
    }
    
    // Create DataFrame
    let mut df_columns = Vec::new();
    for (i, header) in headers.iter().enumerate() {
        let series = Series::new(header.as_str().into(), &columns[i]);
        df_columns.push(series.into());
    }
    
    DataFrame::new(df_columns)
}

fn apply_column_transformations(mut df: DataFrame, sheet_name: &str) -> Result<DataFrame, PolarsError> {
    // Apply Python-like transformations
    match sheet_name {
        "TEST_LOOP" => {
            // Rename SUBS_PRE to SUBSYSTEM and add _TLP suffix
            let new_columns: Vec<String> = df.get_column_names()
                .iter()
                .map(|name| {
                    let clean_name = if name == "SUBS_PRE" { "SUBSYSTEM" } else { name };
                    if clean_name == "SUBSYSTEM" {
                        clean_name.to_string()
                    } else {
                        format!("{}_TLP", clean_name)
                    }
                })
                .collect();
            df = rename_columns(df, new_columns)?;
        }
        "TP" => {
            // Add _TP suffix to all columns
            let new_columns: Vec<String> = df.get_column_names()
                .iter()
                .map(|name| format!("{}_TP", name))
                .collect();
            df = rename_columns(df, new_columns)?;
        }
        "ISOS" => {
            // Add _ISOS suffix except SUBSYSTEM
            let new_columns: Vec<String> = df.get_column_names()
                .iter()
                .map(|name| {
                    if name == "SUBSYSTEM" {
                        name.to_string()
                    } else {
                        format!("{}_ISOS", name)
                    }
                })
                .collect();
            df = rename_columns(df, new_columns)?;
        }
        "Punch_List" => {
            // Rename SUBSISTEMA to SUBSYSTEM and add _PUNCH_L suffix
            let new_columns: Vec<String> = df.get_column_names()
                .iter()
                .map(|name| {
                    let clean_name = if name == "SUBSISTEMA" { "SUBSYSTEM" } else { name };
                    if clean_name == "SUBSYSTEM" {
                        clean_name.to_string()
                    } else {
                        format!("{}_PUNCH_L", clean_name)
                    }
                })
                .collect();
            df = rename_columns(df, new_columns)?;
        }
        _ => {}
    }
    
    // Normalize column names like Python
    let normalized_columns: Vec<String> = df.get_column_names()
        .iter()
        .map(|name| {
            name.trim()
                .to_lowercase()
                .replace(" ", "_")
                .chars()
                .filter(|c| c.is_alphanumeric() || *c == '_')
                .collect()
        })
        .collect();
    
    df = rename_columns(df, normalized_columns)?;
    Ok(df)
}

fn rename_columns(mut df: DataFrame, new_names: Vec<String>) -> Result<DataFrame, PolarsError> {
    let old_names: Vec<String> = df.get_column_names().iter().map(|s| s.to_string()).collect();
    
    for (old, new) in old_names.iter().zip(new_names.iter()) {
        if old != new {
            df.rename(old, new.clone())?;
        }
    }
    
    Ok(df)
}

fn create_master_tables(processed_sheets: &HashMap<String, DataFrame>) -> HashMap<String, DataFrame> {
    let mut master_tables = HashMap::new();
    
    // Create basic SSM table
    if let Some(subsystems_df) = processed_sheets.get("Subsystems") {
        let ssm_df = subsystems_df.clone()
            .select([col("subsystem")])
            .unwrap_or_else(|_| subsystems_df.clone());
        master_tables.insert("ssm".to_string(), ssm_df);
    }
    
    master_tables
}

async fn save_csv_to_s3(
    s3_client: &S3Client,
    df: &DataFrame,
    bucket: &str,
    key: &str,
) -> Result<(), Error> {
    let temp_path = format!("/tmp/{}.csv", uuid::Uuid::new_v4());
    
    let mut file = std::fs::File::create(&temp_path)
        .map_err(|e| format!("Failed to create temp CSV file: {}", e))?;
    
    CsvWriter::new(&mut file)
        .finish(df)
        .map_err(|e| format!("Failed to write CSV: {}", e))?;
    
    let data = std::fs::read(&temp_path)
        .map_err(|e| format!("Failed to read temp CSV file: {}", e))?;
    
    s3_client
        .put_object()
        .bucket(bucket)
        .key(key)
        .body(data.into())
        .content_type("text/csv")
        .send()
        .await
        .map_err(|e| format!("Failed to upload CSV: {}", e))?;
    
    let _ = std::fs::remove_file(&temp_path);
    Ok(())
}

async fn download_excel_file(
    s3_client: &S3Client,
    bucket: &str,
    key: &str,
) -> Result<Vec<u8>, Error> {
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

    Ok(data)
}

async fn save_parquet_to_s3(
    s3_client: &S3Client,
    df: &DataFrame,
    bucket: &str,
    key: &str,
) -> Result<(), Error> {
    let temp_path = format!("/tmp/{}.parquet", uuid::Uuid::new_v4());
    
    let mut file = std::fs::File::create(&temp_path)
        .map_err(|e| format!("Failed to create temp file: {}", e))?;
    
    let mut df_clone = df.clone();
    ParquetWriter::new(&mut file)
        .finish(&mut df_clone)
        .map_err(|e| format!("Failed to write Parquet: {}", e))?;
    
    let data = std::fs::read(&temp_path)
        .map_err(|e| format!("Failed to read temp file: {}", e))?;
    
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
                Ok::<serde_json::Value, lambda_runtime::Error>(serde_json::to_value(result).unwrap())
            }
            Err(e) => {
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