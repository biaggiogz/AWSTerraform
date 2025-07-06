# Step 26: Sunburst Integration Filter - Detailed Implementation Guide

## PROMPT FOR AMAZON Q AI (Claude Sonnet)

**Task**: Create a floating, draggable Sunburst Integration Filter for the INSTRUMENTS REPORT tab that provides visual filtering for dual table system.

## EXACT REQUIREMENTS

### 1. Floating Behavior Requirements
- **Toggle Button**: Add button in INSTRUMENTS REPORT tab to show/hide sunburst
- **Default State**: Hidden by default
- **Draggable**: User can drag the floating sunburst anywhere on screen while holding mouse down
- **Close Button**: X button on sunburst to hide it
- **Z-index**: Must appear above all other components

### 2. Sunburst Chart Specifications
- **Base Code**: Adapt sunburst logic from Example.md to D3.js
- **Library**: D3.js (React-compatible implementation)
- **Interactive**: Click segments to apply filters
- **Visual Feedback**: Highlight active segments with color changes
- **Size**: 400x400px floating container

### 3. Data Mapping Structure
```
Level 1: "Control Instruments" vs "Details Instruments" (2 main categories)
Level 2: Filter Categories - "Isometric", "TestPack", "Subsystem" (3 categories each)
Level 3: Distinct Values - Top 10 most frequent values from each category
Level 4: Individual Records - Actual instrument records
```

### 4. Integration with Existing Components
**MUST USE THESE EXACT COMPONENTS:**
- `useInstrumentsFilter.js` - Extend this for sunburst state
- `ControlInstrumentsTable.optimized.js` - Left table (TableA)
- `DetailsInstrumentsTable.optimized.js` - Right table (TableB)
- `IsometricRelationshipFilter.optimized.js` - Isometric filtering logic
- `TestPackRelationshipFilter.optimized.js` - Test pack filtering logic
- `SubsystemRelationshipFilter.optimized.js` - Subsystem filtering logic

### 5. Column Header Enhancement
**For BOTH tables, add to each column header:**
- Dropdown button (▼) next to column name
- Dropdown shows distinct values as checkboxes
- "Clear" button to reset that column's filter
- Visual indicator when column has active filters

## IMPLEMENTATION STEPS

### Step 1: Create Core Components

**File: `SunburstIntegrationFilter.js`**
```javascript
// Floating draggable container
// Uses @chakra-ui/react Modal/Portal
// Implements drag functionality with mouse events
// Toggle show/hide state
// Contains SunburstChart component
```

**File: `SunburstChart.js`**
```javascript
// D3.js sunburst implementation
// Use d3.partition() and d3.arc() for sunburst layout
// Convert Example.md hierarchical data structure to D3 format
// Add onClick handlers for path elements
// Map clicks to filter updates
// Visual highlighting with fill color changes
```

**File: `useSunburstData.js`**
```javascript
// Transform CSV data to sunburst hierarchy
// Use control_inst_by_isos.csv and details_inst.csv
// Create 4-level structure as specified
// Calculate segment sizes based on record counts
// Generate color schemes
```

### Step 2: Extend Existing Filter System

**Modify: `useInstrumentsFilter.js`**
```javascript
// Add sunburst filter state
// Add functions: setSunburstFilter, clearSunburstFilter
// Integrate with existing isometric/testpack/subsystem filters
// Maintain bidirectional sync
```

**Create: `useColumnFilters.js`**
```javascript
// New hook for individual column filtering
// Extract distinct values from each column
// Handle checkbox selections
// Clear individual column filters
```

### Step 3: Enhance Table Components

**Modify: `ControlInstrumentsTable.optimized.js`**
```javascript
// Add dropdown buttons to column headers
// Integrate useColumnFilters hook
// Add visual indicators for active filters
// Maintain existing @tanstack/react-table structure
```

**Modify: `DetailsInstrumentsTable.optimized.js`**
```javascript
// Same enhancements as control table
// Ensure filter synchronization
// Maintain virtualization performance
```

### Step 4: Integration Points

**Modify: `ChartSelector.optimized.js`**
```javascript
// Add "🎯 Sunburst Filter" toggle button
// Position in INSTRUMENTS REPORT tab header
// Manage sunburst visibility state
```

**Modify: `App.optimized.js`**
```javascript
// Include SunburstIntegrationFilter component
// Ensure proper z-index layering
// Maintain existing functionality
```

## TECHNICAL SPECIFICATIONS

### Libraries to Use (EXISTING + D3)
- **@chakra-ui/react**: Modal, Portal, Button, Checkbox
- **d3**: Sunburst chart implementation (d3.partition, d3.arc, d3.scaleOrdinal)
- **@tanstack/react-table**: Table enhancements
- **react-icons**: Dropdown arrows, close buttons
- **React hooks**: useState, useEffect, useMemo, useRef

### Performance Requirements
- **No Impact**: Must not affect existing table virtualization
- **Lazy Loading**: Only load sunburst data when opened
- **Memoization**: Use React.memo and useMemo for optimization
- **Debouncing**: Debounce filter updates to prevent excessive re-renders

### State Management Flow
```
1. User clicks sunburst segment
2. SunburstChart calls filter update function
3. useInstrumentsFilter updates central state
4. Both tables re-render with new filters
5. Column headers show active filter indicators
6. Sunburst highlights active segments
```

### CSS/Styling Requirements
- **Floating**: position: fixed, high z-index
- **Draggable**: cursor: move when dragging
- **Responsive**: Maintain 400x400px size
- **Theme**: Match existing Chakra UI theme
- **Animations**: Smooth show/hide transitions

## DELIVERABLES CHECKLIST

### New Files to Create
- [ ] `SunburstIntegrationFilter.js` - Main floating container
- [ ] `SunburstChart.js` - D3.js sunburst component
- [ ] `useSunburstData.js` - Data transformation hook
- [ ] `useColumnFilters.js` - Column-specific filtering

### Files to Modify
- [ ] `useInstrumentsFilter.js` - Add sunburst state
- [ ] `ControlInstrumentsTable.optimized.js` - Add column dropdowns
- [ ] `DetailsInstrumentsTable.optimized.js` - Add column dropdowns
- [ ] `ChartSelector.optimized.js` - Add toggle button
- [ ] `App.optimized.js` - Include sunburst component

### Features to Implement
- [ ] Floating draggable sunburst (default hidden)
- [ ] Toggle button in INSTRUMENTS REPORT tab
- [ ] Click-to-filter on sunburst segments
- [ ] Column header dropdown filters
- [ ] Bidirectional filter synchronization
- [ ] Visual feedback for active filters
- [ ] Performance optimization

## SUCCESS CRITERIA
1. **Functionality**: Sunburst filtering works with both tables
2. **Performance**: No degradation in table rendering speed
3. **UX**: Intuitive drag-and-drop, clear visual feedback
4. **Integration**: Seamless with existing filter system
5. **Compatibility**: Works with all existing libraries and components

## CRITICAL NOTES
- **DO NOT** break existing functionality
- **DO NOT** change existing component APIs
- **DO** reuse existing filter logic from Step_23.md components
- **DO** maintain @tanstack/react-table and @chakra-ui/react patterns
- **DO** follow existing code style and structure