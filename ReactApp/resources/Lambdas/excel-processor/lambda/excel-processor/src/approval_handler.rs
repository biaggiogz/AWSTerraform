use aws_sdk_s3::Client as S3Client;
use polars::prelude::*;
use serde::{Deserialize, Serialize};
use std::io::Cursor;
use tracing::info;
use chrono::{DateTime, Utc};

#[derive(Debug, Serialize, Deserialize)]
pub struct ApprovalRequest {
    pub file_id: String,
    pub processing_result_key: String,
    pub approved_by: String,
    pub timestamp: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ApprovalResult {
    pub file_id: String,
    pub status: String,
    pub approved_parquet_path: String,
    pub approved_iceberg_path: String,
    pub approval_timestamp: DateTime<Utc>,
}

pub async fn handle_approval(
    s3_client: &S3Client,
    bucket: &str,
    approval_request: ApprovalRequest,
) -> Result<ApprovalResult, Box<dyn std::error::Error>> {
    info!("Processing approval for file_id: {}", approval_request.file_id);
    
    // Download processing result to get original file paths
    let processing_result = download_processing_result(
        s3_client, 
        bucket, 
        &approval_request.processing_result_key
    ).await?;
    
    // Copy from preDataset to approvedDataset
    let approved_parquet_path = format!("approvedDataset/parquet/{}.parquet", approval_request.file_id);
    let approved_iceberg_path = format!("approvedDataset/iceberg/{}.parquet", approval_request.file_id);
    
    // Copy Parquet file
    copy_s3_object(
        s3_client,
        bucket,
        &processing_result.parquet_path,
        &approved_parquet_path,
    ).await?;
    
    // Copy Iceberg file
    copy_s3_object(
        s3_client,
        bucket,
        &processing_result.iceberg_path,
        &approved_iceberg_path,
    ).await?;
    
    // Create approval metadata
    let approval_result = ApprovalResult {
        file_id: approval_request.file_id.clone(),
        status: "APPROVED".to_string(),
        approved_parquet_path: approved_parquet_path.clone(),
        approved_iceberg_path: approved_iceberg_path.clone(),
        approval_timestamp: approval_request.timestamp,
    };
    
    // Save approval record
    let approval_key = format!("approvedDataset/metadata/{}_approval.json", approval_request.file_id);
    save_approval_record(s3_client, bucket, &approval_key, &approval_result).await?;
    
    info!("Successfully approved file_id: {} to approvedDataset/", approval_request.file_id);
    Ok(approval_result)
}

async fn download_processing_result(
    s3_client: &S3Client,
    bucket: &str,
    key: &str,
) -> Result<ProcessingResult, Box<dyn std::error::Error>> {
    let response = s3_client
        .get_object()
        .bucket(bucket)
        .key(key)
        .send()
        .await?;
    
    let data = response.body.collect().await?.into_bytes();
    let json_str = String::from_utf8(data.to_vec())?;
    let result: ProcessingResult = serde_json::from_str(&json_str)?;
    
    Ok(result)
}

async fn copy_s3_object(
    s3_client: &S3Client,
    bucket: &str,
    source_key: &str,
    dest_key: &str,
) -> Result<(), Box<dyn std::error::Error>> {
    let copy_source = format!("{}/{}", bucket, source_key);
    
    s3_client
        .copy_object()
        .bucket(bucket)
        .key(dest_key)
        .copy_source(&copy_source)
        .send()
        .await?;
    
    info!("Copied {} to {}", source_key, dest_key);
    Ok(())
}

async fn save_approval_record(
    s3_client: &S3Client,
    bucket: &str,
    key: &str,
    approval_result: &ApprovalResult,
) -> Result<(), Box<dyn std::error::Error>> {
    let json_data = serde_json::to_string_pretty(approval_result)?;
    
    s3_client
        .put_object()
        .bucket(bucket)
        .key(key)
        .body(json_data.into())
        .content_type("application/json")
        .send()
        .await?;
    
    info!("Saved approval record to {}", key);
    Ok(())
}

// Re-export ProcessingResult from main module
use crate::ProcessingResult;