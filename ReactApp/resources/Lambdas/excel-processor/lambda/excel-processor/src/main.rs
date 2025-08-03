use aws_lambda_events::event::eventbridge::EventBridgeEvent;
use lambda_runtime::{run, service_fn, Error, LambdaEvent};
use aws_sdk_s3::Client as S3Client;
use polars::prelude::*;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::io::Cursor;
use std::collections::HashMap;
use tracing::info;
use uuid::Uuid;
use calamine::{Reader, Xlsx, open_workbook_from_rs};
use chrono::{DateTime, Utc};

#[derive(Debug)]
struct S3EventDetail {
    bucket: String,
    key: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct ProcessingResult {
    file_id: String,
    timestamp: DateTime<Utc>,
    profile_data: ProfileData,
    schema_version: SchemaVersion,
    field_errors: HashMap<String, Vec<FieldError>>,
    parquet_path: String,
    iceberg_path: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct ProfileData {
    total_rows: usize,
    total_columns: usize,
    columns: Vec<ColumnProfile>,
    data_quality_score: f64,
}

#[derive(Debug, Serialize, Deserialize)]
struct ColumnProfile {
    name: String,
    inferred_type: String,
    data_type_confidence: f64,
    null_count: usize,
    null_percentage: f64,
    unique_count: Option<usize>,
    sample_values: Vec<String>,
    data_patterns: Vec<DataPattern>,
    professional_inference: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct DataPattern {
    pattern_type: String,
    frequency: usize,
    example: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct SchemaVersion {
    version: String,
    created_at: DateTime<Utc>,
    columns: Vec<SchemaColumn>,
}

#[derive(Debug, Serialize, Deserialize)]
struct SchemaColumn {
    name: String,
    data_type: String,
    nullable: bool,
    constraints: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize)]
struct FieldError {
    row_index: usize,
    error_type: String,
    description: String,
    suggested_fix: Option<String>,
    value: String,
}

async fn function_handler(
    event: LambdaEvent<EventBridgeEvent<Value>>,
    s3_client: &S3Client,
) -> Result<ProcessingResult, Error> {
    info!("Processing EventBridge event: {:?}", event.payload.source);

    let s3_detail = extract_s3_details(&event.payload)?;
    info!("Processing file: s3://{}/{}", s3_detail.bucket, s3_detail.key);

    let excel_data = download_file_from_s3(s3_client, &s3_detail.bucket, &s3_detail.key).await?;
    let df = read_excel_to_dataframe(excel_data)?;
    
    let file_id = Uuid::new_v4().to_string();
    let timestamp = Utc::now();
    
    let parquet_key = format!("preDataset/parquet/{}.parquet", file_id);
    save_as_parquet(s3_client, &df, &s3_detail.bucket, &parquet_key).await?;
    
    let iceberg_key = format!("preDataset/iceberg/{}.parquet", file_id);
    save_as_iceberg(s3_client, &df, &s3_detail.bucket, &iceberg_key).await?;
    
    let profile_data = generate_profile_data(&df)?;
    let schema_version = generate_schema_version(&df, timestamp)?;
    let field_errors = detect_field_errors(&df)?;
    
    let result = ProcessingResult {
        file_id,
        timestamp,
        profile_data,
        schema_version,
        field_errors,
        parquet_path: parquet_key,
        iceberg_path: iceberg_key,
    };
    
    let result_key = format!("processing-results/{}.json", result.file_id);
    save_processing_result(s3_client, &result, &s3_detail.bucket, &result_key).await?;
    
    info!("Successfully processed file and saved outputs");
    Ok(result)
}

fn extract_s3_details(event: &EventBridgeEvent<Value>) -> Result<S3EventDetail, Error> {
    let detail = event.detail.as_object()
        .ok_or("Missing detail in EventBridge event")?;
    
    let bucket_name = detail.get("bucket")
        .and_then(|b| b.get("name"))
        .and_then(|n| n.as_str())
        .ok_or("Missing bucket name")?;
    
    let object_key = detail.get("object")
        .and_then(|o| o.get("key"))
        .and_then(|k| k.as_str())
        .ok_or("Missing object key")?;
    
    Ok(S3EventDetail {
        bucket: bucket_name.to_string(),
        key: object_key.to_string(),
    })
}

async fn download_file_from_s3(
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
        .map_err(|e| format!("Failed to download file: {}", e))?;
    
    let data = response
        .body
        .collect()
        .await
        .map_err(|e| format!("Failed to read file data: {}", e))?
        .into_bytes()
        .to_vec();
    
    info!("Downloaded {} bytes from S3", data.len());
    Ok(data)
}

fn read_excel_to_dataframe(excel_data: Vec<u8>) -> Result<DataFrame, Error> {
    let cursor = Cursor::new(excel_data);
    let mut workbook: Xlsx<_> = open_workbook_from_rs(cursor)
        .map_err(|e| format!("Failed to open Excel file: {}", e))?;
    
    let range = workbook.worksheet_range("TEST_LOOP")
        .map_err(|e| format!("Failed to read worksheet: {}", e))?;
    
    let mut data: Vec<Vec<String>> = Vec::new();
    let mut header_row: Vec<String> = Vec::new();
    
    for (row_idx, row) in range.rows().enumerate() {
        if row_idx < 11 { continue; }
        
        let mut row_data = Vec::new();
        for col_idx in 1..22 {
            let cell_value = row.get(col_idx)
                .map(|cell| cell.to_string())
                .unwrap_or_default();
            row_data.push(cell_value);
        }
        
        if row_idx == 11 {
            header_row = row_data.clone();
        } else {
            data.push(row_data);
        }
    }
    
    let column_names: Vec<String> = header_row.iter()
        .enumerate()
        .map(|(idx, h)| {
            let cleaned = h.trim_matches('"').trim().to_string();
            if cleaned.is_empty() {
                format!("Column_{}", idx + 1)
            } else {
                cleaned
            }
        })
        .collect();
    
    let mut series_vec = Vec::new();
    
    for (col_idx, col_name) in column_names.iter().enumerate() {
        let col_data: Vec<String> = data.iter()
            .map(|row| row.get(col_idx).cloned().unwrap_or_default())
            .collect();
        series_vec.push(Series::new(col_name.into(), col_data));
    }
    
    let columns: Vec<Column> = series_vec.into_iter().map(Column::from).collect();
    let df = DataFrame::new(columns)
        .map_err(|e| format!("Failed to create DataFrame: {}", e))?;
    
    Ok(df)
}

fn generate_profile_data(df: &DataFrame) -> Result<ProfileData, Error> {
    let total_rows = df.height();
    let total_columns = df.width();
    let mut columns = Vec::new();
    
    for column in df.get_columns() {
        let col_name = column.name().to_string();
        let null_count = column.null_count();
        let null_percentage = (null_count as f64 / total_rows as f64) * 100.0;
        
        let series = column.as_series().unwrap();
        let (inferred_type, confidence, professional_inference) = infer_professional_type(series);
        let unique_count = series.n_unique().ok();
        let sample_values = get_sample_values(series, 5);
        let data_patterns = detect_data_patterns(series);
        
        columns.push(ColumnProfile {
            name: col_name,
            inferred_type,
            data_type_confidence: confidence,
            null_count,
            null_percentage,
            unique_count,
            sample_values,
            data_patterns,
            professional_inference,
        });
    }
    
    let data_quality_score = calculate_data_quality_score(&columns);
    
    Ok(ProfileData {
        total_rows,
        total_columns,
        columns,
        data_quality_score,
    })
}

fn infer_professional_type(column: &Series) -> (String, f64, String) {
    let name = column.name().as_str();
    let sample_values = get_sample_values(column, 100);
    
    match name {
        "SUBS_PRE" => analyze_subsystem_pattern(&sample_values),
        "TAG LOOP" | "TagS" => analyze_tag_pattern(&sample_values),
        "INSTALLED" | "WIRED" | "CONNECTED" => analyze_status_date_pattern(&sample_values),
        "PRIORITY" | "HITO" => analyze_priority_pattern(&sample_values),
        "OK=100%" | "QCF" => analyze_percentage_pattern(&sample_values),
        "Status Closed&Open (C/O)" => analyze_status_pattern(&sample_values),
        _ => analyze_generic_pattern(&sample_values)
    }
}

fn analyze_subsystem_pattern(values: &[String]) -> (String, f64, String) {
    let mut valid_count = 0;
    let pattern_regex = regex::Regex::new(r"^[A-Z]{2,4}-\d{5}-\d{2}$").unwrap();
    
    for value in values {
        if value.is_empty() || value == "NOT" { continue; }
        if pattern_regex.is_match(value) { valid_count += 1; }
    }
    
    let confidence = if values.is_empty() { 0.0 } else { (valid_count as f64 / values.len() as f64) * 100.0 };
    (
        "SUBSYSTEM_CODE".to_string(),
        confidence,
        "Subsystem code format: XXX-NNNNN-NN (e.g., HMBI-10005-03)".to_string()
    )
}

fn analyze_tag_pattern(values: &[String]) -> (String, f64, String) {
    let mut valid_count = 0;
    
    for value in values {
        if value.is_empty() { continue; }
        if value.len() > 3 && value.chars().any(|c| c.is_alphanumeric()) {
            valid_count += 1;
        }
    }
    
    let confidence = if values.is_empty() { 0.0 } else { (valid_count as f64 / values.len() as f64) * 100.0 };
    (
        "TAG_IDENTIFIER".to_string(),
        confidence,
        "Alphanumeric tag identifier for equipment/loop".to_string()
    )
}

fn analyze_status_date_pattern(values: &[String]) -> (String, f64, String) {
    let mut date_count = 0;
    let mut status_count = 0;
    
    let date_regex = regex::Regex::new(r"\d{1,2}/\d{1,2}/\d{4}").unwrap();
    
    for value in values {
        if value.is_empty() { continue; }
        if date_regex.is_match(value) || value.contains("MONTADO") {
            date_count += 1;
        } else if value.to_uppercase() == "YES" || value.to_uppercase() == "NO" {
            status_count += 1;
        }
    }
    
    let total_valid = date_count + status_count;
    let confidence = if values.is_empty() { 0.0 } else { (total_valid as f64 / values.len() as f64) * 100.0 };
    
    (
        "STATUS_OR_DATE".to_string(),
        confidence,
        "Mixed format: dates (MM/DD/YYYY) or status (YES/NO/MONTADO)".to_string()
    )
}

fn analyze_priority_pattern(values: &[String]) -> (String, f64, String) {
    let mut valid_count = 0;
    
    for value in values {
        if value.is_empty() { continue; }
        if value.parse::<i32>().is_ok() || value.len() <= 10 {
            valid_count += 1;
        }
    }
    
    let confidence = if values.is_empty() { 0.0 } else { (valid_count as f64 / values.len() as f64) * 100.0 };
    (
        "PRIORITY_CODE".to_string(),
        confidence,
        "Priority identifier (numeric or short text)".to_string()
    )
}

fn analyze_percentage_pattern(values: &[String]) -> (String, f64, String) {
    let mut valid_count = 0;
    
    for value in values {
        if value.is_empty() { continue; }
        if value.contains('%') || value.parse::<f64>().is_ok() {
            valid_count += 1;
        }
    }
    
    let confidence = if values.is_empty() { 0.0 } else { (valid_count as f64 / values.len() as f64) * 100.0 };
    (
        "PERCENTAGE".to_string(),
        confidence,
        "Percentage value (0-100% or decimal)".to_string()
    )
}

fn analyze_status_pattern(values: &[String]) -> (String, f64, String) {
    let mut valid_count = 0;
    
    for value in values {
        if value.is_empty() { continue; }
        let upper_val = value.to_uppercase();
        if upper_val == "C" || upper_val == "O" || upper_val == "CLOSED" || upper_val == "OPEN" {
            valid_count += 1;
        }
    }
    
    let confidence = if values.is_empty() { 0.0 } else { (valid_count as f64 / values.len() as f64) * 100.0 };
    (
        "STATUS_FLAG".to_string(),
        confidence,
        "Status indicator: C/O (Closed/Open)".to_string()
    )
}

fn analyze_generic_pattern(values: &[String]) -> (String, f64, String) {
    let mut numeric_count = 0;
    let mut text_count = 0;
    
    for value in values {
        if value.is_empty() { continue; }
        if value.parse::<f64>().is_ok() {
            numeric_count += 1;
        } else {
            text_count += 1;
        }
    }
    
    let confidence = 85.0;
    
    if numeric_count > text_count {
        ("NUMERIC".to_string(), confidence, "Numeric values".to_string())
    } else {
        ("TEXT".to_string(), confidence, "Text values".to_string())
    }
}

fn get_sample_values(series: &Series, limit: usize) -> Vec<String> {
    series.iter()
        .filter_map(|v| {
            if v.is_null() { None } else { Some(v.to_string()) }
        })
        .filter(|s| !s.is_empty())
        .take(limit)
        .collect()
}

fn detect_data_patterns(series: &Series) -> Vec<DataPattern> {
    let mut patterns = Vec::new();
    let values = get_sample_values(series, 100);
    
    let null_count = series.null_count();
    if null_count > 0 {
        patterns.push(DataPattern {
            pattern_type: "NULL_VALUES".to_string(),
            frequency: null_count,
            example: "(empty)".to_string(),
        });
    }
    
    let mut pattern_counts: HashMap<String, (usize, String)> = HashMap::new();
    
    for value in &values {
        let pattern = classify_value_pattern(value);
        let entry = pattern_counts.entry(pattern.clone()).or_insert((0, value.clone()));
        entry.0 += 1;
    }
    
    for (pattern_type, (frequency, example)) in pattern_counts {
        patterns.push(DataPattern {
            pattern_type,
            frequency,
            example,
        });
    }
    
    patterns
}

fn classify_value_pattern(value: &str) -> String {
    if value.is_empty() { return "EMPTY".to_string(); }
    if value.parse::<i32>().is_ok() { return "INTEGER".to_string(); }
    if value.parse::<f64>().is_ok() { return "DECIMAL".to_string(); }
    if value.contains('/') && value.len() <= 10 { return "DATE_LIKE".to_string(); }
    if value.contains('%') { return "PERCENTAGE".to_string(); }
    if value.len() <= 5 && value.chars().all(|c| c.is_uppercase() || c.is_whitespace()) {
        return "SHORT_CODE".to_string();
    }
    "TEXT".to_string()
}

fn calculate_data_quality_score(columns: &[ColumnProfile]) -> f64 {
    if columns.is_empty() { return 0.0; }
    
    let total_confidence: f64 = columns.iter()
        .map(|col| col.data_type_confidence)
        .sum();
    
    let avg_confidence = total_confidence / columns.len() as f64;
    
    let null_penalty: f64 = columns.iter()
        .map(|col| col.null_percentage)
        .sum::<f64>() / columns.len() as f64;
    
    (avg_confidence - null_penalty * 0.5).max(0.0).min(100.0)
}

fn generate_schema_version(df: &DataFrame, timestamp: DateTime<Utc>) -> Result<SchemaVersion, Error> {
    let mut columns = Vec::new();
    
    for column in df.get_columns() {
        let col_name = column.name().to_string();
        let series = column.as_series().unwrap();
        let (inferred_type, _, _) = infer_professional_type(series);
        
        let nullable = series.null_count() > 0;
        let mut constraints = Vec::new();
        
        if !nullable {
            constraints.push("NOT_NULL".to_string());
        }
        
        match inferred_type.as_str() {
            "SUBSYSTEM_CODE" => constraints.push("FORMAT_VALIDATION".to_string()),
            "PERCENTAGE" => constraints.push("RANGE_0_100".to_string()),
            _ => {}
        }
        
        columns.push(SchemaColumn {
            name: col_name,
            data_type: map_to_standard_type(&inferred_type),
            nullable,
            constraints,
        });
    }
    
    Ok(SchemaVersion {
        version: "1.0.0".to_string(),
        created_at: timestamp,
        columns,
    })
}

fn map_to_standard_type(inferred_type: &str) -> String {
    match inferred_type {
        "NUMERIC" => "float64".to_string(),
        "PERCENTAGE" => "float64".to_string(),
        _ => "string".to_string(),
    }
}

fn detect_field_errors(df: &DataFrame) -> Result<HashMap<String, Vec<FieldError>>, Error> {
    let mut field_errors: HashMap<String, Vec<FieldError>> = HashMap::new();
    
    for column in df.get_columns() {
        let col_name = column.name().to_string();
        let series = column.as_series().unwrap();
        let errors = validate_column_values(series);
        
        if !errors.is_empty() {
            field_errors.insert(col_name, errors);
        }
    }
    
    Ok(field_errors)
}

fn validate_column_values(series: &Series) -> Vec<FieldError> {
    let mut errors = Vec::new();
    let col_name = series.name();
    
    for (row_idx, value) in series.iter().enumerate() {
        if value.is_null() { continue; }
        
        let value_str = value.to_string();
        if let Some(error) = validate_value_by_column(col_name, &value_str, row_idx) {
            errors.push(error);
        }
    }
    
    errors
}

fn validate_value_by_column(col_name: &str, value: &str, row_idx: usize) -> Option<FieldError> {
    match col_name {
        "SUBS_PRE" => validate_subsystem_code(value, row_idx),
        "INSTALLED" | "WIRED" | "CONNECTED" => validate_status_date(value, row_idx),
        "OK=100%" | "QCF" => validate_percentage(value, row_idx),
        "Status Closed&Open (C/O)" => validate_status_flag(value, row_idx),
        _ => None
    }
}

fn validate_subsystem_code(value: &str, row_idx: usize) -> Option<FieldError> {
    if value.is_empty() || value == "NOT" { return None; }
    
    let pattern = regex::Regex::new(r"^[A-Z]{2,4}-\d{5}-\d{2}$").unwrap();
    if !pattern.is_match(value) {
        return Some(FieldError {
            row_index: row_idx,
            error_type: "INVALID_FORMAT".to_string(),
            description: "Subsystem code must follow format: XXX-NNNNN-NN".to_string(),
            suggested_fix: Some("Use format like HMBI-10005-03".to_string()),
            value: value.to_string(),
        });
    }
    None
}

fn validate_status_date(value: &str, row_idx: usize) -> Option<FieldError> {
    if value.is_empty() { return None; }
    
    let date_pattern = regex::Regex::new(r"\d{1,2}/\d{1,2}/\d{4}").unwrap();
    let upper_val = value.to_uppercase();
    
    if !date_pattern.is_match(value) && 
       !upper_val.contains("YES") && 
       !upper_val.contains("NO") && 
       !upper_val.contains("MONTADO") {
        return Some(FieldError {
            row_index: row_idx,
            error_type: "INVALID_FORMAT".to_string(),
            description: "Value must be a date (MM/DD/YYYY), YES, NO, or contain MONTADO".to_string(),
            suggested_fix: Some("Use format: 6/18/2025 or YES/NO".to_string()),
            value: value.to_string(),
        });
    }
    None
}

fn validate_percentage(value: &str, row_idx: usize) -> Option<FieldError> {
    if value.is_empty() { return None; }
    
    let clean_value = value.replace('%', "");
    if let Ok(num) = clean_value.parse::<f64>() {
        if num < 0.0 || num > 100.0 {
            return Some(FieldError {
                row_index: row_idx,
                error_type: "OUT_OF_RANGE".to_string(),
                description: "Percentage must be between 0 and 100".to_string(),
                suggested_fix: Some("Enter value between 0-100".to_string()),
                value: value.to_string(),
            });
        }
    } else {
        return Some(FieldError {
            row_index: row_idx,
            error_type: "TYPE_MISMATCH".to_string(),
            description: "Value must be a valid percentage".to_string(),
            suggested_fix: Some("Enter numeric value with or without % symbol".to_string()),
            value: value.to_string(),
        });
    }
    None
}

fn validate_status_flag(value: &str, row_idx: usize) -> Option<FieldError> {
    if value.is_empty() { return None; }
    
    let upper_val = value.to_uppercase();
    if upper_val != "C" && upper_val != "O" && upper_val != "CLOSED" && upper_val != "OPEN" {
        return Some(FieldError {
            row_index: row_idx,
            error_type: "INVALID_VALUE".to_string(),
            description: "Status must be C, O, CLOSED, or OPEN".to_string(),
            suggested_fix: Some("Use C for Closed or O for Open".to_string()),
            value: value.to_string(),
        });
    }
    None
}

async fn save_as_parquet(
    s3_client: &S3Client,
    df: &DataFrame,
    bucket: &str,
    key: &str,
) -> Result<(), Error> {
    let mut buffer = Vec::new();
    let mut cursor = Cursor::new(&mut buffer);
    
    ParquetWriter::new(&mut cursor)
        .finish(&mut df.clone())
        .map_err(|e| format!("Failed to write Parquet: {}", e))?;
    
    s3_client
        .put_object()
        .bucket(bucket)
        .key(key)
        .body(buffer.into())
        .send()
        .await
        .map_err(|e| format!("Failed to upload Parquet: {}", e))?;
    
    info!("Saved Parquet file to s3://{}/{}", bucket, key);
    Ok(())
}

async fn save_as_iceberg(
    s3_client: &S3Client,
    df: &DataFrame,
    bucket: &str,
    key: &str,
) -> Result<(), Error> {
    save_as_parquet(s3_client, df, bucket, key).await
}

async fn save_processing_result(
    s3_client: &S3Client,
    result: &ProcessingResult,
    bucket: &str,
    key: &str,
) -> Result<(), Error> {
    let json_data = serde_json::to_string_pretty(result)
        .map_err(|e| format!("Failed to serialize result: {}", e))?;
    
    s3_client
        .put_object()
        .bucket(bucket)
        .key(key)
        .body(json_data.into_bytes().into())
        .content_type("application/json")
        .send()
        .await
        .map_err(|e| format!("Failed to upload result: {}", e))?;
    
    info!("Saved processing result to s3://{}/{}", bucket, key);
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
                info!("Processing completed successfully: {}", result.file_id);
                Ok::<serde_json::Value, lambda_runtime::Error>(serde_json::json!({
                    "statusCode": 200,
                    "body": result
                }))
            }
            Err(e) => {
                info!("Processing failed: {}", e);
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