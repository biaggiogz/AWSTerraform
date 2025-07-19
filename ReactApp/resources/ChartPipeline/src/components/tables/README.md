# Summary Subsystems Tables

This directory contains the table components used in the Summary Subsystems tab.

## SummarySubsystemsTableA

The `SummarySubsystemsTableA` component displays subsystem overview data with columns for:
- Subsystem information (S/N, FLUID, SUBSYSTEM)
- Items progress (TOTAL ITEMS, DONE ITEMS, PENDING ITEMS)
- Description & Test Packs (DESCRIPTION, N°TP)
- Loop signal progress (TOTAL LOOP, LOOP DONE, LOOP PENDING)

## SummarySubsystemsTableB

The `SummarySubsystemsTableB` component displays test pack details with columns for:
- Subsystem & Test Pack (SUBSYSTEM, TP's INCLUDE, PROGRESS TEST PACK)
- Execution Planning (TRACEADOS, PRIORITY, HITO)
- Contractor Management (TEIGA REINSTATEMENT, TEIGA INSULATION, SIEMSA, TECHNIP)

## SummarySubsystemsTableC

The `SummarySubsystemsTableC` component combines both TableA and TableB into a single expandable table:

### Features:
- Displays all columns from TableA as the main rows
- Adds an expand/collapse button in the N°TP column
- When expanded, shows the related test pack details from TableB directly under the subsystem row
- Maintains full column alignment and layout
- Omits table headers from TableB in the expanded content
- Preserves all filtering and color-coding functionality from both tables

### Implementation Details:
- Uses a single `@tanstack/react-table` instance with combined columns
- Prefixes column IDs with `tableA_` and `tableB_` to distinguish between sources
- Renders multi-level headers only for TableA columns
- Uses conditional rendering in the virtualized row component to handle expanded content
- Preserves all color-coding and status indicators from both tables

### Usage:
```jsx
<SummarySubsystemsTableC
  subsystemData={filteredTableAData}
  testPackData={filteredTableBData}
  selectedSubsystem={selectedSubsystem}
  onSubsystemSelect={handleSubsystemSelect}
  isItemsFilterVisible={isItemsFilterVisible}
  isLoopFilterVisible={isLoopFilterVisible}
  isProgressFilterVisible={isProgressFilterVisible}
  isHitoFilterVisible={isHitoFilterVisible}
/>
```