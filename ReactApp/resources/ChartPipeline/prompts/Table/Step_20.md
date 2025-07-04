# 🎯 REQUEST: SUBSYSTEM Cross-Dataset Filter (COEXIST with ISOMETRIC & TEST PACK Filters)

## ⚠️ CRITICAL REQUIREMENT
**MUST COEXIST** with existing "Bidirectional ISOMETRIC Relationship Filter" and "TEST PACK Cross-Dataset Filter" without interference or modification.

## OBJECTIVE
Implement **THIRD INDEPENDENT** filtering capability for SUBSYSTEM cross-dataset correlation while preserving all existing ISOMETRIC relationship analysis and TEST PACK filtering functionality.

## 🔒 EXISTING SYSTEM - DO NOT TOUCH
```javascript
// EXISTING ISOMETRIC FILTER - PRESERVE COMPLETELY
const isometricFilter = useIsometricRelationshipFilter(controlData, detailData);
// Returns: selectedIsometric, onIsometricSelect, filteredControlData, filteredDetailData, highlightedRecords

// EXISTING TEST PACK FILTER - PRESERVE COMPLETELY
const testPackFilter = useTestPackFilter();
// Returns: selectedTestPack, handleTestPackClick, filterControlData, filterDetailData

// EXISTING TABLE PROPS - PRESERVE COMPLETELY  
<ControlInstrumentsTable 
  selectedIsometric={isometricFilter.selectedIsometric}           // KEEP
  onIsometricClick={isometricFilter.onIsometricSelect}           // KEEP
  highlightedRecords={isometricFilter.highlightedControlRecords} // KEEP
  selectedTestPack={testPackFilter.selectedTestPack}             // KEEP
  onTestPackClick={testPackFilter.handleTestPackClick}          // KEEP
/>

<DetailsInstrumentsTable 
  selectedIsometric={isometricFilter.selectedIsometric}          // KEEP
  onMountingLocationClick={isometricFilter.onIsometricSelect}    // KEEP
  highlightedRecords={isometricFilter.highlightedDetailRecords}  // KEEP
  selectedTestPack={testPackFilter.selectedTestPack}             // KEEP
  onTestPackClick={testPackFilter.handleTestPackClick}          // KEEP
/>
```

## 🆕 NEW SUBSYSTEM FILTER - ADD ALONGSIDE
```javascript
// NEW INDEPENDENT FILTER - ADD THIS
const subsystemFilter = useSubsystemFilter();

// TRIPLE FILTER APPLICATION - CHAIN ALL THREE FILTERS
const finalControlData = useMemo(() => {
  let data = isometricFilter.filteredControlData;  // Apply ISOMETRIC first
  data = testPackFilter.filterControlData(data);   // Apply TEST PACK second
  data = subsystemFilter.filterControlData(data);  // Apply SUBSYSTEM third
  return data;
}, [isometricFilter.filteredControlData, testPackFilter.filterControlData, subsystemFilter.filterControlData]);

const finalDetailData = useMemo(() => {
  let data = isometricFilter.filteredDetailData;   // Apply ISOMETRIC first  
  data = testPackFilter.filterDetailData(data);    // Apply TEST PACK second
  data = subsystemFilter.filterDetailData(data);   // Apply SUBSYSTEM third
  return data;
}, [isometricFilter.filteredDetailData, testPackFilter.filterDetailData, subsystemFilter.filterDetailData]);
```

## 🔧 CORRECTED IMPLEMENTATION (Based on Actual Architecture)

### Hook Implementation
```javascript
const useSubsystemFilter = () => {
  const [selectedSubsystem, setSelectedSubsystem] = useState(null);

  const handleSubsystemClick = useCallback((subsystemValue) => {
    setSelectedSubsystem(prev => prev === subsystemValue ? null : subsystemValue);
  }, []);

  // FOR CONTROL TABLE - Uses direct subsystem field (NO PIPE SPLITTING)
  const filterControlData = useCallback((data) => {
    if (!selectedSubsystem || !data) return data;
    return data.filter(row => {
      const subsystem = row.SUBSYSTEM || row.SUSSYTEM || ''; // Handle both field names
      return subsystem === selectedSubsystem;
    });
  }, [selectedSubsystem]);

  // FOR DETAIL TABLE - Uses direct subsystem field (NO PIPE SPLITTING)
  const filterDetailData = useCallback((data) => {
    if (!selectedSubsystem || !data) return data;
    return data.filter(row => {
      const subsystem = row.SUBSYSTEM || '';
      return subsystem === selectedSubsystem;
    });
  }, [selectedSubsystem]);

  return { selectedSubsystem, handleSubsystemClick, filterControlData, filterDetailData };
};
```

