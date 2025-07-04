# 🎯 REQUEST: TEST PACK Cross-Dataset Filter (COEXIST with ISOMETRIC Filter)

## ⚠️ CRITICAL REQUIREMENT
**MUST COEXIST** with existing "Bidirectional ISOMETRIC Relationship Filter" without interference or modification.

## OBJECTIVE
Implement **SECOND INDEPENDENT** filtering capability for TEST PACK cross-dataset correlation while preserving all existing ISOMETRIC relationship analysis functionality.

## 🔒 EXISTING SYSTEM - DO NOT TOUCH
```javascript
// EXISTING ISOMETRIC FILTER - PRESERVE COMPLETELY
const isometricFilter = useIsometricRelationshipFilter(controlData, detailData);
// Returns: selectedIsometric, onIsometricSelect, filteredControlData, filteredDetailData, highlightedRecords

// EXISTING TABLE PROPS - PRESERVE COMPLETELY  
<ControlInstrumentsTable 
  selectedIsometric={isometricFilter.selectedIsometric}           // KEEP
  onIsometricClick={isometricFilter.onIsometricSelect}           // KEEP
  highlightedRecords={isometricFilter.highlightedControlRecords} // KEEP
/>

<DetailsInstrumentsTable 
  selectedIsometric={isometricFilter.selectedIsometric}          // KEEP
  onMountingLocationClick={isometricFilter.onIsometricSelect}    // KEEP
  highlightedRecords={isometricFilter.highlightedDetailRecords}  // KEEP
/>
```

## 🆕 NEW TEST PACK FILTER - ADD ALONGSIDE
```javascript
// NEW INDEPENDENT FILTER - ADD THIS
const testPackFilter = useTestPackFilter();

// DUAL FILTER APPLICATION - CHAIN FILTERS
const finalControlData = useMemo(() => {
  let data = isometricFilter.filteredControlData;  // Apply ISOMETRIC first
  data = testPackFilter.filterControlData(data);   // Apply TEST PACK second
  return data;
}, [isometricFilter.filteredControlData, testPackFilter.filterControlData]);

const finalDetailData = useMemo(() => {
  let data = isometricFilter.filteredDetailData;   // Apply ISOMETRIC first  
  data = testPackFilter.filterDetailData(data);    // Apply TEST PACK second
  return data;
}, [isometricFilter.filteredDetailData, testPackFilter.filterDetailData]);
```

## 🔧 CORRECTED IMPLEMENTATION (Based on Actual Architecture)

### Hook Implementation
```javascript
const useTestPackFilter = () => {
  const [selectedTestPack, setSelectedTestPack] = useState(null);

  const handleTestPackClick = useCallback((testPackValue) => {
    setSelectedTestPack(prev => prev === testPackValue ? null : testPackValue);
  }, []);

  // FOR CONTROL TABLE - Uses grouped data with testPacks array
  const filterControlData = useCallback((data) => {
    if (!selectedTestPack || !data) return data;
    return data.filter(row => {
      const testPacks = row.testPacks || []; // Use existing testPacks array
      return testPacks.includes(selectedTestPack);
    });
  }, [selectedTestPack]);

  // FOR DETAIL TABLE - Uses processed data with testPack field
  const filterDetailData = useCallback((data) => {
    if (!selectedTestPack || !data) return data;
    return data.filter(row => {
      const testPacks = row.testPack ? 
        row.testPack.toString().split("|").map(v => v.trim()).filter(v => v !== '' && v !== '0') : [];
      return testPacks.includes(selectedTestPack);
    });
  }, [selectedTestPack]);

  return { selectedTestPack, handleTestPackClick, filterControlData, filterDetailData };
};
```

