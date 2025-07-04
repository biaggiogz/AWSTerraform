## ⚙️ Request:
- CREATE TABLE  "Details Instruments" on Tab `"INSTRUMENTS REPORT"`
- POSITION TABLE:  BELOW OF TABLE "Control Instruments"
- Use performance and features from optimization-guide.md

➡️ Maintain Architecture • Optimize Performance • Ensure Filter Functionality
➡️ Optimize Performance (copy performance from table "Control Instruments")
➡️ Ensure Filter Functionality
---

### ⚠️ Implementation Principle

- Dont cut off visually the table
- The table cannot exceed the width of viewport
- ✅ Prioritize **accuracy and logic integrity** over speed of implementation.
- ❗ **Do not modify** any existing chart behavior, filtering, or state.
- ❗ **All table and chart filter logic must remain untouched**.
---

### 📂 Dataset

- **Source File:** `data/details_inst.csv`

---

### 🏗️ Project Structure

- **Source Path:** `ReactApp/resources/ChartPipeline/README.md`
- **Optimization Guide:** `ReactApp/resources/ChartPipeline/optimization-guide.md`
- **Flow data:** `ReactApp/resources/ChartPipeline/FLOW_DATA.md`

---

### COLUMNS MAPPING[Table <-> Dataset]:
- SUBSYSTEM:SUBSYSTEM
- TEST PACK:TEST PACK
- MOUNTING ON ISO/EQUI/PACK:MOUNTING ON ISO/EQUI/PACK
- ON:ON
- TAG INST:TAG INST
- INSTRUMENT TYPE:INSTRUMENT TYPE
- SCOPE BY:SCOPE BY
- TEIGA-TMI:TEGIMA-TMI
- INSTALLED (TEIGA-TMI):INSTALLED (TEIGA-TMI)
- DATE1:DATE1
- SIEMSA:SIEMSA
- INSTALLED (SIEMSA):INSTALLED (SIEMSA)
- DATE2:DATE2
- IT HAS SIGNAL:WITH & WITHOUT SIGNAL



#### EXPECTED OUTCOME TABLE :
```
                                                                                                                                                                       
 ┌───────────┬──────────┬──────────────────────────┬────┬─────────┬──────────┬──────────┬──────────┬────────────┬──────┬───────┬───────────┬───────┬──────────────┐ 
 │ SUBSYSTEM │ TEST PACK│ MOUNTING ON ISO/EQUI/PACK│ ON │TAG INST │INSTRUMENT│ SCOPE BY │TEGIMA-TMI│ INSTALLED  │ DATE1│ SIEMSA│ INSTALLED │ DATE2 │IT HAS SIGNAL │ 
 │           │          │                          │    │         │   TYPE   │          │          │ (TEIGA-TMI)│      │       │ (SIEMSA)  │       │              │ 
 └───────────┴──────────┴──────────────────────────┴────┴─────────┴──────────┴──────────┴──────────┴────────────┴──────┴───────┴───────────┴───────┴──────────────┘ 
                                                                                                                                                                    
```

---

### Filter columns[Filter Panel:Dataset]
- Isometric:ISOMETRIC
- Subsystem:SUBSYSTEM



### 📐 Feature: Table "Control Instruments"

| **Requirement**                 | **Value**                                                                   |
|---------------------------------|-----------------------------------------------------------------------------|
| **Table Library**               | `@tanstack/react-virtual@3.31.9` + `@tanstack/react-table@8.x`              |
| **Target Tab**                  | `"INTRUMENTS REPORT"`                                                       |
| **Position in Tab**             | Below the existing dashboard (not inside it)                                |
| **Embedded Inside Dashboard?**  | ❌ No — it must remain a separate component                                  |
| **Vertical Scrolling Required** | ✅ Yes — enable with `overflowY: auto`                                       |
| **Filter Panel Integration**    | ✅ Yes — table **must respond to Isometric and Subsystem filter selections** |

---

### 🔄 Filtering Requirement

- When a user selects **Isometric** or **Subsystem** in the **Filter Panel**, the table must **dynamically and correctly filter** its rows accordingly.
- ⚠️ **Do not break or duplicate filter logic.** Filtering must apply *once*, based on current global filter state.
- The filter state **must maintain correct relationships** between dataset fields (e.g., Isometric <--> Subsystem ).

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
