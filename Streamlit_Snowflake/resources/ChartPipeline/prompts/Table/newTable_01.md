## ⚙️ Request: CREATE A TABLE CALL "Subsystem Precommissioning" 


- DELETE ANYTHING THAT EXIST IN TAB SUMMARY SUBSYSTEMS, EXCEPT FILTER PANEL 

- COLUMN:
    - SUBSYSTEM  (UNIQUE VALUES)


### 📂 Dataset

- **Source File:**
    - `data/pipelinedata.csv`
---

- **Mapped Columns [Dashboard ↔ Dataset]**:
    - `Subsystem` ↔ `SUBSYSTEM`
    - `Test Pack` ↔ `TEST PACK`

- ⚠️ DONT CREATE OTHER COLUMNS 

### 🏗️ Project Structure

- **Source Path:** `ECS/Streamlit_Snowflake/resources/ChartPipeline/README.md`
- **Optimization Guide:** `ECS/Streamlit_Snowflake/resources/ChartPipeline/optimization-guide.md`
- **Optimization Summary:** `ECS/Streamlit_Snowflake/resources/ChartPipeline/optimization-summary.md`

### ⚠️ Implementation Principle

- ✅ Prioritize **accuracy and logic integrity** over implementation speed.
- ❗ **Do not modify** any existing filter logic, table behavior, or dashboard state beyond the scope defined here.
- Use `useMemo` to memoize global metric computation—trigger recalculation only when the raw dataset changes.
- Avoid unnecessary re-renders by isolating this display from all filter state.
