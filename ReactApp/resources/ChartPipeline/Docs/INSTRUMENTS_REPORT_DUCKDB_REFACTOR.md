# Instruments Report SQL Interface DuckDB Refactor

## Overview

The SQL query interface for the "Instrument Report" tab has been refactored to use DuckDB, enabling SQL queries across all JavaScript-rendered tables in the tab. This solves the previous limitation where it was not possible to access fields from any table rendered in the tab.

## Key Components

### New Components

1. `useInstrumentsReportDuckDB.js` - A custom hook that integrates DuckDB3 with the Instruments Report tables

### Modified Components

1. `InstrumentsReportSQLPanel.js` - Updated to use the new DuckDB hook
2. `InstrumentsReportContainer.js` - Updated to support the DuckDB integration
3. `instrumentsReportQueries.js` - Updated to use the new table names

## Implementation Details

### DuckDB Integration

The refactored architecture uses DuckDB to enable SQL queries across the following tables:

- `controlInstrumentsByIsometric` (from `ControlInstrumentsByIsometric.optimized.js`)
- `detailsInstrumentsTable` (from `DetailsInstrumentsTable.superoptimized.js`)
- `dynamicInstrumentTable` (from `DynamicInstrumentsTable.optimized.js`)

### Data Flow

1. Table data is read from the rendered tables and converted into DuckDB in-memory tables
2. Users can run SQL queries on these tables using the `InstrumentsReportSQLPanel.js` component
3. When filters are applied to the tables via UI buttons, the DuckDB in-memory tables are automatically updated
4. Metric cards update based on the query results:
   - Local metrics update live when filters change
   - Global metrics remain frozen unless explicitly refreshed

### Special Case: Hierarchical Table

For the `dynamicInstrumentTable`, which supports row expansion (hierarchy), the implementation flattens the hierarchy and extracts only the top-level rows to ensure accurate query results.

## Usage Examples

Users can run SQL queries like:

```sql
SELECT SUM("TOTAL DONE") FROM dynamicInstrumentTable AS "TOTAL INST _Global"
```

### Fallback to master_subsystem

If you encounter issues with the custom tables, you can use the master_subsystem table which is provided by DuckDB3.js:

```sql
SELECT COUNT(*) AS "MASTER SUBSYSTEM COUNT _Global" FROM master_subsystem;
```

## Troubleshooting

If you encounter errors like "Table does not exist", check the following:

1. Make sure data is properly loaded in the tables
2. Check the browser console for initialization errors
3. Try refreshing the page to reinitialize the DuckDB instance
4. Use the SHOW TABLES command to see available tables

### Known Issues and Solutions

- **Invalid Input Error: No magic bytes found at end of file**: This error occurs when trying to use Parquet format with JavaScript data. The solution is to use direct SQL table creation instead of Parquet files.

- **Table creation failures**: If one table fails to create, all subsequent operations might fail. The implementation now includes better error handling and a fallback test table to verify DuckDB is working properly.

- **Parser Error: syntax error at or near "LIMIT"**: This error occurs for two reasons:
  1. When column names contain special characters like `&`, parentheses, or spaces. The implementation now normalizes column names by converting them to lowercase, replacing spaces with underscores, and removing special characters.
  2. When DuckDB automatically adds LIMIT clauses to DDL statements. The implementation now uses a custom `safeExecuteQuery` function that detects DDL statements and prevents LIMIT clauses from being added.

- **Referenced column not found**: This error occurs when the column name in the SQL query doesn't match any column in the table. The implementation now:
  1. Logs the actual column names in the table for debugging
  2. Uses table-specific column mappings to handle different naming conventions across tables:
     - In controlInstrumentsByIsometric: "TOTAL DONE" maps to "installed_by_teigatmi" + "installed_by_siemsa"
     - In dynamicInstrumentTable: "TOTAL DONE" maps to "total_installed"
     - In detailsInstrumentsTable: "TAG" maps to "tag_inst"
  3. Provides a helpful error message showing the available columns

- **Table-specific column handling**: Each table has its own column naming conventions. The implementation now uses a table-specific mapping approach to ensure queries work correctly regardless of which table is being queried.

- **Scaling issue with total_installed values**: The values in the "total_installed" column in the dynamicInstrumentTable are stored as 1000 times their actual value. The implementation now automatically scales these values in the metric card display component when the metric title contains "TOTAL DONE".

- **Scaling issue with total_installed values**: The values in the "total_installed" column in the dynamicInstrumentTable are stored as 1000 times their actual value. The implementation now divides these values by 1000 in the SQL queries to display the correct values.

## Constraints Maintained

- No changes to table layouts
- No alterations to DuckDB3.js
- Column names preserved
- Button logic and filter logic preserved