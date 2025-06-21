## ⚙️ Request: CREATE A PANEL CALL "ISOLATION PROGRESS MONITORING" TO REPLACE TAB "Support vs Welding by Subsystem"

---

### ⚠️ Implementation Principle

- ✅ Prioritize **accuracy and logic integrity** over implementation speed.
- ❗ **Do not modify** any existing filter logic, table behavior, or dashboard state beyond the scope defined here.
- Use a **separate aggregation** step to compute the global values.
- Use `useMemo` to memoize global metric computation—trigger recalculation only when the raw dataset changes.
- Avoid unnecessary re-renders by isolating this display from all filter state.

---

### 📂 Dataset

- **Source File:** `data/aislamientos.csv`

---

### 🏗️ Project Structure

- **Source Path:** `ECS/Streamlit_Snowflake/resources/ChartPipeline/README.md`
- **Optimization Guide:** `ECS/Streamlit_Snowflake/resources/ChartPipeline/optimization-guide.md`
- **Optimization Summary:** `ECS/Streamlit_Snowflake/resources/ChartPipeline/optimization-summary.md`

---

### 🎯 Goal

- Replace TAB "Support vs Welding by Subsystem" BY "ISOLATION PROGRESS MONITORING"
- Delete the chart "Support Installation vs Welding Progress by Subsystem"
---
