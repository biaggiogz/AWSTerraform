# ADD  COLUMNS TO EXISTING TABLE IN SummarySubsystems.js

## PROJECT STRUCTURE
- **Source Path:** `ECS/Streamlit_Snowflake/resources/ChartPipeline/README.md`
- **Optimization Guide:** `ECS/Streamlit_Snowflake/resources/ChartPipeline/optimization-guide.md`
- **Optimization Summary:** `ECS/Streamlit_Snowflake/resources/ChartPipeline/optimization-summary.md`


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
        - POSITION COLUMN: AFTER THE COLUMN PROGRESS TEST PACK
    - PRIORITY: LEVEL PRIORITY OF SUBSYSTEM
        - POSITION COLUMN: AFTER THE COLUMN LOOP (Signal) PENDING 
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

### FINAL ORDER OF THE COLUMNS
    LEFT TO RIGHT:
        - S/N | FLUID | SUBSYSTEM | TOTAL ITEMS | DONE ITEMS | PENDING ITEMS | DESCRIPTION | N°TP | TP's INCLUDE | PROGRESS TEST PACK | TRACEADOS | TOTAL LOOP (Signal) | LOOP (Signal) DONE | LOOP (Signal) PENDING | PRIORITY | HITO | TEIGA REINSTATEMENT | TEIGA INSULATION | SIEMSA | TECHNIP


##  EXAMPLE OF EXPECTED OUTCOME VISUAL

+-----+------+------------+------------+------------+------------+-------------+-----+----------+------------------+-----------+------------+------------+------------+----------+------+------------------+------------------+--------+--------+
| S/N |FLUID | SUBSYSTEM  |   TOTAL    |    DONE    |  PENDING   | DESCRIPTION | N°TP|   TP's   |    PROGRESS      |TRACEADOS  | TOTAL LOOP | LOOP (Signal)| LOOP (Signal)|PRIORITY| HITO | TEIGA REINSTATEMENT| TEIGA INSULATION | SIEMSA |TECHNIP |
|     |      |            |   ITEMS    |   ITEMS    |   ITEMS    |             |     | INCLUDE  |    TEST PACK     |           | (Signal)   | DONE         | PENDING      |        |      |                  |                  |        |        |
+-----+------+------------+------------+------------+------------+-------------+-----+----------+------------------+-----------+------------+------------+------------+----------+------+------------------+------------------+--------+--------+
|     |      |            |            |            |            |             |  4  |   1075   |     [28%]        |   TR001   |            |            |            |          |      |                  |                  |        |        |
|     |      |            |            |            |            |             |     |   1045   |     [5%]         |   TR002   |            |            |            |          |      |                  |                  |        |        |
| 001 | AIR  |ACL-00000-01|    2500    |    1200    |    1300    |Air Control  |     |   1077   |     [5%]         |   TR003   |     45     |     28     |     17     |   HIGH   | H001 |    2024-12-15    |    2024-12-20    | S001   | T001   |
|     |      |            |            |            |            | Logic       |     |   1038   |     [0%]         |   TR004   |            |            |            |          |      |                  |                  |        |        |
|     |      |            |            |            |            |             |     |    29    |     [0%]         |   TR005   |            |            |            |          |      |                  |                  |        |        |
+-----+------+------------+------------+------------+------------+-------------+-----+----------+------------------+-----------+------------+------------+------------+----------+------+------------------+------------------+--------+--------+
| 002 | GAS  |ACL-10001-01|    1800    |     900    |     900    |Primary      |  3  |    26    |     [0%]         |   TR006   |     32     |     15     |     17     |  MEDIUM  | H002 |    2024-12-18    |    2024-12-22    | S002   | T002   |
|     |      |            |            |            |            | System      |     |   1006   |     [0%]         |   TR007   |            |            |            |          |      |                  |                  |        |        |
+-----+------+------------+------------+------------+------------+-------------+-----+----------+------------------+-----------+------------+------------+------------+----------+------+------------------+------------------+--------+--------+
| 003 | OIL  |ACL-10001-02|    1200    |     600    |     600    |Secondary    |  1  |   1006   |     [50%]        |   TR008   |     18     |     18     |      0     |   LOW    | H003 |    2024-12-20    |    2024-12-25    | S003   | T003   |
| 004 | WAT  |ACL-10003-01|    1500    |     300    |    1200    |Tertiary     |  1  |   1029   |     [5%]         |   TR009   |     24     |      0     |     24     |   HIGH   | H004 |    2024-12-22    |    2024-12-28    | S004   | T004   |
| 005 | STM  |ACL-10005-01|     800    |     400    |     400    |Backup       |  1  |   1076   |     [0%]         |   TR010   |     12     |      5     |      7     |  MEDIUM  | H005 |    2024-12-25    |    2024-12-30    | S005   | T005   |
| 006 | AIR  |ACL-A6001-01|    2200    |    1100    |    1100    |Auxiliary    |  1  |   1051   |     [5%]         |   TR011   |     36     |     20     |     16     |   LOW    | H006 |    2024-12-28    |    2025-01-02    | S006   | T006   |
|     |      |            |            |            |            | Unit        |     |   1005   |     [0%]         |   TR012   |            |            |            |          |      |                  |                  |        |        |
|     |      |            |            |            |            |             |     |   1023   |     [0%]         |   TR013   |            |            |            |          |      |                  |                  |        |        |
+-----+------+------------+------------+------------+------------+-------------+-----+----------+------------------+-----------+------------+------------+------------+----------+------+------------------+------------------+--------+--------+
|     |      |            |            |            |            |             |  5  |   1076   |     [0%]         |   TR014   |            |            |            |          |      |                  |                  |        |        |
|     |      |            |            |            |            |             |     |   1079   |     [23%]        |   TR015   |            |            |            |          |      |                  |                  |        |        |
|     |      |            |            |            |            |             |     |   1035   |     [0%]         |   TR016   |            |            |            |          |      |                  |                  |        |        |
| 007 | GAS  |ACL-PR18-01 |    3000    |    1500    |    1500    |Process      |     |     6    |     [0%]         |   TR017   |     52     |     12     |     40     |   HIGH   | H007 |    2024-12-30    |    2025-01-05    | S007   | T007   |
|     |      |            |            |            |            | Control     |     |     7    |     [4%]         |   TR018   |            |            |            |          |      |                  |                  |        |        |
|     |      |            |            |            |            |             |     |    57    |     [0%]         |   TR019   |            |            |            |          |      |                  |                  |        |        |
+-----+------+------------+------------+------------+------------+-------------+-----+----------+------------------+-----------+------------+------------+------------+----------+------+------------------+------------------+--------+--------+
| 008 | OIL  |ACL-10005-01|    4500    |    2250    |    2250    |Backup       |  8  |   1091   |     [0%]         |   TR020   |     64     |     32     |     32     |  MEDIUM  | H008 |    2025-01-02    |    2025-01-08    | S008   | T008   |
|     |      |            |            |            |            | Control     |     |   2002   |     [0%]         |   TR021   |            |            |            |          |      |                  |                  |        |        |
|     |      |            |            |            |            |             |     |   2010   |     [25%]        |   TR022   |            |            |            |          |      |                  |                  |        |        |
|     |      |            |            |            |            |             |     |   2052   |     [0%]         |   TR023   |            |            |            |          |      |                  |                  |        |        |
|     |      |            |            |            |            |             |     |   2053   |     [0%]         |   TR024   |            |            |            |          |      |                  |                  |        |        |     |
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