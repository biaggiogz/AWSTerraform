import { useState, useEffect, useRef, useCallback } from 'react';
import { wasmLoader } from '../wasm/wasm-loader';
import { sqlEngineWasm } from '../wasm/sql-engine.wasm';
import { dataProcessorWasm } from '../wasm/data-processor.wasm';
import { multiFilterWasm } from '../wasm/multi-filter.wasm';

const useDuckDBEnhanced = () => {
  const [db, setDb] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const tablesRef = useRef({});
  const [wasmSqlEngine, setWasmSqlEngine] = useState(null);
  const queryCache = useRef(new Map());
  const tableIndices = useRef(new Map());

  // Initialize enhanced DuckDB with WASM acceleration
  useEffect(() => {
    const initializeDB = async () => {
      try {
        // Initialize WASM modules
        await Promise.all([
          sqlEngineWasm.initialize(),
          dataProcessorWasm.initialize(),
          multiFilterWasm.initialize()
        ]);

        setWasmSqlEngine({
          type: 'wasm',
          sqlEngine: sqlEngineWasm,
          dataProcessor: dataProcessorWasm,
          multiFilter: multiFilterWasm
        });
        setDb({ type: 'enhanced-wasm-sql', wasmEnabled: true });
        setLoading(false);
      } catch (err) {
        console.warn('WASM initialization failed, using JavaScript fallback:', err);
        setWasmSqlEngine({ type: 'js' });
        setDb({ type: 'js-sql', wasmEnabled: false });
        setLoading(false);
      }
    };

    initializeDB();
  }, []);

  // Enhanced SQL parser with WASM acceleration
  const parseSQL = (query) => {
    const sql = query.trim();
    
    // Extract components using enhanced regex patterns
    const fromMatch = sql.match(/FROM\s+["`']?([^"`'\s;]+)["`']?/i);
    const tableName = fromMatch ? fromMatch[1] : null;
    
    const selectMatch = sql.match(/SELECT\s+(.+?)\s+FROM/i);
    const selectFields = selectMatch ? selectMatch[1] : '*';
    
    const whereMatch = sql.match(/WHERE\s+(.+?)(?:\s+GROUP\s+BY|\s+ORDER\s+BY|;|$)/i);
    const whereClause = whereMatch ? whereMatch[1] : null;
    
    const groupByMatch = sql.match(/GROUP\s+BY\s+["`']?([^"`'\s;,]+)["`']?/i);
    const groupBy = groupByMatch ? groupByMatch[1] : null;
    
    const joinMatch = sql.match(/LEFT\s+JOIN\s+([^`"'\s]+)\s+([^`"'\s]+)\s+ON\s+(.+?)(?:\s+WHERE|\s+GROUP|\s+ORDER|;|$)/i);
    const join = joinMatch ? {
      table: joinMatch[1],
      alias: joinMatch[2],
      condition: joinMatch[3]
    } : null;
    
    return { tableName, selectFields, whereClause, groupBy, join };
  };

  // Enhanced field mapping with fuzzy matching
  const mapFieldName = (fieldName, row) => {
    const fieldMappings = {
      'WELDING FW+SW': ['TP 100% FW+SW', 'WELDING FW+SW', 'weldingFwSw', 'WELDING_FW_SW'],
      'SUBSYSTEM': ['SUBSYSTEM', 'SUSSYTEM', 'subsystem', 'SUBS_PRE'],
      'QTY INST': ['QTY INST', 'QTY_INST', 'qtyInst', 'QUANTITY INST'],
      'TEST PACK': ['TEST PACK', 'TESTPACK', 'testPack', 'TEST_PACK'],
      'CONSTRUC COORD PROGRESS': ['CONSTRUC COORD PROGRESS', 'CONSTRUC_COORD_PROGRESS', 'PROGRESS'],
      'OK=100%': ['OK=100%', 'OK_100', 'LOOP_COMPLETE']
    };

    // Try exact match first
    let value = row[fieldName];
    
    // Try case variations
    if (value === undefined) {
      value = row[fieldName.toUpperCase()] || row[fieldName.toLowerCase()];
    }
    
    // Try mapped field names
    if (value === undefined && fieldMappings[fieldName]) {
      for (const mappedField of fieldMappings[fieldName]) {
        value = row[mappedField];
        if (value !== undefined) break;
      }
    }
    
    // Fuzzy matching for complex field names
    if (value === undefined) {
      const rowKeys = Object.keys(row);
      const normalizedFieldName = fieldName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      
      for (const key of rowKeys) {
        const normalizedKey = key.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        if (normalizedKey === normalizedFieldName || 
            normalizedKey.includes(normalizedFieldName) ||
            normalizedFieldName.includes(normalizedKey)) {
          value = row[key];
          break;
        }
      }
    }
    
    return value;
  };

  // JavaScript SQL execution fallback
  const executeJavaScriptSQL = (query, tables) => {
    const { tableName, selectFields, whereClause, groupBy, join } = parseSQL(query);
    
    let data = tables[tableName] || [];
    if (data.length === 0) {
      return [{ 'Error': `Table '${tableName}' not found` }];
    }

    // Handle JOINs
    if (join) {
      const joinTable = tables[join.table] || [];
      const joinCondition = join.condition;
      
      // Simple JOIN implementation
      const joinMatch = joinCondition.match(/([^.]+)\.([^=\s]+)\s*=\s*([^.]+)\.([^=\s]+)/);
      if (joinMatch) {
        const [, leftAlias, leftField, rightAlias, rightField] = joinMatch;
        
        data = data.map(leftRow => {
          const matchingRightRows = joinTable.filter(rightRow => 
            mapFieldName(leftField, leftRow) === mapFieldName(rightField, rightRow)
          );
          
          if (matchingRightRows.length > 0) {
            return { ...leftRow, ...matchingRightRows[0] };
          }
          return leftRow;
        });
      }
    }
    
    // Apply WHERE clause with enhanced operators
    if (whereClause) {
      const whereMatch = whereClause.match(/["`']?([^"`'>=<!]+)["`']?\s*(!=|>=|<=|>|<|=)\s*["`']?([^"`']+)["`']?/);
      if (whereMatch) {
        const [, field, operator, value] = whereMatch;
        const fieldName = field.trim();
        
        data = data.filter(row => {
          const rowValue = mapFieldName(fieldName, row);
          const numericRowValue = parseFloat(rowValue);
          const numericValue = parseFloat(value);
          
          if (!isNaN(numericRowValue) && !isNaN(numericValue)) {
            switch (operator) {
              case '>=': return numericRowValue >= numericValue;
              case '<=': return numericRowValue <= numericValue;
              case '>': return numericRowValue > numericValue;
              case '<': return numericRowValue < numericValue;
              case '=': return numericRowValue === numericValue;
              case '!=': return numericRowValue !== numericValue;
              default: return false;
            }
          }
          
          // String comparison
          const stringComparison = String(rowValue) === value;
          return operator === '=' ? stringComparison : !stringComparison;
        });
      }
    }
    
    // Handle aggregation functions
    const aggMatch = selectFields.match(/(COUNT|SUM|AVG|MIN|MAX)\s*\(\s*(?:DISTINCT\s+)?["`']?([^"`')]+)["`']?\s*\)\s+AS\s+["`']?([^"`']+)["`']?/i);
    if (aggMatch) {
      const [, aggFunc, field, alias] = aggMatch;
      const isDistinct = selectFields.includes('DISTINCT');
      
      if (groupBy) {
        // GROUP BY aggregation
        const groups = {};
        const groupField = groupBy.replace(/["`']/g, '');
        
        data.forEach(row => {
          const key = mapFieldName(groupField, row) || 'Unknown';
          const value = mapFieldName(field, row) || 0;
          
          if (!groups[key]) groups[key] = [];
          
          if (isDistinct && field !== '*') {
            // Handle DISTINCT values
            if (String(value).includes('|')) {
              String(value).split('|').forEach(v => {
                const trimmed = v.trim();
                if (trimmed && !groups[key].includes(trimmed)) {
                  groups[key].push(trimmed);
                }
              });
            } else if (!groups[key].includes(value)) {
              groups[key].push(value);
            }
          } else {
            groups[key].push(parseFloat(value) || 0);
          }
        });
        
        return Object.entries(groups).map(([key, values]) => {
          let result;
          switch (aggFunc.toUpperCase()) {
            case 'COUNT': result = isDistinct ? values.length : values.length; break;
            case 'SUM': result = values.reduce((a, b) => a + (parseFloat(b) || 0), 0); break;
            case 'AVG': result = values.reduce((a, b) => a + (parseFloat(b) || 0), 0) / values.length; break;
            case 'MIN': result = Math.min(...values.map(v => parseFloat(v) || 0)); break;
            case 'MAX': result = Math.max(...values.map(v => parseFloat(v) || 0)); break;
            default: result = values.length;
          }
          return { [groupField]: key, [alias]: result };
        });
      } else {
        // Simple aggregation
        let result;
        if (field === '*') {
          result = data.length;
        } else if (isDistinct) {
          const uniqueValues = new Set();
          data.forEach(row => {
            const value = mapFieldName(field, row);
            if (value && String(value).includes('|')) {
              String(value).split('|').forEach(v => {
                const trimmed = v.trim();
                if (trimmed) uniqueValues.add(trimmed);
              });
            } else if (value) {
              uniqueValues.add(String(value).trim());
            }
          });
          result = uniqueValues.size;
        } else {
          const values = data.map(row => parseFloat(mapFieldName(field, row)) || 0);
          switch (aggFunc.toUpperCase()) {
            case 'COUNT': result = values.length; break;
            case 'SUM': result = values.reduce((a, b) => a + b, 0); break;
            case 'AVG': result = values.reduce((a, b) => a + b, 0) / values.length; break;
            case 'MIN': result = Math.min(...values); break;
            case 'MAX': result = Math.max(...values); break;
            default: result = values.length;
          }
        }
        
        return [{ [alias]: result }];
      }
    }
    
    // Default: return limited data
    return selectFields.trim() === '*' ? data.slice(0, 10) : [{ 'Total Records': data.length }];
  };

  // Enhanced query execution with WASM acceleration and caching
  const executeQuery = useCallback(async (query) => {
    try {
      const queryHash = hashQuery(query);
      
      // Check cache first
      if (queryCache.current.has(queryHash)) {
        const cached = queryCache.current.get(queryHash);
        if (Date.now() - cached.timestamp < 30000) { // 30 second cache
          console.log('Using cached query result');
          return cached.result;
        }
      }
      
      const startTime = performance.now();
      let result;
      
      // Use WASM SQL engine if available
      if (wasmSqlEngine && wasmSqlEngine.type === 'wasm') {
        result = await executeQueryWasm(query);
      } else {
        result = await executeQueryJS(query);
      }
      
      const processingTime = performance.now() - startTime;
      console.log(`SQL query processing time: ${processingTime.toFixed(2)}ms (${wasmSqlEngine?.type || 'js'})`);
      
      // Cache result
      queryCache.current.set(queryHash, {
        result,
        timestamp: Date.now()
      });
      
      // Limit cache size
      if (queryCache.current.size > 50) {
        const oldestKey = queryCache.current.keys().next().value;
        queryCache.current.delete(oldestKey);
      }
      
      return result;
    } catch (err) {
      console.error('Enhanced SQL execution error:', err);
      return [{ 'Error': `Query failed: ${err.message}` }];
    }
  }, [wasmSqlEngine]);

  // WASM query execution
  const executeQueryWasm = useCallback(async (query) => {
    const queries = query.split(';').map(q => q.trim()).filter(q => q.length > 0);
    
    if (queries.length === 1) {
      const { tableName } = parseSQL(queries[0]);
      const tableData = tablesRef.current[tableName] || [];
      return await wasmSqlEngine.sqlEngine.executeQuery(tableData, queries[0]);
    } else {
      const combinedResult = {};
      for (const singleQuery of queries) {
        const { tableName } = parseSQL(singleQuery);
        const tableData = tablesRef.current[tableName] || [];
        const result = await wasmSqlEngine.sqlEngine.executeQuery(tableData, singleQuery);
        if (result && result.length > 0 && result[0]) {
          Object.assign(combinedResult, result[0]);
        }
      }
      return [combinedResult];
    }
  }, [wasmSqlEngine]);

  // JavaScript query execution fallback
  const executeQueryJS = useCallback(async (query) => {
    const queries = query.split(';').map(q => q.trim()).filter(q => q.length > 0);
    
    if (queries.length === 1) {
      return executeJavaScriptSQL(queries[0], tablesRef.current);
    } else {
      const combinedResult = {};
      for (const singleQuery of queries) {
        const result = executeJavaScriptSQL(singleQuery, tablesRef.current);
        if (result && result.length > 0 && result[0]) {
          Object.assign(combinedResult, result[0]);
        }
      }
      return [combinedResult];
    }
  }, []);

  // Query hashing for cache keys
  const hashQuery = useCallback((query) => {
    let hash = 0;
    for (let i = 0; i < query.length; i++) {
      const char = query.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }, []);

  // Create table with enhanced indexing and WASM processing
  const createTable = useCallback(async (tableName, data) => {
    if (!data || data.length === 0) return;
    
    console.log(`Creating enhanced table: ${tableName} with ${data.length} rows`);
    
    let processedData = data;
    
    // Use WASM data processor if available
    if (wasmSqlEngine && wasmSqlEngine.type === 'wasm') {
      try {
        // Pre-process data for better performance
        const uniqueValues = await wasmSqlEngine.dataProcessor.getUniqueValues(data, 'SUBSYSTEM');
        console.log(`Pre-indexed ${uniqueValues.length} unique subsystems`);
        
        // Store indices for faster lookups
        tableIndices.current.set(`${tableName}_subsystems`, new Set(uniqueValues));
      } catch (error) {
        console.warn('WASM data processing failed, using original data:', error);
      }
    }
    
    // Store data with potential indexing for performance
    tablesRef.current[tableName] = processedData;
    
    // Clear related cache entries
    const keysToDelete = [];
    for (const key of queryCache.current.keys()) {
      if (key.includes(tableName)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => queryCache.current.delete(key));
    
    // Log sample data structure for debugging
    if (processedData.length > 0) {
      console.log(`Sample row from ${tableName}:`, Object.keys(processedData[0]));
    }
  }, [wasmSqlEngine]);

  // Register multiple tables for SUMMARY SUBSYSTEMS
  const registerSummarySubsystemsTables = useCallback(async (tableAData, tableBData) => {
    if (tableAData && tableAData.length > 0) {
      await createTable('subsystem_overview', tableAData);
    }
    if (tableBData && tableBData.length > 0) {
      await createTable('test_pack_details', tableBData);
    }
  }, [createTable]);

  // CSV upload and table registration
  const registerCSVTable = useCallback(async (tableName, csvData) => {
    if (!csvData || csvData.length === 0) return false;
    
    try {
      await createTable(tableName, csvData);
      console.log(`CSV table registered: ${tableName}`);
      return true;
    } catch (error) {
      console.error(`Failed to register CSV table ${tableName}:`, error);
      return false;
    }
  }, [createTable]);

  // Get available tables
  const getAvailableTables = useCallback(() => {
    return Object.keys(tablesRef.current);
  }, []);

  // Get performance metrics
  const getPerformanceMetrics = useCallback(() => {
    return {
      wasmEnabled: wasmSqlEngine?.type === 'wasm',
      tablesLoaded: Object.keys(tablesRef.current).length,
      sqlEngine: wasmSqlEngine?.type || 'javascript',
      cacheSize: queryCache.current.size,
      indicesCreated: tableIndices.current.size,
      wasmModules: wasmSqlEngine?.type === 'wasm' ? {
        sqlEngine: wasmSqlEngine.sqlEngine.isUsingWasm(),
        dataProcessor: wasmSqlEngine.dataProcessor.isUsingWasm(),
        multiFilter: wasmSqlEngine.multiFilter.isUsingWasm()
      } : null
    };
  }, [wasmSqlEngine]);

  // Clear cache
  const clearCache = useCallback(() => {
    queryCache.current.clear();
    console.log('Query cache cleared');
  }, []);

  return {
    db,
    loading,
    error,
    executeQuery,
    createTable,
    registerSummarySubsystemsTables,
    registerCSVTable,
    getAvailableTables,
    getPerformanceMetrics,
    clearCache
  };
};

export default useDuckDBEnhanced;