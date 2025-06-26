# ADD  COLUMNs TO EXISTING TABLE IN SummarySubsystems.js

## TASK DESCRIPTION
- Enhance the existing table in the SummarySubsystems.js component by adding COLUMNS , ensuring proper row merging and centered values in merged cells.
- DO NOT MODIFY ANY EXISTING COLUMNS - only add the new column.

- COLUMNS TO ADD:
    - TRACEADOS
    - PRIORITY
    - HITO
    - TEIGA REINSTATEMENT
    - TEIGA INSULATION
    - SIEMSA
    - TECHNIP
- COLUMNS TO DELETE:
    - PROGRESS ITEMS%
    - PROGRESS LOOPS%
- MAPPING COLUMNS [TABLE:DATASET]
    - TRACEADOS:TRACEADOS
    - PRIORITY:PRIORITY
    - HITO:HITO
    - TEIGA REINSTATEMENT:TEIGA REINSTATEMENT
    - TEIGA INSULATION:TEIGA INSULATION
    - SIEMSA:SIEMSA
    - TECHNIP:TECHNIP

## DATA SOURCE AND TRANSFORMATION
- **DATA_9**: `data/pipelinedata.csv`
- **SQL Transformation**:

```sql
SELECT 
    SUBSYSTEM,
    MIN("TRACEADOS") AS "TRACEADOS", 
    MIN("PRIORITY") AS "PRORITY", 
    MIN("HITO") AS "HITO", 
    MIN("TEIGA REINSTATEMENT") AS "TEIGA REINSTATEMENT"
    MIN("TEIGA INSULATION") AS "TEIGA INSULATION", 
    MIN("SIEMSA") AS "SIEMSA", 
FROM DATA_9
GROUP BY SUBSYSTEM;


```


## IMPLEMENTATION DETAILS
1. Add these columns to the existing Subsystem Progress table:
    - TRACEADOS: INFO TRACEADOS OF SUBSYSTEM
        - POSITION COLUMN: REPLACE BY THE POSITION OF COLUMN INSULATION
    - PRIORITY: LEVEL PRIORITY OF SUBSYSTEM
        - POSITION COLUMN: REPLACE BY THE POSITION OF COLUMN "PROGRESS ITEMS%"
    - HITO: INFO HITO OF THE SUBSYSTEM
        - POSITION COLUMN: AFTER THE COLUMN PRIORITY
    - TEIGA REINSTATEMENT: DATE REINSTATEMENT OF SUBSYSTEM
        - POSTION COLUMN: AFTER THE COLUMN HITO
    - TEIGA INSULATION: DATE INSULATION OF SUBSYSTEM
        - POSITION COLUMN: AFTER THE COLUMN TEIGA REINSTATEMENT
    - SIEMSA: DATE SIEMA OF SUBSYTEM
        - POSITION COLUMN: AFTER THE COLUMN TEIGA INSULATION
    - TECHNIP: DATE TECHNIP OF SUBSYSTEM
        - POSITION COLUMN: AFTER THE COLUMN TECHNIP
    - IMPORTANT: PRESERVE ALL EXISTING COLUMNS WITHOUT ANY MODIFICATIONS

2. Row merging requirements:
    - DONT MODIFY CURRENT MERGED AND UNMERGED ROWS
    - UNMERGED CELLS (one value per row):
        - TRACEADOS: One value traceados  per test pack
        - PRIORITY: One value priority  per test pack
        - HITO: One value hito  per test pack
        - TEIGA REINSTATEMENT: One value teiga reinstatement per test pack
        - TEIGA INSULATION: One value teiga insulation  per test pack
        - SIEMSA: One value siemsa  per test pack
        - TECHNIP: One value technip  per test pack


## PROJECT STRUCTURE
- **Source Path:** `ECS/Streamlit_Snowflake/resources/ChartPipeline/README.md`
- **Optimization Guide:** `ECS/Streamlit_Snowflake/resources/ChartPipeline/optimization-guide.md`
- **Optimization Summary:** `ECS/Streamlit_Snowflake/resources/ChartPipeline/optimization-summary.md`


##  EXAMPLE OF EXPECTED OUTCOME VISUAL

