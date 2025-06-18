
## Project Structure

- ECS/Streamlit_Snowflake/resources/ChartPipeline/README.md
- ECS/Streamlit_Snowflake/resources/ChartPipeline/optimization-guide.md

### Enhance visualization on "LOOP TEST PROGRESS" dashboard 

Configure "LOOP TEST PROGRESS" dashboard  bar chart 
so that the numeric value of each measure appears inside its c
corresponding colored segment within each bar

### VERY IMPORTANT

1. Filter Design Area and Subsytem must be from dataset test_of_lazos_updated.csv when user is in Dashboard "LOOP TEST PROGRESS"
   * Design Area = Column "Design Area" from test_of_lazos_updated.csv
   * Subsystem = Column "Subsystem" from test_of_lazos_updated.csv

2. Don't touch the filter of the other presents dashboard

#### Functional Requirements

Prompt for Implementation

    Show Values Inside Bar Segments:

        For each bar (representing a SUBS_PRE), display the value of each measure (e.g., "LOOPS ≥ 100%", "LOOPS DONE", "DOSSIER COMPLETED", "LOOPS CONSTRUCTION DONE") inside its respective colored segment.

        The value must be centered or clearly positioned within the segment, ensuring it is legible and does not overlap with other segments or text

Color Consistency:

    Each value should use a text color that ensures high contrast and readability against the background color of its segment.


Measure Association:

    Each value must be placed within the segment that represents its measure, not outside or overlapping other segments.

    The value should correspond exactly to the measure and SUBS_PRE item it represents

Chart.js Plugin Usage:

    Use the Chart.js dataLabels plugin (or chartjs-plugin-datalabels) to render values inside the bars.

    Configure the plugin so that:

        The label for each segment displays the value of that measure.

        The label is positioned inside the segment, centered vertically and horizontally.

        The label's font size and color are set for optimal readability against the segment's background