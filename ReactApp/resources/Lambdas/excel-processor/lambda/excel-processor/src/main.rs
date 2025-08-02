use aws_lambda_events::event::eventbridge::EventBridgeEvent;
use lambda_runtime::{run, service_fn, Error, LambdaEvent};
use aws_sdk_s3::Client as S3Client;
use polars::prelude::*;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::io::Cursor;
use std::collections::HashMap;
use tracing::{info, error};
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

    // Extract S3 details from EventBridge event
    let s3_detail = extract_s3_details(&event.payload)?;
    info!("Processing file: s3://{}/{}", s3_detail.bucket, s3_detail.key);

    // Download Excel file from S3
    let excel_data = download_file_from_s3(s3_client, &s3_detail.bucket, &s3_detail.key).await?;
    
    // Read Excel file into Polars DataFrame
    let df = read_excel_to_dataframe(excel_data)?;
    
    // Generate unique identifier for output files
    let file_id = Uuid::new_v4().to_string();
    let timestamp = Utc::now();
    
    // Transform to Parquet
    let parquet_key = format!("preDataset/parquet/{}.parquet", file_id);
    save_as_parquet(s3_client, &df, &s3_detail.bucket, &parquet_key).await?;
    
    // Transform to Iceberg
    let iceberg_key = format!("preDataset/iceberg/{}.parquet", file_id);
    save_as_iceberg(s3_client, &df, &s3_detail.bucket, &iceberg_key).await?;
    
    // Generate detailed profile data
    let profile_data = generate_profile_data(&df)?;
    
    // Generate schema version
    let schema_version = generate_schema_version(&df, timestamp)?;
    
    // Detect field errors
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
    
    // Save processing result to S3
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
    
    // Skip first 11 rows and extract columns B:V (indices 1:21)
    for (row_idx, row) in range.rows().enumerate() {
        if row_idx < 11 { continue; }
        
        let mut row_data = Vec::new();
        for col_idx in 1..22 { // B=1 to V=21
            let cell_value = row.get(col_idx)
                .map(|cell| cell.to_string())
                .unwrap_or_default();
            row_data.push(cell_value);
        }
        
        // First data row (row 11) becomes headers
        if row_idx == 11 {
            header_row = row_data.clone();
        } else {
            data.push(row_data);
        }
    }
    
    // Clean headers by removing quotes and handle empty names
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
    
    info!("Headers extracted: {:?}", column_names);
    info!("Data rows: {}", data.len());
    
    // Convert to Polars DataFrame
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
    
    info!("DataFrame shape: {:?}", df.shape());
    info!("DataFrame columns: {:?}", df.get_column_names());
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
        
        // Infer professional data type
        let series = column.as_series().unwrap();
        let (inferred_type, confidence, professional_inference) = infer_professional_type(series);
        
        // Get unique count
        let unique_count = series.n_unique().ok();
        
        // Sample values (first 5 non-null)
        let sample_values = get_sample_values(series, 5);
        
        // Detect data patterns
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
    
    // Calculate overall data quality score
    let data_quality_score = calculate_data_quality_score(&columns);
    
    Ok(ProfileData {
        total_rows,
        total_columns,
        columns,
        data_quality_score,
    })
}

fn infer_professional_type(column: &Series) -> (String, f64, String) {
    let name = column.name();
    
    // Analyze actual values for mixed-type detection
    let sample_values = get_sample_values(column, 100);
    let mut type_counts = HashMap::new();
    
    for value in &sample_values {
        let detected_type = detect_value_type(value);
        *type_counts.entry(detected_type).or_insert(0) += 1;
    }
    
    // Determine dominant type and confidence
    let total_samples = sample_values.len() as f64;
    let unknown_type = "unknown".to_string();
    let (dominant_type, count) = type_counts.iter()
        .max_by_key(|(_, &count)| count)
        .unwrap_or((&unknown_type, &0));
    
    let dominant_type = dominant_type.clone();
    
    let confidence = if total_samples > 0.0 { (*count as f64 / total_samples) * 100.0 } else { 0.0 };
    
    // Professional inference based on column name and content
    let professional_inference = match name.to_lowercase().as_str() {
        n if n.contains("id") || n.contains("code") => "Identifier field - likely categorical".to_string(),
        n if n.contains("date") || n.contains("time") => "Temporal data - requires date parsing".to_string(),
        n if n.contains("amount") || n.contains("price") || n.contains("cost") => "Financial data - numeric with currency implications".to_string(),
        n if n.contains("email") => "Email address - requires validation".to_string(),
        n if n.contains("phone") => "Phone number - requires format standardization".to_string(),
        _ => {
            if confidence < 70.0 {
                "Mixed data types detected - requires data cleaning".to_string()
            } else {
                format!("Consistent {} data - good quality", dominant_type)
            }
        }
    };
    
    (dominant_type.clone(), confidence, professional_inference)
}

fn detect_value_type(value: &str) -> String {
    if value.trim().is_empty() {
        return "empty".to_string();
    }
    
    // Try parsing as different types
    if value.parse::<i64>().is_ok() {
        "integer".to_string()
    } else if value.parse::<f64>().is_ok() {
        "float".to_string()
    } else if value.contains('@') && value.contains('.') {
        "email".to_string()
    } else if value.chars().all(|c| c.is_ascii_digit() || c == '-' || c == '(' || c == ')' || c == ' ') {
        "phone".to_string()
    } else {
        "text".to_string()
    }
}

