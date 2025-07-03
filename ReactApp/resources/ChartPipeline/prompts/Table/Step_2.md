# ADD LOOP COLUMNS TO EXISTING TABLE IN SummarySubsystems.js

## TASK DESCRIPTION
- Enhance the existing table in the SummarySubsystems.js component by adding LOOP columns, ensuring proper row merging and centered values in merged cells.

## DATA SOURCE AND TRANSFORMATION
- **DATA_3**: `data/test_of_lazos_updated.csv`
- **SQL Transformation**:
```sql
SELECT  
  "SUBSYSTEM",
  unnest(string_to_array("TEST PACK", '|')) AS "TEST PACK",
  AVG("CONSTRUC COORD PROGRESS") AS "PROGRESS TEST PACK"
FROM DATA_2
GROUP BY "SUBSYSTEM", "TEST PACK";
```

```sql
//query2
WITH ss AS(
SELECT  
  "SUBSYSTEM",
  unnest(string_to_array("TEST PACK", '|')) AS "TEST PACK",
FROM DATA_2
GROUP BY "SUBSYSTEM", "TEST PACK")

SELECT "SUBSYSTEM", COUNT("TEST PACK") AS "N°TP"
FROM ss
GROUP BY "SUBSYSYTEM";
```

## SQL TO TABLE COLUMN MAPPING
- "SUBSYSTEM" from SQL → SUBSYSTEM column in table
- "TEST PACK" from SQL → TP's INCLUDE column in table
- "PROGRESS TEST PACK" from SQL → PROGRESS TEST PACK column in table (display as progress bar and percentage)
- N°TP column in table → from sql query2

## IMPLEMENTATION DETAILS
1. Add these columns to the existing Subsystem Progress table:
   - N°TP: Number of test packs per subsystem (count of distinct TEST PACKs)
   - TP's INCLUDE: Test pack IDs from the "TEST PACK" column in SQL result
   - PROGRESS TEST PACK: Progress visualization and percentage from "PROGRESS TEST PACK" column in SQL result

2. Row merging requirements:
   - MERGED CELLS (with vertically centered values):
     - SUBSYSTEM: One value per subsystem group
     - TOTAL ITEMS: Merged for all rows of same subsystem
     - DONE ITEMS: Merged for all rows of same subsystem
     - PENDING ITEMS: Merged for all rows of same subsystem
     - Progress Items%: Merged for all rows of same subsystem
     - N°TP: Merged for all rows of same subsystem

   - UNMERGED CELLS (one value per row):
     - TP's INCLUDE: One test pack ID per row (from "TEST PACK" column in SQL)
     - PROGRESS TEST PACK: One progress visualization/percentage per row (from "PROGRESS TEST PACK" column in SQL)

3. ALL VALUES IN MERGED CELLS MUST BE VERTICALLY CENTERED

## EXPECTED TABLE STRUCTURE
- Each subsystem has multiple rows (one for each test pack)
- First row of each subsystem contains values for all merged columns
- Subsequent rows only contain values for TP's INCLUDE and PROGRESS TEST PACK
- Progress Items% column is merged for all rows of the same subsystem with centered value

##  EXAMPLE OF EXPECTED OUTCOME VISUAL

