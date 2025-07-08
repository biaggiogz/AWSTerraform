# Request: SQL Query Interface Implementation for SUMMARY SUBSYSTEMS Tab

## Project Structure

- ReactApp/resources/ChartPipeline/src
- TableA: ReactApp/resources/ChartPipeline/src/components/tables/SummarySubsystemsTableA.js
- TableB: ReactApp/resources/ChartPipeline/src/components/tables/SummarySubsystemsTableB.js

## Implementation Flow by Phases

### Phase 1: Core Infrastructure Setup
1. **Extend DuckDB Hook for SUMMARY SUBSYSTEMS**
   - Modify `useDuckDB.enhanced.js` to support multiple table registration
   - Add table management for TableA and TableB data
   - Implement CSV upload and table registration functionality

2. **Create Enhanced SQL Hook**
   - Extend `useDynamicCalculations.js` for SUMMARY SUBSYSTEMS context
   - Add support for local/global metric differentiation
   - Implement filter-responsive vs filter-frozen queries

### Phase 2: WASM Performance Integration
1. **Leverage Existing WASM Modules**
   - Utilize `sql-engine.wasm.js` for query execution
   - Use `data-processor.wasm.js` for CSV processing
   - Apply `multi-filter.wasm.js` for filter-aware operations

2. **Optimize Query Performance**
   - Pre-index TableA and TableB data structures
   - Implement query result caching
   - Add WASM memory management for large datasets

### Phase 3: UI Component Development
1. **SQL Interface Panel**
   - Create `SummarySubsystemsSQLPanel.js` based on `DynamicCalculationPanel.js`
   - Add CSV upload component with drag-drop functionality
   - Implement table name assignment and management

2. **Metric Cards System**
   - Extend existing metric card functionality
   - Add local/global toggle switches
   - Implement freeze/unfreeze mechanism for metrics

### Phase 4: Data Integration Layer
1. **Table Registration System**
   - Auto-register TableA as "subsystem_overview"
   - Auto-register TableB as "test_pack_details" 
   - Dynamic registration for uploaded CSV files
   - Cross-tab table access (from other dashboard tabs)

2. **Filter Integration**
   - Connect to `useSubsystemBidirectionalFilter` hook
   - Implement local metric updates on filter changes
   - Maintain global metrics isolation

### Phase 5: Query Templates and UX
1. **Pre-built Query Templates**
   - Common aggregations for TableA/TableB
   - Cross-table JOIN examples
   - Performance-optimized query patterns

2. **Advanced Features**
   - Query history and favorites
   - Export results functionality
   - Real-time query validation

## Technical Architecture

### Data Flow
```
CSV Upload → WASM Processing → DuckDB Registration → SQL Interface → Metric Cards
     ↓
Filter Changes → Local Metrics Update (unfrozen only)
     ↓
Global Metrics (frozen) remain unchanged
```

### Performance Optimizations
- **WASM-accelerated CSV parsing** (3-5x faster)
- **Pre-computed table indices** for common queries
- **Lazy loading** of metric calculations
- **Memory-efficient** result caching

### Integration Points
- Reuse `DynamicCalculationPanel` architecture
- Extend `useSummarySubsystemsData` hook
- Leverage existing WASM infrastructure
- Connect to bidirectional filter system

## Expected Performance Gains
- **Query Execution**: 2-3x faster with WASM SQL engine
- **CSV Processing**: 3-5x faster with WASM data processor
- **Filter Operations**: 2-4x faster with optimized indices
- **Memory Usage**: 40% reduction through WASM memory management

This phased approach ensures minimal disruption while maximizing performance through existing WASM infrastructure and proven SQL interface patterns.