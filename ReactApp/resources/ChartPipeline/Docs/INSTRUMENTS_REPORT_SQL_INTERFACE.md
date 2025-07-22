# INSTRUMENTS REPORT SQL Interface

## Overview

The INSTRUMENTS REPORT tab now has its own dedicated SQL query interface that is completely separate from the SUMMARY SUBSYSTEMS tab. This separation ensures that:

1. Each tab has its own SQL query state
2. Metric cards are not shared between tabs
3. Filter buttons and their states are independent
4. Each tab can have its own specific SQL query templates

## Components

The following components were created or modified to implement this separation:

### New Components

1. `InstrumentsReportSQLPanel.js` - A dedicated SQL query interface for the INSTRUMENTS REPORT tab
2. `InstrumentsReportContainer.js` - A container component that manages the INSTRUMENTS REPORT tab's layout
3. `InstrumentsReportMetricCards.js` - A component to display saved metric cards specific to the INSTRUMENTS REPORT tab
4. `InstrumentsReportStateNotification.js` - A notification component for the INSTRUMENTS REPORT tab

### Modified Components

1. `ChartSelector.optimized.js` - Updated to use the new InstrumentsReportContainer instead of DynamicCalculationPanel for the INSTRUMENTS REPORT tab

## Implementation Details

### State Separation

The separation of state between the two tabs is achieved by using different keys in the persistent storage:

- INSTRUMENTS REPORT tab uses the key `instrumentsReport`
- SUMMARY SUBSYSTEMS tab uses the key `summarySubsystems`

This ensures that SQL queries, metric cards, and other state information are stored separately for each tab.

### UI Customization

The INSTRUMENTS REPORT tab's SQL interface has been customized with:

- A specific title indicating it's for the INSTRUMENTS REPORT tab
- Default SQL queries relevant to instrument data
- Quick metric buttons specific to instrument analysis

## Usage

Users can now:

1. Create and save SQL queries specific to the INSTRUMENTS REPORT tab
2. Generate metric cards that will only appear in the INSTRUMENTS REPORT tab
3. Use filters that won't affect the SUMMARY SUBSYSTEMS tab

This separation provides a better user experience by keeping the contexts of the two tabs completely independent.