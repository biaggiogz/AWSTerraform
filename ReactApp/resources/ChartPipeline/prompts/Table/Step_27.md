# Request: WASM & DuckDB Optimization for SUMMARY SUBSYSTEMS Tab

## Objective
Transform the SUMMARY SUBSYSTEMS tab by implementing WebAssembly (WASM) and DuckDB optimizations while splitting the current merged table into two separate tables for better performance and user experience.

## Critical Requirements
- **SPLIT TABLE ARCHITECTURE**: Replace single merged table with two independent tables
- **WASM OPTIMIZATION**: Implement WebAssembly modules for computational-heavy operations
- **DUCKDB INTEGRATION**: Use native SQL operations for data aggregation
- **BIDIRECTIONAL FILTERING**: Synchronize SUBSYSTEM filter between both tables
- **MAINTAIN DATA INTEGRITY**: Preserve all existing data relationships and calculations
- **PERFORMANCE FOCUS**: Achieve 3-8x performance improvements

## Current Component Analysis

### Existing: SummarySubsystems.js
**Performance Issues:**
- Complex rowSpan merged table with grouped data
- Heavy JavaScript processing across 4 CSV datasets
- Nested loops for subsystem statistics
- Single-threaded Web Worker processing
- Inefficient memory usage with large datasets

**Data Sources:**
- `/data/pipelinedata.csv` (main dataset)
- `/data/aislamientos.csv` (insulation data)
- `/data/test_of_lazos_updated.csv` (loop testing data)
- `/data/subsystems_info.csv` (subsystem metadata)

## New Architecture Requirements

### TableA: Subsystem Overview (Left Side)
**Columns:**
- S/N | FLUID | SUBSYSTEM | TOTAL ITEMS | DONE ITEMS | PENDING ITEMS | DESCRIPTION | N°TP | TOTAL LOOP | LOOP DONE | LOOP PENDING

**Features:**
- Virtualized table with @tanstack/react-table
- Clickable SUBSYSTEM cells for filtering
- Progress indicators for completion rates
- Aggregated statistics from all 4 datasets

### TableB: Test Pack Details (Right Side)
**Columns:**
- SUBSYSTEM | TP's INCLUDE | PROGRESS TEST PACK | TRACEADOS | PRIORITY | HITO | TEIGA REINSTATEMENT | TEIGA INSULATION | SIEMSA | TECHNIP

**Features:**
- Expanded test pack data (handle pipe-separated values)
- Clickable SUBSYSTEM cells for filtering
- Progress bars for test pack completion
- Detailed subsystem metadata

### Bidirectional SUBSYSTEM Filter
**Functionality:**
- Single shared filter state between both tables
- Click SUBSYSTEM in TableA → filters TableB
- Click SUBSYSTEM in TableB → filters TableA
- Visual highlighting of selected subsystem
- Clear filter option

## WASM Optimization Targets

### 1. Data Processing Layer (HIGHEST PRIORITY)
**Target**: Multi-CSV aggregation and merging
- **WASM Module**: `subsystem-aggregator.wasm`
- **Functions**:
  - `processMultipleCSVs()` - parallel CSV processing
  - `aggregateSubsystemStats()` - statistical calculations
  - `mergeDatasets()` - cross-dataset relationship building
- **Performance Goal**: 5-8x faster data processing

### 2. Test Pack Processing Engine
**Target**: Pipe-separated test pack handling
- **WASM Module**: `testpack-processor.wasm`
- **Functions**:
  - `expandTestPacks()` - split "1|2|3" into separate rows
  - `calculateTestPackProgress()` - progress aggregations
  - `groupTestPacksBySubsystem()` - grouping operations
- **Performance Goal**: 4-6x faster test pack processing

### 3. Statistical Calculations Engine
**Target**: Complex mathematical operations
- **WASM Module**: `stats-calculator.wasm`
- **Functions**:
  - `calculateAverages()` - weighted averages
  - `computeProgressPercentages()` - completion rates
  - `aggregateLoopStatistics()` - loop testing metrics
- **Performance Goal**: 3-5x faster calculations

## DuckDB Integration Strategy

### Enhanced SQL Engine
**Target**: Replace JavaScript aggregations with native SQL
- **Module**: Enhanced `useDuckDB.js` with WASM acceleration
- **Capabilities**:
  - Multi-table JOINs across 4 datasets
  - Complex GROUP BY operations
  - Statistical functions (AVG, SUM, COUNT)
  - Window functions for progress calculations

