// Sheet processors functionality is now integrated into main.rs
// This file is kept for potential future modularization

use polars::prelude::*;
use calamine::Range;

pub struct SheetProcessor;

impl SheetProcessor {
    pub fn new() -> Self {
        Self
    }
}

impl Default for SheetProcessor {
    fn default() -> Self {
        Self::new()
    }
}