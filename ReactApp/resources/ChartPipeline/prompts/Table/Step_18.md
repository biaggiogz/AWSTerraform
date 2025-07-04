# Request: Bidirectional Isometric Relationship Filter

## 🎯 Objective
Create a modular component that implements bidirectional filtering between ControlInstrumentsTable and DetailsInstrumentsTable based on ISOMETRIC relationships.


## 🔗 Table Relationships

**ControlInstrumentsTable** ↔ **DetailsInstrumentsTable**
- `ISOMETRIC` ↔ `MOUNTING ON ISO/EQUI/PACK`
- `TEST PACK` ↔ `TEST PACK`
- `SUBSYSTEM` ↔ `SUBSYSTEM`

## 🧮 Core Algorithm

```javascript
function splitTestPack(testPackStr) {
  if (!testPackStr) return [];
  return testPackStr.toString().split("|").map(v => v.trim()).filter(v => v);
}

function filterByIsometric(controlTable, isoId) {
  return controlTable.filter(row => row.ISOMETRIC === isoId);
}

function filterByMountingLocation(detailTable, isoId) {
  return detailTable.filter(row => row['MOUNTING ON ISO/EQUI/PACK'] === isoId);
}

function findMatchingChains(controlTable, detailTable) {
  const visitedIsometrics = new Set();
  const matchingChains = [];

  for (const record of controlTable) {
    const isoId = record.ISOMETRIC;
    if (!isoId || visitedIsometrics.has(isoId)) continue;

    const currentChain = [];
    const stack = [isoId];

    while (stack.length > 0) {
      const currentIso = stack.pop();
      if (visitedIsometrics.has(currentIso)) continue;
      visitedIsometrics.add(currentIso);

      const isoRecords = filterByIsometric(controlTable, currentIso);

      for (const isoRec of isoRecords) {
        const testPacks = splitTestPack(isoRec['TEST PACK']);
        const subsystemControl = isoRec.SUBSYSTEM;
        const mountedDetails = filterByMountingLocation(detailTable, currentIso);
        
        for (const detailRec of mountedDetails) {
          const subsystemDetail = detailRec.SUBSYSTEM;
          const detailTestPacks = splitTestPack(detailRec['TEST PACK']);

          // RED CONDITION: subsystem must match
          if (subsystemControl === subsystemDetail) {
            const hasMatchingTestPack = testPacks.some(tp => 
              detailTestPacks.includes(tp)
            );
            
            if (hasMatchingTestPack) {
              currentChain.push({ 
                control: isoRec, 
                detail: detailRec,
                matchingTestPacks: testPacks.filter(tp => detailTestPacks.includes(tp))
              });
            }
          }
        }
      }
    }

    if (currentChain.length > 0) {
      matchingChains.push(currentChain);
    }
  }

  return matchingChains;
}
```

## 🏗️ Implementation Requirements

### Component Structure
- **Path:** `ReactApp/resources/ChartPipeline/src/components/IsometricRelationshipFilter.optimized.js`
- **Type:** React Hook/Context Provider
- **Optimization:** Memoized calculations, virtualized rendering support

### Core Functionality
1. **Bidirectional Filtering:**
   - Click ISOMETRIC in ControlTable → Filter DetailsTable
   - Click MOUNTING ON ISO/EQUI/PACK in DetailsTable → Highlight ControlTable

2. **State Management:**
   - `selectedIsometric`: Current selection
   - `matchingChains`: Relationship chains
   - `filteredControlData`: Filtered control data
   - `filteredDetailData`: Filtered detail data

3. **Event Handlers:**
   - `onIsometricSelect(isoId)`: Handle selection
   - `onClearFilter()`: Reset filters
   - `onChainSelect(chainIndex)`: Select chain

### Integration Pattern
```javascript
const { 
  selectedIsometric,
  filteredControlData,
  filteredDetailData,
  onIsometricSelect,
  matchingChains 
} = useIsometricRelationshipFilter(controlData, detailData);

<ControlInstrumentsTable 
  data={filteredControlData}
  selectedIsometric={selectedIsometric}
  onIsometricClick={onIsometricSelect}
/>
<DetailsInstrumentsTable 
  data={filteredDetailData}
  selectedIsometric={selectedIsometric}
  onMountingLocationClick={onIsometricSelect}
/>
```

## ⚠️ Implementation Principles
- ✅ Maintain existing table architecture
- ✅ Optimize performance with memoization
- ✅ Ensure viewport-compatible table width
- ❗ Do not modify existing chart/filter logic
- ❗ Preserve all current functionality

## 🎨 Visual Requirements
- Highlight selected rows with distinct colors
- Show relationship badges/indicators
- Display filter status in headers
- Cross-table selection synchronization

## 🛡️ Error Handling
- Validate data structure compatibility
- Handle missing/null isometric values
- Graceful degradation for malformed data

## 📁 Project References
- **Source:** `ReactApp/resources/ChartPipeline/README.md`
- **Optimization:** `ReactApp/resources/ChartPipeline/optimization-guide.md`
- **Flow Data:** `ReactApp/resources/ChartPipeline/FLOW_DATA.md`

