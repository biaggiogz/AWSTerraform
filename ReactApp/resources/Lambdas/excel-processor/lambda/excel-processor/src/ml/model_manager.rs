use aws_sdk_s3::Client as S3Client;
use candle_core::Device;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

use tracing::info;

#[derive(Debug, Serialize, Deserialize)]
pub struct ModelMetadata {
    pub version: String,
    pub model_type: String,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub accuracy: f64,
    pub file_size: usize,
}

pub struct ModelManager {
    s3_client: S3Client,
    bucket: String,
    device: Device,
    cached_models: HashMap<String, Vec<u8>>,
}

impl ModelManager {
    pub fn new(s3_client: S3Client, bucket: String) -> Self {
        let device = Device::Cpu;
        Self {
            s3_client,
            bucket,
            device,
            cached_models: HashMap::new(),
        }
    }

    pub async fn load_model(&mut self, model_name: &str) -> Result<Vec<u8>, Box<dyn std::error::Error>> {
        if let Some(cached) = self.cached_models.get(model_name) {
            return Ok(cached.clone());
        }

        let model_key = format!("models/{}.safetensors", model_name);
        let response = self.s3_client
            .get_object()
            .bucket(&self.bucket)
            .key(&model_key)
            .send()
            .await?;

        let model_data = response.body.collect().await?.into_bytes().to_vec();
        self.cached_models.insert(model_name.to_string(), model_data.clone());
        
        info!("Loaded model {} ({} bytes)", model_name, model_data.len());
        Ok(model_data)
    }

    pub async fn save_model(&self, model_name: &str, model_data: &[u8], metadata: ModelMetadata) -> Result<(), Box<dyn std::error::Error>> {
        let model_key = format!("models/{}.safetensors", model_name);
        let metadata_key = format!("models/{}_metadata.json", model_name);

        self.s3_client
            .put_object()
            .bucket(&self.bucket)
            .key(&model_key)
            .body(model_data.to_vec().into())
            .send()
            .await?;

        let metadata_json = serde_json::to_string(&metadata)?;
        self.s3_client
            .put_object()
            .bucket(&self.bucket)
            .key(&metadata_key)
            .body(metadata_json.into_bytes().into())
            .content_type("application/json")
            .send()
            .await?;

        info!("Saved model {} to S3", model_name);
        Ok(())
    }

    pub async fn get_latest_model_version(&self, model_type: &str) -> Result<Option<String>, Box<dyn std::error::Error>> {
        let prefix = format!("models/{}_", model_type);
        let response = self.s3_client
            .list_objects_v2()
            .bucket(&self.bucket)
            .prefix(&prefix)
            .send()
            .await?;

        let mut latest_version = None;
        let mut latest_timestamp = chrono::DateTime::<chrono::Utc>::MIN_UTC;

        if let Some(objects) = response.contents {
            for object in objects {
                if let Some(key) = object.key {
                    if key.ends_with("_metadata.json") {
                        if let Some(modified) = object.last_modified {
                            let timestamp = chrono::DateTime::from_timestamp(modified.secs(), 0)
                                .unwrap_or(chrono::DateTime::<chrono::Utc>::MIN_UTC);
                            if timestamp > latest_timestamp {
                                latest_timestamp = timestamp;
                                latest_version = Some(key.replace("_metadata.json", "").replace("models/", ""));
                            }
                        }
                    }
                }
            }
        }

        Ok(latest_version)
    }

    pub fn device(&self) -> &Device {
        &self.device
    }
}