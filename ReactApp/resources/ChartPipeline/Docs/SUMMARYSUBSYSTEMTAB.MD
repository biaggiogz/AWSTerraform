Components in the "SUMMARY SUBSYSTEMS" Tab:

## Main Components:
- **SummarySubsystems.js** - Main container
  - Path: `ReactApp/resources/ChartPipeline/src/components/panels/SummarySubsystems.js`
- **SummarySubsystemsContainer.js** - Layout container with:
  - Path: `ReactApp/resources/ChartPipeline/src/components/panels/SummarySubsystemsContainer.js`
  - **DynamicCalculationPanel** (enhanced with filter toggle button)
    - Path: `ReactApp/resources/ChartPipeline/src/components/panels/DynamicCalculationPanel.js`
  - Two draggable panels containing:
    - **SummarySubsystemsTableA** (Subsystem Overview)
      - Path: `ReactApp/resources/ChartPipeline/src/components/tables/SummarySubsystemsTableA.js`
    - **SummarySubsystemsTableB** (Test Pack Details)
      - Path: `ReactApp/resources/ChartPipeline/src/components/tables/SummarySubsystemsTableB.js`
- **SummarySubsystemsSQLInterface.js** - Alternative SQL interface
  - Path: `ReactApp/resources/ChartPipeline/src/components/panels/SummarySubsystemsSQLInterface.js`
  - ReactApp/resources/ChartPipeline/Docs/COMPLETE_SQL_INTERFACE_DOCUMENTATION.md
- **SummarySubsystemsMetricCards.js** - Dedicated metric cards component
  - Path: `ReactApp/resources/ChartPipeline/src/components/ui/SummarySubsystemsMetricCards.js`

## Filter Components:
- **ProgressFilter.js** - High-performance test pack progress filter panel
  - Path: `ReactApp/resources/ChartPipeline/src/components/filters/ProgressFilter.js`
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

- **SubsystemStatusFilter.js** - High-performance subsystem status filter panel
  - Path: `ReactApp/resources/ChartPipeline/src/components/filters/SubsystemStatusFilter.js`
  - Filters TableA data by subsystem completion status
  - Detached, movable window using ResizableDraggablePanel
  - **Status Legend Filters**: Done, Pending (no progress bars)
  - **Status Calculation**: `(totalItems === doneItems) && (totalItems > 0)` = Done, else Pending
  - **Color-Coded Buttons**: Each subsystem button painted according to status
  - **Color Scheme**:
    - Done: #2F5249 (Dark green)
    - Pending: #E85C0D (Orange)
  - Bulk actions: Select All, Clear All, Invert
  - Individual subsystem buttons with unique subsystem names and status colors
  - Cascades filtering from TableA to TableB through bidirectional filter
  - **Performance Optimizations**:
    - Debounced filtering (100ms) to prevent CPU spikes
    - Memoized button rendering to reduce DOM updates
    - React.memo wrapper to prevent unnecessary re-renders
    - Conditional mounting (only loads when visible)
    - Proper cleanup of timers to prevent memory leaks

- **LoopStatusFilter.js** - High-performance loop status filter panel
  - Path: `ReactApp/resources/ChartPipeline/src/components/filters/LoopStatusFilter.js`
  - Filters TableA data by loop completion status
  - Detached, movable window using ResizableDraggablePanel
  - **Status Legend Filters**: Done, Pending (no progress bars)
  - **Loop Status Calculation**: `(totalLoops === doneLoops) && (totalLoops > 0)` = Done, else Pending
  - **Color-Coded Buttons**: Each subsystem button painted according to loop status
  - **Color Scheme**:
    - Done: #2F5249 (Dark green)
    - Pending: #E85C0D (Orange)
  - Bulk actions: Select All, Clear All, Invert
  - Individual subsystem buttons with unique subsystem names and loop status colors
  - Cascades filtering from TableA to TableB through bidirectional filter
  - **Performance Optimizations**:
    - Debounced filtering (100ms) to prevent CPU spikes
    - Memoized button rendering to reduce DOM updates
    - React.memo wrapper to prevent unnecessary re-renders
    - Conditional mounting (only loads when visible)
    - Proper cleanup of timers to prevent memory leaks

