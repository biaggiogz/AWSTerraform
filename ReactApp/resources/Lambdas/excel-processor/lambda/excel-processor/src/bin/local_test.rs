use polars::prelude::*;
use serde_json;
use std::collections::HashMap;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let parquet_path = "../../../D_02_REPORTE_AVANCE_PRUEBA_DE_LAZOS.parquet";
    
    println!("Loading Parquet file: {}", parquet_path);
    
    let df = LazyFrame::scan_parquet(parquet_path, ScanArgsParquet::default())?
        .collect()?;
    
    println!("Loaded {} rows, {} columns", df.height(), df.width());
    
    // Show column info
    for column in df.get_columns() {
        let col_name = column.name();
        let null_count = column.null_count();
        let total_count = column.len();
        let null_percentage = (null_count as f64 / total_count as f64) * 100.0;
        
        println!("Column '{}': {} nulls ({:.1}%)", col_name, null_count, null_percentage);
        
        // Show sample values with JSON string handling
        let mut sample_values = Vec::new();
        for i in 0..std::cmp::min(3, column.len()) {
            let v = column.get(i).unwrap_or(AnyValue::Null);
            if v.is_null() {
                sample_values.push("NULL".to_string());
            } else {
                let val_str = v.to_string();
                if val_str.starts_with('"') && val_str.ends_with('"') {
                    sample_values.push(format!("{} (cleaned: {})", val_str, &val_str[1..val_str.len()-1]));
                } else {
                    sample_values.push(val_str);
                }
            }
        }
        
        println!("  Sample values: {:?}", sample_values);
    }
    
    // Test anomaly detection
    println!("\n=== Testing Anomaly Detection ===");
    let anomalies = detect_anomalies(&df)?;
    println!("Found {} anomalies", anomalies.len());
    for anomaly in &anomalies {
        println!("  {}", serde_json::to_string_pretty(anomaly)?);
    }
    
    // Test validation
    println!("\n=== Testing Validation ===");
    let validations = validate_with_learned_patterns(&df)?;
    println!("Found {} validation issues", validations.len());
    for validation in &validations {
        println!("  {}", serde_json::to_string_pretty(validation)?);
    }
    
    // Test null predictions
    println!("\n=== Testing Null Predictions ===");
    let predictions = predict_missing_values(&df)?;
    println!("Found {} null predictions", predictions.len());
    for prediction in predictions.iter().take(5) {
        println!("  {}", serde_json::to_string_pretty(prediction)?);
    }
    
    Ok(())
}

fn detect_anomalies(df: &DataFrame) -> Result<Vec<serde_json::Value>, Box<dyn std::error::Error>> {
    let mut anomalies = Vec::new();
    
    for row_idx in 0..std::cmp::min(df.height(), 100) {
        if let (Ok(subs_col), Ok(area_col)) = (df.column("SUBS_PRE"), df.column("Area")) {
            let subs_val = subs_col.get(row_idx).unwrap_or(AnyValue::Null);
            let area_val = area_col.get(row_idx).unwrap_or(AnyValue::Null);
            
            if !subs_val.is_null() && !area_val.is_null() {
                let subs_str = subs_val.to_string();
                let area_str = area_val.to_string();
                
                let clean_subs = if subs_str.starts_with('"') && subs_str.ends_with('"') {
                    &subs_str[1..subs_str.len()-1]
                } else { &subs_str };
                let clean_area = if area_str.starts_with('"') && area_str.ends_with('"') {
                    &area_str[1..area_str.len()-1]
                } else { &area_str };
                
                if !clean_subs.is_empty() && !clean_area.is_empty() {
                    if let Some(area_code) = clean_subs.split('-').nth(1) {
                        if clean_area != format!("A{}", area_code) {
                            anomalies.push(serde_json::json!({
                                "row_index": row_idx,
                                "type": "cross_column_inconsistency",
                                "description": format!("SUBS_PRE area code '{}' doesn't match Area '{}'", area_code, clean_area),
                                "confidence": 0.8
                            }));
                        }
                    }
                }
            }
        }
    }
    
    Ok(anomalies)
}

fn validate_with_learned_patterns(df: &DataFrame) -> Result<Vec<serde_json::Value>, Box<dyn std::error::Error>> {
    let mut validations = Vec::new();
    
    for row_idx in 0..std::cmp::min(df.height(), 50) {
        if let Ok(subs_col) = df.column("SUBS_PRE") {
            let value = subs_col.get(row_idx).unwrap_or(AnyValue::Null);
            if !value.is_null() {
                let val_str = value.to_string();
                let clean_val = if val_str.starts_with('"') && val_str.ends_with('"') {
                    &val_str[1..val_str.len()-1]
                } else { &val_str };
                
                if !clean_val.is_empty() {
                    let has_expected_format = clean_val.matches('-').count() >= 2;
                    if !has_expected_format {
                        validations.push(serde_json::json!({
                            "row_index": row_idx,
                            "column": "SUBS_PRE",
                            "is_valid": false,
                            "confidence": 0.7,
                            "pattern": "subsystem_code"
                        }));
                    }
                }
            }
        }
    }
    
    Ok(validations)
}

fn predict_missing_values(df: &DataFrame) -> Result<Vec<serde_json::Value>, Box<dyn std::error::Error>> {
    let mut predictions = Vec::new();
    
    for row_idx in 0..df.height() {
        if let (Ok(subs_col), Ok(area_col)) = (df.column("SUBS_PRE"), df.column("Area")) {
            let area_val = area_col.get(row_idx).unwrap_or(AnyValue::Null);
            
            if area_val.is_null() {
                let subs_val = subs_col.get(row_idx).unwrap_or(AnyValue::Null);
                if !subs_val.is_null() {
                    let subs_str = subs_val.to_string();
                    let clean_subs = if subs_str.starts_with('"') && subs_str.ends_with('"') {
                        &subs_str[1..subs_str.len()-1]
                    } else { &subs_str };
                    
                    if let Some(area_code) = clean_subs.split('-').nth(1) {
                        predictions.push(serde_json::json!({
                            "row_index": row_idx,
                            "column": "Area",
                            "predicted_value": format!("A{}", area_code),
                            "confidence": 0.9
                        }));
                    }
                }
            }
        }
    }
    
    Ok(predictions)
}