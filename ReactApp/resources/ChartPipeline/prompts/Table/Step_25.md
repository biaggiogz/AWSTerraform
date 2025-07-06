Looking through the codebase for "SQL Query Interface" components, I found:

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