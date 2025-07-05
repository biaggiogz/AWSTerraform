the "INSTRUMENTS REPORT" tab:

Core Components
Main Tables
ControlInstrumentsTable.optimized.js - Primary virtualized table displaying control instruments data with multi-level headers

DetailsInstrumentsTable.optimized.js - Secondary table showing detailed instrument information

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

Main Application Integration
App.optimized.js - Main app with specialized handling for INSTRUMENTS REPORT mode

ChartSelector.optimized.js - Tab container that renders the INSTRUMENTS REPORT tab content

Shared Utilities
FilterPanel.optimized.js - Left sidebar filter panel

useMultiValueFilter.js - Multi-value filtering logic

dataProcessor.optimized.js - CSV data processing utilities

multiValueFilter.js - Filter utility functions

Key Features of INSTRUMENTS REPORT Tab
Dual Dataset Display - Shows both control and details instruments data

Cross-Dataset Filtering - Filters work across both tables simultaneously

Interactive Cells - Clickable isometric, test pack, and subsystem buttons

Real-time SQL Queries - Dynamic calculation panel with pre-built metrics

Multi-level Headers - Complex table headers with color-coded sections

Virtualized Tables - High-performance rendering for large datasets

Relationship Highlighting - Visual connections between related records