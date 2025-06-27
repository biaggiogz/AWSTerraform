# ⚙️ REQUEST: FIX ONLY AND UPDATE ONLY THE CALCULATION OF COLUMN "PROGRESS TEST PACK" IN SummarySubsystems.js

## 🎯 OBJECTIVE
Fix ONLY the test pack progress calculation in SummarySubsystems.js to use AVG("CONSTRUC COORD PROGRESS") grouped by SUBSYSTEM and TEST PACK from `data/pipelinedata.csv`.

## PROJECT STRUCTURE
- **Source Path:** `ECS/Streamlit_Snowflake/resources/ChartPipeline/README.md`
- **Optimization Guide:** `ECS/Streamlit_Snowflake/resources/ChartPipeline/optimization-guide.md`
- **FLOW DATA:** `ECS/Streamlit_Snowflake/resources/ChartPipeline/FLOW_DATA.md`

## 📊 DATA SOURCE SPECIFICATION
- **DATASET**: `data/pipelinedata.csv` (ONLY)
- **REMOVE DEPENDENCY**: Stop using `test_pack_progress.csv`
- **CALCULATION**: AVG("CONSTRUC COORD PROGRESS") GROUP BY SUBSYSTEM, TEST PACK

### Column Mapping [TABLE↔DATASET]:
- TEST PACK ↔ `TEST PACK` 
- Progress Value ↔ `CONSTRUC COORD PROGRESS` (value to average)
- SUBSYSTEM ↔ `SUBSYSTE

## 🔧 EXACT CHANGE REQUIRED

**FILE**: `ECS/Streamlit_Snowflake/resources/ChartPipeline/src/components/SummarySubsystems.js`

**CHANGE ONLY**: Test pack progress calculation logic to:
1. Group records by SUBSYSTEM + TEST PACK combination
2. Calculate average of "CONSTRUC COORD PROGRESS" for each group
3. Use this average as testPackProgress value
4. Remove all references to testPackData/test_pack_progress.csv

## ⚠️ CRITICAL INSTRUCTION #1: CALCULATION REPLACEMENT
- DO NOT MODIFY ANY EXISTING COLUMNS - only fix and UPDATE CALCULATION MENTIONED BELOW.

**MANDATORY CHANGE**: Replace ONLY the calculation logic PROGRESS TEST PACK in:
`ECS/Streamlit_Snowflake/resources/ChartPipeline/src/charts/SummarySubsystems.js`

```sql
-- You need to SPLIT the 'TEST PACK' field and explode the values
WITH exploded AS (
  SELECT 
    "SUBSYSTEM",
    TRIM(value) AS "TEST_PACK",
    "CONSTRUC COORD PROGRESS"
  FROM DATASET,
  UNNEST(string_to_array("TEST PACK", '|')) AS value
)
SELECT
  "SUBSYSTEM",
  "TEST_PACK" as "TEST PACK",
  AVG("CONSTRUC COORD PROGRESS") AS "PROGRESS TEST PACK"
FROM exploded
GROUP BY "SUBSYSTEM", "TEST_PACK"

```

## 🔒 CRITICAL INSTRUCTION #2: PRESERVE EVERYTHING ELSE

**DO NOT CHANGE** anything else from the existing SummarySubsystems.js:

### ✅ Keep Identical:
- **All Colors**
- **All Layout**
- **All Chart Config**
- **All Filters**
- **All Functions**
- **All Performance**
- **All Data Processing**

## 🚫 CRITICAL RESTRICTIONS

### ✅ ONLY CHANGE:
- Test pack progress calculation method
- Remove test_pack_progress.csv dependency
- Use AVG("CONSTRUC COORD PROGRESS") from pipelinedata.csv

### ❌ DO NOT MODIFY:
- Table layout or structure
- Merged/unmerged row configuration
- Row spanning logic (rowSpan, isFirstRow)
- Filter logic or functions
- Data processing workflow
- Component structure
- Colors, styling, or visual layout
- Performance optimizations
- Any other functionality