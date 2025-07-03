## ⚙️ Request: Add Global Metrics Display (Unfiltered) to "LOOP TEST PROGRESS" Dashboard

### 📍 Location
Inject the **Global Metrics** directly **below the "Total Subsystems:" badge** in `LoopTestProgressChart.optimized.js`.  
These values must come from the **same dataset** (`test_of_lazos_updated.csv`) but **must never be affected by filters** (Area, Subsystem, Metric Isolation, etc.).

---

### 🧭 Tab
**LOOP TEST PROGRESS**

---

### ⚠️ Implementation Principles
- ✅ Prioritize **accuracy and logic integrity** over speed of implementation.
- ❗ **Do not modify** any existing chart behavior, filtering, or state.
- ❗ **All table and chart filter logic must remain untouched**.

---

### 🧮 Global Metrics Definition

| Global Metric          | Description                                                              |
|------------------------|--------------------------------------------------------------------------|
| TOTAL LOOP (Signal)    | Sum of all loops across every area and subsystem                        |
| LOOP (Signal) DONE     | Count of DONE loops (unfiltered)                                        |
| LOOP (Signal) PENDING  | Count of PENDING loops (unfiltered)                                     |
| DOSSIER COMPLETED      | Count of completed dossiers across the entire dataset                   |

> These metrics match the structure of the charted values, but must always represent the **total dataset** (unfiltered snapshot).

---

### 📂 Dataset
- **Source File:** `data/test_of_lazos_updated.csv`

---

### 🏗️ Project Structure
- **Source Path:** `ECS/Streamlit_Snowflake/resources/ChartPipeline/README.md`
- **Optimization Guide:** `ECS/Streamlit_Snowflake/resources/ChartPipeline/optimization-guide.md`
- **Optimization Summary:** `ECS/Streamlit_Snowflake/resources/ChartPipeline/optimization-summary.md`

---

### 🖼️ UI Behavior
- Place the metrics **below the "Total Subsystems:" badge** (top-left section).
- Design the visual style to match existing legend color mapping.
- Add subtle UI label or tooltip: `"Global Total (unfiltered)"` for clarity.
- Responsive layout: Metrics should wrap or adjust gracefully on smaller screens.

---

### 🧠 Implementation Notes
- Use a **separate aggregation** step to compute the global values.
- Use `useMemo` to memoize global metric computation—trigger recalculation only when the raw dataset changes.
- Avoid unnecessary re-renders by isolating this display from all filter state.

---

### 🧪 Testing
Ensure:
- ✅ Global metrics **never change** when filtering Area or Subsystem.
- ✅ Global metrics **do not react** to chart legend click (metric isolation).
- ✅ Values are identical to the unfiltered total of the stacked bar chart segments.

---

### 📌 Reminders
- ❗ This addition must **only enhance**, not interfere with the existing chart, filters, or table.
- ✅ Maintain full consistency with current UI/UX behavior.
- 💡 Consider code placement modular for easy future reuse (e.g., a `GlobalMetricDisplay` component).
