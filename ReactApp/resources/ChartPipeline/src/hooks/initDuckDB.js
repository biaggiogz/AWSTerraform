/**
 * Initialize DuckDB for the INSTRUMENTS REPORT tab
 * This module is imported in the main app to ensure DuckDB is enabled by default
 */

import { initializeDuckDB } from '../utils/duckdb-processor';

// Initialize DuckDB when the module is imported
const initDuckDBForInstrumentsReport = () => {
  console.log('Initializing DuckDB for INSTRUMENTS REPORT tab...');
  
  // Initialize DuckDB in the background
  initializeDuckDB()
    .then(() => {
      console.log('✅ DuckDB initialized successfully for INSTRUMENTS REPORT tab');
    })
    .catch(error => {
      console.error('❌ Failed to initialize DuckDB:', error);
    });
};

// Auto-initialize when imported
initDuckDBForInstrumentsReport();

export default { initialized: true };