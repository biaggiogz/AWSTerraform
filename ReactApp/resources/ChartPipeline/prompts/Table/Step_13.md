## ⚙️ Request: Multi-level headers AND Remapping Columns
  - Redesign HEADERS Table "Control Instruments" on Tab `"INSTRUMENTS REPORT"`
  - Use performance and features from table Loop Test Control - Precommissioning from tab LOOP TESTING PROGRESS REPORT

➡️ Maintain Architecture • Optimize Performance • Ensure Filter Functionality
➡️ Optimize Performance (copy performance from table Insulation Progress from tab INSULATION PROGRESS REPORT)
➡️ Ensure Filter Functionality
---

### COLUMNS MAPPING[Table <-> Dataset]:
  - ISOMETRIC:ISOMETRIC
  - WELDING FW+SW:TP 100% FW+SW
  - SUBSYSTEM:SUBSYSTEM
  - CRONO:CRONO
  - PRIORITY:PRIORITY
  - HITO:HITO
  - REINSTATEMENT:REINSTATEMENT
  - INSULATION:INSULATION
  - SIEMSA:SIEMSA
  - TECHNIP:TECHNIP
  - TEST PACK:TEST PACK
  - DELIVERY PROGRESS BY TEN:DELIVERY PROGRESS 100% BY TEN 
  - READY TO INSTALL INST (SIEMSA):READY TO INSTALL INST (SIEMSA)
  - QTY INST:QTY INST
  - SCOPE BY TIEGA-TMI:SCOPE BY TIEGA-TMI
  - SCOPE BY SIEMSA:SCOPE BY SIEMSA
  - INSTALLED (SIEMSA):INSTALLED (SIEMSA)
  - INSTALLED (TEIGA-TMI):INSTALLED (TEIGA-TMI)
  - TOTAL INSTALLED:TOTAL INSTALLED
  - TRAC (YES & NOT):TRAC (YES & NOT)
  - TAG CIRCUITO TRACEADO:Tag Circuito Traceado

### DESIGN HEADERS

#### Multi-Level Header Structure Breakdown:

**LEVEL 1 (Main Groups):**
1. `PROGRESS WELD ISO` (spans 2 columns)
2. `MECHANICAL COMPLETION (MC) REALISTIC DATE BY SUBSYSTEM` (spans 8 columns)
3. `PROGRESS INST & ISO` (spans 9 columns)
4. `TRACING & INSULATION` (spans 2 columns)

**LEVEL 2 (Sub Groups):**
- Under `PROGRESS WELD ISO`: No sub-groups
- Under `MECHANICAL COMPLETION`: 
  - `PLANNING DELIVERY TO ADISSEO` (spans 3 columns)
  - `TEIGA-TMI` (spans 3 columns) 
  - `SIEMSA` (spans 1 column)
  - `TECHNIP` (spans 1 column)
- Under `PROGRESS INST & ISO`:
  - `PROGRESS ISO & TEST PACK` (spans 3 columns)
  - `INSTRUMENT DISTRIBUTION` (spans 3 columns)
  - `INSTRUMENT INSTALLED` (spans 3 columns)
- Under `TRACING & INSULATION`:
  - `SIEMSA` (spans 2 columns)

**LEVEL 3 (Individual Columns - Final Row Headers):**
```
ISOMetric | WELDING FW+SW | SUBSYSTEM | CRONO | PRIORITY | HITO | REINSTATEMENT | INSULATION | SIEMSA | TECHNIP | TEST PACK | DELIVERY PROGRESS BY TEN | READY TO INSTALL INST (SIEMSA) | QTY INST | SCOPE BY TIEGA-TMI | SCOPE BY SIEMSA | INSTALLED (SIEMSA) | INSTALLED (TEIGA-TMI) | TOTAL INSTALLED | TRAC (YES & NOT) | TAG CIRCUITO TRACEADO
```

#### ASCII Visual Reference:
```
       ┌─────────────────────────────────────────────────────┬─────────────────────────────────────────────┬───────────────────────────────────────────────────┬─────────────────────────────────────────────────────────────────────┬───────────────────────────┐            
       │                                                     │     MECHANICAL COMPLETION (MC) REALISTIC    │                                                   │                      PROGRESS INST & ISO                            │ TRACING & INSULATION      │            
       │                                                     │              DATE BY SUBSYSTEM              │                                                   │                                                                     │                           │            
       ├────────────────────────┬────────────────────────────┼──────────────────────────────┬──────┬───────┼───────────────────────────────────────────────────┼───────────────────────────┬─────────────────────────────────────────┼───────────────────────────┼            
       │                        │                            │                              │      │       │           PROGRESS ISO & TEST PACK                │                           │            INSTRUMENT INSTALLED         │         SIEMSA            │            
       │   PROGRESS WELD ISO    │PLANNING DELIVERY TO ADISSEO│         TEIGA-TMI            │SIEMSA│TECHNIP│                                                   │   INSTRUMENT DISTRIBUTION │                                         │                           │            
       ├──────────┬─────────────┼───────────┬─────┬──────────┼────┬─────────────┬───────────┼──────┼───────┼──────────┬──────────────────┬─────────────────────┼────────┬─────────┬────────┼──────────┬──────────────────┬───────────┼───────────────────────────┼            
       │ISOMETRIC │WELDING FW+SW│ SUBSYSTEM │CRONO│ PRIORITY │HITO│REINSTATEMENT│INSULATION │SIEMSA│TECHNIP│ TEST PACK│DELIVERY PROGRESS │READY TO INSTALL INST│QTY INST│SCOPE BY │SCOPE BY│INSTALLED │   INSTALLED      │   TOTAL   │    TRAC      TAG CIRCUITO │            
       │          │             │           │     │          │    │             │           │      │       │          │     BY TEN       │       (SIEMSA)      │        │TIEGA-TMI│ SIEMSA │ (SIEMSA) │  (TEIGA-TMI)     │ INSTALLED │ (YES & NOT)    TRACEADO   │            
       └──────────┴─────────────┴───────────┴─────┴──────────┴────┴─────────────┴───────────┴──────┴───────┴──────────┴──────────────────┴─────────────────────┴────────┴─────────┴────────┴──────────┴──────────────────┴───────────┴───────────────────────────┘            

```



---

### Filter columns[Filter Panel:Dataset]
  - Isometric:ISOMETRIC
  - Subsystem:SUBSYSTEM

### ⚠️ Implementation Principle

- ✅ Prioritize **accuracy and logic integrity** over speed of implementation.
- ❗ **Do not modify** any existing chart behavior, filtering, or state.
- ❗ **All table and chart filter logic must remain untouched**.
---

### 📂 Dataset

- **Source File:** `data/control_inst_by_isos.csv`

---

### 🏗️ Project Structure

- **Source Path:** `ReactApp/resources/ChartPipeline/README.md`
- **Optimization Guide:** `ReactApp/resources/ChartPipeline/optimization-guide.md`
- **Flow data:** `ReactApp/resources/ChartPipeline/FLOW_DATA.md`

---

### 📐 Feature: Table "Control Instruments"

| **Requirement**                 | **Value**                                                                   |
|---------------------------------|-----------------------------------------------------------------------------|
| **Table Library**               | `@tanstack/react-virtual@3.31.9` + `@tanstack/react-table@8.x`              |
| **Target Tab**                  | `"INSULATION PROGRESS CONTROL"`                                             |
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
