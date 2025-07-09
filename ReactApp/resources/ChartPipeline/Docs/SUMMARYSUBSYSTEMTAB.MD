Components in the "SUMMARY SUBSYSTEMS" Tab:

## Main Components:
- **SummarySubsystems.js** - Main container
- **SummarySubsystemsContainer.js** - Layout container with:
  - **DynamicCalculationPanel** (enhanced with filter toggle button)
  - Two draggable panels containing:
    - **SummarySubsystemsTableA** (Subsystem Overview)
    - **SummarySubsystemsTableB** (Test Pack Details)
- **SummarySubsystemsSQLInterface.js** - Alternative SQL interface
- **SummarySubsystemsMetricCards.js** - Dedicated metric cards component

## Filter Components:
- **ProgressFilter.js** - Comprehensive test pack progress filter panel
  - Filters TableB data by "testPackProgress" column
  - Detached, movable window using ResizableDraggablePanel
  - Status legend filters: Above 90%, 70-90%, Below 70%
  - Bulk actions: Select All, Clear All, Invert
  - Individual test pack buttons with progress percentages
  - Cascades filtering from TableB to TableA through bidirectional filter

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

## Filter Integration:
- **Filter Toggle**: Small filter icon button above SQL Query Interface
- **Filter Flow**: ProgressFilter → TableB → TableA (through useSubsystemBidirectionalFilter)
- **State Management**: SummarySubsystemsContainer manages progress filter state
- **Performance**: Maintains existing virtualization and performance optimizations
- **UI/UX**: Hide/show functionality with detached movable window