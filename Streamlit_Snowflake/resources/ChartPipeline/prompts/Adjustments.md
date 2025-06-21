## ⚙️ Request: Visually Reorganize Metrics Display (No Logic or Configuration Changes)

---

### 📂 Project Structure

- **Source Path:** `ECS/Streamlit_Snowflake/resources/ChartPipeline/README.md`
- **Optimization Guide:** `ECS/Streamlit_Snowflake/resources/ChartPipeline/optimization-guide.md`
- **Optimization Summary:** `ECS/Streamlit_Snowflake/resources/ChartPipeline/optimization-summary.md`

---

### 📁 Relevant Files

- `TestPackProgressChart.optimized.js`
- `GlobalMetricsDisplay.js`

---

### 🎯 Objective

Visually reorganize the **metrics display** for improved readability and alignment, without altering any configuration, logic, or state behavior.

> 📌 This is strictly a **UI layout** update — not a functional or logical change.

---

### ✅ What Must Be Preserved

| Aspect                | Requirement                                                                 |
|-----------------------|------------------------------------------------------------------------------|
| 🚫 No New Config Logic | Do **not** introduce any new UI configuration or metric logic               |
| 🔁 Reuse Existing Code | Reuse all logic from `GlobalMetricsDisplay.js` — **no duplication**         |
| ⚙️ Preserve Functionality | Maintain all click handlers, filters, state flows, and calculations        |
| 🎯 Match Calculation Logic | Global metric values must be consistent with existing backend logic       |
| 💻 UI Consistency     | Match existing design system for font, spacing, colors, and styling          |

---

### 🖼️ Updated Visual Layout (Example)

Display each metric in a **horizontal pair**:

```
| TOTAL LOOP (Signal) | LOOP (Signal) DONE | LOOP (Signal) PENDING | DOSSIER COMPLETED |
|---------------------|--------------------|------------------------|-------------------|
|  [METRIC BUTTON]    |   [METRIC BUTTON]  |    [METRIC BUTTON]     |   [METRIC BUTTON] |
|  TOTAL LOOP: 1752   |   LOOP DONE: 856   |    LOOP PENDING: 896   |   DOSSIER: 234    |
```

- 🔹 **Button** is directly above its corresponding **Global Metric Value**
- 🔹 Use the same data logic from `GlobalMetricsDisplay.js`
- 🔹 Arrange items in a clean, responsive, single-row layout
- 🔹 Maintain existing styling patterns from the design system

---

### ✨ Benefits & Expectations

- ✅ Clearer visual hierarchy and grouping
- ✅ Easier for users to scan and compare metrics
- ✅ Consistent relationship between buttons and data values
- ✅ No performance regressions or logic rewrites required
