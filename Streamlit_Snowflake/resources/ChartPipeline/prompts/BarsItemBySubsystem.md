## ⚙️ Request: Replace Panel "Area Contribution by Advance" by Stacked Bar Chart (Horizontal ) showing total items, done items and pending items by Subsystem


## Project Structure

- ECS/Streamlit_Snowflake/resources/ChartPipeline/README.md
- ECS/Streamlit_Snowflake/resources/ChartPipeline/optimization-guide.md

### Dataset
- Source: data/aislamientos.csv 

## Metrics
| Metric            | Condition                                                                      | Meaning                                 |
|:------------------|:-------------------------------------------------------------------------------|:----------------------------------------|
| **TOTAL ITEMS**   | `df.groupby("SUBSYSTEM")["ISO"].count()`                                       | Total Items for each Subsystem.         |
| **ITEMS DONE**    | `df[df["NAME METRIC"].astype(float) == 1].groupby("SUBSYSTEM")["ISO"].count()` | Total Items DONE for each Subsystem.    |
| **ITEMS PENDING** | `[df["NAME METRIC"].astype(float) < 1].groupby("SUBSYSTEM")["ISO"].count()`    | Total Items PENDING for each Subsystem. |

## Configuration of Stacked Bar Chart (Horizontal )

- Name Panel Dashboard: "Progress Items"

- The bars must be group by each "NAME METRIC" ( in total are 6 groups)
- Design a stacked bar chart using current libraries,  
- Each bar represents a SUBSYSTEM. 
- Each colored with two segment [DONE, PENDING] 
- Color "#1DE9B6" for DONE, Color ""#FF168B"" for PENDING
- The chart should remain visually clear and interactive, even with a large number of subsystems
- Dran how must be seeing the bars




### VERY IMPORTANT

1. Filter Design Area and Subsytem must be from dataset test_of_lazos_updated.csv when user is in Dashboard "LOOP TEST PROGRESS"
2. Don't touch the filter of the other presents dashboard

#### Chart Requirements
1. Chart Type and Structure

   * Use a stacked bar chart where each bar represents a single SUBS_PRE item
   * The length of each bar reflects the "TOTAL LOOPS" measure for that item
   * Each bar is divided into colored segments, with each segment representing the value of a specific measure for that SUBS_PRE
   * Display the measures ("TOTAL LOOPS", "LOOPS CONSTRUCTION DONE", "DOSSIER COMPLETED", "LOOPS DONE") as a legend or at the top of the chart, with each measure assigned a unique color

2. Data Structure

   * Structure the data so that each SUBS_PRE item has values for all measures
   * Map each measure to a specific color for consistency across the chart
   * Each bar can have up to four colored segments, each representing a different stage:

       * Light Blue: LOOPS NOT STARTED CONSTRUCTION  (#AEE6F9)
       * Blue: LOOPS DONE (#3B4CCA)
       * Pink: DOSSIER COMPLETED (#D7A0C3)
       * Beige: LOOPS CONSTRUCTION DONE (#E7D1B0)

3. Visual Design

   * Legend: Display a legend at the top or side of the chart, showing the color and label for each measure
   * Color Coding: Assign distinct, visually accessible colors to each measure. Ensure colors are colorblind-friendly
   * Axis Labels: Clearly label the x-axis (SUBS_PRE) and y-axis ("TOTAL LOOPS")
   * Tooltips: Enable tooltips to show detailed values for each measure when hovering over a segment of a bar
   * Each segment within a bar must use the exact color as specified above for consistency

4. Interactivity and Usability

   * Scrolling or Pagination: Implement vertical scrolling to prevent overcrowding when there are many items
   * Sorting: Allow users to sort SUBS_PRE items by "TOTAL LOOPS" or by a specific measure
   * Responsive Design: Ensure the chart is responsive and adapts to different screen sizes

5. Integration with Chakra UI

   * Use Chakra UI components (Box, Heading, HStack, Text, VStack, Flex, Button, Tooltip, SimpleGrid, Badge, Divider) to structure the layout around the chart
   * Place the chart inside a Box with padding and a heading
   * Use HStack or SimpleGrid for the legend and measure labels at the top
   * Add Tooltip for interactive explanations or additional information on measures or items