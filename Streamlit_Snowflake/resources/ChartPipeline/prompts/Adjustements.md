## ⚙️ Request: Enable Metric Isolation on Bar Chart Click for "LOOP TEST PROGRESS" Dashboard

### 🧭 Tab
**LOOP TEST PROGRESS**

### ⚠️ Implementation Principle
- ✅ **Accuracy and logic integrity** are more important than speed of implementation.
- ❗ All **existing table and filter behavior must remain intact**.

---

### 📂 Dataset
- **Source File:** `data/test_of_lazos_updated.csv`

---

### 🏗️ Project Structure
- **Source Path:** `ECS/Streamlit_Snowflake/resources/ChartPipeline/README.md`
- **Optimization Guide:** `ECS/Streamlit_Snowflake/resources/ChartPipeline/optimization-guide.md`

---

### 🎯 Goal
Enable users to **isolate a metric** from the bar chart (e.g., "LOOP (Signal) DONE", "LOOP (Signal) PENDING", etc.), so **only that metric is shown in the chart**, while maintaining correct filtering in the table.

---

### 📐 Key Requirements

| Requirement        | Details                                                                                         |
|--------------------|-------------------------------------------------------------------------------------------------|
| Metric Isolation   | Clicking a metric in the bar chart should show only that metric (others hidden or dimmed).      |
| Reset View         | User can reset to view all metrics (e.g., re-click the same metric or use a "Show All" button). |
| Visual Feedback    | Highlight the selected metric and show a UI indication that filtering is active.                |
| Legend Interaction | Use `legend.onClick` to trigger metric isolation.                                               |
| Accessibility      | Keep contrast and interactivity accessible.                                                     |
| Performance        | Use `useMemo`, `useCallback`, and `React.memo` to optimize rendering.                           |
| Filter Integration | See filtering logic below.                                                                      |

---

### 🧮 Table Filtering Logic (MUST KEEP WORKING)

- ✅ The table **"Loop Test Control - Precommissioning"** must continue to be filtered by **Area** and **Subsystem** (from the Filter Panel) at all times.
- ✅ When a metric is selected, the table must be filtered by both:
    - Metric Filter (e.g., DONE, PENDING)
    - Area/Subsystem
- ✅ When **"TOTAL LOOP (Signal)"** is selected:
    - Clear any **metric filter**
    - Still apply **Area and Subsystem** filter
    - Show all relevant rows based on current Area/Subsystem

---

### 📝 Implementation Notes

#### Chart.js Configuration
- Use `legend.onClick` or dataset toggling logic to isolate chart metric display.
- Ensure **visual state sync** between chart and table when switching metrics.

#### Testing
Confirm:
- ✅ Metric isolation in chart works correctly
- ✅ Table updates with correct filtered rows (combined logic)
- ✅ Resetting restores full view with **Area/Subsystem filters still applied**

---

### 📌 Reminders
- ❗ **Do not overwrite or reset table filtering logic.**
- Chart and table should **reflect a consistent filtered state**.
- Match current **UI/UX architecture and behaviors**.
