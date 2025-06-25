# ADD LOOP COLUMNS TO EXISTING TABLE IN SummarySubsystems.js

## TASK DESCRIPTION
- Enhance the existing table in the SummarySubsystems.js component by adding LOOP columns, ensuring proper row merging and centered values in merged cells.

- COLUMNS TO ADD:
    - TOTAL LOOP (Signal)
    - LOOP (Signal) DONE
    - LOOP (Signal) PENDING
    - PROGRESS LOOPS%

## DATA SOURCE AND TRANSFORMATION
- **DATA_3**: `data/test_of_lazos_updated.csv`
- **SQL Transformation**:

```sql
SELECT  
  "SUBS_PRE" AS "SUBSYSTEM",
  COUNT("TAG LOOP") AS "TOTAL LOOP (Signal)",
  COUNT(*) FILTER (WHERE "OK=100%" = '100.00%') AS "LOOP (Signal) DONE",
  COUNT(*) FILTER (WHERE "OK=100%" != '100.00%') AS "LOOP (Signal) PENDING"
FROM DATA_3
GROUP BY "SUBS_PRE";
```

## IMPLEMENTATION DETAILS
1. Add these columns to the existing Subsystem Progress table:
    - TOTAL LOOPS (Signal): Number of tag loops  per subsystem
    - LOOP (Signal) DONE : Number of rows where "OK=100%"="100.00%"  from the SQL transformation
    - LOOP (Signal) PENDING : Number of rows where "OK=100%" != "100.00%"  from the SQL transformation

2. Row merging requirements:
    - MERGED CELLS (with vertically centered values):
        - SUBSYSTEM: One value per subsystem group
        - TOTAL ITEMS: Merged for all rows of same subsystem
        - DONE ITEMS: Merged for all rows of same subsystem
        - PENDING ITEMS: Merged for all rows of same subsystem
        - Progress Items%: Merged for all rows of same subsystem
        - N°TP: Merged for all rows of same subsystem

    - UNMERGED CELLS (one value per row):
        - TP's INCLUDE: One test pack ID per row
        - PROGRESS TEST PACK: One progress visualization/percentage per row

3. ALL VALUES IN MERGED CELLS MUST BE VERTICALLY CENTERED

## EXPECTED TABLE STRUCTURE
- Each subsystem has multiple rows (one for each test pack)
- First row of each subsystem contains values for all merged columns
- Subsequent rows only contain values for TP's INCLUDE and PROGRESS TEST PACK
- Progress Items% column is merged for all rows of the same subsystem with centered value

## EXAMPLE
For subsystem ACL-00000-01 with 4 test packs:
- Row 1: Contains SUBSYSTEM, TOTAL ITEMS, DONE ITEMS, PENDING ITEMS, Progress Items%, SERVICE, N°TP (value: 4), first TP's INCLUDE (1075), first PROGRESS TEST PACK ([████████] 28%), and LOOP columns
- Rows 2-5: Only contain values for TP's INCLUDE (1045, 1077, 1038, 29) and PROGRESS TEST PACK (5%, 5%, 0%)
- All merged cells have their values vertically centered across all rows

## PROJECT STRUCTURE
- **Source Path:** `ECS/Streamlit_Snowflake/resources/ChartPipeline/README.md`
- **Optimization Guide:** `ECS/Streamlit_Snowflake/resources/ChartPipeline/optimization-guide.md`
- **Optimization Summary:** `ECS/Streamlit_Snowflake/resources/ChartPipeline/optimization-summary.md`


##  EXAMPLE OF EXPECTED OUTCOME VISUAL

