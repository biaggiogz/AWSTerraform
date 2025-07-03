## ⚙️ Request: Add Two-Metrics below to the current  Vertical Stacked Bar Chart 
---
➡️ Maintain Architecture • Optimize Performance • Ensure Filter Functionality

### 📂 Dataset Details

- **CSV Source**: `data/aislamientos.csv`
- **Mapped Columns [Dashboard ↔ Dataset]**:
  - `Isometric` ↔ `ISO`
  - `Test Pack` ↔ `TP`
  - `Design Area` ↔ `Area`
  - `Subsystem` ↔ `SUBSYSTEM`
  - `COD` ↔ `COD`
  - `HAS_TRACING` ↔ `TRACING YES & NOT`
  - `TRACING` ↔ `TAG TRACING`
  - `Mleq` ↔ `Mleq`
  - `Advance Spacer` ↔ `Avance Distanciadores`
  - `Advance Insolation` ↔ `Avance Aislamiento`
  - `Advance Sheet Metal` ↔ `Avance Chapa`
  - `Advance Boxes` ↔ `Avance Cajas`
  - `Advance to Finish` ↔ `Avance Rematar`
  - `Advance Mleq totals` ↔  `Avance Mleq totales`

---

### 🏗️ Project Structure

- **Source Path:** `ECS/Streamlit_Snowflake/resources/ChartPipeline/README.md`
- **Optimization Guide:** `ECS/Streamlit_Snowflake/resources/ChartPipeline/optimization-guide.md`
- **Optimization Summary:** `ECS/Streamlit_Snowflake/resources/ChartPipeline/optimization-summary.md`


### Example Graph

```
✅ Add DONE ITEMS
✅ Add PENDING ITEMS 

┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                               ┌─┐        ┌─┐                                                            │
│             │                                 └─┘ done   └─┘ pending                                                    │
│        100% │ ┌─────────┐        ┌─────────┐         ┌─────────┐      ┌─────────┐      ┌─────────┐     ┌─────────┐      │
│             │ ┼─────────┼        │         │         │         │      │         │      │         │     │         │      │
│             │ │         │        │         │         │         │      │         │      │         │     │         │      │
│             │ │         │        │         │         │         │      │         │      │         │     │         │      │
│             │ │         │        │         │         │         │      │         │      │         │     │         │      │
│             │ │         │        │         │         │         │      │         │      │         │     ┼─────────┼      │
│             │ │         │        │         │         │         │      │         │      │         │     │         │      │
│             │ │         │        │         │         │         │      ┼─────────┤      │         │     │         │      │
│             │ │         │        │         │         │         │      │         │      │         │     │         │      │
│             │ │         │        │         │         │         │      │         │      │         │     │         │      │
│             │ │         │        │         │         │         │      │         │      │         │     │         │      │
│             │ │         │        ┼─────────┤         │         │      │         │      │         │     │         │      │
│             │ │         │        │         │         │         │      │         │      │         │     │         │      │
│             │ │         │        │         │         │         │      │         │      │         │     │         │      │
│         50% │ │         │        │         │         │         │      │         │      │         │     │         │      │
│             │ │         │        │         │         │         │      │         │      │         │     │         │      │
│             │ │         │        │         │         │         │      │         │      │         │     │         │      │
│             │ │         │        │         │         │         │      │         │      │         │     │         │      │
│             │ │         │        │         │         │         │      │         │      │         │     │         │      │
│             │ │         │        │         │         │         │      │         │      ┼─────────┤     │         │      │
│             │ │         │        │         │         │         │      │         │      │         │     │         │      │
│             │ │         │        │         │         ┼─────────┤      │         │      │         │     │         │      │
│             │ │         │        │         │         │         │      │         │      │         │     │         │      │
│             │ │         │        │         │         │         │      │         │      │         │     │         │      │
│             │ │         │        │         │         │         │      │         │      │         │     │         │      │
│             │ │         │        │         │         │         │      │         │      │         │     │         │      │
│             │ │         │        │         │         │         │      │         │      │         │     │         │      │
│             │ │         │        │         │         │         │      │         │      │         │     │         │      │
│          0% └─┴─────────┴────────┴─────────┴─────────┴─────────┴──────┴─────────┴──────┴─────────┴─────┴─────────┴────  │
│              Spacer Advance  Insulation Advance  Sheet Metal Advance  Boxes Advance  Finish Advance  Mleq Total Advance │
│┌───────────────┌───────┐──────────┌───────┐────────────┌──────┐─────────┌──────┐─────────┌──────┐─────────┌─────┐─────┐ │
││DONE ITEMS     │ 215965│          │ 5549  │            │5558  │         │4962  │         │ 458  │         │5846 │     │ │
│└───────────────└───────┘──────────└───────┘────────────└──────┘─────────└──────┘─────────└──────┘─────────└─────┘─────┘ │
│┌───────────────┌───────┐──────────┌───────┐────────────┌──────┐─────────┌──────┐─────────┌──────┐─────────┌─────┐─────┐ │
││PENDING ITEMS  │   2   │          │ 19865 │            │18965 │         │19230 │         │22463 │         │24588│     │ │
│└───────────────└───────┘──────────└───────┘────────────└──────┘─────────└──────┘─────────└──────┘─────────└─────┘─────┘ │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘


```

