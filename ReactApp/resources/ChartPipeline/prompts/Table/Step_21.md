# Request: DuckDB-WASM Dynamic Calculation Panel for INSTRUMENTS REPORT

## CRITICAL REQUIREMENTS
- **DO NOT MODIFY** existing components: ControlInstrumentsTable, DetailsInstrumentsTable, ChartSelector
- **PRESERVE ALL** current filtering logic, layout, colors, and functionality
- **MAINTAIN** existing relationship filters (Isometric, TestPack, Subsystem)
- **ADD ONLY** new dynamic calculation panel as additional feature

## Implementation Plan

### Phase 1: Foundation Setup

**1.1 Install DuckDB-WASM**
```bash
npm install @duckdb/duckdb-wasm
```

**1.2 Create DuckDB Hook**
Create `src/hooks/useDuckDB.js`:
- Initialize DuckDB instance in web worker
- Load CSV data into DuckDB tables
- Handle connection lifecycle
- Maintain existing data loading patterns

**1.3 Data Integration Strategy**
- Use existing `useInstrumentsDataLoader` data
- Convert processed data to DuckDB tables
- Preserve current CSV loading and error handling

### Phase 2: Table Relationship Mapping

**2.1 Create Base Tables in DuckDB**
```sql
CREATE TABLE control_instruments AS SELECT * FROM ?
CREATE TABLE details_instruments AS SELECT * FROM ?
```

**2.2 Establish Primary Relationship**
```sql
CREATE VIEW instrument_master AS
SELECT 
  c.*,
  d.SUBSYSTEM as detail_subsystem,
  d."TAG INST" as detail_tag,
  d.TESTPACK as detail_testpack,
  d."INSTRUMENT TYPE" as instrument_type
FROM control_instruments c
LEFT JOIN details_instruments d 
  ON c.ISOMETRIC = d."MOUNTING ON ISO/EQUI/PACK"
```

**2.3 Relationship Validation Queries**
- Count orphaned records in both tables
- Validate SUBSYSTEM field consistency
- Check TESTPACK alignment between tables
- Generate relationship quality metrics

### Phase 3: Dynamic Calculation Engine

**3.1 Create Calculation Hook**
Create `src/hooks/useDynamicCalculations.js`:
- Accept column selection and calculation type parameters
- Generate SQL queries dynamically based on user input
- Handle cross-table calculations with proper JOINs
- Apply current filter state from existing filter system

**3.2 Query Builder Functions**
- Build SELECT clauses with aggregate functions
- Handle GROUP BY operations
- Generate WHERE clauses from current filters
- Support cross-table ratio calculations

**3.3 Supported Calculation Types**
- **Numeric**: COUNT, SUM, AVG, MIN, MAX, MEDIAN
- **Text**: COUNT, DISTINCT COUNT
- **Cross-table**: Relationship ratios, completion percentages
- **Custom**: User-defined formulas

### Phase 4: UI Components

**4.1 Dynamic Calculation Panel**
Create `src/components/DynamicCalculationPanel.js`:
- Column selector dropdown (multi-select)
- Calculation type selector
- Group by options
- Results display area
- Export functionality

**4.2 Panel Integration**
- Add panel to existing ChartSelector layout
- Position below existing tables
- Use consistent Chakra UI styling
- Maintain current color scheme

**4.3 Results Display Components**
- Summary metric cards
- Sortable data grid using existing table components
- Mini charts for visual representation
- CSV/Excel export buttons

### Phase 5: Filter System Integration

**5.1 Filter State Synchronization**
- Read current filter state from existing hooks:
  - `useIsometricRelationshipFilter`
  - `useTestPackFilter` 
  - `useSubsystemFilter`
- Convert filter state to SQL WHERE clauses
- Apply filters to calculation queries

**5.2 Real-time Updates**
- Listen to filter changes from existing system
- Recalculate results when filters change
- Maintain calculation state during filter updates

**5.3 Bidirectional Filtering**
- Allow calculation results to filter main tables
- Preserve existing table interaction patterns
- Maintain current highlighting system

### Phase 6: Performance Optimization

**6.1 Query Caching Strategy**
- Cache calculation results by filter state
- Invalidate cache on data or filter changes
- Use React.useMemo for expensive operations

**6.2 Web Worker Integration**
- Move DuckDB operations to dedicated web worker
- Implement async query execution
- Add progress indicators for long-running calculations

**6.3 Memory Management**
- Efficient data transfer between main thread and worker
- Cleanup unused query results
- Optimize table creation and indexing

### Phase 7: Component Integration Points

**7.1 ChartSelector Modifications**
- Add DynamicCalculationPanel to existing tab layout
- Maintain current VStack structure
- Preserve existing component hierarchy

**7.2 Data Flow Integration**
- Use existing `finalControlData` and `finalDetailData`
- Respect current filter chain results
- Maintain existing data processing patterns

**7.3 State Management**
- Integrate with existing filter state management
- Preserve current component isolation
- Maintain existing prop passing patterns

## Implementation Sequence

### Week 1: Foundation
1. Install DuckDB-WASM
2. Create useDuckDB hook
3. Test basic table creation with existing data

### Week 2: Relationships
1. Implement table relationship mapping
2. Create validation queries
3. Test JOIN operations with sample data

### Week 3: Calculation Engine
1. Build useDynamicCalculations hook
2. Implement query builder functions
3. Test basic aggregation operations

### Week 4: UI Components
1. Create DynamicCalculationPanel component
2. Implement column and calculation selectors
3. Build results display components

### Week 5: Integration & Testing
1. Integrate panel into ChartSelector
2. Connect to existing filter system
3. Performance testing and optimization

## Success Criteria

- **Functionality**: Dynamic calculations work with all column combinations
- **Performance**: Calculations complete within 2 seconds for typical datasets
- **Integration**: Seamless operation with existing filter system
- **Compatibility**: No breaking changes to existing components
- **User Experience**: Intuitive interface matching current design patterns

## File Structure

```
src/
├── hooks/
│   ├── useDuckDB.js                    # New
│   └── useDynamicCalculations.js       # New
├── components/
│   ├── DynamicCalculationPanel.js      # New
│   ├── ControlInstrumentsTable.optimized.js  # Unchanged
│   ├── DetailsInstrumentsTable.optimized.js  # Unchanged
│   └── ChartSelector.optimized.js      # Minor addition only
└── workers/
    └── duckdb.worker.js                # New
```

## Testing Requirements

- Unit tests for calculation functions
- Integration tests with existing filter system
- Performance benchmarks with large datasets
- Cross-browser compatibility testing
- Memory usage monitoring

This implementation adds powerful analytical capabilities while preserving all existing functionality and user experience patterns.

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