+----------+------------+------------+---------------+---------------+-----+---------------+------------------+---------------+----------------+------------------+
|SUBSYSTEM |   TOTAL    |    DONE    |    PENDING    |   Progress    | N°TP|     TP's      |    PROGRESS      | TOTAL LOOP     | LOOP (Signal)   | LOOP (Signal)    |
|          |   ITEMS    |    ITEMS   |     ITEMS     |    Items%     |     |    INCLUDE    |    TEST PACK     | (Signal)       | DONE            | PENDING          |
+----------+------------+------------+---------------+---------------+-----+---------------+------------------+---------------+----------------+------------------+
|          |            |            |               |               |  4  |     1075      |     [28%]        |               |                |                  |
|          |            |            |               |               |     |     1045      |     [5%]         |               |                |                  |
|ACL-00000-01|          |            |               |               |     |     1077      |     [5%]         |      45       |       28        |        17        |
|          |            |            |               |               |     |     1038      |     [0%]         |               |                |                  |
|          |            |            |               |               |     |      29       |     [0%]         |               |                |                  |
+----------+------------+------------+---------------+---------------+-----+---------------+------------------+---------------+----------------+------------------+
|ACL-10001-01|          |            |               |               |  3  |      26       |     [0%]         |      32       |       15        |        17        |
|          |            |            |               |               |     |     1006      |     [0%]         |               |                |                  |
+----------+------------+------------+---------------+---------------+-----+---------------+------------------+---------------+----------------+------------------+
|ACL-10001-02|          |            |               |               |  1  |     1006      |     [50%]        |      18       |       18        |         0        |
|ACL-10003-01|          |            |               |               |  1  |     1029      |     [5%]         |      24       |        0        |        24        |
|ACL-10005-01|          |            |               |               |  1  |     1076      |     [0%]         |      12       |        5        |         7        |
|ACL-A6001-01|          |            |               |               |  1  |     1051      |     [5%]         |      36       |       20        |        16        |
|          |            |            |               |               |     |     1005      |     [0%]         |               |                |                  |
|          |            |            |               |               |     |     1023      |     [0%]         |               |                |                  |
+----------+------------+------------+---------------+---------------+-----+---------------+------------------+---------------+----------------+------------------+
|          |            |            |               |               |  5  |     1076      |     [0%]         |               |                |                  |
|          |            |            |               |               |     |     1079      |     [23%]        |               |                |                  |
|          |            |            |               |               |     |     1035      |     [0%]         |               |                |                  |
|ACL-PR18-01|           |            |               |               |     |       6       |     [0%]         |      52       |       12        |        40        |
|          |            |            |               |               |     |       7       |     [4%]         |               |                |                  |
|          |            |            |               |               |     |      57       |     [0%]         |               |                |                  |
+----------+------------+------------+---------------+---------------+-----+---------------+------------------+---------------+----------------+------------------+
|ACL-10005-01|          |            |               |               |  8  |     1091      |     [0%]         |      64       |       32        |        32        |
|          |            |            |               |               |     |     2002      |     [0%]         |               |                |                  |
|          |            |            |               |               |     |     2010      |     [25%]        |               |                |                  |
|          |            |            |               |               |     |     2052      |     [0%]         |               |                |                  |
|          |            |            |               |               |     |     2053      |     [0%]         |               |                |                  |
|          |            |            |               |               |     |     1007      |     [0%]         |               |                |                  |
|          |            |            |               |               |     |     1051      |     [0%]         |               |                |                  |
|          |            |            |               |               |     |     1052      |     [0%]         |               |                |                  |
+----------+------------+------------+---------------+---------------+-----+---------------+------------------+---------------+----------------+------------------+
|AP-00000-01|           |            |               |               |  7  |     1052      |     [0%]         |      38       |       22        |        16        |
|          |            |            |               |               |     |     1033      |     [0%]         |               |                |                  |
|          |            |            |               |               |     |     1034      |     [0%]         |               |                |                  |
|          |            |            |               |               |     |     1100      |     [0%]         |               |                |                  |
+----------+------------+------------+---------------+---------------+-----+---------------+------------------+---------------+----------------+------------------+
|AP-PR19-01 |           |            |               |               |  1  |     1100      |     [0%]         |      15       |        8        |         7        |
+----------+------------+------------+---------------+---------------+-----+---------------+------------------+---------------+----------------+------------------+