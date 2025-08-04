use candle_core::{Device, Tensor};
use polars::prelude::*;
use hashbrown::HashMap;


pub struct FeatureExtractor {
    device: Device,
    vocab: HashMap<String, usize>,
    column_encoders: HashMap<String, HashMap<String, f32>>,
}

impl FeatureExtractor {
    pub fn new(device: Device) -> Self {
        Self {
            device,
            vocab: HashMap::new(),
            column_encoders: HashMap::new(),
        }
    }

    pub fn extract_row_features(&self, df: &DataFrame, row_idx: usize) -> Result<Tensor, Box<dyn std::error::Error>> {
        let mut features = Vec::new();
        
        for column in df.get_columns() {
            let col_name = column.name();
            let value = column.get(row_idx).unwrap_or(AnyValue::Null);
            
            // Text embedding features
            let text_features = self.extract_text_features(&value.to_string())?;
            features.extend(text_features);
            
            // Pattern features
            let pattern_features = self.extract_pattern_features(col_name, &value.to_string())?;
            features.extend(pattern_features);
            
            // Null indicator
            features.push(if value.is_null() { 1.0 } else { 0.0 });
        }
        
        let len = features.len();
        Tensor::from_vec(features, (len,), &self.device)
            .map_err(|e| format!("Failed to create tensor: {}", e).into())
    }

    pub fn extract_cross_column_features(&self, df: &DataFrame, row_idx: usize) -> Result<Tensor, Box<dyn std::error::Error>> {
        let mut features = Vec::new();
        
        // SUBS_PRE vs Area consistency
        if let (Ok(subs), Ok(area)) = (df.column("SUBS_PRE"), df.column("Area")) {
            let subs_val = subs.get(row_idx).unwrap_or(AnyValue::Null).to_string();
            let area_val = area.get(row_idx).unwrap_or(AnyValue::Null).to_string();
            features.push(self.check_subs_area_consistency(&subs_val, &area_val));
        }
        
        // Workflow state consistency (INSTALLED -> WIRED -> CONNECTED)
        let workflow_consistency = self.extract_workflow_features(df, row_idx)?;
        features.extend(workflow_consistency);
        
        // Date sequence validation
        let date_features = self.extract_temporal_features(df, row_idx)?;
        features.extend(date_features);
        
        let len = features.len();
        Tensor::from_vec(features, (len,), &self.device)
            .map_err(|e| format!("Failed to create cross-column tensor: {}", e).into())
    }

    fn extract_text_features(&self, text: &str) -> Result<Vec<f32>, Box<dyn std::error::Error>> {
        let mut features = vec![0.0; 50]; // Fixed size embedding
        
        // Character-level features
        features[0] = text.len() as f32;
        features[1] = text.chars().filter(|c| c.is_alphabetic()).count() as f32;
        features[2] = text.chars().filter(|c| c.is_numeric()).count() as f32;
        features[3] = text.chars().filter(|c| *c == '-').count() as f32;
        features[4] = text.chars().filter(|c| *c == '/').count() as f32;
        
        // Pattern indicators
        features[5] = if text.contains("MONTADO") { 1.0 } else { 0.0 };
        features[6] = if text.contains("CABLEADO") { 1.0 } else { 0.0 };
        features[7] = if text.contains("CONEXIONADO") { 1.0 } else { 0.0 };
        features[8] = if text.matches('/').count() == 2 { 1.0 } else { 0.0 }; // Date pattern
        
        Ok(features)
    }

    fn extract_pattern_features(&self, column_name: &str, value: &str) -> Result<Vec<f32>, Box<dyn std::error::Error>> {
        let mut features = Vec::new();
        
        match column_name {
            "SUBS_PRE" => {
                features.push(if regex::Regex::new(r"^[A-Z]{2,4}-\d{5}-\d{2}$").unwrap().is_match(value) { 1.0 } else { 0.0 });
                features.push(if value.contains("00000") { 1.0 } else { 0.0 }); // Special case
            },
            "TAG LOOP" => {
                features.push(if regex::Regex::new(r"^[A-Z]+-\d+[A-Z]?$").unwrap().is_match(value) { 1.0 } else { 0.0 });
            },
            "Area" => {
                features.push(if regex::Regex::new(r"^A\d{5}$").unwrap().is_match(value) { 1.0 } else { 0.0 });
            },
            _ => {
                features.push(0.0); // Generic pattern score
            }
        }
        
        Ok(features)
    }

