## Looking through the codebase for "SQL Query Interface" components, I found:

Main SQL Query Interface Component
src/components/DynamicCalculationPanel.js - The primary SQL interface component with:

SQL query textarea

Execute button

Results display as metric cards

Quick metric buttons

Schema reference display

Supporting Hooks
src/hooks/useDynamicCalculations.js - Manages SQL execution and table initialization

src/hooks/useDuckDB.js - Core SQL engine with JavaScript-based query parsing and execution

src/hooks/useDuckDB.wasm.js - WASM-enhanced version with fallback

Integration Point
The SQL Query Interface is integrated into the INSTRUMENTS REPORT tab via src/components/ChartSelector.optimized.js where DynamicCalculationPanel is rendered below the instrument tables.

Key Features
Real-time SQL queries on filtered instrument data

Pre-built quick metric buttons

Automatic filter integration (Isometric, TestPack, Subsystem)

Table schema display with row counts

Metric card results display

The interface operates on two main tables: "Control Instruments" and "Details Instruments" with automatic synchronization to active filters.

## All the components that are part of or present in the "INSTRUMENTS REPORT" tab in ReactApp/resources/ChartPipeline/src:

Core Components
Main Application Integration
App.optimized.js - Main app with specialized handling for INSTRUMENTS REPORT mode

ChartSelector.optimized.js - Tab container that renders the INSTRUMENTS REPORT tab content


Main Tables
ControlInstrumentsTable.optimized.js - Primary virtualized table displaying control instruments data with multi-level headers

DetailsInstrumentsTable.optimized.old.js - Secondary table showing detailed instrument information

Data Management
useInstrumentsDataLoader.optimized.js - Loads control_inst_by_isos.csv and details_inst.csv datasets

useInstrumentsFilter.js - Manages multi-value filtering for instruments data

Interactive Filtering Components
IsometricRelationshipFilter.optimized.js - Handles isometric-based cross-dataset filtering

TestPackRelationshipFilter.optimized.js - Manages test pack filtering across datasets

SubsystemRelationshipFilter.optimized.js - Controls subsystem-based filtering

Analysis & Calculation Tools
DynamicCalculationPanel.js - SQL query interface for real-time calculations

IsometricRelationshipPanel.optimized.js - Visual relationship status panel (currently hidden)

useDynamicCalculations.js - Powers SQL calculations using DuckDB

useDuckDB.js - Database interface for in-browser SQL queries

Shared Utilities
FilterPanel.optimized.js - Left sidebar filter panel

useMultiValueFilter.js - Multi-value filtering logic

dataProcessor.optimized.js - CSV data processing utilities

multiValueFilter.js - Filter utility functions

WASM Performance Components
WasmPerformanceMonitor.js - Performance monitoring overlay

wasm-loader.js - WASM module loader with fallbacks

WASM Optimization Modules
IsometricRelationshipFilter.wasm.js - WASM-optimized relationship filtering

useDuckDB.wasm.js - WASM-optimized SQL engine

dataProcessor.wasm.js - WASM-optimized data processing

multiValueFilter.wasm.js - WASM-optimized filtering

WASM Module Files
data-processor.wasm.js - Data processing WASM module

multi-filter.wasm.js - Multi-value filtering WASM module

relationship-engine.wasm.js - Relationship engine WASM module

sql-engine.wasm.js - SQL engine WASM module

Key Features of INSTRUMENTS REPORT Tab
Dual Dataset Display - Shows both control and details instruments data

Cross-Dataset Filtering - Filters work across both tables simultaneously

Interactive Cells - Clickable isometric, test pack, and subsystem buttons

Real-time SQL Queries - Dynamic calculation panel with pre-built metrics

Multi-level Headers - Complex table headers with color-coded sections

Virtualized Tables - High-performance rendering for large datasets

Relationship Highlighting - Visual connections between related records

WASM Performance Optimization - WebAssembly modules for computational-heavy operations