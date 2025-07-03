# Control Instruments Table - Hover Popup Menu Implementation

### Filter columns[Filter Panel:Dataset]
- Isometric:ISOMETRIC
- Subsystem:SUBSYSTEM

### ⚠️ Implementation Principle

- ✅ Prioritize **accuracy and logic integrity** over speed of implementation.
- ❗ **Do not modify** any existing chart behavior, filtering, or state.
- ❗ **All table and chart filter logic must remain untouched**.
---

### 📂 Dataset

- **Source File:** `data/control_inst_by_isos.csv`

---

### 🏗️ Project Structure

- **Source Path:** `ReactApp/resources/ChartPipeline/README.md`
- **Optimization Guide:** `ReactApp/resources/ChartPipeline/optimization-guide.md`
- **Flow data:** `ReactApp/resources/ChartPipeline/FLOW_DATA.md`

---

## Current Issue
The table shows duplicate rows for the same isometric  that differ only in TEST PACK values . Need to consolidate to single row while maintaining filtering capability.

- Table: Control Instruments
- Tab: INSTRUMENTS REPORT
- Target file: ReactApp/resources/ChartPipeline/src/components/ControlInstrumentsTable.optimized.js


## Current Table Structure
```
┌─────────────────────────────────────┬────────────────────────────┬─────────────────────────────────────────────┬───────────────────────────────────────────────────┬─────────────────────────────────────────────────────────────────────┬───────────────────────────┐  
│                PROGRESS WELD ISO    │PLANNING DELIVERY TO ADISSEO│     MECHANICAL COMPLETION (MC) REALISTIC    │            PROGRESS ISO & TEST PACK               │                      PROGRESS INST & ISO                            │ TRACING & INSULATION      │  
│                                     │                            │              DATE BY SUBSYSTEM              │                                                   │                                                                     │                           │  
┼─────────────────────────────────────┼────────────────────────────┼──────────────────────────────┬──────┬───────┼───────────────────────────────────────────────────┼───────────────────────────┬─────────────────────────────────────────┼───────────────────────────┼  
│                                     │                            │                              │      │       │                                                   │   INSTRUMENT DISTRIBUTION │            INSTRUMENT INSTALLED         │         SIEMSA            │  
│                                     │                            │         TEIGA-TMI            │SIEMSA│TECHNIP│                                                   │                           │                                         │                           │  
├───────────────────────┬─────────────┼───────────┬─────┬──────────┼────┬─────────────┬───────────┼──────┼───────┼──────────┬──────────────────┬─────────────────────┼────────┬─────────┬────────┼──────────┬──────────────────┬───────────┼─────────────┬─────────────┼  
│             ISOMETRIC │WELDING FW+SW│ SUBSYSTEM │CRONO│ PRIORITY │HITO│REINSTATEMENT│INSULATION │SIEMSA│TECHNIP│ TEST PACK│DELIVERY PROGRESS │READY TO INSTALL INST│QTY INST│SCOPE BY │SCOPE BY│INSTALLED │   INSTALLED      │   TOTAL   │    TRAC     │TAG CIRCUITO │  
│                       │             │           │     │          │    │             │           │      │       │          │     BY TEN       │       (SIEMSA)      │        │TIEGA-TMI│ SIEMSA │ (SIEMSA) │  (TEIGA-TMI)     │ INSTALLED │ (YES & NOT) │  TRACEADO   │  
├───────────────────────┼─────────────┼───────────┼─────┼──────────┼────┼─────────────┼───────────┼──────┼───────┼──────────┼──────────────────┼─────────────────────┼────────┼─────────┼────────┼──────────┼──────────────────┼───────────┼─────────────┼─────────────┤  
│A10001-40-FMBH-140242- │     40%     │HMBI-10001-│ 93  │   4      │HITO│  7/11/2025  │8/10/2025  │      │       │   1001   │                  │                     │ 1      │    1    │        │          │       1          │     1     │     NOT     │EHT-104242-TH│  
│    U4BC1B-CCTN_01     │             │     03    │     │          │ 7  │             │           │      │       │          │                  │                     │        │         │        │          │                  │           │             │             │  
├───────────────────────┼─────────────┼───────────┼─────┼──────────┼────┼─────────────┼───────────┼──────┼───────┼──────────┼──────────────────┼─────────────────────┼────────┼─────────┼────────┼──────────┼──────────────────┼───────────┼─────────────┼─────────────┤  
│A10001-40-FMBH-140242- │     40%     │HMBI-10001-│ 93  │   4      │HITO│  7/11/2025  │8/10/2025  │      │       │     4    │                  │                     │ 1      │    1    │        │          │       1          │     1     │     NOT     │EHT-104242-TH│  
│    U4BC1B-CCTN_01     │             │     03    │     │          │ 7  │             │           │      │       │          │                  │                     │        │         │        │          │                  │           │             │             │  
└───────────────────────┴─────────────┴───────────┴─────┴──────────┴────┴─────────────┴───────────┴──────┴───────┴──────────┴──────────────────┴─────────────────────┴────────┴─────────┴────────┴──────────┴──────────────────┴───────────┴─────────────┴─────────────┘  
```

