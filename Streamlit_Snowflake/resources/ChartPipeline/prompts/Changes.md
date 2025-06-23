## ⚙️ Request: Replace Panel "Area Contribution by Advance" by  showing total items, done items and pending items by Subsystem (use existitng  Layout Type: Vertical Grid Layout with Stacked Sections)


## Project Structure

- **Source Path:** `ECS/Streamlit_Snowflake/resources/ChartPipeline/README.md`
- **Optimization Guide:** `ECS/Streamlit_Snowflake/resources/ChartPipeline/optimization-guide.md`
- **Optimization Summary:** `ECS/Streamlit_Snowflake/resources/ChartPipeline/optimization-summary.md`

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

## Metrics

NAME_METRIC =["Advance Spacer","Advance Insolation","Advance Sheet Metal","Advance Boxes","Advance to Finish","Advance Mleq totals"]

| Metric            | Condition                                                                      | Meaning                                 |
|:------------------|:-------------------------------------------------------------------------------|:----------------------------------------|
| **TOTAL ITEMS**   | `df.groupby("SUBSYSTEM")["ISO"].count()`                                       | Total Items for each Subsystem.         |
| **ITEMS DONE**    | `df[df["NAME_METRIC"].astype(float) == 1].groupby("SUBSYSTEM")["ISO"].count()` | Total Items DONE for each Subsystem.    |
| **ITEMS PENDING** | `[df["NAME_METRIC"].astype(float) < 1].groupby("SUBSYSTEM")["ISO"].count()`    | Total Items PENDING for each Subsystem. |

## Configuration of Layout

- Name Panel Dashboard: "Progress Items"

- Use existiting Layout Type: Vertical Grid Layout with Stacked Sections
- Header: SUBSYSTEM: TOTAL ITEMS
- VStack: Vertical stack container holding all metric blocks ( in total are 6 blocs, each block represents one metric)
- MetricBlock components: Each containing a Section title (centered) and SimpleGrid with 3 columns for subsystem count items bars
- 6 metric sections stacked vertically (Spacer, Insulation, Sheet Metal, Boxes, Finish, Mleq Total)
- Each section displays subsystem data in a 3-column grid
- Individual bars show count items done, completed  progress with color-coded segments
- Each colored with two segment [DONE, PENDING]
- Color "#1DE9B6" for DONE, Color ""#FF168B"" for PENDING
- The chart should remain visually clear and interactive, even with a large number of subsystems


### VERY IMPORTANT

1. Filter Design Area and Subsytem must be from dataset test_of_lazos_updated.csv when user is in Dashboard "LOOP TEST PROGRESS"
2. Don't touch the filter of the other presents dashboard

### 🧩 Panel Structure Overview

- Panel Title: `"Progress Items"`
- Panel appears on the right side of the screen (toggle-able)
- Toggle switch: allows user to switch between:
  - `"Progress Items"` (existing)
  - `"Subsystem Contribution by Advance"` (this is already implemented)

### 📐 Layout Requirements

- ✅ Each metric block must contain **a grid with 3 columns**
- ✅ Each cell is a **mini stacked bar**:
  - Green = `% Complete` (`#1DE9B6`)
  - Magenta = `% Incomplete` (`#FF168B`)
  - Black border around each bar
- ✅ % Labels must appear inside each bar, contrast adjusted
- 🔁 Grid must be **responsive** and wrap rows if >3 items
- 🧠 DO NOT show only one bar labeled `"Unknown"` — that is incorrect


### 💡 Code Layout Hints

- Use `<SidebarMetricContributionPanel />` as your base
- Use `display: grid` and `gridTemplateColumns: repeat(3, 1fr)`
- Reuse data from `IsolationProgressControlChart`
- Do not modify data or logic — visual rendering only

### 🧪 Testing Environment

- **URL:** `http://localhost:3000/`
- Verify that:
  - ✅ Detaching and **resizing the table works** across screen sizes.
  - ✅ Columns remain **visible** and adapt to container size.
  - ✅ Filters and **dashboard interactions remain functional**.