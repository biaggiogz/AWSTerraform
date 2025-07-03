# Update Filter Panel that is associated to SummarySubsystems.js

## Objective
Implement dynamic filtering functionality in the SummarySubsystems.js component to filter table data based on user selections.

## Requirements

### Filter Panel Configuration
- Add two filter dropdowns:
  - **Test Pack** filter
  - **Subsystem** filter

### Data Source
- **File**: `data/pipelinedata.csv`
- **Column Mapping**:
  - Filter "Test Pack" → CSV column "TEST PACK"
  - Filter "Subsystem" → CSV column "SUBSYSTEM"

### Filtering Logic
1. **Dynamic Filtering**: Table rows must update immediately when filters are applied
2. **Multi-Filter Support**: Both filters can be active simultaneously
3. **Filter Relationships**: Maintain data integrity between Test Pack and Subsystem selections
4. **Single Application**: Apply filtering logic once per state change to avoid duplication

### Technical Constraints
- Do not break existing filter functionality
- Ensure filter state is managed globally
- Implement efficient filtering to avoid performance issues

## Expected Behavior
- User selects a Test Pack → table shows only rows matching that Test Pack
- User selects a Subsystem → table shows only rows matching that Subsystem  
- User selects both → table shows rows matching BOTH criteria
- Reset filters → table shows all data


### 🏗️ Project Structure

- **Source Path:** `ECS/Streamlit_Snowflake/resources/ChartPipeline/README.md`
- **Optimization Guide:** `ECS/Streamlit_Snowflake/resources/ChartPipeline/optimization-guide.md`
- **Optimization Summary:** `ECS/Streamlit_Snowflake/resources/ChartPipeline/optimization-summary.md`
