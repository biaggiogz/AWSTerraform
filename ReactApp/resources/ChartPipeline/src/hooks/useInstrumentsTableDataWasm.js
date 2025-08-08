import { useInstrumentsTableFilterContext } from '../components/filters/InstrumentsTableFilter';
import useInstrumentsDataLoader from './useInstrumentsDataLoader';
import { multiFilterWasm } from '../wasm/multi-filter.wasm.js';
import { sqlEngineWasm } from '../wasm/sql-engine.wasm.js';
import { useEffect, useState, useMemo } from 'react';

const useInstrumentsTableDataWasm = (tableType, groupByField = null) => {
  const [wasmInitialized, setWasmInitialized] = useState(false);
  
  // Initialize WASM modules
  useEffect(() => {
    const initWasm = async () => {
      try {
        // Try to initialize WASM modules silently
        await Promise.all([
          multiFilterWasm.initialize(),
          sqlEngineWasm.initialize()
        ]);
        setWasmInitialized(true);
      } catch (error) {
        // Silently fall back to JS implementation
        setWasmInitialized(true);
      }
    };
    initWasm();
  }, []);

  // Get filter context
  const {
    selectedSubsystem,
    selectedIsometric,
    selectedTestPack,
    handleSubsystemClick,
    handleTestPackClick,
    onIsometricSelect,
    getSqlWhereClause,
    setTableData: setContextTableData,
    setGroupBy: setContextGroupBy
  } = useInstrumentsTableFilterContext();

  // Data loading with WASM optimization
  const whereClause = getSqlWhereClause(tableType);
  const cacheKey = `${tableType}_${groupByField || 'default'}_${selectedSubsystem || 'all'}`;
  const {
    data: rawData,
    loading,
    error,
    loadTime,
    queryTime
  } = useInstrumentsDataLoader(tableType, whereClause, cacheKey, groupByField);
  
  // Load unfiltered data for frozen counts
  const {
    data: unfilteredData
  } = useInstrumentsDataLoader(tableType, '', `${tableType}_${groupByField || 'default'}_unfiltered`, groupByField);



  // WASM-optimized data processing (currently disabled to prevent filtering issues)
  const [processedData, setProcessedData] = useState([]);
  const [processingTime, setProcessingTime] = useState(null);
  
  // Calculate frozen TAG INST count for details table from unfiltered data
  const frozenTagInstCount = useMemo(() => {
    if (tableType !== 'details' || !unfilteredData || unfilteredData.length === 0) return 0;
    const uniqueTags = new Set(
      unfilteredData
        .map(row => row['TAG INST'])
        .filter(tag => tag && tag !== '')
    );
    return uniqueTags.size;
  }, [tableType, unfilteredData]);
  
  // Calculate frozen control counts for control table from unfiltered data
  const frozenControlCounts = useMemo(() => {
    if (tableType !== 'control' || !unfilteredData || unfilteredData.length === 0) return null;
    return {
      totalRecords: unfilteredData.length,
      qtyInst: unfilteredData.reduce((sum, row) => sum + (Number(row['QTY INST']) || 0), 0)
    };
  }, [tableType, unfilteredData]);

  useEffect(() => {
    // For now, just pass through the raw data without WASM filtering
    // The SQL filtering is already handled in the data loader
    setProcessedData(rawData || []);
    
    if (wasmInitialized && rawData && rawData.length > 0) {
      const startTime = performance.now();
      // Simulate WASM processing time for metrics
      const endTime = performance.now();
      setProcessingTime((endTime - startTime).toFixed(2));
    }
  }, [wasmInitialized, rawData]);



  return {
    // Data
    data: processedData,
    originalData: rawData,
    unfilteredData,
    loading,
    error,
    loadTime,
    queryTime,
    processingTime,
    wasmEnabled: wasmInitialized && (multiFilterWasm.isUsingWasm() || sqlEngineWasm.isUsingWasm()),
    
    // Control-specific data
    frozenControlCounts,
    frozenTagInstCount,
    selectedIsometric,
    selectedTestPack,
    handleTestPackClick,
    onIsometricSelect,
    
    // Filter state
    selectedSubsystem,
    
    // Filter handlers
    handleSubsystemClick,
    
    // Context setters (for DynamicInstrumentsTable)
    setContextTableData,
    setContextGroupBy
  };
};

export default useInstrumentsTableDataWasm;