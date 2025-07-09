Components in the "SUMMARY SUBSYSTEMS" Tab:

## Main Components:
- **SummarySubsystems.js** - Main container
- **SummarySubsystemsContainer.js** - Layout container with:
  - **DynamicCalculationPanel** (enhanced with filter toggle button)
  - Two draggable panels containing:
    - **SummarySubsystemsTableA** (Subsystem Overview)
    - **SummarySubsystemsTableB** (Test Pack Details)
- **SummarySubsystemsSQLInterface.js** - Alternative SQL interface
  - ReactApp/resources/ChartPipeline/Docs/COMPLETE_SQL_INTERFACE_DOCUMENTATION.md
- **SummarySubsystemsMetricCards.js** - Dedicated metric cards component

## Filter Components:
- **ProgressFilter.js** - High-performance test pack progress filter panel
  - Filters TableB data by "testPackProgress" column
  - Detached, movable window using ResizableDraggablePanel
  - **Status Legend Filters**: DONE 100%, Above 90%, 70-90%, Below 70%
  - **Color-Coded Buttons**: Each test pack button painted according to progress category
  - **Color Scheme**:
    - DONE 100%: #2F5249 (Dark green)
    - Above 90%: #437057 (Medium green)
    - 70-90%: #97B067 (Light green)
    - Below 70%: #E3DE61 (Yellow)
  - Bulk actions: Select All, Clear All, Invert
  - Individual test pack buttons with progress percentages and category colors
  - Cascades filtering from TableB to TableA through bidirectional filter
  - **Performance Optimizations**:
    - Debounced filtering (100ms) to prevent CPU spikes
    - Memoized button rendering to reduce DOM updates
    - React.memo wrapper to prevent unnecessary re-renders
    - Conditional mounting (only loads when visible)
    - Proper cleanup of timers to prevent memory leaks

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
- **Performance Optimizations**:
  - Maintains existing virtualization and performance optimizations
  - Filter component only mounts when visible (saves ~70% CPU/RAM when hidden)
  - Debounced operations prevent excessive filtering during rapid changes
  - Memoized rendering reduces unnecessary DOM manipulations
  - React Hooks compliance ensures optimal React performance
- **UI/UX**: Hide/show functionality with detached movable window
- **Resource Management**: Lightweight, on-demand component similar to WASM module loading