## WASM & DuckDB Components:
- **useSummarySubsystemsData.js** - Main data hook with WASM integration
  - Path: `ReactApp/resources/ChartPipeline/src/hooks/useSummarySubsystemsData.js`
- **useDuckDB.enhanced.js** - Enhanced DuckDB with WASM SQL engine
  - Path: `ReactApp/resources/ChartPipeline/src/hooks/useDuckDB.enhanced.js`
- **wasm-loader.js** - WASM module loader with JavaScript fallbacks
  - Path: `ReactApp/resources/ChartPipeline/src/wasm/wasm-loader.js`
- **WasmPerformanceMonitor.js** - Performance monitoring component
  - Path: `ReactApp/resources/ChartPipeline/src/components/ui/WasmPerformanceMonitor.js`

## WASM Modules Used:
- **sql-engine.wasm.js** - Accelerated SQL query execution
  - Path: `ReactApp/resources/ChartPipeline/src/wasm/sql-engine.wasm.js`
- **data-processor.wasm.js** - Data processing acceleration
  - Path: `ReactApp/resources/ChartPipeline/src/wasm/data-processor.wasm.js`
- **multi-filter.wasm.js** - Multi-value filtering acceleration
  - Path: `ReactApp/resources/ChartPipeline/src/wasm/multi-filter.wasm.js`
- **relationship-engine.wasm.js** - Relationship processing engine
  - Path: `ReactApp/resources/ChartPipeline/src/wasm/relationship-engine.wasm.js`
- **wasm-loader.enhanced.js** - Enhanced WASM loader
  - Path: `ReactApp/resources/ChartPipeline/src/wasm/wasm-loader.enhanced.js`

## Data Processing:
- Loads multiple CSV files (pipelinedata.csv, aislamientos.csv, test_of_lazos_updated.csv, subsystems_info.csv)
- Creates DuckDB tables for SQL querying
- Uses WASM acceleration for data processing when available
- Falls back to JavaScript implementations when WASM fails

## Filter Integration:
- **Filter Toggle Buttons**: Three small icon buttons above SQL Query Interface
  - **Progress Filter**: Filter list icon (MdFilterList) for test pack progress filtering
  - **Status Filter**: Check circle icon (MdCheckCircle) for subsystem status filtering
  - **Loop Filter**: Loop icon (MdLoop) for loop status filtering
- **Triple Filter Flows**:
  - **ProgressFilter** → TableB → TableA (through useSubsystemBidirectionalFilter)
  - **SubsystemStatusFilter** → TableA → TableB (through useSubsystemBidirectionalFilter)
  - **LoopStatusFilter** → TableA → TableB (through useSubsystemBidirectionalFilter)
- **Supporting Components**:
  - **ResizableDraggablePanel** - UI component for movable filter windows
    - Path: `ReactApp/resources/ChartPipeline/src/components/ui/ResizableDraggablePanel.js`
  - **useSubsystemBidirectionalFilter** - Hook for bidirectional filtering logic
    - Path: `ReactApp/resources/ChartPipeline/src/hooks/useSubsystemBidirectionalFilter.js`
- **Advanced Filter Chaining**: 
  - TableA filters (SubsystemStatusFilter + LoopStatusFilter) use intersection logic
  - Subsystems must pass BOTH status and loop filters to be visible
  - TableB filter (ProgressFilter) operates independently
- **State Management**: SummarySubsystemsContainer manages all three filter states independently
- **Independent Operation**: All three filters can be used simultaneously for comprehensive data filtering
- **Performance Optimizations**:
  - Maintains existing virtualization and performance optimizations
  - Filter components only mount when visible (saves ~70% CPU/RAM when hidden)
  - Debounced operations prevent excessive filtering during rapid changes
  - Memoized rendering reduces unnecessary DOM manipulations
  - React Hooks compliance ensures optimal React performance
- **UI/UX**: Hide/show functionality with detached movable windows
- **Resource Management**: Lightweight, on-demand components similar to WASM module loading