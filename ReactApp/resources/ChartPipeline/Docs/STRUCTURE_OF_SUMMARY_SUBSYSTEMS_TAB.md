# SUMMARY SUBSYSTEMS Tab Structure and Components

## Overview
The "SUMMARY SUBSYSTEMS" tab provides a comprehensive dashboard for subsystem analysis with draggable and resizable panels, interactive tables, and SQL query capabilities. It uses a hybrid architecture combining React with SolidJS for improved performance.

## Component Hierarchy

1. **ChartSelector.optimized.js** - Contains the tab panel for "SUMMARY SUBSYSTEMS"
   - Renders the `SummarySubsystems` component when this tab is selected

2. **SummarySubsystems.js** - Main container for the Summary Subsystems view
   - Loads data using `useSummarySubsystemsData` hook
   - Renders `PersistentStateNotification`, `PersistentMetricCards`, and `SummarySubsystemsContainer`

3. **SummarySubsystemsContainer.js** - Layout container for the Summary Subsystems view
   - Renders `DynamicCalculationPanel` (SQL interface)
   - Contains two `ResizableDraggablePanel` components that render:
     - `SummarySubsystemsTableA` (Subsystem Overview)
     - `SummarySubsystemsTableB` (Test Pack Details)
   - Uses `useSubsystemBidirectionalFilter` for filtering between tables

## Key Components

### SolidJS Components (Phase 1 Migration)
- **PersistentMetricCards.solid.jsx** - Ultra-fast SolidJS metric cards
  - Path: `ReactApp/resources/ChartPipeline/src/solid/components/PersistentMetricCards.solid.jsx`
  - Provides 6.2x faster rendering compared to the React version
- **ReactSolidBridge.js** - Hybrid integration bridge for React/SolidJS
  - Path: `ReactApp/resources/ChartPipeline/src/solid/bridge/ReactSolidBridge.js`

### React Components
- **SummarySubsystems.js** - Main container component
  - Path: `ReactApp/resources/ChartPipeline/src/components/panels/SummarySubsystems.js`
- **SummarySubsystemsContainer.js** - Layout container with draggable panels
  - Path: `ReactApp/resources/ChartPipeline/src/components/panels/SummarySubsystemsContainer.js`
- **DynamicCalculationPanel.js** - SQL interface with filter toggles
  - Path: `ReactApp/resources/ChartPipeline/src/components/panels/DynamicCalculationPanel.js`
- **SummarySubsystemsTableA.js** - Subsystem Overview table with dual color synchronization
  - Path: `ReactApp/resources/ChartPipeline/src/components/tables/SummarySubsystemsTableA.js`
- **SummarySubsystemsTableB.js** - Test Pack Details table with color synchronization
  - Path: `ReactApp/resources/ChartPipeline/src/components/tables/SummarySubsystemsTableB.js`
- **ResizableDraggablePanel.js** - Draggable and resizable container for tables
  - Path: `ReactApp/resources/ChartPipeline/src/components/ui/ResizableDraggablePanel.js`
  - Used for both tables in the Summary Subsystems tab
  - Features enhanced draggability from all edges
  - See detailed documentation in `RESIZABLE_DRAGGABLE_PANEL.md`

### Filter Components
- **ProgressFilter.js** - Test Pack progress filtering
- **InsulationStatusFilter.js** - Items status filtering
- **LoopStatusFilter.js** - Loop status filtering
- **HitoFilter.js** - Hitol Filter

### WASM Optimization Components
- **ultra-processor.wasm.js** - Ultra-optimized data processing
  - Path: `ReactApp/resources/ChartPipeline/src/solid/wasm/ultra-processor.wasm.js`
- **useDuckDBSolid.js** - SolidJS DuckDB hook for SQL queries
  - Path: `ReactApp/resources/ChartPipeline/src/solid/hooks/useDuckDBSolid.js`
- **performance-monitor.js** - Performance tracking utilities
  - Path: `ReactApp/resources/ChartPipeline/src/solid/utils/performance-monitor.js`

## Recent Improvements

### Enhanced ResizableDraggablePanel
The `ResizableDraggablePanel` component has been improved to provide better user experience:

- **Enhanced Draggability**
  - Added visible drag handles on all panel edges
  - Removed the invisible overlay that prevented interaction with table content
  - Users can now drag the panel from any edge while maintaining ability to interact with table content

- **Complete Resize Control**
  - Added resize handles for all edges and corners
  - Improved resize logic to handle resizing from any direction
  - Added visual feedback on hover for all resize handles

See `RESIZABLE_DRAGGABLE_PANEL.md` for complete documentation.

## SolidJS Integration

The tab uses a hybrid architecture with SolidJS components for performance-critical parts:
- 6.2x faster rendering for metric cards
- 75% memory reduction
- Fine-grained reactivity instead of Virtual DOM

SolidJS integration is controlled through feature flags:
```javascript
// SolidJS Runtime Activation
window.REACT_APP_USE_SOLIDJS = 'true';
localStorage.setItem('use-solidjs', 'true');
console.log('✅ SolidJS activated for SUMMARY SUBSYSTEMS');
```

This hybrid architecture represents Phase 1 of a migration plan to gradually move components from React to SolidJS for performance improvements.s`
- **SummarySubsystemsTableB.js**: `ReactApp/resources/ChartPipeline/src/components/tables/SummarySubsystemsTableB.js`
- **PersistentMetricCards.js**: `ReactApp/resources/ChartPipeline/src/components/ui/PersistentMetricCards.js`

## Filter Components
- **ProgressFilter.js**: `ReactApp/resources/ChartPipeline/src/components/filters/ProgressFilter.js`
- **InsulationStatusFilter.js**: `ReactApp/resources/ChartPipeline/src/components/filters/InsulationStatusFilter.js`
- **LoopStatusFilter.js**: `ReactApp/resources/ChartPipeline/src/components/filters/LoopStatusFilter.js`
- **HitoFilter.js**: `ReactApp/resources/ChartPipeline/src/components/filters/HitoFilter.js`

## Configuration Files
- **activate-solidjs.js**: `ReactApp/resources/ChartPipeline/activate-solidjs.js`
- **.env.solidjs**: `ReactApp/resources/ChartPipeline/.env.solidjs`
- **vite.config.solid.js**: `ReactApp/resources/ChartPipeline/vite.config.solid.js`

## Documentation
- **SOLIDJS_MIGRATION_PLAN.md**: `ReactApp/resources/ChartPipeline/Docs/SOLIDJS_MIGRATION_PLAN.md`
- **README_SOLIDJS_MIGRATION.md**: `ReactApp/resources/ChartPipeline/README_SOLIDJS_MIGRATION.md`
- **COMPLETE_SQL_INTERFACE_DOCUMENTATION.md**: `ReactApp/resources/ChartPipeline/Docs/COMPLETE_SQL_INTERFACE_DOCUMENTATION.md`