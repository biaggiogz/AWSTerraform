use polars::prelude::*;
use calamine::Range;

pub struct SheetProcessor;

impl SheetProcessor {
    pub fn new() -> Self {
        Self
    }

    pub fn process_sheet(&self, range: &Range<calamine::Data>, sheet_name: &str) -> Result<Option<DataFrame>, PolarsError> {
        match sheet_name {
            "TEST_LOOP" => self.process_test_loop_sheet(range),
            "TP" => self.process_tp_sheet(range),
            "general" => self.process_general_sheet(range),
            "Subsystems" => self.process_subsystems_sheet(range),
            "ISOS" => self.process_isos_sheet(range),
            "Tuberia" => self.process_insulation_sheet(range),
            "TRAC_SIEMSA" => self.process_tracing_sheet(range),
            "FIELD_CONTROL" => self.process_field_control_sheet(range),
            "ISO_INST" => self.process_iso_inst_sheet(range),
            "Punch_List" => self.process_punch_list_sheet(range),
            _ => self.process_default_sheet(range),
        }
    }

    fn process_test_loop_sheet(&self, range: &Range<calamine::Data>) -> Result<Option<DataFrame>, PolarsError> {
        // Skip 11 rows, use cols B:V (1-21)
        let df = self.range_to_dataframe(range, 11, Some((1, 21)))?;
        Ok(Some(df))
    }

    fn process_tp_sheet(&self, range: &Range<calamine::Data>) -> Result<Option<DataFrame>, PolarsError> {
        // Skip 4 rows, use cols B:AS (1-44)
        let df = self.range_to_dataframe(range, 4, Some((1, 44)))?;
        Ok(Some(df))
    }

    fn process_general_sheet(&self, range: &Range<calamine::Data>) -> Result<Option<DataFrame>, PolarsError> {
        // Skip 3 rows, use all columns
        let df = self.range_to_dataframe(range, 3, None)?;
        Ok(Some(df))
    }

    fn process_subsystems_sheet(&self, range: &Range<calamine::Data>) -> Result<Option<DataFrame>, PolarsError> {
        // Use all rows and columns
        let df = self.range_to_dataframe(range, 0, None)?;
        Ok(Some(df))
    }

    fn process_isos_sheet(&self, range: &Range<calamine::Data>) -> Result<Option<DataFrame>, PolarsError> {
        // Skip 1 row, use cols A:AL (0-37)
        let df = self.range_to_dataframe(range, 1, Some((0, 37)))?;
        Ok(Some(df))
    }

    fn process_insulation_sheet(&self, range: &Range<calamine::Data>) -> Result<Option<DataFrame>, PolarsError> {
        // Skip 8 rows, use cols A:BC (0-54)
        let df = self.range_to_dataframe(range, 8, Some((0, 54)))?;
        Ok(Some(df))
    }

    fn process_tracing_sheet(&self, range: &Range<calamine::Data>) -> Result<Option<DataFrame>, PolarsError> {
        // Skip 7 rows, use cols B:AG (1-32)
        let df = self.range_to_dataframe(range, 7, Some((1, 32)))?;
        Ok(Some(df))
    }

    fn process_field_control_sheet(&self, range: &Range<calamine::Data>) -> Result<Option<DataFrame>, PolarsError> {
        // Skip 4 rows, use cols A:BJ (0-61)
        let df = self.range_to_dataframe(range, 4, Some((0, 61)))?;
        Ok(Some(df))
    }

    fn process_iso_inst_sheet(&self, range: &Range<calamine::Data>) -> Result<Option<DataFrame>, PolarsError> {
        // Skip 4 rows, use cols A:AJ (0-35)
        let df = self.range_to_dataframe(range, 4, Some((0, 35)))?;
        Ok(Some(df))
    }

    fn process_punch_list_sheet(&self, range: &Range<calamine::Data>) -> Result<Option<DataFrame>, PolarsError> {
        // Skip 5 rows, use cols B:W (1-22)
        let df = self.range_to_dataframe(range, 5, Some((1, 22)))?;
        Ok(Some(df))
    }

    fn process_default_sheet(&self, range: &Range<calamine::Data>) -> Result<Option<DataFrame>, PolarsError> {
        // Use all rows and columns
        let df = self.range_to_dataframe(range, 0, None)?;
        Ok(Some(df))
    }

    fn range_to_dataframe(
        &self,
        range: &Range<calamine::Data>,
        skip_rows: usize,
        col_range: Option<(usize, usize)>,
    ) -> Result<DataFrame, PolarsError> {
        let height = range.height();
        let width = range.width();
        let (start_col, end_col) = col_range.unwrap_or((0, width));
        
        if skip_rows >= height || start_col >= end_col {
            return Err(PolarsError::ComputeError("Invalid range".into()));
        }
        
        // Extract headers and handle duplicates
        let mut headers = Vec::new();
        let mut header_counts = std::collections::HashMap::new();
        
        for col in start_col..end_col.min(width) {
            let mut header = range.get_value((skip_rows as u32, col as u32))
                .map(|v| format!("{}", v))
                .unwrap_or_else(|| format!("col_{}", col));
            
            // Handle empty headers
            if header.trim().is_empty() {
                header = format!("col_{}", col);
            }
            
            // Handle duplicate headers
            let count = header_counts.entry(header.clone()).or_insert(0);
            *count += 1;
            
            if *count > 1 {
                header = format!("{}_{}", header, *count - 1);
            }
            
            headers.push(header);
        }
        
        // Extract data
        let mut columns: Vec<Vec<String>> = vec![Vec::new(); headers.len()];
        
        for row in (skip_rows + 1)..height {
            for (col_idx, col) in (start_col..end_col.min(width)).enumerate() {
                let value = range.get_value((row as u32, col as u32))
                    .map(|v| format!("{}", v))
                    .unwrap_or_else(|| String::new());
                columns[col_idx].push(value);
            }
        }
        
        // Create DataFrame
        let mut df_columns = Vec::new();
        for (i, header) in headers.iter().enumerate() {
            let series = Series::new(header.as_str().into(), &columns[i]);
            df_columns.push(series.into());
        }
        
        DataFrame::new(df_columns)
    }
}

impl Default for SheetProcessor {
    fn default() -> Self {
        Self::new()
    }
}