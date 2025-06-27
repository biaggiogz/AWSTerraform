

## ⚠️ CRITICAL INSTRUCTION #1: CALCULATION REPLACEMENT

**MANDATORY CHANGE**: Replace ONLY the calculation logic PROGRESS TEST PACK in:
`ECS/Streamlit_Snowflake/resources/ChartPipeline/src/charts/SummarySubsystems.js`



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

---


### ❌ DON'T:
1. Modify colors, styling, or layout
2. Change filter logic or functions
3. Alter chart configuration
4. Remove performance optimizations
5. Change component structure




## 📊 DATA SOURCE
- **DATASET**: `data/pipelinedata.csv`
- **Column Mapping [TABLE↔DATASET]**:
    - TEST PACK ↔ `TEST PACK` (grouping column, may have pipe-separated values)
    - Progress Value ↔ `CONSTRUC COORD PROGRESS` (value to average)
    - SUBSYSTEM ↔ `SUBSYSTEM` (for filtering)