### Component Integration
```javascript
const InstrumentsReport = ({ controlData, detailData }) => {
  // EXISTING ISOMETRIC FILTER - DO NOT MODIFY
  const isometricFilter = useIsometricRelationshipFilter(controlData, detailData);
  
  // NEW TEST PACK FILTER - ADD THIS
  const testPackFilter = useTestPackFilter();

  // DUAL FILTERING - CHAIN BOTH FILTERS
  const finalControlData = useMemo(() => {
    let data = isometricFilter.filteredControlData;
    data = testPackFilter.filterControlData(data);
    return data;
  }, [isometricFilter.filteredControlData, testPackFilter.filterControlData]);

  const finalDetailData = useMemo(() => {
    let data = isometricFilter.filteredDetailData;
    data = testPackFilter.filterDetailData(data);
    return data;
  }, [isometricFilter.filteredDetailData, testPackFilter.filterDetailData]);

  return (
    <VStack spacing={4}>
      {/* DUAL FILTER STATUS */}
      <HStack spacing={4}>
        {isometricFilter.selectedIsometric && (
          <Badge colorScheme="purple">ISOMETRIC: {isometricFilter.selectedIsometric}</Badge>
        )}
        {testPackFilter.selectedTestPack && (
          <Badge colorScheme="blue">TEST PACK: {testPackFilter.selectedTestPack}</Badge>
        )}
      </HStack>
      
      <ControlInstrumentsTable 
        data={finalControlData}
        // EXISTING ISOMETRIC PROPS - PRESERVE
        selectedIsometric={isometricFilter.selectedIsometric}
        onIsometricClick={isometricFilter.onIsometricSelect}
        highlightedRecords={isometricFilter.highlightedControlRecords}
        // NEW TEST PACK PROPS - ADD
        selectedTestPack={testPackFilter.selectedTestPack}
        onTestPackClick={testPackFilter.handleTestPackClick}
      />
      
      <DetailsInstrumentsTable 
        data={finalDetailData}
        // EXISTING ISOMETRIC PROPS - PRESERVE
        selectedIsometric={isometricFilter.selectedIsometric}
        onMountingLocationClick={isometricFilter.onIsometricSelect}
        highlightedRecords={isometricFilter.highlightedDetailRecords}
        // NEW TEST PACK PROPS - ADD
        selectedTestPack={testPackFilter.selectedTestPack}
        onTestPackClick={testPackFilter.handleTestPackClick}
      />
    </VStack>
  );
};
```

### Table Component Updates
```javascript
// ControlInstrumentsTable - ADD PROPS (don't remove existing)
const ControlInstrumentsTable = ({ 
  // EXISTING PROPS - PRESERVE ALL
  selectedIsometric, onIsometricClick, highlightedRecords,
  // NEW PROPS - ADD THESE
  selectedTestPack, onTestPackClick,
  // ... other existing props
}) => {
  // REMOVE local testPackFilter state - use props instead
  // const [testPackFilter, setTestPackFilter] = useState(null); // DELETE THIS LINE
  
  // Update TestPackCell usage:
  <TestPackCell 
    testPacks={testPacks}
    onTestPackSelect={onTestPackClick}    // Use parent handler
    selectedTestPack={selectedTestPack}   // Use parent state
  />
};

// DetailsInstrumentsTable - ADD PROPS (don't remove existing)  
const DetailsInstrumentsTable = ({ 
  // EXISTING PROPS - PRESERVE ALL
  selectedIsometric, onMountingLocationClick, highlightedRecords,
  // NEW PROPS - ADD THESE
  selectedTestPack, onTestPackClick,
  // ... other existing props
}) => {
  // Update TEST PACK column cell:
  cell: ({ getValue }) => {
    const testPackValue = getValue();
    const testPacks = testPackValue ? 
      testPackValue.toString().split("|").map(v => v.trim()).filter(v => v !== '' && v !== '0') : [];
    
    return (
      <TestPackCell 
        testPacks={testPacks} 
        onTestPackSelect={onTestPackClick}    // Add handler
        selectedTestPack={selectedTestPack}   // Add state
      />
    );
  }
};
```

## Key Fixes Applied

