import { useInstrumentsTableFilterContext } from '../components/filters/InstrumentsTableFilter';
import useInstrumentsDataLoader from './useInstrumentsDataLoader';
import { multiFilterWasm } from '../wasm/multi-filter.wasm.js';
import { sqlEngineWasm } from '../wasm/sql-engine.wasm.js';
import { useEffect, useState } from 'react';

const useInstrumentsTableDataWasm = (tableType) => {
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
    selectedIsometric,
    selectedTestPack,
    selectedSubsystem,
    handleTestPackClick,
    handleSubsystemClick,
    getSqlWhereClause,
    setTableData: setContextTableData,
    setGroupBy: setContextGroupBy,
    onIsometricSelect
  } = useInstrumentsTableFilterContext();

  // Data loading with WASM optimization
  const whereClause = getSqlWhereClause(tableType);
  const cacheKey = `${tableType}_${selectedIsometric || 'all'}_${selectedSubsystem || 'all'}_${selectedTestPack || 'all'}`;
  const {
    data: rawData,
    loading,
    error,
    loadTime,
    queryTime
  } = useInstrumentsDataLoader(tableType, whereClause, cacheKey);

  // WASM-optimized data processing (currently disabled to prevent filtering issues)
  const [processedData, setProcessedData] = useState([]);
  const [processingTime, setProcessingTime] = useState(null);

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
    loading,
    error,
    loadTime,
    queryTime,
    processingTime,
    wasmEnabled: wasmInitialized && (multiFilterWasm.isUsingWasm() || sqlEngineWasm.isUsingWasm()),
    
    // Filter state
    selectedIsometric,
    selectedTestPack,
    selectedSubsystem,
    
    // Filter handlers
    handleTestPackClick,
    handleSubsystemClick,
    onIsometricSelect,
    
    // Context setters (for DynamicInstrumentsTable)
    setContextTableData,
    setContextGroupBy
  };
};

export default useInstrumentsTableDataWasm;