### Component Integration
```javascript
const InstrumentsReport = ({ controlData, detailData }) => {
  // EXISTING ISOMETRIC FILTER - DO NOT MODIFY
  const isometricFilter = useIsometricRelationshipFilter(controlData, detailData);
  
  // EXISTING TEST PACK FILTER - DO NOT MODIFY
  const testPackFilter = useTestPackFilter();

  // NEW SUBSYSTEM FILTER - ADD THIS
  const subsystemFilter = useSubsystemFilter();

  // TRIPLE FILTERING - CHAIN ALL THREE FILTERS
  const finalControlData = useMemo(() => {
    let data = isometricFilter.filteredControlData;
    data = testPackFilter.filterControlData(data);
    data = subsystemFilter.filterControlData(data);
    return data;
  }, [isometricFilter.filteredControlData, testPackFilter.filterControlData, subsystemFilter.filterControlData]);

  const finalDetailData = useMemo(() => {
    let data = isometricFilter.filteredDetailData;
    data = testPackFilter.filterDetailData(data);
    data = subsystemFilter.filterDetailData(data);
    return data;
  }, [isometricFilter.filteredDetailData, testPackFilter.filterDetailData, subsystemFilter.filterDetailData]);

  return (
    <VStack spacing={4}>
      {/* TRIPLE FILTER STATUS */}
      <HStack spacing={4}>
        {isometricFilter.selectedIsometric && (
          <Badge colorScheme="purple">ISOMETRIC: {isometricFilter.selectedIsometric}</Badge>
        )}
        {testPackFilter.selectedTestPack && (
          <Badge colorScheme="blue">TEST PACK: {testPackFilter.selectedTestPack}</Badge>
        )}
        {subsystemFilter.selectedSubsystem && (
          <Badge colorScheme="orange">SUBSYSTEM: {subsystemFilter.selectedSubsystem}</Badge>
        )}
      </HStack>
      
      <ControlInstrumentsTable 
        data={finalControlData}
        // EXISTING ISOMETRIC PROPS - PRESERVE
        selectedIsometric={isometricFilter.selectedIsometric}
        onIsometricClick={isometricFilter.onIsometricSelect}
        highlightedRecords={isometricFilter.highlightedControlRecords}
        // EXISTING TEST PACK PROPS - PRESERVE
        selectedTestPack={testPackFilter.selectedTestPack}
        onTestPackClick={testPackFilter.handleTestPackClick}
        // NEW SUBSYSTEM PROPS - ADD
        selectedSubsystem={subsystemFilter.selectedSubsystem}
        onSubsystemClick={subsystemFilter.handleSubsystemClick}
      />
      
      <DetailsInstrumentsTable 
        data={finalDetailData}
        // EXISTING ISOMETRIC PROPS - PRESERVE
        selectedIsometric={isometricFilter.selectedIsometric}
        onMountingLocationClick={isometricFilter.onIsometricSelect}
        highlightedRecords={isometricFilter.highlightedDetailRecords}
        // EXISTING TEST PACK PROPS - PRESERVE
        selectedTestPack={testPackFilter.selectedTestPack}
        onTestPackClick={testPackFilter.handleTestPackClick}
        // NEW SUBSYSTEM PROPS - ADD
        selectedSubsystem={subsystemFilter.selectedSubsystem}
        onSubsystemClick={subsystemFilter.handleSubsystemClick}
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
  selectedTestPack, onTestPackClick,
  // NEW PROPS - ADD THESE
  selectedSubsystem, onSubsystemClick,
  // ... other existing props
}) => {
  // Update SubsystemCell usage (ALREADY EXISTS - just connect to props):
  <SubsystemCell 
    subsystem={subsystem}
    onSubsystemSelect={onSubsystemClick}    // Use parent handler
    selectedSubsystem={selectedSubsystem}   // Use parent state
  />
};

// DetailsInstrumentsTable - ADD PROPS (don't remove existing)  
const DetailsInstrumentsTable = ({ 
  // EXISTING PROPS - PRESERVE ALL
  selectedIsometric, onMountingLocationClick, highlightedRecords,
  selectedTestPack, onTestPackClick,
  // NEW PROPS - ADD THESE
  selectedSubsystem, onSubsystemClick,
  // ... other existing props
}) => {
  // Update SUBSYSTEM column cell (NO PIPE SPLITTING NEEDED):
  cell: ({ getValue }) => {
    const subsystemValue = getValue();
    const subsystems = subsystemValue ? [subsystemValue] : []; // Single value, no splitting
    
    return (
      <SubsystemCell 
        subsystems={subsystems} 
        onSubsystemSelect={onSubsystemClick}    // Add handler
        selectedSubsystem={selectedSubsystem}   // Add state
      />
    );
  }
};
```

