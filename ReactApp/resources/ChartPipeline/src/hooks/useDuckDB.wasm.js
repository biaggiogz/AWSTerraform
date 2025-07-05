/**
 * WASM-enhanced DuckDB hook with fallback to original implementation
 * Maintains API compatibility while providing performance improvements
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  executeQuery as wasmExecuteQuery,
  parseSQL as wasmParseSQL
} from '../wasm/sql-engine.wasm.js';

// WASM-enhanced DuckDB hook
const useDuckDBWasm = () => {
  const [db, setDb] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const tablesRef = useRef({});
  const filteredTablesRef = useRef({});
  const [lastQueryResult, setLastQueryResult] = useState([]);
  const [lastQuery, setLastQuery] = useState('');

  useEffect(() => {
    setDb({ type: 'wasm-js-sql' });
    setLoading(false);
  }, []);

  // Get available tables
  const getAvailableTables = useCallback(() => {
    return Object.keys(tablesRef.current);
  }, []);

  // Get available fields for a table
  const getTableFields = useCallback((tableName) => {
    const data = filteredTablesRef.current[tableName] || tablesRef.current[tableName];
    if (!data || data.length === 0) return [];
    return Object.keys(data[0]);
  }, []);

  // Get table info (tables with their fields)
  const getTableInfo = useCallback(() => {
    const tables = {};
    Object.keys(tablesRef.current).forEach(tableName => {
      const totalRows = tablesRef.current[tableName]?.length || 0;
      const filteredRows = filteredTablesRef.current[tableName]?.length || totalRows;
      
      tables[tableName] = {
        totalRows,
        filteredRows,
        fields: getTableFields(tableName)
      };
    });
    return tables;
  }, [getTableFields]);

  // WASM-enhanced query execution
  const executeQuery = useCallback(async (query) => {
    try {
      const start = performance.now();
      
      // Get the appropriate data source
      const { tableName } = await wasmParseSQL(query);
      const data = filteredTablesRef.current[tableName] || tablesRef.current[tableName] || [];
      
      if (data.length === 0) {
        const availableTables = Object.keys(tablesRef.current);
        return [{ 'Error': `Table '${tableName}' not found. Available: ${availableTables.join(', ')}` }];
      }

      // Execute query with WASM optimization
      const result = await wasmExecuteQuery(data, query);
      
      const end = performance.now();
      console.log(`WASM-enhanced query execution took ${end - start} milliseconds`);
      
      return result;
    } catch (error) {
      console.error('WASM query execution failed, using fallback:', error);
      
      // Fallback to original implementation
      try {
        const { default: originalUseDuckDB } = await import('./useDuckDB.js');
        const originalHook = originalUseDuckDB();
        
        // Copy table data to original hook
        Object.keys(tablesRef.current).forEach(tableName => {
          originalHook.createTable(tableName, tablesRef.current[tableName]);
        });
        
        return await originalHook.executeQuery(query);
      } catch (fallbackError) {
        console.error('Fallback query execution also failed:', fallbackError);
        return [{ 'Error': `Query failed: ${fallbackError.message}` }];
      }
    }
  }, []);

  // Auto-refresh query when filtered data changes
  const refreshQuery = useCallback(() => {
    if (lastQuery) {
      executeQuery(lastQuery).then(result => {
        setLastQueryResult(result);
      });
    }
  }, [lastQuery, executeQuery]);

  const createTable = useCallback(async (tableName, data) => {
    if (!data || data.length === 0) return;
    
    console.log(`Creating WASM-enhanced table: ${tableName}`);
    console.log('Sample row keys:', Object.keys(data[0]));
    
    tablesRef.current[tableName] = data;
  }, []);

  // Update filtered table data (called by table components)
  const updateFilteredTable = useCallback((tableName, filteredData) => {
    if (!filteredData || filteredData.length === 0) {
      delete filteredTablesRef.current[tableName];
    } else {
      filteredTablesRef.current[tableName] = filteredData;
    }
    // Auto-refresh last query
    refreshQuery();
  }, [refreshQuery]);

  const executeQueryWithCache = useCallback(async (query) => {
    setLastQuery(query);
    const result = await executeQuery(query);
    setLastQueryResult(result);
    return result;
  }, [executeQuery]);

  return { 
    db, 
    loading, 
    error, 
    executeQuery: executeQueryWithCache, 
    createTable,
    updateFilteredTable,
    getAvailableTables,
    getTableFields,
    getTableInfo,
    lastQueryResult
  };
};

// Performance monitoring
export const getPerformanceMetrics = () => {
  const { sqlEngineWasm } = require('../wasm/sql-engine.wasm.js');
  return {
    usingWasm: sqlEngineWasm.isUsingWasm(),
    module: 'sql-engine'
  };
};

export default useDuckDBWasm;