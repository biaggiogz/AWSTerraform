import { useState, useCallback, useMemo, useRef } from 'react';
import useDuckDB from './useDuckDB';

const useDynamicCalculations = (controlData, detailsData, filters = {}) => {
  const { executeQuery, createTable, loading: dbLoading } = useDuckDB();
  const [calculations, setCalculations] = useState([]);
  const [loading, setLoading] = useState(false);
  const tablesInitialized = useRef(false);

  const initializeTables = useCallback(async () => {
    if (!controlData || !detailsData) return;
    
    try {
      await createTable('Control Instruments', controlData);
      await createTable('Details Instruments', detailsData);
    } catch (error) {
      console.error('Failed to initialize tables:', error);
    }
  }, [controlData, detailsData, createTable]);

  const executeSQLQuery = useCallback(async (sqlQuery) => {
    if (dbLoading) return;
    
    setLoading(true);
    try {
      // Initialize tables only once
      if (!tablesInitialized.current) {
        await initializeTables();
        tablesInitialized.current = true;
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

  const controlColumns = useMemo(() => {
    if (!controlData || controlData.length === 0) return [];
    return Object.keys(controlData[0]);
  }, [controlData]);

  const detailColumns = useMemo(() => {
    if (!detailsData || detailsData.length === 0) return [];
    return Object.keys(detailsData[0]);
  }, [detailsData]);

  return {
    calculations,
    loading: loading || dbLoading,
    executeSQLQuery,
    controlColumns,
    detailColumns
  };
};

export default useDynamicCalculations;