## Key Implementation Notes

1. **No Pipe Splitting**: SUBSYSTEM values are single strings, not pipe-delimited
2. **Direct Field Access**: Uses `row.SUBSYSTEM` or `row.SUSSYTEM` directly
3. **Exact String Matching**: Simple equality comparison for filtering
4. **Triple Filter Chain**: ISOMETRIC → TEST PACK → SUBSYSTEM sequence
5. **Orange Badge**: Uses orange color scheme for SUBSYSTEM filter status
6. **Existing Components**: Reuses existing SubsystemCell components

## Usage

This algorithm provides SUBSYSTEM cross-dataset correlation as a third independent filtering capability that works alongside both existing ISOMETRIC relationship analysis and TEST PACK filtering without interfering with either.

## 🔗 Table Relationships

**ControlInstrumentsTable** ↔ **DetailsInstrumentsTable**
- `SUBSYSTEM` ↔ `SUBSYSTEM`

## 🏗️ Implementation Requirements

### Component Structure
- **Path:** `ReactApp/resources/ChartPipeline/src/components/SubsystemRelationshipFilter.optimized.js`
- **Type:** React Hook/Context Provider
- **Optimization:** Memoized calculations, virtualized rendering support

### Core Functionality
1. **Bidirectional Filtering:**
    - Click SUBSYSTEM in ControlInstrumentsTable → Filter DetailsInstrumentsTable
    - Click SUBSYSTEM in DetailsInstrumentsTable → Filter ControlInstrumentsTable

## ⚠️ Implementation Principles
- ✅ Maintain existing table architecture
- ✅ Optimize performance with memoization
- ✅ Ensure viewport-compatible table width
- ❗ Do not modify existing chart/filter logic
- ❗ Do not modify existing algorithm "Bidirectional ISOMETRIC Relationship Filter"
- ❗ Do not modify existing algorithm "TEST PACK Cross-Dataset Filter"
- ❗ Preserve all current functionality

## 🎨 Visual Requirements
- Highlight selected rows with distinct colors
- Show relationship badges/indicators (Orange for SUBSYSTEM)
- Display filter status in headers
- Cross-table selection synchronization

## 🛡️ Error Handling
- Validate data structure compatibility
- Handle missing/null SUBSYSTEM values
- Graceful degradation when no data available

## 🔄 Filter Chain Sequence
1. **ISOMETRIC Filter** (Purple Badge) - Applied first
2. **TEST PACK Filter** (Blue Badge) - Applied second  
3. **SUBSYSTEM Filter** (Orange Badge) - Applied third

## 📊 Data Structure Notes
- **Control Table**: Uses `SUBSYSTEM` or `SUSSYTEM` field
- **Detail Table**: Uses `SUBSYSTEM` field
- **No Splitting**: Values are single strings, not pipe-delimited
- **Direct Matching**: Simple string equality comparison

## ⚠️ Implementation Principles
- ✅ Maintain existing table architecture
- ✅ Optimize performance with memoization
- ✅ Ensure viewport-compatible table width
- ❗ Do not modify existing chart/filter logic
- ❗ Do not modify existing algorithm "Bidirectional ISOMETRIC Relationship Filter"
- - ❗ Do not modify existing algorithm "Bidirectional TEST PACK Relationship Filter"
- ❗ Preserve all current functionality

## 🎨 Visual Requirements
- Highlight selected rows with distinct colors
- Show relationship badges/indicators
- Display filter status in headers
- Cross-table selection synchronization

## 🛡️ Error Handling
- Validate data structure compatibility
- Handle missing/null SUBSYSTEM values
- Graceful degradation for malformed data

## 📁 Project References
- **Source:** `ReactApp/resources/ChartPipeline/README.md`
- **Optimization:** `ReactApp/resources/ChartPipeline/optimization-guide.md`
- **Flow Data:** `ReactApp/resources/ChartPipeline/FLOW_DATA.md`

