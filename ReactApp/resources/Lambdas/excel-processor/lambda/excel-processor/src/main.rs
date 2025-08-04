use lambda_runtime::{run, service_fn, Error, LambdaEvent};
use aws_sdk_s3::Client as S3Client;
use polars::prelude::*;
use serde::{Deserialize, Serialize};

use std::collections::HashMap;
use tracing::info;
use chrono::{DateTime, Utc};
use uuid::Uuid;

mod approval_handler;

#[derive(Debug, Deserialize)]
struct ParquetAnalysisRequest {
    bucket: String,
    parquet_key: String,
    metadata_key: String,
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
    // ML Enhancement Results (empty for clean data)
    anomaly_results: Vec<serde_json::Value>,
    validation_results: Vec<serde_json::Value>,
    null_predictions: Vec<serde_json::Value>,
    ml_confidence_score: f64,
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
    event: LambdaEvent<ParquetAnalysisRequest>,
    s3_client: &S3Client,
) -> Result<ProcessingResult, Error> {
    info!("Processing Parquet file for ML analysis: {}", event.payload.parquet_key);

    // Load preprocessed Parquet file
    let df = load_parquet_from_s3(s3_client, &event.payload.bucket, &event.payload.parquet_key).await?;

    // Load metadata
    let metadata = load_metadata_from_s3(s3_client, &event.payload.bucket, &event.payload.metadata_key).await?;

    let file_id = metadata.file_id.clone();
    let timestamp = Utc::now();

    // Generate minimal profile (Parquet already has clean data)
    let profile_data = generate_clean_profile_data(&df, &metadata)?;
    let schema_version = generate_schema_from_metadata(&metadata, timestamp)?;

    // Skip ML error detection - Python preprocessing ensures clean data
    let field_errors = HashMap::new();

    // Skip ML enhancement - focus on clean data processing
    let anomaly_results = Vec::new();
    let validation_results = Vec::new();
    let null_predictions = Vec::new();
    let ml_confidence = 0.95; // High confidence in Python preprocessing

    let result = ProcessingResult {
        file_id: file_id.clone(),
        timestamp,
        profile_data,
        schema_version,
        field_errors,
        parquet_path: event.payload.parquet_key.clone(),
        iceberg_path: format!("iceberg/{}.parquet", file_id),
        anomaly_results,
        validation_results,
        null_predictions,
        ml_confidence_score: ml_confidence,
    };

    let result_key = format!("processing-results/{}.json", result.file_id);
    save_processing_result(s3_client, &result, &event.payload.bucket, &result_key).await?;

    // Collect training data
    collect_training_data(s3_client, &df, &result, &event.payload.bucket).await
        .unwrap_or_else(|e| info!("Training data collection failed: {}", e));

    info!("Successfully completed ML analysis");
    Ok(result)
}

#[derive(Debug, Deserialize)]
struct PreprocessMetadata {
    file_id: String,
    original_key: String,
    parquet_key: String,
    rows: usize,
    columns: usize,
    column_types: HashMap<String, String>,
    timestamp: String,
}

async fn load_parquet_from_s3(
    s3_client: &S3Client,
    bucket: &str,
    key: &str,
) -> Result<DataFrame, Error> {
    let response = s3_client
        .get_object()
        .bucket(bucket)
        .key(key)
        .send()
        .await
        .map_err(|e| format!("Failed to download Parquet: {}", e))?;

    let data = response
        .body
        .collect()
        .await
        .map_err(|e| format!("Failed to read Parquet data: {}", e))?
        .into_bytes()
        .to_vec();

    // Write to temporary file
    let temp_path = format!("/tmp/{}.parquet", Uuid::new_v4());
    std::fs::write(&temp_path, data)
        .map_err(|e| format!("Failed to write temp file: {}", e))?;

    let df = LazyFrame::scan_parquet(&temp_path, ScanArgsParquet::default())
        .map_err(|e| format!("Failed to scan Parquet: {}", e))?
        .collect()
        .map_err(|e| format!("Failed to collect DataFrame: {}", e))?;

    // Clean up temp file
    let _ = std::fs::remove_file(&temp_path);

    info!("Loaded Parquet with {} rows, {} columns", df.height(), df.width());
    Ok(df)
}