+----------+------------+------------+---------------+---------------+---------------+-----+---------------+------------------+---------------+----------------+------------------+
|SUBSYSTEM |   TOTAL    |    DONE    |    PENDING    |   Progress    | DESCRIPTION   | N°TP|     TP's      |    PROGRESS      | TOTAL LOOP     | LOOP (Signal)   | LOOP (Signal)    |
|          |   ITEMS    |    ITEMS   |     ITEMS     |    Items%     |               |     |    INCLUDE    |    TEST PACK     | (Signal)       | DONE            | PENDING          |
+----------+------------+------------+---------------+---------------+---------------+-----+---------------+------------------+---------------+----------------+------------------+
|          |            |            |               |               |               |  4  |     1075      |     [28%]        |               |                |                  |
|          |            |            |               |               |               |     |     1045      |     [5%]         |               |                |                  |
|ACL-00000-01|          |            |               |               |Air Control Logic|     |     1077      |     [5%]         |      45       |       28        |        17        |
|          |            |            |               |               |               |     |     1038      |     [0%]         |               |                |                  |
|          |            |            |               |               |               |     |      29       |     [0%]         |               |                |                  |
+----------+------------+------------+---------------+---------------+---------------+-----+---------------+------------------+---------------+----------------+------------------+
|ACL-10001-01|          |            |               |               |Primary System  |  3  |      26       |     [0%]         |      32       |       15        |        17        |
|          |            |            |               |               |               |     |     1006      |     [0%]         |               |                |                  |
+----------+------------+------------+---------------+---------------+---------------+-----+---------------+------------------+---------------+----------------+------------------+
|ACL-10001-02|          |            |               |               |Secondary Unit  |  1  |     1006      |     [50%]        |      18       |       18        |         0        |
|ACL-10003-01|          |            |               |               |Tertiary System |  1  |     1029      |     [5%]         |      24       |        0        |        24        |
|ACL-10005-01|          |            |               |               |Backup Control  |  1  |     1076      |     [0%]         |      12       |        5        |         7        |
|ACL-A6001-01|          |            |               |               |Auxiliary Unit  |  1  |     1051      |     [5%]         |      36       |       20        |        16        |
|          |            |            |               |               |               |     |     1005      |     [0%]         |               |                |                  |
|          |            |            |               |               |               |     |     1023      |     [0%]         |               |                |                  |
+----------+------------+------------+---------------+---------------+---------------+-----+---------------+------------------+---------------+----------------+------------------+
|          |            |            |               |               |               |  5  |     1076      |     [0%]         |               |                |                  |
|          |            |            |               |               |               |     |     1079      |     [23%]        |               |                |                  |
|          |            |            |               |               |               |     |     1035      |     [0%]         |               |                |                  |
|ACL-PR18-01|           |            |               |               |Process Control |     |       6       |     [0%]         |      52       |       12        |        40        |
|          |            |            |               |               |               |     |       7       |     [4%]         |               |                |                  |
|          |            |            |               |               |               |     |      57       |     [0%]         |               |                |                  |
+----------+------------+------------+---------------+---------------+---------------+-----+---------------+------------------+---------------+----------------+------------------+
|ACL-10005-01|          |            |               |               |Backup Control  |  8  |     1091      |     [0%]         |      64       |       32        |        32        |
|          |            |            |               |               |               |     |     2002      |     [0%]         |               |                |                  |
|          |            |            |               |               |               |     |     2010      |     [25%]        |               |                |                  |
|          |            |            |               |               |               |     |     2052      |     [0%]         |               |                |                  |
|          |            |            |               |               |               |     |     2053      |     [0%]         |               |                |                  |
|          |            |            |               |               |               |     |     1007      |     [0%]         |               |                |                  |
|          |            |            |               |               |               |     |     1051      |     [0%]         |               |                |                  |
|          |            |            |               |               |               |     |     1052      |     [0%]         |               |                |                  |
+----------+------------+------------+---------------+---------------+---------------+-----+---------------+------------------+---------------+----------------+------------------+
|AP-00000-01|           |            |               |               |Air Processor   |  7  |     1052      |     [0%]         |      38       |       22        |        16        |
|          |            |            |               |               |               |     |     1033      |     [0%]         |               |                |                  |
|          |            |            |               |               |               |     |     1034      |     [0%]         |               |                |                  |
|          |            |            |               |               |               |     |     1100      |     [0%]         |               |                |                  |
+----------+------------+------------+---------------+---------------+---------------+-----+---------------+------------------+---------------+----------------+------------------+
|AP-PR19-01 |           |            |               |               |Process Unit    |  1  |     1100      |     [0%]         |      15       |        8        |         7        |
+----------+------------+------------+---------------+---------------+---------------+-----+---------------+------------------+---------------+----------------+------------------+