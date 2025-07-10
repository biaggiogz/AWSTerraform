import { createSignal, createMemo, createEffect } from 'solid-js';
import { ultraWasmProcessor } from '../wasm/ultra-processor.wasm.js';

export function useDuckDBSolid() {
  const [db, setDb] = createSignal(null);
  const [loading, setLoading] = createSignal(true);
  const [tables, setTables] = createSignal({});
  const [lastQuery, setLastQuery] = createSignal('');
  const [lastResult, setLastResult] = createSignal([]);
  
  // Initialize database
  createEffect(() => {
    const initDB = async () => {
      try {
        await ultraWasmProcessor.initialize();
        setDb({ type: 'solid-ultra-wasm' });
        setLoading(false);
      } catch (error) {
        console.error('Failed to initialize SolidJS DuckDB:', error);
        setLoading(false);
      }
    };
    
    initDB();
  });
  
  // Ultra-fast query execution
  const executeQuery = async (query) => {
    const start = performance.now();
    
    try {
      const result = await ultraWasmProcessor.executeQuery(tables(), query);
      setLastQuery(query);
      setLastResult(result);
      
      const end = performance.now();
      console.log(`SolidJS DuckDB query: ${end - start}ms`);
      
      return result;
    } catch (error) {
      console.error('SolidJS query execution failed:', error);
      return [{ 'Error': `Query failed: ${error.message}` }];
    }
  };
  
  const createTable = (name, data) => {
    setTables(prev => ({ ...prev, [name]: data }));
    console.log(`SolidJS table created: ${name} (${data.length} rows)`);
  };
  
  const getAvailableTables = () => {
    return Object.keys(tables());
  };
  
  const getTableFields = (tableName) => {
    const data = tables()[tableName];
    if (!data || data.length === 0) return [];
    return Object.keys(data[0]);
  };
  
  const getTableInfo = () => {
    const info = {};
    Object.keys(tables()).forEach(tableName => {
      const data = tables()[tableName];
      info[tableName] = {
        totalRows: data?.length || 0,
        fields: getTableFields(tableName)
      };
    });
    return info;
  };
  
  // Performance metrics
  const getPerformanceMetrics = () => {
    return {
      ...ultraWasmProcessor.getPerformanceMetrics(),
      framework: 'SolidJS',
      tablesCount: Object.keys(tables()).length
    };
  };
  
  return {
    db,
    loading,
    executeQuery,
    createTable,
    getAvailableTables,
    getTableFields,
    getTableInfo,
    lastQuery,
    lastResult,
    getPerformanceMetrics
  };
}