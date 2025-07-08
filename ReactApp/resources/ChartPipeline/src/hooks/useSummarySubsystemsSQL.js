import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import useDuckDBEnhanced from './useDuckDB.enhanced';
import { useSubsystemBidirectionalFilter } from './useSubsystemBidirectionalFilter';

const useSummarySubsystemsSQL = (tableAData, tableBData) => {
  const { 
    executeQuery, 
    registerSummarySubsystemsTables,
    registerCSVTable,
    getAvailableTables,
    loading: dbLoading 
  } = useDuckDBEnhanced();
  
  const { filteredTableAData, filteredTableBData } = useSubsystemBidirectionalFilter(tableAData, tableBData);
  
  const [calculations, setCalculations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState({});
  const tablesInitialized = useRef(false);

  // Initialize SUMMARY SUBSYSTEMS tables
  const initializeTables = useCallback(async () => {
    if (!tableAData || !tableBData) return;
    
    try {
      await registerSummarySubsystemsTables(tableAData, tableBData);
      tablesInitialized.current = true;
      console.log('SUMMARY SUBSYSTEMS tables initialized');
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

  // Execute SQL query with filter awareness
  const executeSQLQuery = useCallback(async (sqlQuery, isLocalMetric = true) => {
    if (dbLoading) return;
    
    setLoading(true);
    try {
      if (!tablesInitialized.current) {
        await initializeTables();
      }
      
      const result = await executeQuery(sqlQuery);
      setCalculations(result);
      return result;
    } catch (error) {
      console.error('SQL Query failed:', error);
      setCalculations([{ 'Error': 'Query failed' }]);
      return [];
    } finally {
      setLoading(false);
    }
  }, [dbLoading, executeQuery, initializeTables]);

  // Upload and register CSV file
  const uploadCSV = useCallback(async (file, tableName) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const csvText = e.target.result;
          const Papa = await import('papaparse');
          
          Papa.parse(csvText, {
            header: true,
            complete: async (results) => {
              const success = await registerCSVTable(tableName, results.data);
              resolve(success);
            },
            error: (error) => reject(error)
          });
        } catch (error) {
          reject(error);
        }
      };
      reader.readAsText(file);
    });
  }, [registerCSVTable]);

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

  return {
    calculations,
    loading: loading || dbLoading,
    executeSQLQuery,
    uploadCSV,
    addMetric,
    updateMetric,
    metrics,
    availableTables,
    tablesReady: tablesInitialized.current
  };
};

export default useSummarySubsystemsSQL;