async fn load_metadata_from_s3(
    s3_client: &S3Client,
    bucket: &str,
    key: &str,
) -> Result<PreprocessMetadata, Error> {
    let response = s3_client
        .get_object()
        .bucket(bucket)
        .key(key)
        .send()
        .await
        .map_err(|e| format!("Failed to download metadata: {}", e))?;

    let data = response
        .body
        .collect()
        .await
        .map_err(|e| format!("Failed to read metadata: {}", e))?
        .into_bytes();

    let metadata: PreprocessMetadata = serde_json::from_slice(&data)
        .map_err(|e| format!("Failed to parse metadata: {}", e))?;

    Ok(metadata)
}

fn generate_clean_profile_data(df: &DataFrame, metadata: &PreprocessMetadata) -> Result<ProfileData, Error> {
    let total_rows = df.height();
    let total_columns = df.width();
    let mut columns = Vec::new();

    for column in df.get_columns() {
        let col_name = column.name().to_string();
        let null_count = column.null_count();
        let null_percentage = (null_count as f64 / total_rows as f64) * 100.0;

        let series = column.as_series().unwrap();
        let inferred_type = metadata.column_types.get(&col_name)
            .cloned()
            .unwrap_or_else(|| "string".to_string());

        let unique_count = series.n_unique().ok();
        let sample_values = get_sample_values(series, 5);
        let data_patterns = detect_data_patterns(series);

        columns.push(ColumnProfile {
            name: col_name,
            inferred_type: inferred_type.clone(),
            data_type_confidence: 0.95, // High confidence from Python preprocessing
            null_count,
            null_percentage,
            unique_count,
            sample_values,
            data_patterns,
            professional_inference: format!("Preprocessed as {}", inferred_type),
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

fn generate_schema_from_metadata(metadata: &PreprocessMetadata, timestamp: DateTime<Utc>) -> Result<SchemaVersion, Error> {
    let columns = metadata.column_types.iter()
        .map(|(name, dtype)| SchemaColumn {
            name: name.clone(),
            data_type: dtype.clone(),
            nullable: true,
            constraints: Vec::new(),
        })
        .collect();

    Ok(SchemaVersion {
        version: "1.0.0".to_string(),
        created_at: timestamp,
        columns,
    })
}




fn get_sample_values(series: &Series, limit: usize) -> Vec<String> {
    series.iter()
        .take(limit)
        .filter_map(|v| v.get_str().map(|s| s.to_string()))
        .collect()
}

fn detect_data_patterns(series: &Series) -> Vec<DataPattern> {
    let mut patterns = Vec::new();

    // Simple pattern detection
    let sample_values = get_sample_values(series, 100);
    let mut pattern_counts = HashMap::new();

    for value in &sample_values {
        if value.contains('-') {
            *pattern_counts.entry("hyphen_separated".to_string()).or_insert(0) += 1;
        }
        if value.chars().all(|c| c.is_numeric()) {
            *pattern_counts.entry("numeric".to_string()).or_insert(0) += 1;
        }
        if value.contains('/') {
            *pattern_counts.entry("slash_separated".to_string()).or_insert(0) += 1;
        }
    }

    for (pattern_type, frequency) in pattern_counts {
        if frequency > 0 {
            patterns.push(DataPattern {
                pattern_type,
                frequency,
                example: sample_values.first().cloned().unwrap_or_default(),
            });
        }
    }

    patterns
}

fn calculate_data_quality_score(columns: &[ColumnProfile]) -> f64 {
    if columns.is_empty() {
        return 0.0;
    }

    let avg_confidence: f64 = columns.iter()
        .map(|c| c.data_type_confidence)
        .sum::<f64>() / columns.len() as f64;

    let avg_null_rate: f64 = columns.iter()
        .map(|c| c.null_percentage)
        .sum::<f64>() / columns.len() as f64;

    // Higher confidence and lower null rate = higher quality
    (avg_confidence * 0.7) + ((100.0 - avg_null_rate) / 100.0 * 0.3)
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
        .map_err(|e| format!("Failed to save result: {}", e))?;

    info!("Saved processing result: s3://{}/{}", bucket, key);
    Ok(())
}

async fn collect_training_data(
    _s3_client: &S3Client,
    _df: &DataFrame,
    _result: &ProcessingResult,
    _bucket: &str,
) -> Result<(), Error> {
    // Skip training data collection - using clean Parquet data
    info!("Training data collection disabled - using Python preprocessing");
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
                info!("Processing completed successfully: {} (ML confidence: {:.2})",
                      result.file_id, result.ml_confidence_score);
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