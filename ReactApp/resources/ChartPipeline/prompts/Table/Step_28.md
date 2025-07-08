# Request: Fix calculation in tables  Subsystem Overview on "SUMMARY SUBSYSTEMS TRACKING" tab

## Dataset Details

### Data Sources:
- `/data/pipelinedata.csv` (main_dataset)
- `/data/aislamientos.csv` (insulation)
- `/data/test_of_lazos_updated.csv` (loop_data)
- `/data/subsystems_info.csv` (subsystem_metadata)

### Table Generation Mapping:
;

```sql
-- TABLE Subsystem Overview
WITH pp AS (
    SELECT DISTINCT l.SUBS_PRE AS "SUBSYSTEM"
    FROM loop_data AS l
    UNION
    SELECT DISTINCT md."SUBSYSTEM"
    FROM main_dataset AS md
),

     metadata AS (
         SELECT
             s.SUBSYSTEM,
             split_part(s.SUBSYSTEM, '-', 1) AS FLUID,
             s.DESCRIPTION
         FROM subsystem_metadata AS s
     ),

     insulation_data AS (
         SELECT
             i.SUBSYSTEM,
             COUNT(i.ISO) AS TOTAL_ITEMS,
             SUM(CASE WHEN i.DONE = 'YES' THEN 1 ELSE 0 END) AS DONE_ITEMS,
             COUNT(i.ISO) - SUM(CASE WHEN i.DONE = 'YES' THEN 1 ELSE 0 END) AS PENDING_ITEMS
         FROM insulation AS i
         GROUP BY i.SUBSYSTEM
     ),

     loop_data_summary AS (
         SELECT
             l.SUBS_PRE AS SUBSYSTEM,
             COUNT("TAG LOOP") AS TOTAL_LOOP,
             COUNT(*) FILTER (WHERE "OK=100%" = '100.00%') AS LOOP_DONE,
             COUNT(*) FILTER (WHERE "OK=100%" != '100.00%') AS LOOP_PENDING
         FROM loop_data AS l
         GROUP BY l.SUBS_PRE
     ),

     test_pack_data AS (
         SELECT
             md.SUBSYSTEM,
             md."S/N",
             unnest(string_to_array(md."TEST PACK", '|')) AS TEST_PACK
         FROM main_dataset AS md
     ),

     test_pack_count AS (
         SELECT 
             SUBSYSTEM, 
             MIN("S/N") AS "S/N",
             COUNT(TEST_PACK) AS "N°TP"
         FROM test_pack_data
         GROUP BY SUBSYSTEM
     )

-- Final JOIN
SELECT
    tp."S/N",
    pp.SUBSYSTEM,
    m.FLUID,
    ins.TOTAL_ITEMS,
    ins.DONE_ITEMS,
    ins.PENDING_ITEMS,
    m.DESCRIPTION,
    tp."N°TP",
    loop.TOTAL_LOOP,
    loop.LOOP_DONE,
    loop.LOOP_PENDING
FROM pp
         LEFT JOIN metadata AS m ON pp.SUBSYSTEM = m.SUBSYSTEM
         LEFT JOIN insulation_data AS ins ON pp.SUBSYSTEM = ins.SUBSYSTEM
         LEFT JOIN loop_data_summary AS loop ON pp.SUBSYSTEM = loop.SUBSYSTEM
         LEFT JOIN test_pack_count AS tp ON pp.SUBSYSTEM = tp.SUBSYSTEM;

````

