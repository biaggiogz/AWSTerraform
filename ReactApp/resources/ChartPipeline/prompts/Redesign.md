## ⚙️ Request: Add a Second Right Panel Showing Subsystem Contribution by Metric (Matrix Layout with Mini Bars)

---

### 🧠 CRITICAL LAYOUT RULE (PLEASE READ FIRST)

For each metric block (e.g., `"Spacer Advance"`), render a **matrix/grid layout** of subsystem mini bars:

- ⚠️ **NOT a single bar per metric**
- ⚠️ **NOT a vertical list of bars**
- ✅ **YES: Multiple subsystem bars per metric, arranged in 3 columns per row (grid layout)**

---

### 📊 Visual Example (ASCII Grid Layout for One Metric Block)

Here’s how **Spacer Advance** block should look if there are 6 subsystems:

**Spacer Advance**

┌────────────┬────────────┬────────────┐
│ Subsystem1 │ Subsystem2 │ Subsystem3 │
├────────────┼────────────┼────────────┤
│ Subsystem4 │ Subsystem5 │ Subsystem6 │
└────────────┴────────────┴────────────┘

- Each box contains a mini stacked horizontal bar (Complete vs Incomplete)
- Use this **same 3-column grid layout** inside each of the 6 metric blocks

---

### 🧩 Panel Structure Overview

- Panel Title: `"Subsystem Contribution by Advance"`
- Panel appears on the right side of the screen (toggle-able)
- Toggle switch: allows user to switch between:
    - `"Area Contribution by Advance"` (existing)
    - `"Subsystem Contribution by Advance"` (this request)

---

### 📦 For Each Metric Block (6 blocks total):

| Metric Name            | Example Subsystems            |
|------------------------|-------------------------------|
| Spacer Advance         | Sub1, Sub2, Sub3, Sub4...     |
| Insulation Advance     | Sub1, Sub2, Sub3, ...         |
| Sheet Metal Advance    | Sub1, Sub2, ...               |
| Boxes Advance          | Sub1, Sub2, ...               |
| Finish Advance         | Sub1, Sub2, ...               |
| Mleq Advance           | Sub1, Sub2, ...               |

---

### 📐 Layout Requirements

- ✅ Each metric block must contain **a grid with 3 columns**
- ✅ Each cell is a **mini stacked bar**:
    - Green = `% Complete` (`#1DE9B6`)
    - Magenta = `% Incomplete` (`#FF168B`)
    - Black border around each bar
- ✅ % Labels must appear inside each bar, contrast adjusted
- 🔁 Grid must be **responsive** and wrap rows if >3 items
- 🧠 DO NOT show only one bar labeled `"Unknown"` — that is incorrect

---

### 💡 Code Layout Hints

- Use `<SidebarMetricContributionPanel />` as your base
- Use `display: grid` and `gridTemplateColumns: repeat(3, 1fr)`
- Reuse data from `IsolationProgressControlChart`
- Do not modify data or logic — visual rendering only

---

### ✅ Deliverables Summary

- 📦 One new panel on the right titled: `"Subsystem Contribution by Advance"`
- 📊 Contains 6 metric blocks, each with a 3-column matrix of subsystem bars
- 🔄 Toggle button to switch views
- 🔁 All data reused from existing logic — no filters, no logic changes

---