### 🧭 Tab
**[INSULATION PROGRESS CONTROL]**

---

### ⚠️ Implementation Principles

- ✅ Prioritize **accuracy and logic integrity** over speed of implementation.
- ❗ **Do not modify** any existing chart behavior, filtering, or state.
- ❗ **All table and chart filter logic must remain untouched**.
---


### 🎯 Goal

- ADD METRIC "DONE ITEMS" AND "PENDING ITEMS" to the current **vertical stacked bar chart** as in below example graph:
- The position of these metrics must be located as showed in the example graph, exactly in that positions visually 
---

### Metrics


**Categories**: ["Advance Spacer", "Advance Insulation", "Advance Sheet Metal", "Advance Boxes", "Advance to Finish", "Advance Mleq totals"]


### Standard Categories (First 5)
| Metric            | Formula                                                                                                                     | Meaning                     |
|:------------------|:----------------------------------------------------------------------------------------------------------------------------|:----------------------------|
| **DONE ITEMS**    | `df[df[category_column].astype(float) == 1]["ISO"].count()`                                                                 | Items with 100% completion  |
| **PENDING ITEMS** | `df[(df[category_column].astype(float) < 1) \| (df[category_column].isna()) \| (df[category_column] == "")]["ISO"].count()` | Items with <100% completion |

### Special Category: "Advance Mleq totals"
| Metric            | Formula                                              | Format         |
|:------------------|:-----------------------------------------------------|:---------------|
| **DONE ITEMS**    | `df["Advance Mleq totals"].sum()`                    | `#,##0.00 "m"` |
| **PENDING ITEMS** | `df["Mleq"].sum() - df["Advance Mleq totals"].sum()` | `#,##0.00 "m"` |

**Note**: Only "Advance Mleq totals" uses sum calculations with custom "m" format. All other categories use count calculations with standard number format.



### Filter Panel

- The current filter panel on tab "INSULATION PROGRESS CONTROL" must use Design Area and Subsystem from the Dataset 

### 📐 Key Requirements

| Feature        | Requirement                                              |
|----------------|----------------------------------------------------------|
| Responsiveness | Fully responsive layout and labels on all screen sizes   |
| Legend         | Use the current legend to clarify color-to-label mapping |
| Accessibility  | Adequate contrast and font size for readability          |                                                                        
| Label Layout	  | Headers show only metric value, not the full name        |


---

### 📝 Implementation Notes

- **Library:** `current libraries from chart IsolationProgressControlChart.optimized.js`
 - Define distinct colors using `backgroundColor`, `borderColor`, `borderWidth`
    - The bar must be capable by filter by Design Area and Subsystem
  
---

### 📌 Reminders

- Delete any   existing **dashboard ** present in TAB "INSULATION PROGRESS CONTROL"
- UI/UX must **exactly match existing components**:
  - Layout
  - Styling (colors, padding, spacing)
  - Responsiveness
  - Component hierarchy and structure

### Final Cleanup

    🧹 Delete any existing charts in tab INSULATION PROGRESS CONTROL

    🧪 Test:

        Filtering response

        Label accuracy

        Mobile layout and desktop spacing

        UI style and alignment consistency
