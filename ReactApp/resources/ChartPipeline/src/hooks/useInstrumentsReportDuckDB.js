import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import useDuckDB3 from './useDuckDB3';

/**
 * Custom hook for handling DuckDB integration with Instruments Report tables
 * This hook provides SQL query capabilities across all tables in the Instruments Report tab
 */
const useInstrumentsReportDuckDB = (
  controlData, 
  detailsData, 
  dynamicData,
  filteredControlData, 
  filteredDetailsData,
  filteredDynamicData
) => {
  const { 
    loading: duckDBLoading, 
    error, 
    createTableFromParquet, 
    executeQuery,
    clearQueryCache
  } = useDuckDB3();
  
  const [calculations, setCalculations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tableInfo, setTableInfo] = useState({});
  const tablesInitialized = useRef(false);
  const tableDataRef = useRef({
    controlInstrumentsByIsometric: null,
    detailsInstrumentsTable: null,
    dynamicInstrumentReadingTable: null
  });

  // Convert JavaScript array to ArrayBuffer for DuckDB
  const convertToArrayBuffer = useCallback((data) => {
    if (!data || data.length === 0) return null;
    
    // Create a simple CSV-like format in memory
    const headers = Object.keys(data[0]);
    const rows = data.map(row => headers.map(h => {
      const val = row[h];
      // Handle different data types appropriately
      if (val === null || val === undefined) return '';
      if (typeof val === 'string') return `"${val.replace(/"/g, '""')}"`;
      return val;
    }).join(','));
    
    const csvContent = [headers.join(','), ...rows].join('\n');
    const encoder = new TextEncoder();
    return encoder.encode(csvContent).buffer;
  }, []);

  // Initialize tables with data
  const initializeTables = useCallback(async () => {
    if (duckDBLoading || tablesInitialized.current) return;
    
    setLoading(true);
    try {
      // Store the data references
      tableDataRef.current = {
        controlInstrumentsByIsometric: controlData,
        detailsInstrumentsTable: detailsData,
        dynamicInstrumentReadingTable: dynamicData || controlData // Fallback to controlData if dynamicData not provided
      };
      
      // Convert data to ArrayBuffer format for DuckDB
      const controlBuffer = convertToArrayBuffer(controlData);
      const detailsBuffer = convertToArrayBuffer(detailsData);
      const dynamicBuffer = convertToArrayBuffer(dynamicData || controlData);
      
      if (controlBuffer) {
        await createTableFromParquet('controlInstrumentsByIsometric', controlBuffer);
      }
      
      if (detailsBuffer) {
        await createTableFromParquet('detailsInstrumentsTable', detailsBuffer);
      }
      
      if (dynamicBuffer) {
        await createTableFromParquet('dynamicInstrumentReadingTable', dynamicBuffer);
      }
      
      tablesInitialized.current = true;
      
      // Update table info
      updateTableInfo();
    } catch (err) {
      console.error('Failed to initialize DuckDB tables:', err);
    } finally {
      setLoading(false);
    }
  }, [controlData, detailsData, dynamicData, duckDBLoading, createTableFromParquet, convertToArrayBuffer]);

  // Update tables with filtered data
  const updateTables = useCallback(async () => {
    if (!tablesInitialized.current) {
      await initializeTables();
      return;
    }
    
    setLoading(true);
    try {
      // Use filtered data if available, otherwise use original data
      const controlDataToUse = filteredControlData || controlData;
      const detailsDataToUse = filteredDetailsData || detailsData;
      const dynamicDataToUse = filteredDynamicData || dynamicData || controlData;
      
      // Only update if data has changed
      if (controlDataToUse !== tableDataRef.current.controlInstrumentsByIsometric) {
        const controlBuffer = convertToArrayBuffer(controlDataToUse);
        if (controlBuffer) {
          await createTableFromParquet('controlInstrumentsByIsometric', controlBuffer);
          tableDataRef.current.controlInstrumentsByIsometric = controlDataToUse;
        }
      }
      
      if (detailsDataToUse !== tableDataRef.current.detailsInstrumentsTable) {
        const detailsBuffer = convertToArrayBuffer(detailsDataToUse);
        if (detailsBuffer) {
          await createTableFromParquet('detailsInstrumentsTable', detailsBuffer);
          tableDataRef.current.detailsInstrumentsTable = detailsDataToUse;
        }
      }
      
      if (dynamicDataToUse !== tableDataRef.current.dynamicInstrumentReadingTable) {
        // For dynamic table, we need to flatten the hierarchy and extract only top-level rows
        const flattenedDynamicData = flattenHierarchicalTable(dynamicDataToUse);
        const dynamicBuffer = convertToArrayBuffer(flattenedDynamicData);
        if (dynamicBuffer) {
          await createTableFromParquet('dynamicInstrumentReadingTable', dynamicBuffer);
          tableDataRef.current.dynamicInstrumentReadingTable = dynamicDataToUse;
        }
      }
      
      // Clear query cache after updating tables
      clearQueryCache();
      
      // Update table info
      updateTableInfo();
    } catch (err) {
      console.error('Failed to update DuckDB tables:', err);
    } finally {
      setLoading(false);
    }
  }, [
    controlData, detailsData, dynamicData,
    filteredControlData, filteredDetailsData, filteredDynamicData,
    initializeTables, createTableFromParquet, convertToArrayBuffer, clearQueryCache
  ]);

  // Flatten hierarchical table (dynamicInstrumentReadingTable)
  const flattenHierarchicalTable = useCallback((data) => {
    if (!data || data.length === 0) return [];
    
    // Extract only top-level rows (parent rows)
    // A parent row is one that has children or doesn't have a parent
    const parentRows = data.filter(row => {
      // Identify parent rows based on your data structure
      // This is an example - adjust according to your actual data structure
      return !row.isChild && !row.parentId;
    });
    
    return parentRows.length > 0 ? parentRows : data;
  }, []);

  // Update table info for UI display
  const updateTableInfo = useCallback(async () => {
    try {
      // Get row counts for each table
      const [controlCount] = await executeQuery('SELECT COUNT(*) as count FROM controlInstrumentsByIsometric');
      const [detailsCount] = await executeQuery('SELECT COUNT(*) as count FROM detailsInstrumentsTable');
      const [dynamicCount] = await executeQuery('SELECT COUNT(*) as count FROM dynamicInstrumentReadingTable');
      
      // Get column names for each table
      const [controlColumns] = await executeQuery('SELECT * FROM controlInstrumentsByIsometric LIMIT 1');
      const [detailsColumns] = await executeQuery('SELECT * FROM detailsInstrumentsTable LIMIT 1');
      const [dynamicColumns] = await executeQuery('SELECT * FROM dynamicInstrumentReadingTable LIMIT 1');
      
      setTableInfo({
        controlInstrumentsByIsometric: {
          totalRows: controlCount?.count || 0,
          fields: controlColumns ? Object.keys(controlColumns) : []
        },
        detailsInstrumentsTable: {
          totalRows: detailsCount?.count || 0,
          fields: detailsColumns ? Object.keys(detailsColumns) : []
        },
        dynamicInstrumentReadingTable: {
          totalRows: dynamicCount?.count || 0,
          fields: dynamicColumns ? Object.keys(dynamicColumns) : []
        }
      });
    } catch (err) {
      console.error('Failed to update table info:', err);
    }
  }, [executeQuery]);

  // Execute SQL query
  const executeSQLQuery = useCallback(async (sqlQuery) => {
    if (!sqlQuery.trim()) return [];
    
    setLoading(true);
    try {
      // Initialize tables if not done yet
      if (!tablesInitialized.current) {
        await initializeTables();
      }
      
      // Execute the query
      const result = await executeQuery(sqlQuery);
      setCalculations(result);
      return result;
    } catch (err) {
      console.error('SQL Query execution failed:', err);
      setCalculations([{ Error: err.message || 'Query execution failed' }]);
      return [{ Error: err.message || 'Query execution failed' }];
    } finally {
      setLoading(false);
    }
  }, [initializeTables, executeQuery]);

  // Initialize tables on first render
  useEffect(() => {
    if (!duckDBLoading && !tablesInitialized.current) {
      initializeTables();
    }
  }, [duckDBLoading, initializeTables]);

  // Update tables when filtered data changes
  useEffect(() => {
    if (!duckDBLoading && tablesInitialized.current) {
      updateTables();
    }
  }, [filteredControlData, filteredDetailsData, filteredDynamicData, duckDBLoading, updateTables]);

  // Get available tables
  const availableTables = useMemo(() => {
    return Object.keys(tableInfo);
  }, [tableInfo]);

  return {
    calculations,
    loading: loading || duckDBLoading,
    error,
    executeSQLQuery,
    tableInfo,
    availableTables,
    updateTables
  };
};

export default useInstrumentsReportDuckDB;