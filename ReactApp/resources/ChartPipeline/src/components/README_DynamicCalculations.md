# Dynamic Calculation Panel

## Overview
The Dynamic Calculation Panel adds analytical capabilities to the INSTRUMENTS REPORT tab, allowing users to perform real-time calculations on the instrument data while respecting all existing filters.

## Features
- **Real-time Calculations**: Perform COUNT, SUM, AVG, MIN, MAX operations
- **Filter Integration**: Automatically applies active Isometric, TestPack, and Subsystem filters
- **Grouping Options**: Group results by Subsystem or Isometric
- **Responsive UI**: Matches existing Chakra UI design patterns

## Usage
1. Navigate to the INSTRUMENTS REPORT tab
2. Select a column from the dropdown
3. Choose an aggregation function (COUNT, SUM, etc.)
4. Optionally select a grouping field
5. Click "Calculate" to see results

## Integration
- Preserves all existing functionality
- Uses existing filter state from:
  - `useIsometricRelationshipFilter`
  - `useTestPackFilter`
  - `useSubsystemFilter`
- Positioned below existing tables in the INSTRUMENTS REPORT tab

## Technical Implementation
- **useDuckDB.js**: Lightweight data processing hook with JavaScript fallback
- **useDynamicCalculations.js**: Calculation engine with filter integration
- **DynamicCalculationPanel.js**: UI component with Chakra UI styling

## Performance
- Minimal overhead with memoized calculations
- Fallback implementation ensures compatibility
- Real-time filter synchronization