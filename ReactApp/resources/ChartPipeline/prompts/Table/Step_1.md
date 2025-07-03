REQUEST: CREATE A TABLE FROM SQL SENTENCE TO RENDER IN SummarySubsystems.js

- File target : SummarySubsystems.js


### DATASET:
    - DATA_1: data/aislamientos.csv

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
)

SELECT
ss.SUBSYSTEM,
ss.TOTAL_ITEMS,
ss.DONEITEMS,
(ss.TOTAL_ITEMS - ss.DONEITEMS) AS PENDINGITEMS,
FROM ss


## Project Structure

- **Source Path:** `ECS/Streamlit_Snowflake/resources/ChartPipeline/README.md`
- **Optimization Guide:** `ECS/Streamlit_Snowflake/resources/ChartPipeline/optimization-guide.md`
- **Optimization Summary:** `ECS/Streamlit_Snowflake/resources/ChartPipeline/optimization-summary.md`