+----------+-------+------+---------+--------------------------------+-----+---------------+----------+------------+------------+------------+
|SUBSYSTEM | TOTAL ITEMS | DONE ITEMS  | PENDING ITEMS|          SERVICE               | N°TP| TP's INCLUDE  | PROGRESS |TOTAL LOOP (Signal)  | LOOP (Signal) DONE| LOOP (Signal) PENDING|
+----------+-------+------+---------+--------------------------------+-----+---------------+----------+------------+------------+------------+
|          |       |      |         |Distribución agua caliente de   |  4  |     1075      |[████████]|     5      |     0      |     5      |
|          |       |      |         |lavados                         |     |     1045      |   28%    |            |            |            |
|ACL-00000-01|     |      |         |                                |     |     1077      |    5%    |            |            |            |
|          |       |      |         |                                |     |     1038      |    5%    |            |            |            |
|          |       |      |         |                                |     |      29       |    0%    |            |            |            |
+----------+-------+------+---------+--------------------------------+-----+---------------+----------+------------+------------+------------+
|ACL-10001-01|     |      |         |Agua caliente de lavados A39001 |  3  |      26       |    0%    |     3      |     0      |     3      |
|          |       |      |         |                                |     |     1006      |    0%    |            |            |            |
+----------+-------+------+---------+--------------------------------+-----+---------------+----------+------------+------------+------------+
|ACL-10001-02|     |      |         |Agua caliente de lavados ATC001C|  1  |     1006      |[█████    ]|     3      |     0      |     3      |
|ACL-10003-01|     |      |         |Agua caliente de lavados A39003 |  1  |     1029      |    5%    |     0      |     0      |     0      |
|ACL-10005-01|     |      |         |Agua caliente de lavados A39005 |  1  |     1076      |    0%    |     0      |     0      |     0      |
|ACL-A6001-01|     |      |         |Agua caliente de lavados A60006 |  1  |     1051      |    5%    |     0      |     0      |     0      |
|          |       |      |         |                                |     |     1005      |    0%    |            |            |            |
|          |       |      |         |                                |     |     1023      |    0%    |            |            |            |
+----------+-------+------+---------+--------------------------------+-----+---------------+----------+------------+------------+------------+
|          |       |      |         |Agua caliente de lavados PR1819 |  5  |     1076      |    0%    |     0      |     0      |     0      |
|          |       |      |         |                                |     |     1079      |[██████   ]|            |            |            |
|          |       |      |         |                                |     |     1035      |   23%    |            |            |            |
|ACL-PR18-01|      |      |         |                                |     |       6       |    0%    |            |            |            |
|          |       |      |         |                                |     |       7       |    0%    |            |            |            |
|          |       |      |         |                                |     |      57       |    4%    |            |            |            |
+----------+-------+------+---------+--------------------------------+-----+---------------+----------+------------+------------+------------+
|ACL-10005-01|     |      |         |Agua glicolada y líneas asociadas|  8  |     1091      |    0%    |    42      |    16      |    26      |
|          |       |      |         |                                |     |     2002      |    0%    |            |            |            |
|          |       |      |         |                                |     |     2010      |[██████   ]|            |            |            |
|          |       |      |         |                                |     |     2052      |   25%    |            |            |            |
|          |       |      |         |                                |     |     2053      |    0%    |            |            |            |
|          |       |      |         |                                |     |     1007      |    0%    |            |            |            |
|          |       |      |         |                                |     |     1051      |    0%    |            |            |            |
|          |       |      |         |                                |     |     1052      |    0%    |            |            |            |
+----------+-------+------+---------+--------------------------------+-----+---------------+----------+------------+------------+------------+
|AP-00000-01|     |      |         |Agua potable (colector)         |  7  |     1052      |    0%    |     1      |     0      |     1      |
|          |       |      |         |                                |     |     1033      |    0%    |            |            |            |
|          |       |      |         |                                |     |     1034      |    0%    |            |            |            |
|          |       |      |         |                                |     |     1100      |    0%    |            |            |            |
+----------+-------+------+---------+--------------------------------+-----+---------------+----------+------------+------------+------------+
|AP-PR19-01 |     |      |         |Agua potable (PR19)             |  1  |     1100      |    0%    |     1      |     0      |     1      |
+----------+-------+------+---------+--------------------------------+-----+---------------+----------+------------+------------+------------+


## EXAMPLE
For subsystem ACL-00000-01 with 4 test packs:
- Row 1: Contains SUBSYSTEM, TOTAL ITEMS, DONE ITEMS, PENDING ITEMS, Progress Items%, SERVICE, N°TP (value: 4), first TP's INCLUDE (1075), first PROGRESS TEST PACK ([████████] 28%), and LOOP columns
- Rows 2-5: Only contain values for TP's INCLUDE (1045, 1077, 1038, 29) and PROGRESS TEST PACK (5%, 5%, 0%)
- All merged cells have their values vertically centered across all rows

## PROJECT STRUCTURE
- **Source Path:** `ECS/Streamlit_Snowflake/resources/ChartPipeline/README.md`
- **Optimization Guide:** `ECS/Streamlit_Snowflake/resources/ChartPipeline/optimization-guide.md`
- **Optimization Summary:** `ECS/Streamlit_Snowflake/resources/ChartPipeline/optimization-summary.md`