# 🎯 TASK: Re-enable Test Pack Progress Chart

## 🚨 PRIMARY OBJECTIVE
**ACTIVATE** the "Test Pack Progress" tab and **RESTORE** TestPackProgressChart.optimized.js functionality

---

## ⚠️ CRITICAL INSTRUCTION #1: CALCULATION REPLACEMENT

**MANDATORY CHANGE**: Replace ONLY the calculation logic in:
`ECS/Streamlit_Snowflake/resources/ChartPipeline/src/charts/TestPackProgressChart.optimized.js`

### 📊 COLUMNS INVOLVED IN CALCULATION:
- **Grouping Column**: `TEST PACK` (may contain pipe-separated IDs like "1245|382")
- **Value Column**: `CONSTRUC COORD PROGRESS` (the progress percentage to average)
- **HANDLE DIVISION 0**: HANDLE ERRORS OF DIVISION 0

**NEW CALCULATION CODE** (use exactly as provided):
```javascript
// Group data by test pack (handle pipe-separated IDs), calculate average CONSTRUC COORD PROGRESS per test pack
const testPackGroups = {};
subsystemProgressData.forEach(row => {
    if (row.testPack && row.constructionCoordProgress > 0) {
        // Split pipe-separated test packs (e.g., "1245|382" becomes ["1245", "382"])
        const testPacks = row.testPack.split('|');

        testPacks.forEach(testPackId => {
            const trimmedId = testPackId.trim();
            if (trimmedId) {
                if (!testPackGroups[trimmedId]) {
                    testPackGroups[trimmedId] = { total: 0, count: 0 };
                }
                // Add CONSTRUC COORD PROGRESS value to this test pack group
                testPackGroups[trimmedId].total += row.constructionCoordProgress;
                testPackGroups[trimmedId].count++;
            }
        });
    }
});

// Calculate final averages for each test pack
const testPackAverages = {};
Object.keys(testPackGroups).forEach(testPackId => {
    const group = testPackGroups[testPackId];
    testPackAverages[testPackId] = {
        avgConstructionProgress: Math.round(group.total / group.count)
    };
});
```

---

## 🔒 CRITICAL INSTRUCTION #2: PRESERVE EVERYTHING ELSE

**DO NOT CHANGE** anything else from the existing TestPackProgressChart.optimized.js:

### ✅ Keep Identical:
- **All Colors**: Green `rgb(0, 112, 116)`, Yellow `rgba(255, 206, 86, 0.6)`, Red `rgba(255, 99, 132, 0.6)`
- **All Layout**: Chakra UI components, spacing, positioning
- **All Chart Config**: Horizontal bars, 30px height, dynamic sizing
- **All Filters**: above90/between70And90/below70 logic
- **All Functions**: toggleExclusiveFilter, toggleTestPack, toggleAllTestPacks, invertTestPackSelection
- **All Performance**: useMemo, useCallback, state management
- **All Data Processing**: sorting, filtering, calculateMetricsByGroup

---

## 📋 IMPLEMENTATION RULES

### ✅ DO:
1. Read existing TestPackProgressChart.optimized.js file
2. Replace ONLY the calculation method with provided code
3. Keep everything else exactly the same
4. Test that chart renders with new calculation

### ❌ DON'T:
1. Modify colors, styling, or layout
2. Change filter logic or functions
3. Alter chart configuration
4. Remove performance optimizations
5. Change component structure

---

## 📊 DATA SOURCE
- **File**: `data/pipelinedata.csv`
- **Column Mapping**: 
  - Test Pack ↔ `TEST PACK` (grouping column, may have pipe-separated values)
  - Progress Value ↔ `CONSTRUC COORD PROGRESS` (value to average)
  - Subsystem ↔ `SUBSYSTEM` (for filtering)

---

## 📋 EXPECTED RESULT

### Chart Visualization (Horizontal Bars):
```
Test Pack A  ████████████████████████████████████████ 95% [GREEN]
Test Pack B  ████████████████████████████████         85% [YELLOW] 
Test Pack C  ████████████████████████████████████████ 92% [GREEN]
Test Pack D  ████████████████████                     65% [RED]
```

### Interactive Controls:
- **Filter Buttons**: [Above 90%] [70-90%] [Below 70%]
- **Selection**: [Select All] [Deselect All] [Invert Selection]
- **Individual Toggles**: ☑ Test Pack A ☐ Test Pack B

### Technical Specs:
- **Chart**: Horizontal Bar (Chart.js)
- **Colors**: Green (>90%), Yellow (70-90%), Red (<70%)
- **Performance**: Memoized with useMemo/useCallback
- **Max Visible**: 15 test packs
- **Height**: Dynamic (30px per bar)

---

## 🔧 TECHNICAL REQUIREMENTS

| Requirement | Value |
|-------------|-------|
| **Libraries** | Use existing from package.json |
| **Target Tab** | "Test Pack Progress" |
| **Scrolling** | Enable `overflowY: auto` |
| **Integration** | Respond to filter selections |
| **Component** | Separate (not embedded) |

