# Dynamic Instrument Table Query Structure

## Overview

This document explains the correct query structure for accessing the Dynamic Instrument Table data in the INSTRUMENTS REPORT SQL interface.

## Important Note

The `dynamicInstrumentTable` is not a direct table in DuckDB. Instead, it's created dynamically from the `master_subsystem` table using a complex query with Common Table Expressions (CTEs).

## Correct Query Structure

To query the Dynamic Instrument Table data, you must use the following structure:

```sql
WITH inst_data AS (
  SELECT 
    mounting_on_isoequipack_isoinst AS isometric,
    MAX(subsystem) AS subsystem,
    MAX(tp_include_isoinst) AS tps,
    MAX(progress_ac_tp_1) AS progress_ac_tp_1,
    MAX(progress_ac_tp_2) AS progress_ac_tp_2,
    MAX(progress_ac_tp_3) AS progress_ac_tp_3,
    COUNT(tag_inst_isoinst) AS qty_inst,
    COUNT(scope__by_isoinst) FILTER(WHERE scope__by_isoinst = 'TEIGA-TMI') AS scope_teiga_tmi,
    COUNT(scope__by_isoinst) FILTER(WHERE scope__by_isoinst = 'SIEMSA') AS scope_siemsa,
    COUNT(scope__by_isoinst) FILTER(WHERE scope__by_isoinst = 'TEIGA-TMI' AND ok100_isoinst = 1) AS installed_teiga_tmi,
    COUNT(scope__by_isoinst) FILTER(WHERE scope__by_isoinst = 'SIEMSA' AND ok100_isoinst = 1) AS installed_siemsa
  FROM master_subsystem
  WHERE on_isoinst = 'PIP'
  GROUP BY mounting_on_isoequipack_isoinst
),
progress_data AS (
  SELECT
    isometricos_ifc3_isos AS isometric,
    isometric__progress__isos AS isometric_progress,
    hito_isos AS hito
  FROM master_subsystem
  WHERE isometricos_ifc3_isos IS NOT NULL
),
exploded_tps AS (
  SELECT
    i.isometric,
    i.subsystem,
    p.hito,
    UNNEST(string_to_array(i.tps, '|')) AS tp,
    CASE idx
      WHEN 1 THEN i.progress_ac_tp_1
      WHEN 2 THEN i.progress_ac_tp_2
      WHEN 3 THEN i.progress_ac_tp_3
    END AS progress,
    i.qty_inst,
    i.scope_teiga_tmi,
    i.scope_siemsa,
    i.installed_teiga_tmi,
    i.installed_siemsa,
    (i.qty_inst - i.installed_teiga_tmi - i.installed_siemsa) AS pending
  FROM (
    SELECT *,
    generate_subscripts(string_to_array(tps, '|'), 1) AS idx
    FROM inst_data
  ) i
  LEFT JOIN progress_data p ON i.isometric = p.isometric
),
dynamic_table AS (
  SELECT 
    subsystem AS "SUBSYSTEM",
    hito AS "HITO",
    tp AS "TP",
    SUM(qty_inst) AS "TOTAL INST",
    SUM(installed_teiga_tmi) AS "INSTALLED BY TEIGA-TMI",
    SUM(installed_siemsa) AS "INSTALLED BY SIEMSA",
    SUM(pending) AS "PENDING",
    CASE 
      WHEN ABS(SUM(qty_inst) - SUM(installed_teiga_tmi) - SUM(installed_siemsa)) < 0.01 AND SUM(qty_inst) > 0 
      THEN SUM(qty_inst) 
      ELSE 0 
    END AS "DONE",
    MAX(progress) AS "PROGRESS TP"
  FROM exploded_tps
  GROUP BY subsystem, hito, tp
)
SELECT * FROM dynamic_table;
```

## Available Columns

After creating the dynamic_table CTE, the following columns are available:

- `"SUBSYSTEM"` - Subsystem identifier
- `"HITO"` - Hito identifier
- `"TP"` - Test pack identifier
- `"TOTAL INST"` - Total instruments
- `"INSTALLED BY TEIGA-TMI"` - Instruments installed by TEIGA-TMI
- `"INSTALLED BY SIEMSA"` - Instruments installed by SIEMSA
- `"PENDING"` - Pending instruments
- `"DONE"` - Completed instruments
- `"PROGRESS TP"` - Test pack progress

## Example Queries

```sql
-- Get total instruments
WITH inst_data AS (...),
progress_data AS (...),
exploded_tps AS (...),
dynamic_table AS (...)
SELECT SUM("TOTAL INST") AS "TOTAL INST _Global"
FROM dynamic_table;

-- Get total done instruments
WITH inst_data AS (...),
progress_data AS (...),
exploded_tps AS (...),
dynamic_table AS (...)
SELECT SUM("DONE") AS "DONE _Global"
FROM dynamic_table;
```

## Error Resolution

If you encounter an error like:

```
Binder Error: Referenced column "total_inst" not found in FROM clause!
```

Make sure you're using the correct query structure with all the CTEs as shown above, and that you're referencing the column names with the correct case (e.g., "TOTAL INST" not "total_inst").