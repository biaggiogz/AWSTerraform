REQUEST: CREATE A newdataset FROM SQL SENTENCE using SQL SENTENCES

- Folder TARGET: data
- name new datset: summarysubsytems.csv
- script to use for generate new dataset: etl/transform_polars.js

### DATASET:
    - DATA_1: data/aislamientos.csv
    - DATA_2: data/pipelinedata.csv
    - DATA_3: data/test_of_lazos_updated.csv

### TABLE:

-- CTE for Query 1: Item Progress from DATA_1
WITH ss AS (
SELECT
SUBSYSTEM,
COUNT(ISO) AS TOTAL_ITEMS,
COUNT(CASE
WHEN [Avance Distanciadores] = 1 AND
[Avance Aislamiento] = 1 AND
[Avance Chapa] = 1 AND
[Avance Cajas] = 1 AND
[Avance Rematar] = 1
THEN 1 ELSE NULL
END) AS DONEITEMS
FROM DATA_1
GROUP BY SUBSYSTEM
),

-- CTE for Query 2: Progress from DATA_2
progress AS (
SELECT  
"SUBSYSTEM",
"TEST PACK",
AVG("CONSTRUC COORD PROGRESS") AS PROGRESS
FROM DATA_2
GROUP BY "SUBSYSTEM", "TEST PACK"
),

-- CTE for Query 3: Loop Completion from DATA_3
loops AS (
SELECT
SUBSYSTEM,
COUNT("TAG LOOP") AS TOTAL_LOOPS,
COUNT(CASE WHEN "OK=100%" = '100.00%' THEN 1 ELSE NULL END) AS DONELOOPS,
COUNT(CASE WHEN "OK=100%" != '100.00%' THEN 1 ELSE NULL END) AS PENDINGLOOPS
FROM DATA_3
GROUP BY SUBSYSTEM
)

-- Final combined result
SELECT
ss.SUBSYSTEM,
ss.TOTAL_ITEMS,
ss.DONEITEMS,
(ss.TOTAL_ITEMS - ss.DONEITEMS) AS PENDINGITEMS,
pr."TEST PACK",
pr.PROGRESS,
lp.TOTAL_LOOPS,
lp.DONELOOPS,
lp.PENDINGLOOPS
FROM ss
LEFT JOIN progress pr ON ss.SUBSYSTEM = pr."SUBSYSTEM"
LEFT JOIN loops lp ON ss.SUBSYSTEM = lp.SUBSYSTEM;


## Project Structure

- **Source Path:** `ECS/Streamlit_Snowflake/resources/ChartPipeline/README.md`
- **Optimization Guide:** `ECS/Streamlit_Snowflake/resources/ChartPipeline/optimization-guide.md`
- **Optimization Summary:** `ECS/Streamlit_Snowflake/resources/ChartPipeline/optimization-summary.md`
