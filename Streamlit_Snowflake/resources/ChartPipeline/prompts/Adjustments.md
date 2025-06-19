⚙️ Request: Align Stacked Bar Chart to the Left on Sort by Any Sort controls on LoopTestProgressChart.optimized.js
🧭 Tab: LOOP TEST PROGRESS
⚠️ Implementation Principle

    ✅ Accuracy and verification of logic are more important than speed of implementation.

📂 Dataset

    Source File: data/test_of_lazos_updated.csv

🏗️ Project Structure

    Source Path: ECS/Streamlit_Snowflake/resources/ChartPipeline/README.md

    Optimization Guide: ECS/Streamlit_Snowflake/resources/ChartPipeline/optimization-guide.md

🎯 Goal

When the user sorts the stacked bar chart by any sort control (not just "TOTAL LOOP"), the bars must always align to the left edge, so the sorted control's value for each bar starts at the same vertical baseline. This ensures clear, practical visual order and improves user readability, regardless of which control is selected for sorting.

📐 Requirements

| Requirement         | Value                                                                                               |
|---------------------|-----------------------------------------------------------------------------------------------------|
| Sort Behavior        | On sort by any sort control, the bars must re-align so the sorted control appears at the left edge. |
| Stacked Segments     | All segments should shift so that the sorted control is the first (leftmost) segment in each bar.   |
| Color Consistency    | Maintain color mapping for each sort control as per design system.                                  |
| Data Structure       | Dynamically re-order the data for each bar according to the selected sort control.                  |
| Responsiveness       | Chart must remain responsive and visually clear after sorting.                                      |
| Legend               | Update legend order to match the new segment order if needed.                                       |
| Performance          | Optimize data transformation to avoid unnecessary re-renders.                                       |


📝 Implementation Notes

    Data Transformation:
    When a user selects a sort control, transform the data for each bar so that the sorted control's value is always the first segment (leftmost for horizontal bars). The remaining segments should follow in a consistent order.

    Chart.js Configuration:
    Chart.js does not provide a built-in property to shift stack order dynamically per sort; you must reorder the data arrays and their corresponding colors/labels before passing them to the chart instance

    Visual Consistency:
    Ensure that the bar labels, tooltips, and data labels update to reflect the new segment order after sorting.

    Accessibility:
    Maintain high-contrast text for all in-bar labels, and ensure the interactive sorting controls remain accessible.

    Testing:
    After implementing, verify that sorting by any control always aligns the bars to the left and that the order is visually clear and matches the user's sort selection.

📌 Reminder

✅    Do not simply sort the entire bar (row) order; you must also shift the stack order within each bar so the sorted control is always leftmost.

✅    This adjustment is required for every control in the sort menu, not just "TOTAL LOOP".

✅    Maintain all existing filter and dashboard interactions.

✅ Keep architecture and performance optimizations (e.g., `@tanstack/react-virtual`, Chakra UI, memoization, etc.)

✅ Follow existing UI/UX patterns  Add commentMore actions

✅ Do not duplicate filtering logic — filter table once based on combined state


✅ You can request a small test live using http://localhost:3000/ which is active as decribe below to verify:

| COMMAND |  PID  | USER  | FD  | TYPE | DEVICE  | SIZE/OFF | NODE | NAME                                                 |
|---------|-------|--------|-----|------|---------|----------|------|------------------------------------------------------|
| firefox |  4712 | ubuntu | 65u | IPv4 | 1105168 | 0t0      | TCP  | localhost:51086->localhost:3000 (ESTABLISHED)       |
| node    | 29760 | ubuntu | 18u | IPv4 | 736052  | 0t0      | TCP  | *:3000 (LISTEN)                                      |
| node    | 29760 | ubuntu | 21u | IPv4 | 1102976 | 0t0      | TCP  | localhost:3000->localhost:51086 (ESTABLISHED)       |)       |