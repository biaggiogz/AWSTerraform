# TestPackProgressChart - ASCII Representation & Data Flow

## ASCII Chart Visualization

```
Test Pack Progress Chart (Horizontal Bars)
==========================================

Test Pack A  ████████████████████████████████████████ 95% [GREEN]
Test Pack B  ████████████████████████████████         85% [YELLOW]
Test Pack C  ████████████████████████████████████████ 92% [GREEN]
Test Pack D  ████████████████████                     65% [RED]
Test Pack E  ███████████████████████████████████      88% [YELLOW]
Test Pack F  ████████████████████████████████████████ 98% [GREEN]
Test Pack G  ██████████████████████████               75% [YELLOW]
Test Pack H  ███████████████                          45% [RED]

             0%    25%    50%    75%    100%
             |-----|-----|-----|-----|
             Construction Coordination Progress

Legend:
🟢 GREEN  (>90%):  Good Progress
🟡 YELLOW (70-90%): Warning
🔴 RED    (<70%):   Critical
```

## Data Flow

```
Raw Data Input
      ↓
calculateMetricsByGroup(data, 'TEST PACK')
      ↓
Sort Test Packs (alphanumeric)
      ↓
Apply Filters:
├── Exclusive Filter (above90/between70And90/below70)
└── Selected Test Packs (checkbox selection)
      ↓
Generate Chart Data:
├── Labels: Test Pack Names
├── Data: avgConstructionProgress values
├── Colors: Based on progress thresholds
└── Bar Configuration
      ↓
Render Horizontal Bar Chart
      ↓
Interactive Controls:
├── Filter Buttons
├── Select/Deselect All
└── Individual Test Pack Toggles
```

## UI Components

### Chart Component
- **Bar Chart** (react-chartjs-2) - Main horizontal bar visualization

### Chakra UI Components
- **Box** - Container wrapper
- **Heading** - Chart title
- **HStack** - Horizontal stack layout
- **Text** - Text labels and descriptions
- **VStack** - Vertical stack layout
- **Flex** - Flexible layout container
- **Button** - Interactive control buttons
- **Tooltip** - Hover information display
- **SimpleGrid** - Grid layout for buttons
- **Badge** - Status indicators
- **Divider** - Visual separators

### Interactive Buttons

#### Exclusive Filter Buttons
```
[Above 90%] [70-90%] [Below 70%]
```
- **Above 90%**: `toggleExclusiveFilter('above90')`
- **70-90%**: `toggleExclusiveFilter('between70And90')`
- **Below 70%**: `toggleExclusiveFilter('below70')`

#### Test Pack Control Buttons
```
[Select All] [Deselect All] [Invert Selection]
```
- **Select All**: `toggleAllTestPacks(true)`
- **Deselect All**: `toggleAllTestPacks(false)`
- **Invert Selection**: `invertTestPackSelection()`

#### Individual Test Pack Toggles
```
☑ Test Pack A    ☐ Test Pack B    ☑ Test Pack C
☐ Test Pack D    ☑ Test Pack E    ☑ Test Pack F
```
- Each test pack has checkbox-style toggle: `toggleTestPack(testPack)`

## Chart Configuration Summary

- **Type**: Horizontal Bar Chart (Chart.js)
- **Max Visible**: 15 test packs
- **Bar Height**: 30px
- **Dynamic Height**: Based on filtered count
- **Performance**: Memoized calculations, conditional animations
- **Interactivity**: Real-time filtering and selection