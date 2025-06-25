# Multi-Value Filter Implementation

This document explains the implementation of multi-value filtering in the ChartPipeline project.

## Overview

The multi-value filter system allows users to select multiple values for each filter type (e.g., multiple areas and multiple subsystems) and applies these filters using OR logic within each filter type and AND logic between different filter types.

## Architecture

The implementation follows a two-tier data architecture:

1. **Physical Data Layer**: Raw data loaded from CSV files
2. **Virtual Data Layer**: Filtered data created by applying multi-value filters to the raw data

## Key Components

### 1. `multiValueFilter.js` Utility

Contains core functions for multi-value filtering:

- `applyMultiValueFilters()`: Applies multi-value filters to raw data
- `createVirtualDataset()`: Creates a virtual dataset based on physical filters
- `extractFilterOptions()`: Extracts unique values for each filter field
- `buildRelationshipMaps()`: Builds relationship maps between filter fields

### 2. `useMultiValueFilter` Hook

Custom hook that manages multi-value filter state and logic:

- Maintains state for multi-value filters and progress filter
- Creates virtual datasets based on filter selections
- Provides filter options and relationship maps
- Handles filter changes and resets

### 3. `MultiValueFilterPanel` Component

UI component for multi-value selection:

- Renders multi-select dropdowns for each filter type
- Shows/hides options based on relationships
- Displays filter metadata and counts
- Provides reset functionality

### 4. Integration with `LoopTestProgressChart`

The chart component now:

- Uses the `useMultiValueFilter` hook to manage filter state
- Renders the `MultiValueFilterPanel` component
- Processes the filtered data for visualization
- Maintains bidirectional communication with parent components

## Filter Flow

1. User selects multiple areas (A1, A2) and multiple subsystems (S1, S3)
2. `useMultiValueFilter` hook applies these filters to the raw data
3. Filter logic: items matching (A1 OR A2) AND (S1 OR S3)
4. Virtual dataset is created with filtered data
5. Components receive and visualize only the filtered dataset

## Benefits

- **Flexibility**: Users can select multiple values for each filter type
- **Performance**: Filtering happens at the data layer, not in components
- **Separation of Concerns**: Filter logic is isolated from visualization
- **Reusability**: Same filter system can be used across different components
- **Maintainability**: Clear separation between physical and virtual data

## Usage

To use the multi-value filter system:

1. Import the necessary components:
   ```javascript
   import useMultiValueFilter from '../hooks/useMultiValueFilter';
   import MultiValueFilterPanel from '../components/MultiValueFilterPanel';
   ```

2. Use the hook in your component:
   ```javascript
   const {
     filteredData,
     metadata,
     filterOptions,
     relationshipMaps,
     multiFilters,
     progressFilter,
     handleFilterChange,
     handleProgressFilter,
     resetAllFilters
   } = useMultiValueFilter(rawData, filterMappings);
   ```

3. Render the filter panel:
   ```javascript
   <MultiValueFilterPanel
     areas={filterOptions[filterMappings.area] || []}
     subsystems={filterOptions[filterMappings.subsystem] || []}
     multiFilters={multiFilters}
     onFilterChange={handleFilterChange}
     filterMappings={filterMappings}
     progressFilter={progressFilter}
     onResetAll={resetAllFilters}
     metadata={metadata}
     relationshipMaps={relationshipMaps}
   />
   ```

4. Use the filtered data in your visualizations:
   ```javascript
   // Process filteredData for your component
   const processedData = processData(filteredData);
   ```

## Migration

To migrate from single-value to multi-value filtering:

1. Replace `FilterPanel` with `MultiValueFilterPanel`
2. Replace filter state management with `useMultiValueFilter` hook
3. Update data processing to work with the virtual dataset
4. Update App.js to use the multi-value filter system