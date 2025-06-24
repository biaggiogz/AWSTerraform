## ⚙️ Request: ADD THIRD COLUMN CALL "DONE ITEMS " FOR EXISTITNG  TABLE CALL "Subsystem Precommissioning"

- File target: SubsystemPrecommissioning.js

### 🏗️ Project Structure

- **Source Path:** `ECS/Streamlit_Snowflake/resources/ChartPipeline/README.md`
- **Optimization Guide:** `ECS/Streamlit_Snowflake/resources/ChartPipeline/optimization-guide.md`
- **Optimization Summary:** `ECS/Streamlit_Snowflake/resources/ChartPipeline/optimization-summary.md`

### ⚠️ Implementation Principle

- ✅ Prioritize **accuracy and logic integrity** over implementation speed.
- ❗ **Do not modify** any existing filter logic, table behavior, or dashboard state beyond the scope defined here.
- Use `useMemo` to memoize global metric computation—trigger recalculation only when the raw dataset changes.
- Avoid unnecessary re-renders by isolating this display from all filter state.

### 📂 Dataset

- **Source File:**
    - `data/aislamiento.csv`
---

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
  
- ⚠️ DONT CREATE OTHER COLUMNS

## Calculation third column 

NAME COLUMNS =["Advance Spacer","Advance Insolation","Advance Sheet Metal","Advance Boxes","Advance to Finish"]

| COLUMNS        | Condition                                                                                                                                                                       | Meaning                                                                                       |
|:---------------|:--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|:----------------------------------------------------------------------------------------------|
| **DONE ITEMS** | `df[df[["Advance Spacer","Advance Insolation","Advance Sheet Metal","Advance Boxes","Advance to Finish"]].astype(float).eq(1).all(axis=1)].groupby("SUBSYSTEM")["ISO"].count()` | Total items where all NAME COLUMNS = 1, grouped by SUBSYSTEM. Counted using the "ISO" column. |

