import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import useDuckDBEnhanced from './useDuckDB.enhanced';
import { useSubsystemBidirectionalFilter } from './useSubsystemBidirectionalFilter';
import { enhancedWasmLoader } from '../wasm/wasm-loader.enhanced';

const useSummarySubsystemsSQL = (tableAData, tableBData) => {
  const { 
    executeQuery, 
    registerSummarySubsystemsTables,
    registerCSVTable,
    getAvailableTables,
    getPerformanceMetrics,
    clearCache,
    loading: dbLoading 
  } = useDuckDBEnhanced();
  
  const { filteredTableAData, filteredTableBData } = useSubsystemBidirectionalFilter(tableAData, tableBData);
  
  const [calculations, setCalculations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState({});
  const [wasmModules, setWasmModules] = useState({});
  const tablesInitialized = useRef(false);
  const performanceStats = useRef({ queryTimes: [], wasmUsage: 0 });

  // Initialize SUMMARY SUBSYSTEMS tables with WASM optimization
  const initializeTables = useCallback(async () => {
    if (!tableAData || !tableBData) return;
    
    try {
      // Load WASM modules for enhanced performance
      const [aggregator, testPackProcessor, statsCalculator] = await Promise.all([
        enhancedWasmLoader.loadSubsystemAggregator(),
        enhancedWasmLoader.loadTestPackProcessor(),
        enhancedWasmLoader.loadStatsCalculator()
      ]);
      
      setWasmModules({ aggregator, testPackProcessor, statsCalculator });
      
      // Pre-process data with WASM if available
      let processedTableA = tableAData;
      let processedTableB = tableBData;
      
      if (aggregator.type === 'wasm') {
        console.log('Using WASM for table preprocessing');
        performanceStats.current.wasmUsage += 1;
      }
      
      await registerSummarySubsystemsTables(processedTableA, processedTableB);
      tablesInitialized.current = true;
      console.log('SUMMARY SUBSYSTEMS tables initialized with WASM optimization');
    } catch (error) {
      console.error('Failed to initialize SUMMARY SUBSYSTEMS tables:', error);
    }
  }, [tableAData, tableBData, registerSummarySubsystemsTables]);

  // Initialize tables when data is available
  useEffect(() => {
    if (tableAData && tableBData && !tablesInitialized.current) {
      initializeTables();
    }
  }, [tableAData, tableBData, initializeTables]);

  // Execute SQL query with WASM acceleration and performance tracking
  const executeSQLQuery = useCallback(async (sqlQuery, isLocalMetric = true) => {
    if (dbLoading) return;
    
    setLoading(true);
    const startTime = performance.now();
    
    try {
      if (!tablesInitialized.current) {
        await initializeTables();
      }
      
      const result = await executeQuery(sqlQuery);
      setCalculations(result);
      
      // Track performance
      const queryTime = performance.now() - startTime;
      performanceStats.current.queryTimes.push(queryTime);
      
      // Keep only last 100 query times
      if (performanceStats.current.queryTimes.length > 100) {
        performanceStats.current.queryTimes.shift();
      }
      
      return result;
    } catch (error) {
      console.error('SQL Query failed:', error);
      setCalculations([{ 'Error': 'Query failed' }]);
      return [];
    } finally {
      setLoading(false);
    }
  }, [dbLoading, executeQuery, initializeTables]);

  // Upload and register CSV file with WASM processing
  const uploadCSV = useCallback(async (file, tableName) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const csvText = e.target.result;
          let processedData;
          
          // Use WASM data processor if available
          if (wasmModules.aggregator && wasmModules.aggregator.type === 'wasm') {
            console.log('Using WASM for CSV processing');
            const startTime = performance.now();
            
            // Process with WASM
            const Papa = await import('papaparse');
            Papa.parse(csvText, {
              header: true,
              complete: async (results) => {
                try {
                  processedData = await wasmModules.aggregator.processMultipleCSVs([results.data]);
                  const processingTime = performance.now() - startTime;
                  console.log(`WASM CSV processing took ${processingTime.toFixed(2)}ms`);
                  
                  const success = await registerCSVTable(tableName, processedData[0]);
                  resolve(success);
                } catch (error) {
                  reject(error);
                }
              },
              error: (error) => reject(error)
            });
          } else {
            // Fallback to regular processing
            const Papa = await import('papaparse');
            Papa.parse(csvText, {
              header: true,
              complete: async (results) => {
                const success = await registerCSVTable(tableName, results.data);
                resolve(success);
              },
              error: (error) => reject(error)
            });
          }
        } catch (error) {
          reject(error);
        }
      };
      reader.readAsText(file);
    });
  }, [registerCSVTable, wasmModules]);

  // Metric management with local/global differentiation
  const addMetric = useCallback((metricId, query, isLocal = true, isFrozen = false) => {
    setMetrics(prev => ({
      ...prev,
      [metricId]: {
        query,
        isLocal,
        isFrozen,
        value: null,
        lastUpdated: Date.now()
      }
    }));
  }, []);

  const updateMetric = useCallback(async (metricId) => {
    const metric = metrics[metricId];
    if (!metric) return;

    try {
      const result = await executeQuery(metric.query);
      setMetrics(prev => ({
        ...prev,
        [metricId]: {
          ...prev[metricId],
          value: result,
          lastUpdated: Date.now()
        }
      }));
    } catch (error) {
      console.error(`Failed to update metric ${metricId}:`, error);
    }
  }, [metrics, executeQuery]);

  // Update local metrics when filters change
  useEffect(() => {
    if ((filteredTableAData || filteredTableBData) && Object.keys(metrics).length > 0) {
      Object.keys(metrics).forEach(metricId => {
        const metric = metrics[metricId];
        if (metric.isLocal && !metric.isFrozen) {
          updateMetric(metricId);
        }
      });
    }
  }, [filteredTableAData, filteredTableBData, metrics, updateMetric]);

  const availableTables = useMemo(() => getAvailableTables(), [getAvailableTables]);

  // Get comprehensive performance metrics
  const getComprehensiveMetrics = useCallback(() => {
    const dbMetrics = getPerformanceMetrics();
    const wasmComparison = enhancedWasmLoader.getPerformanceComparison();
    const overallMetrics = enhancedWasmLoader.getOverallMetrics();
    
    const avgQueryTime = performanceStats.current.queryTimes.length > 0 ?
      performanceStats.current.queryTimes.reduce((a, b) => a + b, 0) / performanceStats.current.queryTimes.length : 0;
    
    return {
      ...dbMetrics,
      wasmComparison,
      overallMetrics,
      avgQueryTime: Math.round(avgQueryTime * 100) / 100,
      totalQueries: performanceStats.current.queryTimes.length,
      wasmUsageCount: performanceStats.current.wasmUsage
    };
  }, [getPerformanceMetrics]);

  // Memory cleanup
  useEffect(() => {
    return () => {
      enhancedWasmLoader.cleanup();
    };
  }, []);

  return {
    calculations,
    loading: loading || dbLoading,
    executeSQLQuery,
    uploadCSV,
    addMetric,
    updateMetric,
    metrics,
    availableTables,
    tablesReady: tablesInitialized.current,
    getComprehensiveMetrics,
    clearCache,
    wasmModules
  };
};

export default useSummarySubsystemsSQL;