## Requirements
- **DO NOT** change existing configuration, layout, filter logic, or other features
- **DO NOT** modify multi-level headers, column colors, virtualization, or table structure
- **ONLY** add hover popup menu functionality for TEST PACK consolidation

## Implementation Flow - Pop Menu

### 1. Data Processing Enhancement
```javascript
// Group isometrics by unique identifier (excluding testPack)
const groupedData = useMemo(() => {
  const grouped = {};
  processedData.forEach(row => {
    const key = `${row.isometric}-${row.subsystem}-${row.crono}`;
    if (!grouped[key]) {
      grouped[key] = { ...row, testPacks: [row.testPack] };
    } else {
      grouped[key].testPacks.push(row.testPack);
    }
  });
  return Object.values(grouped);
}, [processedData]);
```

### 2. Visual Indicator Component
```javascript
// Add small badge/icon for isometrics with multiple test packs
const TestPackIndicator = ({ testPacks }) => {
  if (testPacks.length <= 1) return null;
  
  return (
    <Badge 
      size="xs" 
      colorScheme="blue" 
      position="absolute" 
      top="-2px" 
      right="-2px"
      borderRadius="full"
    >
      {testPacks.length}
    </Badge>
  );
};
```

### 3. Hover Popup Component
```javascript
const TestPackPopup = ({ testPacks, onTestPackSelect, isOpen, onTogglePin }) => {
  return (
    <Popover isOpen={isOpen} placement="right-start">
      <PopoverContent width="200px" boxShadow="lg">
        <PopoverHeader>
          <HStack justify="space-between">
            <Text fontSize="sm" fontWeight="bold">Test Packs</Text>
            <IconButton 
              size="xs" 
              icon={<PinIcon />} 
              onClick={onTogglePin}
              variant="ghost"
            />
          </HStack>
        </PopoverHeader>
        <PopoverBody>
          <VStack spacing={2} align="stretch">
            {testPacks.map(testPack => (
              <Button
                key={testPack}
                size="sm"
                variant="ghost"
                onClick={() => onTestPackSelect(testPack)}
                _hover={{ bg: "blue.50" }}
              >
                {testPack}
              </Button>
            ))}
          </VStack>
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
};
```

### 4. Enhanced TEST PACK Cell
```javascript
// Modify testPack column cell renderer
cell: ({ getValue, row }) => {
  const testPacks = row.original.testPacks || [getValue()];
  const [isHovered, setIsHovered] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  
  return (
    <Box 
      position="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => !isPinned && setIsHovered(false)}
    >
      <Text fontSize="xs" textAlign="center" fontWeight="medium" color="blue.600">
        {testPacks.length > 1 ? `${testPacks[0]}...` : testPacks[0]}
      </Text>
      <TestPackIndicator testPacks={testPacks} />
      <TestPackPopup 
        testPacks={testPacks}
        isOpen={isHovered || isPinned}
        onTestPackSelect={handleTestPackFilter}
        onTogglePin={() => setIsPinned(!isPinned)}
      />
    </Box>
  );
}
```

### 5. Filter Integration
```javascript
// Add test pack filter state
const [testPackFilter, setTestPackFilter] = useState(null);

// Filter function
const handleTestPackFilter = (selectedTestPack) => {
  setTestPackFilter(selectedTestPack);
  // Apply filter to show all isometrics containing this test pack
  table.getColumn('testPack')?.setFilterValue(selectedTestPack);
};

// Custom filter function
const testPackFilterFn = (row, columnId, filterValue) => {
  if (!filterValue) return true;
  const testPacks = row.original.testPacks || [row.getValue(columnId)];
  return testPacks.includes(filterValue);
};
```