### SQL Query Examples
```sql
-- TableA Data Aggregation
SELECT 
  s.SUBSYSTEM,
  s.FLUID,
  s.DESCRIPTION,
  COUNT(*) as TOTAL_ITEMS,
  SUM(CASE WHEN a.DONE = 'YES' THEN 1 ELSE 0 END) as DONE_ITEMS,
  COUNT(DISTINCT p.TEST_PACK) as NUM_TEST_PACKS,
  COUNT(l.LOOP_ID) as TOTAL_LOOPS,
  SUM(CASE WHEN l.OK = '100.00%' THEN 1 ELSE 0 END) as LOOP_DONE
FROM subsystems s
LEFT JOIN aislamientos a ON s.SUBSYSTEM = a.SUBSYSTEM
LEFT JOIN pipelinedata p ON s.SUBSYSTEM = p.SUBSYSTEM
LEFT JOIN loops l ON s.SUBSYSTEM = l.SUBS_PRE
GROUP BY s.SUBSYSTEM, s.FLUID, s.DESCRIPTION;

-- TableB Test Pack Details
SELECT 
  SUBSYSTEM,
  TEST_PACK as TP_INCLUDE,
  AVG(CONSTRUC_COORD_PROGRESS) as PROGRESS_TEST_PACK,
  TRACEADOS,
  PRIORITY,
  HITO
FROM pipelinedata
WHERE TEST_PACK IS NOT NULL
GROUP BY SUBSYSTEM, TEST_PACK, TRACEADOS, PRIORITY, HITO;
```

## Implementation Requirements

### File Structure
```
src/components/
├── SummarySubsystemsTableA.js (new)
├── SummarySubsystemsTableB.js (new)
├── SummarySubsystemsContainer.js (new)
└── SummarySubsystems.js (refactor)

src/hooks/
├── useSummarySubsystemsData.js (new)
├── useSubsystemBidirectionalFilter.js (new)
└── useDuckDB.enhanced.js (enhanced)

src/wasm/
├── subsystem-aggregator.wasm (new)
├── testpack-processor.wasm (new)
├── stats-calculator.wasm (new)
```

### Component Architecture
**SummarySubsystemsContainer.js** - Main container with side-by-side layout
**SummarySubsystemsTableA.js** - Left table with subsystem overview
**SummarySubsystemsTableB.js** - Right table with test pack details
**useSubsystemBidirectionalFilter.js** - Shared filter state management

### Performance Monitoring
- **WasmPerformanceMonitor.js** integration
- Benchmark comparisons (before/after)
- Memory usage tracking
- Query execution time monitoring

## Success Criteria

### Performance Improvements
- **Data Processing**: 5-8x faster multi-CSV aggregation
- **Filtering**: 3-5x faster with WASM-optimized algorithms
- **Memory Usage**: 40-60% reduction with optimized data structures
- **UI Responsiveness**: Eliminate rowSpan complexity, smoother interactions
- **Query Performance**: 3-5x faster with native DuckDB operations

### User Experience Improvements
- **Clearer Data Presentation**: Two focused tables vs complex merged table
- **Better Filtering**: Intuitive bidirectional subsystem selection
- **Faster Interactions**: Real-time filtering without performance lag
- **Improved Readability**: Separate concerns between overview and details

### Technical Benefits
- **Parallel Processing**: WASM enables multi-threading
- **Native SQL**: DuckDB replaces JavaScript loops
- **Modular Architecture**: Independent tables for better maintainability
- **Scalability**: Optimized for larger datasets

## Testing Requirements
- Performance benchmarks comparing old vs new implementation
- Functional testing for data accuracy across both tables
- Filter synchronization testing
- Memory leak detection
- Cross-browser WASM compatibility testing
- Large dataset stress testing (10k+ records)

## Deliverables
1. **Split Table Components**: TableA and TableB with virtualization
2. **WASM Modules**: Three optimized modules for data processing
3. **Enhanced DuckDB Integration**: Native SQL operations
4. **Bidirectional Filter System**: Synchronized subsystem filtering
5. **Performance Benchmarks**: Before/after comparison metrics
6. **Documentation**: Implementation guide and performance analysis

**CRITICAL SUCCESS FACTOR**: The new implementation must provide significantly better performance while maintaining all existing data relationships and providing a superior user experience through the split-table architecture.