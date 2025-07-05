# Isometric Relationship Filter

## Overview

The Isometric Relationship Filter implements bidirectional filtering between ControlInstrumentsTable and DetailsInstrumentsTable based on ISOMETRIC relationships. This modular component provides real-time cross-table filtering with visual feedback and relationship analysis.

## Core Algorithm

The filter uses a sophisticated matching algorithm that:

1. **Splits Test Packs**: Handles pipe-delimited test pack strings (`"1|2|3"` → `["1", "2", "3"]`)
2. **Finds Isometric Matches**: Links `ISOMETRIC` ↔ `MOUNTING ON ISO/EQUI/PACK`
3. **Validates Relationships**: Ensures `SUBSYSTEM` and `TEST PACK` alignment
4. **Builds Relationship Chains**: Groups related records into logical chains

## Components

### 1. IsometricRelationshipFilter.optimized.js
**Core filtering logic and React hooks**

```javascript
import { useIsometricRelationshipFilter } from './IsometricRelationshipFilter.optimized';

const {
  selectedIsometric,
  filteredControlData,
  filteredDetailData,
  highlightedControlRecords,
  highlightedDetailRecords,
  matchingChains,
  relationshipStats,
  onIsometricSelect,
  onClearFilter,
  onChainSelect
} = useIsometricRelationshipFilter(controlData, detailData);
```

### 2. IsometricRelationshipPanel.optimized.js
**Visual status panel with relationship statistics and controls**

- Displays selected isometric and match count
- Shows relationship statistics (chains, matches, unique ISOs)
- Provides expandable chain details
- Includes clear filter controls

### 3. Enhanced Table Components
**Updated ControlInstrumentsTable and DetailsInstrumentsTable**

- Clickable isometric/mounting location cells
- Visual highlighting for selected and related records
- Hover effects and selection feedback
- Maintains existing functionality

## Integration Pattern

### Basic Usage
```javascript
import { useIsometricRelationshipFilter } from './IsometricRelationshipFilter.optimized';
import IsometricRelationshipPanel from './IsometricRelationshipPanel.optimized';

const InstrumentsReport = ({ controlData, detailData }) => {
  const filter = useIsometricRelationshipFilter(controlData, detailData);
  
  return (
    <VStack spacing={4}>
      <IsometricRelationshipPanel {...filter} />
      <ControlInstrumentsTable 
        data={filter.filteredControlData}
        selectedIsometric={filter.selectedIsometric}
        onIsometricClick={filter.onIsometricSelect}
        highlightedRecords={filter.highlightedControlRecords}
      />
      <DetailsInstrumentsTable 
        data={filter.filteredDetailData}
        selectedIsometric={filter.selectedIsometric}
        onMountingLocationClick={filter.onIsometricSelect}
        highlightedRecords={filter.highlightedDetailRecords}
      />
    </VStack>
  );
};
```

### Context Provider Pattern
```javascript
import { IsometricRelationshipProvider } from './IsometricRelationshipFilter.optimized';

const App = () => (
  <IsometricRelationshipProvider controlData={controlData} detailData={detailData}>
    <InstrumentsReport />
  </IsometricRelationshipProvider>
);
```

## Features

### ✅ Bidirectional Filtering
- Click ISOMETRIC in ControlTable → Filter DetailsTable
- Click MOUNTING ON ISO/EQUI/PACK in DetailsTable → Highlight ControlTable
- Synchronized selection across both tables

### ✅ Visual Feedback
- **Blue highlighting**: Selected isometric
- **Yellow highlighting**: Related/matching records
- **Bold text**: Active selections
- **Hover effects**: Interactive elements

### ✅ Relationship Analysis
- **Matching Chains**: Groups of related control-detail pairs
- **Statistics**: Total chains, matches, unique isometrics
- **Chain Details**: Expandable view of relationship details

### ✅ Performance Optimized
- **Memoized calculations**: Prevents unnecessary recalculations
- **Virtualized rendering**: Handles large datasets efficiently
- **Minimal re-renders**: Optimized React hooks

## Data Relationships

### Table Mapping
```
ControlInstrumentsTable ↔ DetailsInstrumentsTable
├── ISOMETRIC ↔ MOUNTING ON ISO/EQUI/PACK
├── TEST PACK ↔ TEST PACK (pipe-delimited matching)
└── SUBSYSTEM ↔ SUBSYSTEM (exact match required)
```

### Matching Criteria
1. **Isometric Match**: Control.ISOMETRIC === Detail.MOUNTING_ON_ISO_EQUI_PACK
2. **Subsystem Match**: Control.SUBSYSTEM === Detail.SUBSYSTEM
3. **Test Pack Overlap**: At least one test pack in common

## Error Handling

- **Data Validation**: Checks for missing/null isometric values
- **Graceful Degradation**: Handles malformed data without breaking
- **Type Safety**: Robust string/array handling for test packs
- **Fallback States**: Shows appropriate messages when no data available

## Performance Considerations

- **Memoization**: All expensive calculations are memoized
- **Virtualization**: Tables support large datasets
- **Debouncing**: Prevents excessive filtering operations
- **Memory Management**: Efficient data structures and cleanup

## Browser Compatibility

- Modern browsers with ES6+ support
- React 16.8+ (hooks support)
- Chakra UI components
- TanStack Table v8+

## Files Structure

```
src/components/
├── IsometricRelationshipFilter.optimized.js    # Core filtering logic
├── IsometricRelationshipPanel.optimized.js     # Visual status panel
├── IsometricRelationshipFilter.README.md       # This documentation
├── ControlInstrumentsTable.optimized.js        # Enhanced control table
└── DetailsInstrumentsTable.optimized.js        # Enhanced details table
```

## Testing

The component includes comprehensive error handling and validation:

- Empty data sets
- Missing isometric values
- Malformed test pack strings
- Invalid relationship data
- Performance with large datasets

## Future Enhancements

- Export filtered data functionality
- Advanced relationship visualization
- Custom matching criteria
- Bulk selection operations
- Relationship history tracking