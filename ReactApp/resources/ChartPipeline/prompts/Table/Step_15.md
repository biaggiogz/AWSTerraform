## ⚙️ Request: 
- Reconfigure Multi-Level Header Structure breakdown for  Table "Control Instruments" on Tab `"INSTRUMENTS REPORT"`
- Assign group of colors to the HEADERS Hierarchy Table "Control Instruments" on Tab `"INSTRUMENTS REPORT"`
- Don't modify performance, features and even layout

➡️ Maintain Architecture • Optimize Performance 
---

### COLUMNS MAPPING COLORS[Table <-> Color]:
- ISOMETRIC:#8DBCC7
- WELDING FW+SW:#8DBCC7
- SUBSYSTEM:#EAE4D5
- CRONO:#EAE4D5
- PRIORITY:#EAE4D5
- HITO:#A9B5DF
- REINSTATEMENT:#A9B5DF
- INSULATION:#A9B5DF
- SIEMSA:#A9B5DF
- TECHNIP:#A9B5DF
- TEST PACK:#C9E6F0
- DELIVERY PROGRESS BY TEN:#C9E6F0
- READY TO INSTALL INST (SIEMSA):#C9E6F0
- QTY INST:#D4BEE4
- SCOPE BY TIEGA-TMI:#D4BEE4
- SCOPE BY SIEMSA:#D4BEE4
- INSTALLED (SIEMSA):#D4BEE4 + 5% dark
- INSTALLED (TEIGA-TMI):#D4BEE4 + 5% dark
- TOTAL INSTALLED:#D4BEE4 + 5% dark
- TRAC (YES & NOT):#EEF7FF
- TAG CIRCUITO TRACEADO:#EEF7FF
### DESIGN HEADERS

#### HEADERS MAPPING COLORS[HEADERS<->COLORS]:

**LEVEL 1 (Main Groups):**
- `PROGRESS WELD ISO`: #8DBCC7 + 15% dark
- `PLANNING DELIVERY TO ADISSEO`: #EAE4D5 + 15% dark
- `MECHANICAL COMPLETION (MC) REALISTIC DATE BY SUBSYSTEM`: #A9B5DF + 15% dark
- `PROGRESS ISO & TEST PACK`: #C9E6F0 + 15% dark
- `PROGRESS INST & ISO`: #D4BEE4 + 15% dark
- `TRACING & INSULATION`:  #EEF7FF + 15% dark

**LEVEL 2 (Sub Groups):**

- `TEIGA-TMI`: #A9B5DF + 10% dark
- `SIEMSA`: #A9B5DF + 10% dark
- `TECHNIP`: #A9B5DF + 10% dark
- `INSTRUMENT DISTRIBUTION`: #D4BEE4 + 10% dark
- `INSTRUMENT INSTALLED`: #D4BEE4 + 10% dark
- `SIEMSA`: #EEF7FF + 10% dark



#### Multi-Level Header Structure Breakdown:

**LEVEL 1 (Main Groups):**
1. `PROGRESS WELD ISO` (spans 2 columns)
2. `PLANNING DELIVERY TO ADISSEO` (spans 3 columns)
3. `MECHANICAL COMPLETION (MC) REALISTIC DATE BY SUBSYSTEM` (spans 5 columns)
4. `PROGRESS ISO & TEST PACK` (spans 3 columns)
5. `PROGRESS INST & ISO` (spans 6 columns)
6. `TRACING & INSULATION` (spans 2 columns)

**LEVEL 2 (Sub Groups):**
- Under `PROGRESS WELD ISO`: No sub-groups
- Under `PLANNING DELIVERY TO ADISSEO`: No sub-groups
- Under `MECHANICAL COMPLETION (MC) REALISTIC DATE BY SUBSYSTEM`:
    - `TEIGA-TMI` (spans 3 columns)
    - `SIEMSA` (spans 1 column)
    - `TECHNIP` (spans 1 column)
- Under `PROGRESS ISO & TEST PACK`: No subs-groups
- Under `PROGRESS INST & ISO`:
    - `INSTRUMENT DISTRIBUTION` (spans 3 columns)
    - `INSTRUMENT INSTALLED` (spans 3 columns)
- Under `TRACING & INSULATION`:
    - `SIEMSA` (spans 2 columns)

**LEVEL 3 (Individual Columns - Final Row Headers):**
```
ISOMETRIC | WELDING FW+SW | SUBSYSTEM | CRONO | PRIORITY | HITO | REINSTATEMENT | INSULATION | SIEMSA | TECHNIP | TEST PACK | DELIVERY PROGRESS BY TEN | READY TO INSTALL INST (SIEMSA) | QTY INST | SCOPE BY TIEGA-TMI | SCOPE BY SIEMSA | INSTALLED (SIEMSA) | INSTALLED (TEIGA-TMI) | TOTAL INSTALLED | TRAC (YES & NOT) | TAG CIRCUITO TRACEADO
```

#### ASCII Visual Reference:
```
                                                                                                                                                                                                                                                                   
                                                                                                                                                                                                                                                                   
     ┌─────────────────────────────────────────────────────┬─────────────────────────────────────────────┬───────────────────────────────────────────────────┬─────────────────────────────────────────────────────────────────────┬───────────────────────────┐   
     │                                                     │     MECHANICAL COMPLETION (MC) REALISTIC    │                                                   │                      PROGRESS INST & ISO                            │ TRACING & INSULATION      │   
     │                                                     │              DATE BY SUBSYSTEM              │                                                   │                                                                     │                           │   
     ├────────────────────────┬────────────────────────────┼──────────────────────────────┬──────┬───────┼───────────────────────────────────────────────────┼───────────────────────────┬─────────────────────────────────────────┼───────────────────────────┼   
     │                        │                            │                              │      │       │           PROGRESS ISO & TEST PACK                │                           │            INSTRUMENT INSTALLED         │         SIEMSA            │   
     │   PROGRESS WELD ISO    │PLANNING DELIVERY TO ADISSEO│         TEIGA-TMI            │SIEMSA│TECHNIP│                                                   │   INSTRUMENT DISTRIBUTION │                                         │                           │   
     ├──────────┬─────────────┼───────────┬─────┬──────────┼────┬─────────────┬───────────┼──────┼───────┼──────────┬──────────────────┬─────────────────────┼────────┬─────────┬────────┼──────────┬──────────────────┬───────────┼─────────────┬─────────────┼   
     │ISOMETRIC │WELDING FW+SW│ SUBSYSTEM │CRONO│ PRIORITY │HITO│REINSTATEMENT│INSULATION │SIEMSA│TECHNIP│ TEST PACK│DELIVERY PROGRESS │READY TO INSTALL INST│QTY INST│SCOPE BY │SCOPE BY│INSTALLED │   INSTALLED      │   TOTAL   │    TRAC     │TAG CIRCUITO │   
     │          │             │           │     │          │    │             │           │      │       │          │     BY TEN       │       (SIEMSA)      │        │TIEGA-TMI│ SIEMSA │ (SIEMSA) │  (TEIGA-TMI)     │ INSTALLED │ (YES & NOT) │  TRACEADO   │   
     └──────────┴─────────────┴───────────┴─────┴──────────┴────┴─────────────┴───────────┴──────┴───────┴──────────┴──────────────────┴─────────────────────┴────────┴─────────┴────────┴──────────┴──────────────────┴───────────┴─────────────┴─────────────┘   
                                                                                                                                                                                                                                                                   
                                                                                                                                                                                                                                                                             

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
