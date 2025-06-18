
## Project Structure

- ECS/Streamlit_Snowflake/resources/ChartPipeline/README.md
- ECS/Streamlit_Snowflake/resources/ChartPipeline/optimization-guide.md

### Enable interactive filtering on "LOOP TEST PROGRESS" dashboard so 

When a user clicks on a measure at the top of the chart (e.g., "LOOPS DONE", "DOSSIER COMPLETED"), 
the bars are filtered to show only those for the selected measure. 
The selected measure should be visually indicated as active. 
Clicking the same measure again will disable the filter and restore 
the original, unfiltered chart view


### VERY IMPORTANT

1. Filter Design Area and Subsytem must be from dataset test_of_lazos_updated.csv when user is in Dashboard "LOOP TEST PROGRESS"
   * Design Area = Column "Design Area" from test_of_lazos_updated.csv
   * Subsystem = Column "Subsystem" from test_of_lazos_updated.csv

2. Don't touch the filter of the other presents dashboard

#### Functional Requirements

    Clickable Measures: Each measure label at the top of the chart acts as a toggle button.

    Filtering Behavior:

        When a measure is clicked, filter the bars to display only those SUBS_PRE items
        The selected measure is visually highlighted (e.g., with a different background, border, or bold text) to indicate it is active.
        If the user clicks the active measure again, the filter is removed and all bars are shown as in the original state.

    Single Active Filter: Only one measure can be active at a time. Clicking a different measure switches the filter to the new selection.

UI/UX Requirements

    Active State Indication: Use Chakra UI components (e.g., Badge, Button, or custom styles) to clearly show which measure is currently active.
    Accessibility: Ensure that the active state is accessible (e.g., with ARIA attributes or clear visual contrast).
    Responsiveness: The filtering and active state indication should work seamlessly across all device sizes.

Example User Flow

    Initial State: All bars are displayed, and no measure is highlighted.
    User Clicks a Measure: The bar filtered that measure are shown. The measure is highlighted as active.
    User Clicks the Same Measure Again: The filter is removed, all bars are displayed, and no measure is highlighted.
    User Clicks a Different Measure: The filter updates to the new measure, and the new measure is highlighted.

Implementation Hints

    Use React state to track the currently selected measure.
    Filter the data array based on the selected measure before passing it to the chart.
    Use Chakra UI's styling props or conditional classes to highlight the active measure.
    Add click handlers to the measure labels to toggle filtering.
