## ⚙️ Request: Extend Chart Layout with Mini Stacked Bars Panel Showing Area Contribution by Metric (UI-Only Addition)

---

### 📂 Project Structure

- **Source Path:** `ECS/Streamlit_Snowflake/resources/ChartPipeline/README.md`
- **Optimization Guide:** `ECS/Streamlit_Snowflake/resources/ChartPipeline/optimization-guide.md`
- **Optimization Summary:** `ECS/Streamlit_Snowflake/resources/ChartPipeline/optimization-summary.md`

---

### 📁 Relevant Files

- `IsolationProgressControlChart.optimized.js` (main chart: ✅ already implemented)

---

### ⚠️ Implementation Principles

| Rule                     | Description                                                              |
|--------------------------|---------------------------------------------------------------------------|
| ✅ Reuse Logic            | Pull data from same source already used in `IsolationProgressControlChart` |
| ❌ No Logic Modifications | Do NOT change chart logic, filtering, or data sources                    |
| 🎨 Design Consistency     | Match app design system: colors, borders, layout, responsiveness          |

---

### 🎯 Objective

Add a new **right-hand panel** displaying **how much each area contributes to each overall metric**.

Instead of summarizing per area like the main chart, this new panel flips the perspective:

- Each **metric** (e.g. Spacer Advance, Insulation Advance, etc.) will show **multiple horizontal stacked bars** representing the **area-level contribution** to that metric (i.e. how much each area makes up that metric's total progress).
- Each bar shows **Complete vs Incomplete** per area **within the context of that metric**.

---

### 📦 Visual Structure

#### 🔹 Current (Keep As Is)

> Large vertical stacked bar chart showing total % complete/incomplete for each metric  
> (`IsolationProgressControlChart.optimized.js`)

#### 🔸 New (Add This Panel on the Right)

> For **each of the 6 metrics**:

- Show a block titled with the metric name (e.g. `Spacer Advance`)
- Inside each block, show **one horizontal bar per area** (e.g. Area 1, Area 2, Area 3...)
- Each area bar shows % Complete (green) vs % Incomplete (magenta) **relative to that metric**
- This layout shows **contribution of each area toward the metric**, with a breakdown of progress state.
- The left side of group is for completed , the right of the group is for incompleted

---

### 📊 Design & Display Specs

| Element         | Spec                                                                 |
|------------------|----------------------------------------------------------------------|
| 📋 Block Titles   | 6 total (one for each metric): Spacer, Insulation, Sheet Metal, Boxes, Finish, Mleq |
| 📏 Mini Bars      | Horizontal stacked bars — one per **area**                          |
| 🎨 Colors         | ✅ Green: `#1DE9B6` for Complete<br>❌ Magenta: `#FF168B` for Incomplete |
| 💬 Labels         | Centered % labels inside each segment (readable, contrast adjusted) |
| 🖼️ Border         | Each bar: black border `borderWidth: 1.5`, `borderColor: "#000"`    |
| 📐 Layout         | Group each metric into a block; stack metrics vertically in panel   |
| 📱 Responsive     | Ensure panel scrolls vertically if height exceeds view              |

---

### 💡 Implementation Tips

- Group all mini-bars in a single React component: `<SidebarMetricContributionPanel />`
- Reuse bar rendering logic (e.g., from `Chart.js` config used in main chart)
- You can extract metric-to-area mapping logic from wherever the full chart gets its grouped data
- No new state or filtering logic should be introduced

---

### ✅ Output Summary

- 📊 Main chart: untouched
- 📦 New right-hand panel: metric blocks with area-level stacked bars
- 🔄 Filter panel affects both main chart and new mini bars (reuse state)
- 🔁 All values are reused — **no changes to data sources or computations**

---

