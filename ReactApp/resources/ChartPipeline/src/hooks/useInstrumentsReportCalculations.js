import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import useDuckDB from './useDuckDB';

/**
 * Custom hook for handling dynamic calculations specifically for the INSTRUMENTS REPORT tab
 * This hook provides SQL query capabilities for the INSTRUMENTS REPORT tab's tables
 */
const useInstrumentsReportCalculations = (controlData, detailsData, filteredControlData, filteredDetailsData, filters = {}) => {
  const { 
    executeQuery, 
    createTable, 
    updateFilteredTable,
    getAvailableTables,
    getTableFields,
    getTableInfo,
    lastQueryResult,
    loading: dbLoading 
  } = useDuckDB();
  
  const [calculations, setCalculations] = useState([]);
  const [loading, setLoading] = useState(false);
  const tablesInitialized = useRef(false);

  // Initialize tables with data
  const initializeTables = useCallback(async () => {
    if (!controlData || !detailsData) return;
    
    try {
      // Create tables for the three main data sources
      await createTable('ControlInstrumentsByIsometric', controlData);
      await createTable('Details Instruments', detailsData);
      await createTable('DynamicInstrumentsTable', controlData);
      tablesInitialized.current = true;
      
      // Immediately update with filtered data if available
      const controlDataToUse = filteredControlData && filteredControlData.length > 0 ? filteredControlData : controlData;
      const detailsDataToUse = filteredDetailsData && filteredDetailsData.length > 0 ? filteredDetailsData : detailsData;
      
      updateFilteredTable('ControlInstrumentsByIsometric', controlDataToUse);
      updateFilteredTable('Details Instruments', detailsDataToUse);
      updateFilteredTable('DynamicInstrumentsTable', controlDataToUse);
    } catch (error) {
      console.error('Failed to initialize tables for INSTRUMENTS REPORT:', error);
    }
  }, [controlData, detailsData, filteredControlData, filteredDetailsData, createTable, updateFilteredTable]);

  // Update filtered data when filters change
  useEffect(() => {
    if (tablesInitialized.current) {
      // Always update with current data (filtered or original)
      const controlDataToUse = filteredControlData && filteredControlData.length > 0 ? filteredControlData : controlData;
      const detailsDataToUse = filteredDetailsData && filteredDetailsData.length > 0 ? filteredDetailsData : detailsData;
      
      if (controlDataToUse) {
        updateFilteredTable('ControlInstrumentsByIsometric', controlDataToUse);
        updateFilteredTable('DynamicInstrumentsTable', controlDataToUse);
      }
      if (detailsDataToUse) {
        updateFilteredTable('Details Instruments', detailsDataToUse);
      }
    }
  }, [filteredControlData, filteredDetailsData, controlData, detailsData, updateFilteredTable]);

  // Sync calculations with auto-refreshed query results
  useEffect(() => {
    if (lastQueryResult && lastQueryResult.length > 0 && tablesInitialized.current) {
      setCalculations(lastQueryResult);
    }
  }, [lastQueryResult]);

  // Execute SQL query function
  const executeSQLQuery = useCallback(async (sqlQuery) => {
    if (dbLoading) return;
    
    setLoading(true);
    try {
      // Initialize tables if not done
      if (!tablesInitialized.current) {
        await initializeTables();
      }
      
      const result = await executeQuery(sqlQuery);
      setCalculations(result);
      return result;
    } catch (error) {
      console.error('SQL Query failed in INSTRUMENTS REPORT:', error);
      setCalculations([{ 'Error': 'Query failed' }]);
      return [];
    } finally {
      setLoading(false);
    }
  }, [dbLoading, executeQuery, initializeTables]);

  // Get table information
  const tableInfo = useMemo(() => getTableInfo(), [getTableInfo]);
  
  // Get available tables
  const availableTables = useMemo(() => getAvailableTables(), [getAvailableTables]);

  // Get columns for each table
  const controlColumns = useMemo(() => {
    return getTableFields('ControlInstrumentsByIsometric');
  }, [getTableFields]);

  const detailColumns = useMemo(() => {
    return getTableFields('Details Instruments');
  }, [getTableFields]);

  const dynamicColumns = useMemo(() => {
    return getTableFields('DynamicInstrumentsTable');
  }, [getTableFields]);

  return {
    calculations,
    loading: loading || dbLoading,
    executeSQLQuery,
    controlColumns,
    detailColumns,
    dynamicColumns,
    availableTables,
    tableInfo
  };
};

export default useInstrumentsReportCalculations;