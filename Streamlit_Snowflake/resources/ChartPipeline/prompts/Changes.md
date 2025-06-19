## 🔧 Request: Fix UI Layout and Visual Consistency for Table "Lazos"

### 🎯 Objective:
Align all table columns and rows properly, apply consistent styling, and match the UI to the existing design system.

---

### 📐 Fixes to Apply:

| Area            | Required Fix                                                                                     |
|------------------|--------------------------------------------------------------------------------------------------|
| 🧱 Table Layout   | Use `table-layout: fixed` and ensure equal column widths with `minWidth` + `maxWidth` settings  |
| 🎨 Badge Styling  | Use Chakra UI's `Badge` with consistent `variant`, `colorScheme`, and padding/margin rules     |
| 📏 Row Height     | Normalize padding in each `td` — use `py={2}` or `py={1}` consistently                         |
| 📊 Progress Bar   | Ensure it's inside a container with fixed height and consistent margin                         |
| 🧭 Horizontal Scroll | Enable proper overflow with `overflowX: auto` on table container                              |
| ⚙️ Cell Alignment | Add `textAlign="center"` or `start`/`end` consistently across columns                          |

---

### 🔎 QA Checklist:

- [ ] ✅ Columns align with headers
- [ ] ✅ Vertical scroll works independently
- [ ] ✅ Filtering does not break table structure
- [ ] ✅ UI uses consistent Chakra design tokens
- [ ] ✅ Responsive layout does not overflow or collapse

---

Please re-implement the rendering logic with **proper styling, alignment, and performance optimizations**.
