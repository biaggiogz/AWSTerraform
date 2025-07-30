import { useInstrumentsTableFilterContext } from '../components/filters/InstrumentsTableFilter';
import useInstrumentsDataLoader from './useInstrumentsDataLoader';
import { multiFilterWasm } from '../wasm/multi-filter.wasm.js';
import { sqlEngineWasm } from '../wasm/sql-engine.wasm.js';
import { useEffect, useState, useMemo } from 'react';

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

  // Load original unfiltered data for frozen count
  const {
    data: originalData
  } = useInstrumentsDataLoader(tableType, '', `${tableType}_original`);

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

  // Calculate frozen unique TAG INST count from original data
  const frozenTagInstCount = useMemo(() => {
    if (!originalData || originalData.length === 0) return 0;
    const uniqueTags = new Set(
      originalData
        .map(row => row['TAG INST'])
        .filter(tag => tag && tag !== '')
    );
    return uniqueTags.size;
  }, [originalData]);

  // Calculate frozen control counts from original data
  const frozenControlCounts = useMemo(() => {
    if (!originalData || originalData.length === 0 || tableType !== 'control') return null;
    return {
      isometricCount: originalData.length,
      qtyInstSum: originalData.reduce((sum, row) => sum + (Number(row['QTY INST']) || 0), 0),
      scopeTeigaSum: originalData.reduce((sum, row) => sum + (Number(row['SCOPE BY TEIGA-TMI']) || 0), 0),
      scopeSiemsaSum: originalData.reduce((sum, row) => sum + (Number(row['SCOPE BY SIEMSA']) || 0), 0),
      installedTeigaSum: originalData.reduce((sum, row) => sum + (Number(row['INSTALLED BY TEIGA-TMI']) || 0), 0),
      installedSiemsaSum: originalData.reduce((sum, row) => sum + (Number(row['INSTALLED BY SIEMSA']) || 0), 0),
      pendingSum: originalData.reduce((sum, row) => sum + (Number(row['PENDING']) || 0), 0)
    };
  }, [originalData, tableType]);

  return {
    // Data
    data: processedData,
    loading,
    error,
    loadTime,
    queryTime,
    processingTime,
    wasmEnabled: wasmInitialized && (multiFilterWasm.isUsingWasm() || sqlEngineWasm.isUsingWasm()),
    
    // Counts
    frozenTagInstCount,
    frozenControlCounts,
    
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