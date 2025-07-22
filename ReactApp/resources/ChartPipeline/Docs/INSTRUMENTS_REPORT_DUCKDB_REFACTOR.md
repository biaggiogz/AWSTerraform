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
- `dynamicInstrumentReadingTable` (from `DynamicInstrumentsTable.optimized.js`)

### Data Flow

1. Table data is read from the rendered tables and converted into DuckDB in-memory tables
2. Users can run SQL queries on these tables using the `InstrumentsReportSQLPanel.js` component
3. When filters are applied to the tables via UI buttons, the DuckDB in-memory tables are automatically updated
4. Metric cards update based on the query results:
   - Local metrics update live when filters change
   - Global metrics remain frozen unless explicitly refreshed

### Special Case: Hierarchical Table

For the `dynamicInstrumentReadingTable`, which supports row expansion (hierarchy), the implementation flattens the hierarchy and extracts only the top-level rows to ensure accurate query results.

## Usage Examples

Users can run SQL queries like:

```sql
SELECT SUM("TOTAL DONE") FROM dynamicInstrumentReadingTable AS "TOTAL INST _Global"
```

## Constraints Maintained

- No changes to table layouts
- No alterations to DuckDB3.js
- Column names preserved
- Button logic and filter logic preserved