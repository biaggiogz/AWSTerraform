## ⚙️ Request: Create a Two-Category Vertical Stacked Bar Chart with inside Percentage Labels
---
➡️ Maintain Architecture • Optimize Performance • Ensure Filter Functionality

### 📂 Dataset

- **Source File:** `data/aislamientos.csv`
- **Mapping Columns [Dashboard:Dataset]**
  - `Subsystem:SUBSYSTEM`
  - `Design Area:Area`
  - `Spacer Advance:Avance Distanciadores`
  - `Insulation Advance:Avance Aislamiento`
  - `Advance Sheet Metal:Avance Chapa`
  - `Advance Boxes:Avance Cajas`
  - `Advance to Finish:Avance Rematar`


---

### 🏗️ Project Structure

- **Source Path:** `ECS/Streamlit_Snowflake/resources/ChartPipeline/README.md`
- **Optimization Guide:** `ECS/Streamlit_Snowflake/resources/ChartPipeline/optimization-guide.md`
- **Optimization Summary:** `ECS/Streamlit_Snowflake/resources/ChartPipeline/optimization-summary.md`


--- Example Graph

Spacer Advance
----------------
|    42%       |
|              |
|--------------|
|    58%       |
|              |
----------------

Insulation Advance
----------------
|    70%       |
|              |
|--------------|
|    30%       |
|              |
----------------

Sheet metal advance
----------------
|    30%       |
|              |
|--------------|
|    70%       |
|              |
----------------

Advance Boxes
----------------
|    90%       |
|              |
|--------------|
|    10%       |
|              |
----------------

Advance to Finish
----------------
|    22%       |
|              |
|--------------|
|    88%       |
|              |
----------------

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

---

### Metrics
  - The total items = df["ISO"].count()
  - The Average completation is for example , df["Avance Distanciadores"].avg()

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
| Accessibility  | Adequate contrast and font size for readability                                    |                                                                                    |


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
- Test for **responsiveness**, visual alignment, and label clarity across screen sizes
