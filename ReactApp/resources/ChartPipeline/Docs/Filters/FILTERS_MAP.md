# Filter Components Map & Flow

## 📁 Filter Architecture Overview

### 🔧 Base Components (Shared Infrastructure)
```
BaseStatusFilter.js ← Core shared status filter component
hooks/
├── useBaseStatusFilter.js ← Shared status filter logic
├── useFilterDebounce.js ← Debouncing utility
```

### 📊 Status Filters (Using BaseStatusFilter)
```
InstStatusFilter.js → BaseStatusFilter (total_inst, done_inst)
LoopStatusFilter.js → BaseStatusFilter (total_loop, done_loop)  
InsulationStatusFilter.js → BaseStatusFilter (total_insulation, done_insulation)
ItemsTotalStatusFilter.js → BaseStatusFilter (total_items, done_items)
TracingStatusFilter.js → BaseStatusFilter (total_tracing, done_tracing)
```

### 🎯 Specialized Filters (Unique Logic)
```
HitoFilterA.js ← Hito-specific filtering (hito_isos field)
SubsystemFilterA.js ← Subsystem-specific filtering (subsystem field)
FilterPanel.optimized.js ← Main filter panel (areas, subsystems, multi-filters)
FilterStatusBar.js ← Active filter display bar
```

### 🔗 Relationship Filters (Cross-dataset)
```
IsometricRelationshipFilter.optimized.js ← Control/Detail table relationships
TestPackRelationshipFilter.optimized.js ← Test pack cross-filtering
SubsystemRelationshipFilter.optimized.js ← Subsystem cross-filtering
```

### 📋 Table-Specific Filters
```
InstrumentsTableFilter.js ← Instruments table context & filtering
LazosTableFilter.js ← Lazos table context & filtering
```

### ❌ Unused Components
```
ProgressFilter.js ← UNUSED (functionality exists in hooks/components)
```

## 🔄 Filter Flow Patterns

### Status Filter Pattern (5 filters)
```
Data Input → useBaseStatusFilter Hook → BaseStatusFilter UI → Filtered Output
├── Exclusive filtering (Done/Pending/Not Apply)
├── Subsystem selection
├── Search functionality
└── Propagation support
```

### Relationship Filter Pattern (3 filters)
```
Multiple Datasets → Cross-reference Logic → Context Provider → Filtered Results
├── Control/Detail matching
├── Test pack relationships
└── Subsystem relationships
```

### Table Context Pattern (2 filters)
```
Table Data → Context Provider → Filter State → Multiple Consumers
├── SQL WHERE clause generation
├── Filter state management
└── Multi-table coordination
```

## 📍 Usage Locations

### DynamicCalculationPanel.js Uses:
- InstStatusFilter
- LoopStatusFilter
- InsulationStatusFilter
- ItemsTotalStatusFilter
- TracingStatusFilter
- HitoFilterA
- SubsystemFilterA

### ChartSelector.optimized.js Uses:
- IsometricRelationshipFilter
- TestPackRelationshipFilter
- SubsystemRelationshipFilter
- InstrumentsTableFilter
- LazosTableFilter
- FilterStatusBar

### App.optimized.js Uses:
- FilterPanel.optimized

### Multiple Tables Use:
- InstrumentsTableFilter (5+ components)
- LazosTableFilter (3+ components)

## 🎛️ Filter Configuration

### BaseStatusFilter Props:
```javascript
{
  data,           // Dataset to filter
  onFilterChange, // Filter callback
  isVisible,      // Visibility state
  onClose,        // Close handler
  onPropagationChange, // Propagation callback
  onBringToFront, // Z-index handler
  title,          // Filter title
  dataFields: {   // Field mappings
    total: 'field_name',
    done: 'field_name'
  },
  tooltipLabels: { // Custom tooltips
    done: 'text',
    pending: 'text', 
    notapply: 'text'
  }
}
```

### Common Filter States:
- `selectedSubsystems` - Selected subsystem checkboxes
- `exclusiveFilter` - Done/Pending/Not Apply mode
- `searchTerm` - Search filter text
- `propagationTarget` - Cross-filter target

## 🚀 Future Development Guidelines

### Adding New Status Filter:
1. Create thin wrapper using BaseStatusFilter
2. Define dataFields mapping
3. Add to DynamicCalculationPanel if needed

### Adding New Specialized Filter:
1. Create standalone component
2. Use useFilterDebounce for performance
3. Follow existing UI patterns

### Modifying Base Logic:
1. Update useBaseStatusFilter hook
2. All 5 status filters inherit changes automatically
3. Test all status filters together