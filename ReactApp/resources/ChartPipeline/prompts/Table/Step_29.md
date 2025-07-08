# Request: Fix calculation in table Test Pack Details on "SUMMARY SUBSYSTEMS TRACKING" tab

## Dataset Details

### Data Sources:
- `/data/pipelinedata.csv` (main_dataset)
- `/data/test_of_lazos_updated.csv` (loop_data)

### Table Generation Mapping:
;

```sql
-- TABLE Test Pack Details
WITH pp AS (
    SELECT l.SUBS_PRE AS "SUBSYSTEM"
    FROM loop_data AS l
    UNION
    SELECT md."SUBSYSTEM"
    FROM main_dataset AS md
),

     progress AS (
         SELECT
             md."SUBSYSTEM",
             unnest(string_to_array(md."TEST PACK", '|')) AS "TP's INCLUDE",
             AVG(md."CONSTRUC COORD PROGRESS") AS "PROGRESS TEST PACK",
             MIN(TRACEADOS) AS TRACEADOS,
             MIN(PRIORITY) AS PRIORITY,
             MIN(HITO) AS HITO,
             MIN("TEIGA REINSTATEMENT") AS "TEIGA REINSTATEMENT",
             MIN("TEIGA INSULATION") AS "TEIGA INSULATION",
             MIN(SIEMSA) AS SIEMSA,
             MIN(TECHNIP) AS TECHNIP
         FROM main_dataset AS md
         GROUP BY md."SUBSYSTEM", md."TEST PACK"
     )

-- Final JOIN
SELECT
    pp.SUBSYSTEM,
    ps."TP's INCLUDE",
    ps."PROGRESS TEST PACK",
    ps.TRACEADOS,
    ps.PRIORITY,
    ps.HITO,
    ps."TEIGA REINSTATEMENT",
    ps."TEIGA INSULATION",
    ps.SIEMSA,
    ps.TECHNIP
FROM pp
         LEFT JOIN progress AS ps ON pp.SUBSYSTEM = ps.SUBSYSTEM;

````