## Implementation Flow - Additional UX Enhancements

### 1. Smart Popup Positioning
```javascript
const useSmartPositioning = (triggerRef) => {
  const [position, setPosition] = useState('right-start');
  
  useEffect(() => {
    if (!triggerRef.current) return;
    
    const rect = triggerRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Adjust position based on available space
    if (rect.right + 200 > viewportWidth) {
      setPosition('left-start');
    }
    if (rect.bottom + 150 > viewportHeight) {
      setPosition(position.replace('start', 'end'));
    }
  }, [triggerRef]);
  
  return position;
};
```

### 2. Keyboard Navigation Support
```javascript
const useKeyboardNavigation = (testPacks, onSelect) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  useEffect(() => {
    const handleKeyDown = (e) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => (prev + 1) % testPacks.length);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => (prev - 1 + testPacks.length) % testPacks.length);
          break;
        case 'Enter':
          e.preventDefault();
          onSelect(testPacks[selectedIndex]);
          break;
        case 'Escape':
          // Close popup
          break;
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [testPacks, selectedIndex, onSelect]);
  
  return selectedIndex;
};
```

### 3. Filter Feedback Component
```javascript
const FilterFeedback = ({ activeFilter, onClear, matchCount }) => {
  if (!activeFilter) return null;
  
  return (
    <HStack 
      spacing={2} 
      bg="blue.50" 
      p={2} 
      borderRadius="md" 
      border="1px solid"
      borderColor="blue.200"
    >
      <Text fontSize="sm">
        Filtered by Test Pack: <Badge colorScheme="blue">{activeFilter}</Badge>
      </Text>
      <Text fontSize="sm" color="gray.600">
        ({matchCount} results)
      </Text>
      <IconButton 
        size="xs" 
        icon={<CloseIcon />} 
        onClick={onClear}
        variant="ghost"
      />
    </HStack>
  );
};
```

### 4. Multi-Select Enhancement
```javascript
const [selectedTestPacks, setSelectedTestPacks] = useState(new Set());

const handleMultiSelect = (testPack, isCtrlPressed) => {
  if (isCtrlPressed) {
    const newSelection = new Set(selectedTestPacks);
    if (newSelection.has(testPack)) {
      newSelection.delete(testPack);
    } else {
      newSelection.add(testPack);
    }
    setSelectedTestPacks(newSelection);
    applyMultiFilter(Array.from(newSelection));
  } else {
    setSelectedTestPacks(new Set([testPack]));
    handleTestPackFilter(testPack);
  }
};
```

### 5. Performance Optimization
```javascript
// Debounced hover to prevent excessive popup triggers
const useDebouncedHover = (delay = 300) => {
  const [isHovered, setIsHovered] = useState(false);
  const timeoutRef = useRef();
  
  const handleMouseEnter = useCallback(() => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setIsHovered(true), delay);
  }, [delay]);
  
  const handleMouseLeave = useCallback(() => {
    clearTimeout(timeoutRef.current);
    setIsHovered(false);
  }, []);
  
  return { isHovered, handleMouseEnter, handleMouseLeave };
};
```

## Integration Points

### 1. Modify processedData to use groupedData
### 2. Update TEST PACK column cell renderer with popup functionality
### 3. Add filter state management for test pack filtering
### 4. Integrate FilterFeedback component in table header area
### 5. Ensure popup doesn't interfere with table virtualization

## Expected Behavior

1. **Single Row Display**: Each unique isometric shows as one row
2. **Visual Indicator**: Small badge shows count of test packs (if > 1)
3. **Hover Interaction**: Mouse hover reveals popup with test pack list
4. **Push Pin**: Click pin icon to keep popup open
5. **Filter Action**: Click any test pack to filter entire table
6. **Clear Filter**: Easy way to reset filter and show all data
7. **Keyboard Support**: Arrow keys + Enter for accessibility
8. **Smart Positioning**: Popup adjusts position based on screen space

## Success Criteria

- ✅ Duplicate rows eliminated
- ✅ All test pack values preserved and accessible
- ✅ Filtering works for any test pack value
- ✅ No impact on existing table features
- ✅ Intuitive user experience
- ✅ Accessible keyboard navigation
- ✅ Performance maintained with virtualization