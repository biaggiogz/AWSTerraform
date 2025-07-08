# Documentation of SQL Query Interface Implementation for SUMMARY SUBSYSTEMS Tab

## Overview
Implementation of SQL query interface with DuckDB and WASM performance optimization for the SUMMARY SUBSYSTEMS tab, replicating the same functionality available in the INSTRUMENTS tab.

## Files Modified

### 1. SummarySubsystemsContainer.js
**Path:** `/src/components/panels/SummarySubsystemsContainer.js`

**Changes Made:**
- Added lazy import for `DynamicCalculationPanel`
- Added `Suspense` wrapper with spinner fallback
- Integrated SQL interface above the draggable tables
- Passed filtered data to the calculation panel

**Key Additions:**
```javascript
const DynamicCalculationPanel = lazy(() => import('../panels/DynamicCalculationPanel'));

// Added SQL Query Interface section
<Suspense fallback={<Center p={4}><Spinner /></Center>}>
  <DynamicCalculationPanel
    controlData={tableAData}
    detailsData={tableBData}
    filteredControlData={filteredTableAData}
    filteredDetailsData={filteredTableBData}
    filters={{
      selectedSubsystem: selectedSubsystem
    }}
  />
</Suspense>
```

### 2. DynamicCalculationPanel.js
**Path:** `/src/components/panels/DynamicCalculationPanel.js`

**Changes Made:**
- Added detection logic for SUMMARY SUBSYSTEMS tab
- Created subsystem-specific quick metric buttons
- Maintained existing INSTRUMENTS tab functionality

**Key Additions:**
```javascript
// Table detection logic
const isSubsystemsTab = controlData && detailsData && 
  controlData[0] && ('subsystem' in controlData[0] || 'serialNumber' in controlData[0]);

// Conditional metric buttons for SUMMARY SUBSYSTEMS
{isSubsystemsTab ? (
  // SUMMARY SUBSYSTEMS metrics
  <>
    <Button onClick={() => addMetricQuery('SELECT COUNT(DISTINCT subsystem) AS "Total Subsystems _Global"\nFROM "Control Instruments";')}>
      Total Subsystems
    </Button>
    // ... other subsystem metrics
  </>
) : (
  // INSTRUMENTS metrics (existing)
)}
```

## Components Used (Existing)

### Core Components
1. **DynamicCalculationPanel** - Main SQL interface component
2. **useDynamicCalculations** - Hook for SQL execution and table management
3. **useDuckDB** - DuckDB integration with JavaScript SQL parser
4. **WASM Performance Monitor** - Performance monitoring overlay

### Supporting Infrastructure
1. **Lazy Loading** - React.lazy for code splitting
2. **Suspense** - Loading fallback during component load
3. **Chakra UI** - UI components (Box, VStack, Button, etc.)

## Features Implemented

### SQL Query Interface
- **Query Editor** - Textarea for custom SQL queries
- **Quick Metrics** - Pre-defined buttons for common queries
- **Schema Reference** - Shows available tables and fields
- **Metric Cards** - Visual display of query results

### SUMMARY SUBSYSTEMS Specific Metrics
- Total Subsystems
- Total Items (Done/Pending)
- Total Test Packs
- Total Loops (Done/Pending)
- Average Progress

### Advanced Features
- **Local vs Global** - Toggle between filtered and unfiltered data
- **Metric Locking** - Freeze specific metrics
- **WASM Acceleration** - Performance optimization
- **Real-time Updates** - Metrics update with filter changes

## Data Flow

1. **Data Input** - tableAData and tableBData from useSummarySubsystemsData
2. **Filter Processing** - useSubsystemBidirectionalFilter applies subsystem filtering
3. **SQL Execution** - useDynamicCalculations creates DuckDB tables and executes queries
4. **Result Display** - Metric cards show query results with visual formatting

## Integration Points

### Existing Hooks Used
- `useDynamicCalculations` - SQL execution and table management
- `useSubsystemBidirectionalFilter` - Subsystem filtering logic
- `useSummarySubsystemsData` - Data loading and processing

### WASM Integration
- Automatic WASM acceleration through existing infrastructure
- Performance monitoring via WasmPerformanceMonitor
- Fallback to JavaScript if WASM unavailable

## Technical Implementation

### Table Creation
```javascript
// Tables created in DuckDB
"Control Instruments" -> tableAData (Subsystem Overview)
"Details Instruments" -> tableBData (Test Pack Details)
```

### Query Examples
```sql
-- Total Subsystems
SELECT COUNT(DISTINCT subsystem) AS "Total Subsystems _Global"
FROM "Control Instruments";

-- Average Progress
SELECT AVG(testPackProgress) AS "Avg Progress _Global"
FROM "Details Instruments";
```

### Filter Integration
- Filtered data automatically updates SQL query results
- Local metrics respond to subsystem selection
- Global metrics remain constant (frozen)

## Result
Successfully replicated the complete SQL query interface from INSTRUMENTS tab to SUMMARY SUBSYSTEMS tab with:
- ✅ DuckDB integration
- ✅ WASM performance optimization
- ✅ Subsystem-specific metrics
- ✅ Real-time filter integration
- ✅ Visual metric cards
- ✅ Advanced query capabilities

## Files Structure
```
src/
├── components/
│   └── panels/
│       ├── DynamicCalculationPanel.js (Modified)
│       └── SummarySubsystemsContainer.js (Modified)
├── hooks/
│   ├── useDynamicCalculations.js (Used)
│   ├── useDuckDB.js (Used)
│   └── useSubsystemBidirectionalFilter.js (Used)
└── wasm/ (Used existing WASM infrastructure)
```