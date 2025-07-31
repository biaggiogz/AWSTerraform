use wasm_bindgen::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct TableRow {
    #[serde(rename = "SUBSYSTEM")]
    subsystem: Option<String>,
    #[serde(rename = "TPs")]
    tps: Option<String>,
    #[serde(rename = "MOUNTING ON ISO/EQUI/PACK")]
    isometric: Option<String>,
}

#[wasm_bindgen]
pub fn filter_table_data(data: &JsValue, subsystem: Option<String>, test_pack: Option<String>, isometric: Option<String>) -> JsValue {
    let rows: Vec<TableRow> = serde_wasm_bindgen::from_value(data.clone()).unwrap_or_default();
    
    let filtered: Vec<TableRow> = rows.into_iter().filter(|row| {
        if let Some(ref sub) = subsystem {
            if row.subsystem.as_ref() != Some(sub) {
                return false;
            }
        }
        
        if let Some(ref tp) = test_pack {
            if let Some(ref tps) = row.tps {
                if !tps.contains(tp) {
                    return false;
                }
            } else {
                return false;
            }
        }
        
        if let Some(ref iso) = isometric {
            if row.isometric.as_ref() != Some(iso) {
                return false;
            }
        }
        
        true
    }).collect();
    
    serde_wasm_bindgen::to_value(&filtered).unwrap()
}

#[wasm_bindgen]
pub fn calculate_row_heights(data: &JsValue) -> Vec<u32> {
    let rows: Vec<serde_json::Value> = serde_wasm_bindgen::from_value(data.clone()).unwrap_or_default();
    
    rows.iter().map(|row| {
        let max_length = row.as_object()
            .map(|obj| obj.values()
                .map(|v| v.as_str().unwrap_or("").len())
                .max()
                .unwrap_or(0))
            .unwrap_or(0);
        
        // Base height + extra for long content
        30 + (max_length / 50) as u32 * 10
    }).collect()
}