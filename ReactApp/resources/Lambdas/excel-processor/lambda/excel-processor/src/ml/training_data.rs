use aws_sdk_s3::Client as S3Client;
use polars::prelude::*;
use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize)]
pub struct TrainingExample {
    pub id: String,
    pub timestamp: DateTime<Utc>,
    pub row_data: Vec<String>,
    pub column_names: Vec<String>,
    pub ground_truth: GroundTruth,
    pub source: String, // "approval", "correction", "validation"
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GroundTruth {
    pub is_valid: bool,
    pub anomaly_score: Option<f64>,
    pub corrections: Vec<FieldCorrection>,
    pub validation_results: Vec<ValidationLabel>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FieldCorrection {
    pub column: String,
    pub original_value: String,
    pub corrected_value: String,
    pub correction_type: String, // "format", "consistency", "workflow", "temporal"
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ValidationLabel {
    pub column: String,
    pub is_valid: bool,
    pub confidence: f64,
    pub validation_type: String,
}

pub struct TrainingDataCollector {
    s3_client: S3Client,
    bucket: String,
}

impl TrainingDataCollector {
    pub fn new(s3_client: S3Client, bucket: String) -> Self {
        Self { s3_client, bucket }
    }

    pub async fn collect_from_approval(&self, approval_data: &crate::approval_handler::ApprovalRequest, df: &DataFrame) -> Result<(), Box<dyn std::error::Error>> {
        let training_examples = self.create_training_examples_from_approval(approval_data, df)?;
        
        for example in training_examples {
            self.save_training_example(&example).await?;
        }
        
        Ok(())
    }

    pub async fn collect_from_corrections(&self, corrections: &[FieldCorrection], df: &DataFrame, row_indices: &[usize]) -> Result<(), Box<dyn std::error::Error>> {
        for (_idx, &row_idx) in row_indices.iter().enumerate() {
            let row_data = self.extract_row_data(df, row_idx)?;
            let column_names = df.get_column_names().iter().map(|s| s.to_string()).collect();
            
            let example = TrainingExample {
                id: Uuid::new_v4().to_string(),
                timestamp: Utc::now(),
                row_data,
                column_names,
                ground_truth: GroundTruth {
                    is_valid: false,
                    anomaly_score: None,
                    corrections: corrections.to_vec(),
                    validation_results: Vec::new(),
                },
                source: "correction".to_string(),
            };
            
            self.save_training_example(&example).await?;
        }
        
        Ok(())
    }

    pub async fn collect_validation_feedback(&self, validation_results: &[crate::ml::inference_engine::ValidationResult], df: &DataFrame) -> Result<(), Box<dyn std::error::Error>> {
        let mut examples_by_row: std::collections::HashMap<usize, Vec<ValidationLabel>> = std::collections::HashMap::new();
        
        for result in validation_results {
            let label = ValidationLabel {
                column: result.column.clone(),
                is_valid: result.is_valid,
                confidence: result.confidence,
                validation_type: "context".to_string(),
            };
            
            examples_by_row.entry(result.row_index).or_insert_with(Vec::new).push(label);
        }
        
        for (row_idx, validation_labels) in examples_by_row {
            let row_data = self.extract_row_data(df, row_idx)?;
            let column_names = df.get_column_names().iter().map(|s| s.to_string()).collect();
            
            let example = TrainingExample {
                id: Uuid::new_v4().to_string(),
                timestamp: Utc::now(),
                row_data,
                column_names,
                ground_truth: GroundTruth {
                    is_valid: validation_labels.iter().all(|v| v.is_valid),
                    anomaly_score: None,
                    corrections: Vec::new(),
                    validation_results: validation_labels,
                },
                source: "validation".to_string(),
            };
            
            self.save_training_example(&example).await?;
        }
        
        Ok(())
    }

    pub async fn load_training_data(&self, limit: Option<usize>) -> Result<Vec<TrainingExample>, Box<dyn std::error::Error>> {
        let mut examples = Vec::new();
        
        let response = self.s3_client
            .list_objects_v2()
            .bucket(&self.bucket)
            .prefix("training-data/")
            .max_keys(limit.unwrap_or(1000) as i32)
            .send()
            .await?;
        
        if let Some(objects) = response.contents {
            for object in objects {
                if let Some(key) = object.key {
                    if key.ends_with(".json") {
                        let example = self.load_training_example(&key).await?;
                        examples.push(example);
                    }
                }
            }
        }
        
        Ok(examples)
    }

    async fn save_training_example(&self, example: &TrainingExample) -> Result<(), Box<dyn std::error::Error>> {
        let key = format!("training-data/{}/{}.json", example.source, example.id);
        let json_data = serde_json::to_string_pretty(example)?;
        
        self.s3_client
            .put_object()
            .bucket(&self.bucket)
            .key(&key)
            .body(json_data.into_bytes().into())
            .content_type("application/json")
            .send()
            .await?;
        
        tracing::info!("Saved training example: {}", key);
        Ok(())
    }

    async fn load_training_example(&self, key: &str) -> Result<TrainingExample, Box<dyn std::error::Error>> {
        let response = self.s3_client
            .get_object()
            .bucket(&self.bucket)
            .key(key)
            .send()
            .await?;
        
        let data = response.body.collect().await?.into_bytes();
        let json_str = String::from_utf8(data.to_vec())?;
        let example: TrainingExample = serde_json::from_str(&json_str)?;
        
        Ok(example)
    }

    fn create_training_examples_from_approval(&self, approval_data: &crate::approval_handler::ApprovalRequest, df: &DataFrame) -> Result<Vec<TrainingExample>, Box<dyn std::error::Error>> {
        let mut examples = Vec::new();
        
        for row_idx in 0..df.height() {
            let row_data = self.extract_row_data(df, row_idx)?;
            let column_names = df.get_column_names().iter().map(|s| s.to_string()).collect();
            
            let example = TrainingExample {
                id: Uuid::new_v4().to_string(),
                timestamp: approval_data.timestamp,
                row_data,
                column_names,
                ground_truth: GroundTruth {
                    is_valid: true, // Approved data is considered valid
                    anomaly_score: Some(0.0),
                    corrections: Vec::new(),
                    validation_results: Vec::new(),
                },
                source: "approval".to_string(),
            };
            
            examples.push(example);
        }
        
        Ok(examples)
    }

    fn extract_row_data(&self, df: &DataFrame, row_idx: usize) -> Result<Vec<String>, Box<dyn std::error::Error>> {
        let mut row_data = Vec::new();
        
        for column in df.get_columns() {
            let value = column.get(row_idx).unwrap_or(polars::prelude::AnyValue::Null);
            row_data.push(value.to_string());
        }
        
        Ok(row_data)
    }

    pub async fn get_training_statistics(&self) -> Result<TrainingStatistics, Box<dyn std::error::Error>> {
        let examples = self.load_training_data(None).await?;
        
        let total_examples = examples.len();
        let approval_count = examples.iter().filter(|e| e.source == "approval").count();
        let correction_count = examples.iter().filter(|e| e.source == "correction").count();
        let validation_count = examples.iter().filter(|e| e.source == "validation").count();
        
        let valid_examples = examples.iter().filter(|e| e.ground_truth.is_valid).count();
        let invalid_examples = total_examples - valid_examples;
        
        Ok(TrainingStatistics {
            total_examples,
            approval_count,
            correction_count,
            validation_count,
            valid_examples,
            invalid_examples,
            last_updated: Utc::now(),
        })
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TrainingStatistics {
    pub total_examples: usize,
    pub approval_count: usize,
    pub correction_count: usize,
    pub validation_count: usize,
    pub valid_examples: usize,
    pub invalid_examples: usize,
    pub last_updated: DateTime<Utc>,
}