fn get_sample_values(column: &Series, limit: usize) -> Vec<String> {
    column.iter()
        .filter_map(|v| {
            if v.is_null() {
                None
            } else {
                Some(format!("{}", v))
            }
        })
        .take(limit)
        .collect()
}

fn detect_data_patterns(column: &Series) -> Vec<DataPattern> {
    let sample_values = get_sample_values(column, 50);
    let mut patterns = HashMap::new();
    
    for value in &sample_values {
        let pattern = classify_pattern(value);
        let entry = patterns.entry(pattern.clone()).or_insert((0, value.clone()));
        entry.0 += 1;
    }
    
    patterns.into_iter()
        .map(|(pattern_type, (frequency, example))| DataPattern {
            pattern_type,
            frequency,
            example,
        })
        .collect()
}

fn classify_pattern(value: &str) -> String {
    if value.chars().all(|c| c.is_ascii_digit()) {
        "numeric_only".to_string()
    } else if value.chars().all(|c| c.is_ascii_alphabetic() || c.is_whitespace()) {
        "text_only".to_string()
    } else if value.contains('@') {
        "email_format".to_string()
    } else if value.chars().any(|c| c.is_ascii_digit()) && value.chars().any(|c| c.is_ascii_alphabetic()) {
        "alphanumeric".to_string()
    } else {
        "mixed_special".to_string()
    }
}

fn calculate_data_quality_score(columns: &[ColumnProfile]) -> f64 {
    if columns.is_empty() {
        return 0.0;
    }
    
    let total_score: f64 = columns.iter().map(|col| {
        let null_penalty = col.null_percentage * 0.01;
        let confidence_bonus = col.data_type_confidence * 0.01;
        (100.0 - null_penalty + confidence_bonus).max(0.0).min(100.0)
    }).sum();
    
    total_score / columns.len() as f64
}

fn generate_schema_version(df: &DataFrame, timestamp: DateTime<Utc>) -> Result<SchemaVersion, Error> {
    let version = format!("v{}", timestamp.format("%Y%m%d_%H%M%S"));
    let mut columns = Vec::new();
    
    for column in df.get_columns() {
        let col_name = column.name().to_string();
        let data_type = format!("{:?}", column.dtype());
        let nullable = column.null_count() > 0;
        let series = column.as_series().unwrap();
        let constraints = infer_constraints(series);
        
        columns.push(SchemaColumn {
            name: col_name,
            data_type,
            nullable,
            constraints,
        });
    }
    
    Ok(SchemaVersion {
        version,
        created_at: timestamp,
        columns,
    })
}

fn infer_constraints(column: &Series) -> Vec<String> {
    let mut constraints = Vec::new();
    
    if column.null_count() == 0 {
        constraints.push("NOT_NULL".to_string());
    }
    
    if let Ok(unique_count) = column.n_unique() {
        if unique_count == column.len() {
            constraints.push("UNIQUE".to_string());
        }
    }
    
    constraints
}

fn detect_field_errors(df: &DataFrame) -> Result<HashMap<String, Vec<FieldError>>, Error> {
    let mut field_errors = HashMap::new();
    
    for column in df.get_columns() {
        let col_name = column.name().to_string();
        let mut errors = Vec::new();
        
        // Check for data type inconsistencies
        let series = column.as_series().unwrap();
        let sample_values = get_sample_values(series, 1000);
        if let Some(first_value) = sample_values.first() {
            let expected_type = detect_value_type(first_value);
            
            for (idx, value) in sample_values.iter().enumerate() {
                let actual_type = detect_value_type(value);
                
                if actual_type != expected_type && actual_type != "empty" {
                    errors.push(FieldError {
                        row_index: idx,
                        error_type: "TYPE_MISMATCH".to_string(),
                        description: format!("Expected {}, found {}", expected_type, actual_type),
                        suggested_fix: Some(format!("Convert to {} or clean data", expected_type)),
                        value: value.clone(),
                    });
                }
                
                // Check for invalid formats
                if col_name.to_lowercase().contains("email") && !value.contains('@') && !value.trim().is_empty() {
                    errors.push(FieldError {
                        row_index: idx,
                        error_type: "INVALID_FORMAT".to_string(),
                        description: "Invalid email format".to_string(),
                        suggested_fix: Some("Verify email address format".to_string()),
                        value: value.clone(),
                    });
                }
            }
        }
        
        if !errors.is_empty() {
            field_errors.insert(col_name, errors);
        }
    }
    
    Ok(field_errors)
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
        .content_type("application/octet-stream")
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
    // Simplified Iceberg implementation - save as Parquet in iceberg folder
    // In production, you'd use proper Iceberg table format
    let mut buffer = Vec::new();
    let mut cursor = Cursor::new(&mut buffer);
    
    ParquetWriter::new(&mut cursor)
        .finish(&mut df.clone())
        .map_err(|e| format!("Failed to write Iceberg format: {}", e))?;
    
    s3_client
        .put_object()
        .bucket(bucket)
        .key(key)
        .body(buffer.into())
        .content_type("application/octet-stream")
        .send()
        .await
        .map_err(|e| format!("Failed to upload Iceberg: {}", e))?;
    
    info!("Saved Iceberg file to s3://{}/{}", bucket, key);
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
                error!("Processing failed: {}", e);
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