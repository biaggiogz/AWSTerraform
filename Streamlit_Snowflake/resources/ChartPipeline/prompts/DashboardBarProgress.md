## ⚙️ Request: Create a Two-Category Vertical Stacked Bar Chart with inside Percentage Labels
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
✅ You may reorganize and group metrics visually as shown in the example
✅ The design must align with the styling and layout rules of other dashboard components
✅ EACH METRIC MUST SHOW ITS VALUE 

-----------------------------------------------------------------------------------
advance_spacer | advance_insolation | advance_sheet_metal | advance_boxes | advance_to_finish | m_advance_mleq_total
-----------------------------------------------------------------------------------

 ------------  ------------  ------------  ------------  ------------  ------------
|   42%     | |   42%     | |   42%     | |   42%     | |   42%     | |   42%     |
|           | |           | |           | |           | |           | |           |
|           | |           | |           | |           | |           | |           |
|-----------| |-----------| |-----------| |-----------| |-----------| |-----------|
|   58%     | |   58%     | |   58%     | |   58%     | |   58%     | |   58%     |
|           | |           | |           | |           | |           | |           |
|           | |           | |           | |           | |           | |           |
|           | |           | |           | |           | |           | |           |
 ------------  ------------  ------------  ------------  ------------  ------------


```

### 🧭 Tab
**[ISOLATION PROGRESS CONTROL]**

---

### ⚠️ Implementation Principles

- ✅ Prioritize accuracy and visual clarity
- ✅ All chart and label logic must be responsive and accessible
- ✅ The filter panel must be filtering  the graph

---


### 🎯 Goal

Replicate the **vertical stacked bar chart** as shown in example graph:

- Each bar represents a **category** (e.g., `"Spacer Advance"`, `"Insulation Advance"`, etc.)
- Each bar is split into **two colored segments** (e.g., **magenta** and **green**) representing **complementary percentages** summing to 100%
- Each segment displays its **percentage label** centered within it
- All bars have consistent **color mapping** and a **bold border**
- The graph must align the bars horizontally 
- The header sections where is located the metrics,  is necessary see the value of each metric

---

### Metrics

#### Constants Metrics (THESE METRICS ARE NOT REPONSIVE, NOT FILTERED)

- C_Mleq = df['Mleq'].sum()
- C_Advance Spacer = 0
- C_Advance Insolation= 25
- C_Advance Sheet Metal= 40
- C_Advance Boxes= 25
- C_Advance to Finish= 10

#### Weighted averages completation is calculated as wrote below. These metrics are percentage (THESE METRICS ARE RESPONSIVE, THE VALUE CHANGE EVERY TIME THE USER USE THE FILTER PANEL)

$$
\text{Advance Metric} = \frac{\sum (\text{Mleq} \times \text{Advance Column})}{C_{\text{Mleq}}}
$$


computing weighted averages:

```python
# Percentage-formatted metrics
advance_spacer = (df['Mleq'] * df['Advance Spacer']).sum() / C_Mleq       # Format: Percentage
advance_insolation = (df['Mleq'] * df['Advance Insolation']).sum() / C_Mleq  # Format: Percentage
advance_sheet_metal = (df['Mleq'] * df['Advance Sheet Metal']).sum() / C_Mleq  # Format: Percentage
advance_boxes = (df['Mleq'] * df['Advance Boxes']).sum() / C_Mleq         # Format: Percentage
advance_to_finish = (df['Mleq'] * df['Advance to Finish']).sum() / C_Mleq  # Format: Percentage

# Metric in custom "m" format: #,##0.00 "m"
m_advance_mleq_total = df['Advance Mleq Totals'].sum()                      # Format: #,##0.00 "m"

# Percentage of total
a_advance_mleq_total= m_advance_mleq_total / C_Mleq                       # Format: Percentage

```


### Filter Panel

- The current filter panel on tab "ISOLATION PROGRESS CONTROL" must use Design Area and Subsystem from the Dataset 

### 📐 Key Requirements

| Feature        | Requirement                                                                        |
|----------------|------------------------------------------------------------------------------------|
| Chart Type     | Vertical stacked bar chart (100% stacked, two segments per bar)                    |
| Categories     | One bar per main category (e.g., `"Spacer Advance"`, `"Insulation Advance"`)       |
| Segments       | Two segments per bar (e.g., `"Complete"` / `"Incomplete"`)                         |
| Colors         | High-contrast, visually distinct colors (e.g., magenta `#FF168B`, green `#1DE9B6`) |
| Borders        | Each segment has a clear, bold border (`borderColor: "#000"`, `borderWidth: 2`)    |
| Data Labels    | Percentage labels centered inside each segment, readable on all backgrounds        |
| Responsiveness | Fully responsive layout and labels on all screen sizes                             |
| Legend         | Optional: legend to clarify color-to-label mapping                                 |
| Accessibility  | Adequate contrast and font size for readability                                    |                                                                        
| Label Layout	  | Headers show only metric value, not the full name                                  |


---

### 📝 Implementation Notes

- **Library:** `current libraries from chart TestPackProgressChart.optimized.js`
    - Enable `stacked: true` for both `x` and `y` axes
    - Use `chartjs-plugin-datalabels` to display percentage labels centered inside each segment
    - Define distinct colors using `backgroundColor`, `borderColor`, `borderWidth`
    - The bar must be capable by filter by Design Area and Subsystem
  
---

### 📌 Reminders

- Delete any   existing **dashboard ** present in TAB "ISOLATION PROGRESS CONTROL"
- UI/UX must **exactly match existing components**:
  - Layout
  - Styling (colors, padding, spacing)
  - Responsiveness
  - Component hierarchy and structure

### Final Cleanup

    🧹 Delete any existing charts in tab ISOLATION PROGRESS CONTROL

    🧪 Test:

        Filtering response

        Label accuracy

        Mobile layout and desktop spacing

        UI style and alignment consistency
