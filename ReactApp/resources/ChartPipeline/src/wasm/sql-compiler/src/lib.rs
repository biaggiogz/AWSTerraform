use wasm_bindgen::prelude::*;
use serde::{Deserialize, Serialize};
use sha2::{Sha256, Digest};
use regex::Regex;
use std::collections::HashMap;
use once_cell::sync::Lazy;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

macro_rules! console_log {
    ($($t:tt)*) => (log(&format_args!($($t)*).to_string()))
}

#[derive(Serialize, Deserialize, Clone)]
pub struct CompiledQuery {
    pub hash: String,
    pub optimized_sql: String,
    pub parameters: Vec<String>,
    pub cache_key: String,
    pub estimated_cost: u32,
}

#[derive(Serialize, Deserialize)]
pub struct QueryTemplate {
    pub name: String,
    pub base_query: String,
    pub parameters: Vec<String>,
    pub optimization_hints: Vec<String>,
}

static QUERY_CACHE: Lazy<std::sync::Mutex<HashMap<String, CompiledQuery>>> = 
    Lazy::new(|| std::sync::Mutex::new(HashMap::new()));

#[wasm_bindgen]
pub struct SqlCompiler {
    templates: HashMap<String, QueryTemplate>,
}

#[wasm_bindgen]
impl SqlCompiler {
    #[wasm_bindgen(constructor)]
    pub fn new() -> SqlCompiler {
        console_log!("Initializing SQL Compiler");
        SqlCompiler {
            templates: HashMap::new(),
        }
    }

    #[wasm_bindgen]
    pub fn register_query_template(&mut self, name: &str, template_json: &str) -> Result<(), JsValue> {
        let template: QueryTemplate = serde_json::from_str(template_json)
            .map_err(|e| JsValue::from_str(&format!("Failed to parse template: {}", e)))?;
        
        self.templates.insert(name.to_string(), template);
        console_log!("Registered query template: {}", name);
        Ok(())
    }

    #[wasm_bindgen]
    pub fn compile_query(&self, template_name: &str, where_clause: &str) -> Result<String, JsValue> {
        let template = self.templates.get(template_name)
            .ok_or_else(|| JsValue::from_str("Template not found"))?;

        let query_hash = self.generate_query_hash(template_name, where_clause);
        
        if let Ok(cache) = QUERY_CACHE.lock() {
            if let Some(cached) = cache.get(&query_hash) {
                return Ok(serde_json::to_string(cached).unwrap());
            }
        }

        let optimized_query = self.optimize_query(&template.base_query, where_clause)?;
        let compiled = CompiledQuery {
            hash: query_hash.clone(),
            optimized_sql: optimized_query,
            parameters: template.parameters.clone(),
            cache_key: format!("{}_{}", template_name, &query_hash[..8]),
            estimated_cost: self.estimate_query_cost(&template.base_query),
        };

        if let Ok(mut cache) = QUERY_CACHE.lock() {
            cache.insert(query_hash, compiled.clone());
        }

        Ok(serde_json::to_string(&compiled).unwrap())
    }

    fn optimize_query(&self, base_query: &str, where_clause: &str) -> Result<String, JsValue> {
        let mut optimized = base_query.to_string();

        if !where_clause.is_empty() {
            optimized = self.inject_where_clause(&optimized, where_clause);
        }

        optimized = self.optimize_joins(&optimized);
        optimized = self.optimize_aggregations(&optimized);
        optimized = self.add_query_hints(&optimized);

        Ok(optimized)
    }

    fn inject_where_clause(&self, query: &str, where_clause: &str) -> String {
        let where_pattern = Regex::new(r"WHERE\s+(.+?)(\s+GROUP\s+BY|\s+ORDER\s+BY|\s+LIMIT|$)").unwrap();
        
        if where_pattern.is_match(query) {
            where_pattern.replace(query, |caps: &regex::Captures| {
                format!("WHERE {} AND {} {}", &caps[1], &where_clause[6..], &caps[2])
            }).to_string()
        } else {
            let group_pattern = Regex::new(r"(\s+GROUP\s+BY)").unwrap();
            if group_pattern.is_match(query) {
                group_pattern.replace(query, &format!(" {} $1", where_clause)).to_string()
            } else {
                format!("{} {}", query, where_clause)
            }
        }
    }

    fn optimize_joins(&self, query: &str) -> String {
        let join_pattern = Regex::new(r"LEFT\s+JOIN\s+(\w+)\s+(\w+)\s+ON\s+(.+?)(?=\s+(?:LEFT\s+JOIN|WHERE|GROUP\s+BY|ORDER\s+BY|$))").unwrap();
        
        join_pattern.replace_all(query, |caps: &regex::Captures| {
            format!("LEFT JOIN {} {} ON {} /* optimized */", &caps[1], &caps[2], &caps[3])
        }).to_string()
    }

    fn optimize_aggregations(&self, query: &str) -> String {
        let count_pattern = Regex::new(r"COUNT\(([^)]+)\)\s+FILTER\s*\(\s*WHERE\s+([^)]+)\)").unwrap();
        
        count_pattern.replace_all(query, |caps: &regex::Captures| {
            format!("COUNT({}) FILTER(WHERE {}) /* optimized filter */", &caps[1], &caps[2])
        }).to_string()
    }

    fn add_query_hints(&self, query: &str) -> String {
        if query.contains("GROUP BY") {
            format!("PRAGMA enable_optimizer=true;\n{}", query)
        } else {
            query.to_string()
        }
    }

    fn estimate_query_cost(&self, query: &str) -> u32 {
        let mut cost = 100;
        
        if query.contains("JOIN") { cost += 50; }
        if query.contains("GROUP BY") { cost += 30; }
        if query.contains("ORDER BY") { cost += 20; }
        if query.contains("FILTER") { cost += 15; }
        
        let subquery_count = query.matches("WITH").count() + query.matches("SELECT").count() - 1;
        cost += (subquery_count as u32) * 25;
        
        cost
    }

    fn generate_query_hash(&self, template_name: &str, where_clause: &str) -> String {
        let mut hasher = Sha256::new();
        hasher.update(template_name.as_bytes());
        hasher.update(where_clause.as_bytes());
        format!("{:x}", hasher.finalize())[..16].to_string()
    }

    #[wasm_bindgen]
    pub fn invalidate_cache(&self, pattern: &str) -> u32 {
        if let Ok(mut cache) = QUERY_CACHE.lock() {
            let initial_size = cache.len();
            cache.retain(|key, _| !key.contains(pattern));
            (initial_size - cache.len()) as u32
        } else {
            0
        }
    }

    #[wasm_bindgen]
    pub fn get_cache_stats(&self) -> String {
        if let Ok(cache) = QUERY_CACHE.lock() {
            serde_json::json!({
                "total_queries": cache.len(),
                "memory_usage": cache.len() * 1024,
            }).to_string()
        } else {
            "{}".to_string()
        }
    }
}

#[wasm_bindgen]
pub fn init_sql_compiler() {
    console_log!("SQL Compiler WASM module initialized");
}