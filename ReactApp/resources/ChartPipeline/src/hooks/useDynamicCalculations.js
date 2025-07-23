import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import useDuckDB from './useDuckDB';

const useDynamicCalculations = (controlData, detailsData, filteredControlData, filteredDetailsData, filters = {}) => {
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

  const initializeTables = useCallback(async () => {
    if (!controlData || !detailsData) return;
    
    try {
      await createTable('Subsystem Overview', controlData);
      await createTable('Test Pack Details', detailsData);
      tablesInitialized.current = true;
      
      // Immediately update with filtered data if available
      const controlDataToUse = filteredControlData && filteredControlData.length > 0 ? filteredControlData : controlData;
      const detailsDataToUse = filteredDetailsData && filteredDetailsData.length > 0 ? filteredDetailsData : detailsData;
      
      updateFilteredTable('Subsystem Overview', controlDataToUse);
      updateFilteredTable('Test Pack Details', detailsDataToUse);
    } catch (error) {
      console.error('Failed to initialize tables:', error);
    }
  }, [controlData, detailsData, filteredControlData, filteredDetailsData, createTable, updateFilteredTable]);

  // Update filtered data when filters change
  useEffect(() => {
    if (tablesInitialized.current) {
      // Always update with current data (filtered or original)
      const controlDataToUse = filteredControlData && filteredControlData.length > 0 ? filteredControlData : controlData;
      const detailsDataToUse = filteredDetailsData && filteredDetailsData.length > 0 ? filteredDetailsData : detailsData;
      
      if (controlDataToUse) {
        updateFilteredTable('Subsystem Overview', controlDataToUse);
      }
      if (detailsDataToUse) {
        updateFilteredTable('Test Pack Details', detailsDataToUse);
      }
    }
  }, [filteredControlData, filteredDetailsData, controlData, detailsData, updateFilteredTable]);

  // Sync calculations with auto-refreshed query results
  useEffect(() => {
    if (lastQueryResult && lastQueryResult.length > 0 && tablesInitialized.current) {
      setCalculations(lastQueryResult);
    }
  }, [lastQueryResult]);

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
      console.error('SQL Query failed:', error);
      setCalculations([{ 'Error': 'Query failed' }]);
      return [];
    } finally {
      setLoading(false);
    }
  }, [dbLoading, executeQuery, initializeTables]);

  const tableInfo = useMemo(() => getTableInfo(), [getTableInfo]);
  
  const availableTables = useMemo(() => getAvailableTables(), [getAvailableTables]);

  const controlColumns = useMemo(() => {
    return getTableFields('Subsystem Overview');
  }, [getTableFields]);

  const detailColumns = useMemo(() => {
    return getTableFields('Test Pack Details');
  }, [getTableFields]);

  return {
    calculations,
    loading: loading || dbLoading,
    executeSQLQuery,
    controlColumns,
    detailColumns,
    availableTables,
    tableInfo
  };
};

export default useDynamicCalculations;