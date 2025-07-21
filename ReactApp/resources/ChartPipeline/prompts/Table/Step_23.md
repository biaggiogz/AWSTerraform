# INSTRUMENTS REPORT Tab - Complete Component Documentation

## Core Components

### Main Tables
**ControlInstrumentsTable.optimized.js**
- **Function**: Primary virtualized table displaying control instruments data from `control_inst_by_isos.csv`
- **Features**: Multi-level color-coded headers, interactive cells, progress bars, clickable buttons
- **Libraries**: @tanstack/react-table, @tanstack/react-virtual, @chakra-ui/react
- **Performance**: Handles 1000+ rows with virtualization

- **Function**: Secondary table showing detailed instrument information from `details_inst.csv`
- **Features**: Virtualized rendering, interactive mounting location cells, badge status indicators
- **Libraries**: @tanstack/react-table, @tanstack/react-virtual, @chakra-ui/react
- **Integration**: Synchronized filtering with control table

### Data Management
**useInstrumentsDataLoader.optimized.js**
- **Function**: Loads and processes dual CSV datasets in parallel
- **Data Sources**: `/data/control_inst_by_isos.csv`, `/data/details_inst.csv`
- **Libraries**: Papa Parse (CSV processing), React hooks
- **Optimization**: Parallel loading, memoized processing

**useInstrumentsFilter.js**
- **Function**: Manages multi-value filtering across both datasets
- **Features**: Cross-dataset synchronization, relationship-aware filtering
- **Libraries**: React hooks, custom filter utilities
- **Logic**: Maps ISOMETRIC to MOUNTING ON ISO/EQUI/PACK for cross-table filtering

### Interactive Filtering Components
**IsometricRelationshipFilter.optimized.js**
- **Function**: Handles isometric-based cross-dataset filtering and relationship finding
- **Algorithm**: Chain-finding algorithm to match control and detail records
- **Libraries**: React hooks, Set/Map for performance
- **Features**: Highlighted records, relationship statistics, chain selection

**TestPackRelationshipFilter.optimized.js**
- **Function**: Manages test pack filtering across datasets
- **Features**: Pipe-separated value handling ("1|2|3"), cross-table synchronization
- **Libraries**: React hooks
- **Logic**: Splits test pack strings and applies OR logic within test packs

**SubsystemRelationshipFilter.optimized.js**
- **Function**: Controls subsystem-based filtering
- **Features**: Handles SUBSYSTEM/SUSSYTEM field variations
- **Libraries**: React hooks
- **Integration**: Works with both control and details datasets

### Analysis & Calculation Tools
**DynamicCalculationPanel.js**
- **Function**: SQL query interface for real-time calculations on filtered data
- **Features**: Pre-built metric buttons, custom SQL editor, metric cards with lock/delete
- **Libraries**: @chakra-ui/react, React Icons
- **Integration**: Uses useDynamicCalculations hook for query execution

**useDynamicCalculations.js**
- **Function**: Powers SQL calculations using in-browser database
- **Features**: Table creation, filter synchronization, query execution
- **Libraries**: Custom useDuckDB hook
- **Performance**: Auto-refreshes queries when filters change

**useDuckDB.js**
- **Function**: JavaScript-based SQL engine with reactive filtering
- **Features**: SQL parsing, aggregation functions, field mapping
- **Libraries**: Pure JavaScript implementation
- **Capabilities**: COUNT, SUM, AVG, MIN, MAX, GROUP BY, WHERE clauses

### WASM Performance Optimization (Optional)
**WasmPerformanceMonitor.js**
- **Function**: Performance monitoring overlay for WASM modules
- **Features**: Real-time metrics, module status, keyboard toggle (Ctrl+Shift+W)
- **Libraries**: React hooks, CSS-in-JS
- **Integration**: Shows WASM vs JavaScript fallback status

### Main Application Integration
**App.optimized.js**
- **Function**: Main application with specialized INSTRUMENTS REPORT handling
- **Features**: Dual data loader selection, filter hook switching
- **Libraries**: React hooks, @chakra-ui/react
- **Logic**: Conditionally uses instruments-specific loaders and filters

**ChartSelector.optimized.js**
- **Function**: Tab container that renders INSTRUMENTS REPORT content
- **Features**: Lazy loading, filter status badges, triple filter integration
- **Libraries**: React.lazy, @chakra-ui/react
- **Layout**: Stacked components with filter status display

## Key Libraries Used

### UI Framework
- **@chakra-ui/react**: Complete UI component library
- **@emotion/react**: CSS-in-JS styling
- **react-icons**: Icon components

### Data Processing
- **papaparse**: CSV parsing and processing
- **@tanstack/react-table**: Advanced table functionality
- **@tanstack/react-virtual**: Virtualization for performance

### Performance
- **react-window**: List virtualization
- **Custom WASM modules**: Optional WebAssembly optimization

### State Management
- **React hooks**: useState, useEffect, useMemo, useCallback
- **Custom hooks**: Specialized data and filter management

## Key Features

### Dual Dataset Display
- Simultaneously shows control and details instruments
- Synchronized filtering across both tables
- Cross-dataset relationship highlighting

### Interactive Filtering
- **Isometric Filter**: Matches ISOMETRIC to MOUNTING ON ISO/EQUI/PACK
- **Test Pack Filter**: Handles pipe-separated values ("1|2|3")
- **Subsystem Filter**: Works across SUBSYSTEM/SUSSYTEM fields
- **Triple Filter Status**: Visual badges showing active filters

### Real-time SQL Interface
- Pre-built metric queries (Total Isos, Total at 100%, etc.)
- Custom SQL editor with schema reference
- Lockable/deletable metric cards
- Auto-refresh on filter changes

### Performance Optimizations
- **Virtualized Tables**: Handle 1000+ rows smoothly
- **Memoized Calculations**: Prevent unnecessary re-renders
- **Parallel Data Loading**: Load both datasets simultaneously
- **WASM Fallback**: Optional WebAssembly acceleration

### Visual Features
- **Multi-level Headers**: Color-coded sections with 3 header levels
- **Interactive Cells**: Clickable buttons for isometric, test pack, subsystem
- **Progress Bars**: Visual progress indicators with percentages
- **Status Badges**: Color-coded status indicators (YES/NOT)
- **Relationship Highlighting**: Yellow background for related records

## Data Flow
1. **Data Loading**: useInstrumentsDataLoader loads both CSV files
2. **Filter Application**: Triple filters (Isometric, TestPack, Subsystem) process data
3. **Table Rendering**: Virtualized tables display filtered results
4. **SQL Calculations**: DynamicCalculationPanel provides real-time metrics
5. **User Interaction**: Clicking cells updates filters and highlights relationships