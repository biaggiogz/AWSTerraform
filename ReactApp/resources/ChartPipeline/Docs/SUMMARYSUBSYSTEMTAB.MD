Components in the "SUMMARY SUBSYSTEMS" Tab:

## Main Components:
- **SummarySubsystems.js** - Main container
- **SummarySubsystemsContainer.js** - Layout container with:
  - **DynamicCalculationPanel** (the one we just modified)
  - Two draggable panels containing:
    - **SummarySubsystemsTableA** (Subsystem Overview)
    - **SummarySubsystemsTableB** (Test Pack Details)
- **SummarySubsystemsSQLInterface.js** - Alternative SQL interface
- **SummarySubsystemsMetricCards.js** - Dedicated metric cards component

## WASM & DuckDB Components:
- **useSummarySubsystemsData.js** - Main data hook with WASM integration
- **useDuckDB.enhanced.js** - Enhanced DuckDB with WASM SQL engine
- **wasm-loader.js** - WASM module loader with JavaScript fallbacks
- **WasmPerformanceMonitor.js** - Performance monitoring component

## WASM Modules Used:
- **subsystem-aggregator.wasm** - Aggregates subsystem statistics
- **testpack-processor.wasm** - Processes test pack data
- **stats-calculator.wasm** - Calculates performance metrics
- **sql-engine.wasm** - Accelerated SQL query execution

## Data Processing:
- Loads multiple CSV files (pipelinedata.csv, aislamientos.csv, test_of_lazos_updated.csv, subsystems_info.csv)
- Creates DuckDB tables for SQL querying
- Uses WASM acceleration for data processing when available
- Falls back to JavaScript implementations when WASM fails