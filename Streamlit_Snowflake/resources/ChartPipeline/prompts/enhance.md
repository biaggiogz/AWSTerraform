## ⚙️ Request: Update Bar Chart Metric Selection and Display Behavior for "LOOP TEST PROGRESS" Dashboard

---

### 🧭 Tab: `LOOP TEST PROGRESS`

---

### ⚠️ Implementation Principle

- ✅ Prioritize **accuracy and logic integrity** over implementation speed.
- ❗ **Do not modify** any existing filter logic, table behavior, or dashboard state beyond the scope defined here.
- Use a **separate aggregation** step to compute the global values.
- Use `useMemo` to memoize global metric computation—trigger recalculation only when the raw dataset changes.
- Avoid unnecessary re-renders by isolating this display from all filter state.

---

### 📂 Dataset

- **Source File:** `data/test_of_lazos_updated.csv`

---

### 🏗️ Project Structure

- **Source Path:** `ECS/Streamlit_Snowflake/resources/ChartPipeline/README.md`
- **Optimization Guide:** `ECS/Streamlit_Snowflake/resources/ChartPipeline/optimization-guide.md`
- **Optimization Summary:** `ECS/Streamlit_Snowflake/resources/ChartPipeline/optimization-summary.md`

---

### 🎯 Goal

Update the **bar chart metric selection and display logic** in the "LOOP TEST PROGRESS" dashboard to improve clarity and usability, as illustrated in the attached image (`Adjustements.jpg`).

---

### 📐 Key Requirements

| Requirement          | Details                                                                                  |
|----------------------|------------------------------------------------------------------------------------------|
| **Metric Selection** | Clicking a metric (e.g., "TOTAL LOOP (Signal)") displays **only that metric** in the chart. |
| **Show All Metrics** | Provide a control labeled **"SHOWING: ALL METRICS"** to restore the multi-metric view.     |
| **Visual Feedback**  | Highlight the selected metric or "ALL METRICS" button for clear visual indication.        |
| **Legend + Summary** | Show only the legend/summary for the active metric(s) based on the current selection.     |
| **Sorting Behavior** | When a metric is selected, sort bars based on that metric for clearer comparison.         |
| **Responsiveness**   | Maintain responsive layout across devices and screen sizes.                               |
| **No State Regression** | All Area and Subsystem filters and table interactions must remain unaffected.             |

---

### 📝 Implementation Notes

#### UI/UX

- Follow the visual interaction model shown in the `"UPDATE"` section of the attached image.
- When a metric is selected:
   - Display only that metric in both the chart and the legend.
   - Sort bars by the selected metric.
   - Highlight the metric button as "active".
- When `"SHOWING: ALL METRICS"` is active:
   - Display all available metrics.
   - Clear any single-metric selection highlight.

#### Performance

- Use `useMemo` or similar techniques to avoid unnecessary re-renders when switching metric views.

#### Testing

- Verify:
   - All metric selection states.
   - Sorting behavior.
   - Filter integrity.
   - No disruption to table logic or existing dashboard elements.

---

### 📌 Reminders

- 🚫 **Do not duplicate** filtering logic—apply filters centrally and consistently.
- 🔁 Maintain all current **dashboard logic**, including UI state and performance optimizations.
- 🧪 **Test Live:** `http://localhost:3000/`