    fn check_subs_area_consistency(&self, subs: &str, area: &str) -> f32 {
        if subs.is_empty() || area.is_empty() { return 0.5; }
        
        // Extract area code from SUBS_PRE (e.g., "NI-10004-01" -> "10004")
        if let Some(area_from_subs) = subs.split('-').nth(1) {
            if area == format!("A{}", area_from_subs) {
                return 1.0; // Consistent
            }
        }
        
        0.0 // Inconsistent
    }

    fn extract_workflow_features(&self, df: &DataFrame, row_idx: usize) -> Result<Vec<f32>, Box<dyn std::error::Error>> {
        let mut features = Vec::new();
        
        let installed = df.column("INSTALLED").ok().and_then(|c| Some(c.get(row_idx).unwrap_or(AnyValue::Null).to_string()));
        let wired = df.column("WIRED").ok().and_then(|c| Some(c.get(row_idx).unwrap_or(AnyValue::Null).to_string()));
        let connected = df.column("CONNECTED").ok().and_then(|c| Some(c.get(row_idx).unwrap_or(AnyValue::Null).to_string()));
        
        // Workflow progression score
        let workflow_score = match (installed.as_deref(), wired.as_deref(), connected.as_deref()) {
            (Some(i), Some(w), Some(c)) if !i.is_empty() && !w.is_empty() && !c.is_empty() => 1.0,
            (Some(i), Some(w), _) if !i.is_empty() && !w.is_empty() => 0.7,
            (Some(i), _, _) if !i.is_empty() => 0.3,
            _ => 0.0,
        };
        
        features.push(workflow_score);
        Ok(features)
    }

    fn extract_temporal_features(&self, df: &DataFrame, row_idx: usize) -> Result<Vec<f32>, Box<dyn std::error::Error>> {
        let mut features = Vec::new();
        
        // Extract dates from various columns
        let date_columns = ["INSTALLED", "QCF", "DOSSIER", "TEST LOOP"];
        let mut dates = Vec::new();
        
        for col_name in &date_columns {
            if let Ok(column) = df.column(col_name) {
                let value = column.get(row_idx).unwrap_or(AnyValue::Null).to_string();
                if let Some(date) = self.extract_date_from_text(&value) {
                    dates.push(date);
                }
            }
        }
        
        // Date sequence validation
        dates.sort();
        let sequence_valid = dates.windows(2).all(|w| w[0] <= w[1]);
        features.push(if sequence_valid { 1.0 } else { 0.0 });
        
        Ok(features)
    }

    fn extract_date_from_text(&self, text: &str) -> Option<chrono::NaiveDate> {
        // Try different date formats
        let date_regex = regex::Regex::new(r"(\d{1,2})/(\d{1,2})/(\d{4})").unwrap();
        if let Some(caps) = date_regex.captures(text) {
            let month: u32 = caps[1].parse().ok()?;
            let day: u32 = caps[2].parse().ok()?;
            let year: i32 = caps[3].parse().ok()?;
            return chrono::NaiveDate::from_ymd_opt(year, month, day);
        }
        None
    }

    pub fn build_training_features(&mut self, df: &DataFrame) -> Result<Tensor, Box<dyn std::error::Error>> {
        let mut all_features = Vec::new();
        
        for row_idx in 0..df.height() {
            let row_features = self.extract_row_features(df, row_idx)?;
            let cross_features = self.extract_cross_column_features(df, row_idx)?;
            
            // Combine features
            let combined = Tensor::cat(&[&row_features, &cross_features], 0)?;
            all_features.push(combined);
        }
        
        // Stack all rows
        if all_features.is_empty() {
            return Tensor::zeros((0, 0), candle_core::DType::F32, &self.device)
                .map_err(|e| format!("Failed to create empty tensor: {}", e).into());
        }
        
        Tensor::stack(&all_features, 0)
            .map_err(|e| format!("Failed to stack features: {}", e).into())
    }
}