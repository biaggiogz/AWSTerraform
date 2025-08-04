use candle_core::{Device, Tensor};

use polars::prelude::*;
use serde::{Deserialize, Serialize};
use crate::ml::{ModelManager, FeatureExtractor};

#[derive(Debug, Serialize, Deserialize)]
pub struct AnomalyResult {
    pub row_index: usize,
    pub anomaly_score: f64,
    pub is_anomaly: bool,
    pub explanation: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ValidationResult {
    pub row_index: usize,
    pub column: String,
    pub is_valid: bool,
    pub confidence: f64,
    pub suggested_value: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct NullPrediction {
    pub row_index: usize,
    pub column: String,
    pub predicted_value: String,
    pub confidence: f64,
}

pub struct InferenceEngine {
    device: Device,
    feature_extractor: FeatureExtractor,
    anomaly_threshold: f64,
}

impl InferenceEngine {
    pub fn new(device: Device) -> Self {
        Self {
            device: device.clone(),
            feature_extractor: FeatureExtractor::new(device),
            anomaly_threshold: 0.7,
        }
    }

    pub async fn detect_anomalies(&self, df: &DataFrame, _model_manager: &ModelManager) -> Result<Vec<AnomalyResult>, Box<dyn std::error::Error>> {
        let mut results = Vec::new();
        
        for row_idx in 0..df.height() {
            let features = self.feature_extractor.extract_row_features(df, row_idx)?;
            let cross_features = self.feature_extractor.extract_cross_column_features(df, row_idx)?;
            
            // Simple anomaly detection using feature statistics
            let anomaly_score = self.calculate_anomaly_score(&features, &cross_features)?;
            let is_anomaly = anomaly_score > self.anomaly_threshold;
            
            if is_anomaly {
                let explanation = self.generate_anomaly_explanation(df, row_idx, anomaly_score)?;
                results.push(AnomalyResult {
                    row_index: row_idx,
                    anomaly_score,
                    is_anomaly,
                    explanation,
                });
            }
        }
        
        Ok(results)
    }

    pub async fn validate_context(&self, df: &DataFrame) -> Result<Vec<ValidationResult>, Box<dyn std::error::Error>> {
        let mut results = Vec::new();
        
        for row_idx in 0..df.height() {
            // Cross-column validation
            let cross_validations = self.validate_cross_column_relationships(df, row_idx)?;
            results.extend(cross_validations);
            
            // Workflow state validation
            let workflow_validations = self.validate_workflow_states(df, row_idx)?;
            results.extend(workflow_validations);
            
            // Temporal consistency validation
            let temporal_validations = self.validate_temporal_consistency(df, row_idx)?;
            results.extend(temporal_validations);
        }
        
        Ok(results)
    }

    pub async fn predict_nulls(&self, df: &DataFrame) -> Result<Vec<NullPrediction>, Box<dyn std::error::Error>> {
        let mut predictions = Vec::new();
        
        for row_idx in 0..df.height() {
            for column in df.get_columns() {
                let col_name = column.name();
                let value = column.get(row_idx).unwrap_or(AnyValue::Null);
                
                if value.is_null() || value.to_string().trim().is_empty() {
                    if let Some(prediction) = self.predict_missing_value(df, row_idx, col_name)? {
                        predictions.push(prediction);
                    }
                }
            }
        }
        
        Ok(predictions)
    }

    fn calculate_anomaly_score(&self, features: &Tensor, cross_features: &Tensor) -> Result<f64, Box<dyn std::error::Error>> {
        // Simple statistical anomaly detection
        let feature_values = features.to_vec1::<f32>()?;
        let cross_values = cross_features.to_vec1::<f32>()?;
        
        // Calculate z-scores for key features
        let mut anomaly_indicators = 0;
        let total_features = feature_values.len() + cross_values.len();
        
        // Check for extreme values in features
        for &value in &feature_values {
            if value > 3.0 || value < -3.0 { // Simple threshold
                anomaly_indicators += 1;
            }
        }
        
        // Check cross-column consistency
        for &value in &cross_values {
            if value < 0.3 { // Low consistency score
                anomaly_indicators += 1;
            }
        }
        
        Ok(anomaly_indicators as f64 / total_features as f64)
    }

    fn generate_anomaly_explanation(&self, df: &DataFrame, row_idx: usize, score: f64) -> Result<String, Box<dyn std::error::Error>> {
        let mut explanations = Vec::new();
        
        // Check SUBS_PRE vs Area consistency
        if let (Ok(subs_col), Ok(area_col)) = (df.column("SUBS_PRE"), df.column("Area")) {
            let subs = subs_col.get(row_idx).unwrap_or(AnyValue::Null).to_string();
            let area = area_col.get(row_idx).unwrap_or(AnyValue::Null).to_string();
            
            if !subs.is_empty() && !area.is_empty() {
                if let Some(area_from_subs) = subs.split('-').nth(1) {
                    if area != format!("A{}", area_from_subs) {
                        explanations.push(format!("SUBS_PRE area code '{}' doesn't match Area '{}'", area_from_subs, area));
                    }
                }
            }
        }
        
        // Check workflow inconsistencies
        let workflow_explanation = self.check_workflow_anomalies(df, row_idx)?;
        if !workflow_explanation.is_empty() {
            explanations.push(workflow_explanation);
        }
        
        if explanations.is_empty() {
            explanations.push(format!("Statistical anomaly detected (score: {:.2})", score));
        }
        
        Ok(explanations.join("; "))
    }

    fn validate_cross_column_relationships(&self, df: &DataFrame, row_idx: usize) -> Result<Vec<ValidationResult>, Box<dyn std::error::Error>> {
        let mut results = Vec::new();
        
        // SUBS_PRE vs Area validation
        if let (Ok(subs_col), Ok(area_col)) = (df.column("SUBS_PRE"), df.column("Area")) {
            let subs = subs_col.get(row_idx).unwrap_or(AnyValue::Null).to_string();
            let area = area_col.get(row_idx).unwrap_or(AnyValue::Null).to_string();
            
            if !subs.is_empty() && !area.is_empty() {
                let is_consistent = if let Some(area_from_subs) = subs.split('-').nth(1) {
                    area == format!("A{}", area_from_subs) || area == "A00000" // Special case
                } else {
                    false
                };
                
                results.push(ValidationResult {
                    row_index: row_idx,
                    column: "Area".to_string(),
                    is_valid: is_consistent,
                    confidence: if is_consistent { 0.95 } else { 0.85 },
                    suggested_value: if !is_consistent {
                        subs.split('-').nth(1).map(|code| format!("A{}", code))
                    } else {
                        None
                    },
                });
            }
        }
        
        Ok(results)
    }

    fn validate_workflow_states(&self, df: &DataFrame, row_idx: usize) -> Result<Vec<ValidationResult>, Box<dyn std::error::Error>> {
        let mut results = Vec::new();
        
        let installed = df.column("INSTALLED").ok().and_then(|c| Some(c.get(row_idx).unwrap_or(AnyValue::Null).to_string()));
        let wired = df.column("WIRED").ok().and_then(|c| Some(c.get(row_idx).unwrap_or(AnyValue::Null).to_string()));
        let connected = df.column("CONNECTED").ok().and_then(|c| Some(c.get(row_idx).unwrap_or(AnyValue::Null).to_string()));
        
        // Validate workflow progression
        if let (Some(inst), Some(wire)) = (&installed, &wired) {
            if !inst.is_empty() && wire.is_empty() {
                results.push(ValidationResult {
                    row_index: row_idx,
                    column: "WIRED".to_string(),
                    is_valid: false,
                    confidence: 0.8,
                    suggested_value: Some("CABLEADO".to_string()),
                });
            }
        }
        
        if let (Some(wire), Some(conn)) = (&wired, &connected) {
            if !wire.is_empty() && conn.is_empty() {
                results.push(ValidationResult {
                    row_index: row_idx,
                    column: "CONNECTED".to_string(),
                    is_valid: false,
                    confidence: 0.8,
                    suggested_value: Some("CONEXIONADO".to_string()),
                });
            }
        }
        
        Ok(results)
    }

    fn validate_temporal_consistency(&self, df: &DataFrame, row_idx: usize) -> Result<Vec<ValidationResult>, Box<dyn std::error::Error>> {
        let mut results = Vec::new();
        
        // Extract dates from key columns
        let mut dates = Vec::new();
        let date_columns = [("INSTALLED", "Installation"), ("QCF", "QCF"), ("DOSSIER", "Dossier")];
        
        for (col_name, desc) in &date_columns {
            if let Ok(column) = df.column(col_name) {
                let value = column.get(row_idx).unwrap_or(AnyValue::Null).to_string();
                if let Some(date) = self.extract_date_from_value(&value) {
                    dates.push((date, col_name, desc));
                }
            }
        }
        
        // Check date sequence
        dates.sort_by_key(|(date, _, _)| *date);
        for window in dates.windows(2) {
            let (date1, _col1, _) = &window[0];
            let (date2, col2, _) = &window[1];
            
            if date1 > date2 {
                results.push(ValidationResult {
                    row_index: row_idx,
                    column: col2.to_string(),
                    is_valid: false,
                    confidence: 0.9,
                    suggested_value: None,
                });
            }
        }
        
        Ok(results)
    }

    fn predict_missing_value(&self, df: &DataFrame, row_idx: usize, col_name: &str) -> Result<Option<NullPrediction>, Box<dyn std::error::Error>> {
        match col_name {
            "WIRED" => {
                if let Ok(installed_col) = df.column("INSTALLED") {
                    let installed = installed_col.get(row_idx).unwrap_or(AnyValue::Null).to_string();
                    if !installed.is_empty() && installed != "0" {
                        return Ok(Some(NullPrediction {
                            row_index: row_idx,
                            column: col_name.to_string(),
                            predicted_value: "CABLEADO".to_string(),
                            confidence: 0.85,
                        }));
                    }
                }
            },
            "CONNECTED" => {
                if let Ok(wired_col) = df.column("WIRED") {
                    let wired = wired_col.get(row_idx).unwrap_or(AnyValue::Null).to_string();
                    if !wired.is_empty() && wired != "0" {
                        return Ok(Some(NullPrediction {
                            row_index: row_idx,
                            column: col_name.to_string(),
                            predicted_value: "CONEXIONADO".to_string(),
                            confidence: 0.8,
                        }));
                    }
                }
            },
            "Area" => {
                if let Ok(subs_col) = df.column("SUBS_PRE") {
                    let subs = subs_col.get(row_idx).unwrap_or(AnyValue::Null).to_string();
                    if let Some(area_code) = subs.split('-').nth(1) {
                        return Ok(Some(NullPrediction {
                            row_index: row_idx,
                            column: col_name.to_string(),
                            predicted_value: format!("A{}", area_code),
                            confidence: 0.9,
                        }));
                    }
                }
            },
            _ => {}
        }
        
        Ok(None)
    }

    fn check_workflow_anomalies(&self, df: &DataFrame, row_idx: usize) -> Result<String, Box<dyn std::error::Error>> {
        let mut issues = Vec::new();
        
        let installed = df.column("INSTALLED").ok().and_then(|c| Some(c.get(row_idx).unwrap_or(AnyValue::Null).to_string()));
        let wired = df.column("WIRED").ok().and_then(|c| Some(c.get(row_idx).unwrap_or(AnyValue::Null).to_string()));
        let connected = df.column("CONNECTED").ok().and_then(|c| Some(c.get(row_idx).unwrap_or(AnyValue::Null).to_string()));
        
        // Check for workflow gaps
        if let (Some(inst), Some(wire)) = (&installed, &wired) {
            if !inst.is_empty() && wire.is_empty() {
                issues.push("INSTALLED but not WIRED");
            }
        }
        
        if let (Some(wire), Some(conn)) = (&wired, &connected) {
            if !wire.is_empty() && conn.is_empty() {
                issues.push("WIRED but not CONNECTED");
            }
        }
        
        Ok(issues.join(", "))
    }

    fn extract_date_from_value(&self, value: &str) -> Option<chrono::NaiveDate> {
        let date_regex = regex::Regex::new(r"(\d{1,2})/(\d{1,2})/(\d{4})").unwrap();
        if let Some(caps) = date_regex.captures(value) {
            let month: u32 = caps[1].parse().ok()?;
            let day: u32 = caps[2].parse().ok()?;
            let year: i32 = caps[3].parse().ok()?;
            return chrono::NaiveDate::from_ymd_opt(year, month, day);
        }
        None
    }
}