# Dynamic Instrument Table Column Names

## Overview

This document provides information about the column names for the `dynamicInstrumentTable` in the INSTRUMENTS REPORT SQL interface.

## Available Columns

The `dynamicInstrumentTable` has the following columns available for SQL queries:

- `"SUBSYSTEM"` - Subsystem identifier
- `"HITO"` - Hito identifier
- `"TP"` - Test pack identifier
- `"TOTAL INST"` - Total instruments
- `"INSTALLED BY TEIGA-TMI"` - Instruments installed by TEIGA-TMI
- `"INSTALLED BY SIEMSA"` - Instruments installed by SIEMSA
- `"PENDING"` - Pending instruments
- `"DONE"` - Completed instruments
- `"PROGRESS TP"` - Test pack progress

## Common Query Patterns

When querying the `dynamicInstrumentTable`, use the following patterns:

```sql
-- For total instruments
SELECT SUM("TOTAL INST") AS "TOTAL INST _Global"
FROM dynamicInstrumentTable;

-- For installed by TEIGA-TMI
SELECT SUM("INSTALLED BY TEIGA-TMI") AS "INSTALLED BY TEIGA-TMI _Global"
FROM dynamicInstrumentTable;

-- For installed by SIEMSA
SELECT SUM("INSTALLED BY SIEMSA") AS "INSTALLED BY SIEMSA _Global"
FROM dynamicInstrumentTable;

-- For pending instruments
SELECT SUM("PENDING") AS "PENDING _Global"
FROM dynamicInstrumentTable;

-- For completed instruments
SELECT SUM("DONE") AS "DONE _Global"
FROM dynamicInstrumentTable;
```

## Important Notes

1. Column names are case-sensitive and must be enclosed in double quotes.
2. The column names match exactly with what's displayed in the Dynamic Instruments Table component.
3. Use the exact column names as shown above to avoid errors.

## Error Resolution

If you encounter an error like:

```
Binder Error: Referenced column "total_inst" not found in FROM clause!
```

Make sure you're using the correct case for the column name. For example, use `"TOTAL INST"` (uppercase) instead of `"total_inst"` (lowercase).