1. **React State Management**: Uses `useState` and `useCallback` instead of global variables
2. **Proper Data Filtering**: Filters data arrays instead of manipulating DOM
3. **Pipe-Delimited Handling**: Correctly splits `"1|2|3"` format TEST PACK values
4. **Component Integration**: Passes props to table components for proper rendering
5. **Visual Feedback**: Highlights selected TEST PACK buttons with different colors
6. **Filter Combination**: Works alongside existing isometric relationship analysis
7. **Performance Optimization**: Uses `useMemo` for filtered data calculations

## Usage

This  algorithm provides TEST PACK cross-dataset correlation as a separate filtering capability that works alongside the existing isometric relationship analysis without interfering with it.

## 🔗 Table Relationships

**ControlInstrumentsTable** ↔ **DetailsInstrumentsTable**
- `TEST PACK` ↔ `TEST PACK`

## 🏗️ Implementation Requirements

### Component Structure
- **Path:** `ReactApp/resources/ChartPipeline/src/components/TestPackRelationshipFilter.optimized.js`
- **Type:** React Hook/Context Provider
- **Optimization:** Memoized calculations, virtualized rendering support

### Core Functionality
1. **Bidirectional Filtering:**
    - Click TEST PACK in ControlInstrumentsTable → Filter DetailsInstrumentsTable
    - Click TEST PACK in DetailsInstrumentsTable → Filter ControlInstrumentsTable


## ⚠️ Implementation Principles
- ✅ Maintain existing table architecture
- ✅ Optimize performance with memoization
- ✅ Ensure viewport-compatible table width
- ❗ Do not modify existing chart/filter logic
- ❗ Do not modify existing algorithm "Bidirectional ISOMETRIC Relationship Filter"
- ❗ Preserve all current functionality

## 🎨 Visual Requirements
- Highlight selected rows with distinct colors
- Show relationship badges/indicators
- Display filter status in headers
- Cross-table selection synchronization

## 🛡️ Error Handling
- Validate data structure compatibility
- Handle missing/null TEST PACK values
- Graceful degradation for malformed data

## 📁 Project References
- **Source:** `ReactApp/resources/ChartPipeline/README.md`
- **Optimization:** `ReactApp/resources/ChartPipeline/optimization-guide.md`
- **Flow Data:** `ReactApp/resources/ChartPipeline/FLOW_DATA.md`


## 🚨 CRITICAL CONSTRAINTS

### ❌ ABSOLUTELY FORBIDDEN
- **DO NOT** modify `useIsometricRelationshipFilter` hook
- **DO NOT** modify ISOMETRIC click handlers (`onIsometricClick`, `onMountingLocationClick`)
- **DO NOT** modify ISOMETRIC highlighting logic
- **DO NOT** modify ISOMETRIC field matching logic
- **DO NOT** change existing prop names or interfaces
- **DO NOT** remove any existing functionality

### ✅ REQUIRED ADDITIONS
- **ADD** `useTestPackFilter` as separate independent hook
- **ADD** TEST PACK props to both table components
- **ADD** dual filter chaining in parent component
- **ADD** TEST PACK visual feedback (different colors from ISOMETRIC)
- **REMOVE** local `testPackFilter` state from ControlInstrumentsTable

## 🎯 SUCCESS CRITERIA
1. **ISOMETRIC filtering works exactly as before** (purple highlighting)
2. **TEST PACK filtering works independently** (green/blue highlighting)  
3. **Both filters can be active simultaneously** (dual filtering)
4. **Clicking ISOMETRIC doesn't affect TEST PACK filter**
5. **Clicking TEST PACK doesn't affect ISOMETRIC filter**
6. **Both filters chain properly** (ISOMETRIC → TEST PACK → final data)

## 🔍 TESTING SCENARIOS
1. Click ISOMETRIC → Only ISOMETRIC filter active
2. Click TEST PACK → Only TEST PACK filter active  
3. Click ISOMETRIC then TEST PACK → Both filters active
4. Click TEST PACK then ISOMETRIC → Both filters active
5. Toggle same ISOMETRIC → Only TEST PACK remains active
6. Toggle same TEST PACK → Only ISOMETRIC remains active