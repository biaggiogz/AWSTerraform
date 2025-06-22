## ⚙️ Request: Implement Table "Insulation Progress" on Tab `"INSULATION PROGRESS CONTROL"`
➡️ Maintain Architecture • Optimize Performance • Ensure Filter Functionality

---

### ⚠️ Implementation Principle

- ✅ Prioritize **accuracy and logic integrity** over speed of implementation.
- ❗ **Do not modify** any existing chart behavior, filtering, or state.
- ❗ **All table and chart filter logic must remain untouched**.
---

### 📂 Dataset

- **Source File:** `data/aislamientos.csv`

---

### 🏗️ Project Structure

- **Source Path:** `ECS/Streamlit_Snowflake/resources/ChartPipeline/README.md`
- **Optimization Guide:** `ECS/Streamlit_Snowflake/resources/ChartPipeline/optimization-guide.md`
- **Optimization Summary:** `ECS/Streamlit_Snowflake/resources/ChartPipeline/optimization-summary.md`

---

### 📐 Feature: Table "Insulation Progress"

| **Requirement**                 | **Value**                                                                 |
|---------------------------------|---------------------------------------------------------------------------|
| **Table Library**               | `@tanstack/react-virtual@3.31.9` + `@tanstack/react-table@8.x`           |
| **Target Tab**                  | `"INSULATION PROGRESS CONTROL"`                                                    |
| **Position in Tab**             | Below the existing dashboard (not inside it)                              |
| **Embedded Inside Dashboard?**  | ❌ No — it must remain a separate component                               |
| **Vertical Scrolling Required** | ✅ Yes — enable with `overflowY: auto`                                    |
| **Filter Panel Integration**    | ✅ Yes — table **must respond to Area and Subsystem filter selections**   |

---

### 🔄 Filtering Requirement

- When a user selects **Area** or **Subsystem** in the **Filter Panel**, the table must **dynamically and correctly filter** its rows accordingly.
- ⚠️ **Do not break or duplicate filter logic.** Filtering must apply *once*, based on current global filter state.
- The filter state **must maintain correct relationships** between dataset fields (e.g., Area → Subsystem → TAG_LOOP).

---

### 📝 Notes

- UI/UX must **exactly match existing components**:
    - Layout
    - Styling (colors, padding, spacing)
    - Responsiveness
    - Component hierarchy and structure
- Optimize performance for large datasets (1,500+ rows, 17+ columns)
- Use `useMemo`, `useCallback`, and `React.memo` where appropriate
- Avoid excessive recalculations and preserve correct filter → table flow

---
