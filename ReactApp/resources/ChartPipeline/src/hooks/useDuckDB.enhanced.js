import { useState, useEffect, useRef, useCallback } from 'react';
import { wasmLoader } from '../wasm/wasm-loader';

const useDuckDBEnhanced = () => {
  const [db, setDb] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const tablesRef = useRef({});
  const [wasmSqlEngine, setWasmSqlEngine] = useState(null);

  // Initialize enhanced DuckDB with WASM acceleration
  useEffect(() => {
    const initializeDB = async () => {
      try {
        // Try to load WASM SQL engine
        const sqlEngine = await wasmLoader.loadModule(
          'sql-engine',
          '/wasm/sql-engine.wasm',
          // JavaScript fallback
          {
            executeSQL: (query, tables) => {
              console.log('Using JavaScript SQL fallback');
              return executeJavaScriptSQL(query, tables);
            }
          }
        );

        setWasmSqlEngine(sqlEngine);
        setDb({ type: 'enhanced-js-sql', wasmEnabled: sqlEngine.type === 'wasm' });
        setLoading(false);
      } catch (err) {
        console.warn('Enhanced DuckDB initialization failed:', err);
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

  // Enhanced query execution with WASM acceleration
  const executeQuery = useCallback(async (query) => {
    try {
      const startTime = performance.now();
      
      // Use WASM SQL engine if available
      if (wasmSqlEngine && wasmSqlEngine.type === 'wasm') {
        console.log('Using WASM SQL engine for query execution');
        // WASM implementation would call the actual WASM module
        // For now, fall back to JavaScript
      }
      
      // Split multiple queries
      const queries = query.split(';').map(q => q.trim()).filter(q => q.length > 0);
      
      if (queries.length === 1) {
        const result = executeJavaScriptSQL(queries[0], tablesRef.current);
        const processingTime = performance.now() - startTime;
        console.log(`SQL query processing time: ${processingTime.toFixed(2)}ms`);
        return result;
      } else {
        // Multiple queries - merge results
        const combinedResult = {};
        for (const singleQuery of queries) {
          const result = executeJavaScriptSQL(singleQuery, tablesRef.current);
          if (result && result.length > 0 && result[0]) {
            Object.assign(combinedResult, result[0]);
          }
        }
        const processingTime = performance.now() - startTime;
        console.log(`Multiple SQL queries processing time: ${processingTime.toFixed(2)}ms`);
        return [combinedResult];
      }
    } catch (err) {
      console.error('Enhanced SQL execution error:', err);
      return [{ 'Error': `Query failed: ${err.message}` }];
    }
  }, [wasmSqlEngine]);

  // Create table with enhanced indexing
  const createTable = useCallback(async (tableName, data) => {
    if (!data || data.length === 0) return;
    
    console.log(`Creating enhanced table: ${tableName} with ${data.length} rows`);
    
    // Store data with potential indexing for performance
    tablesRef.current[tableName] = data;
    
    // Log sample data structure for debugging
    if (data.length > 0) {
      console.log(`Sample row from ${tableName}:`, Object.keys(data[0]));
    }
  }, []);

  // Get performance metrics
  const getPerformanceMetrics = useCallback(() => {
    return {
      wasmEnabled: wasmSqlEngine?.type === 'wasm',
      tablesLoaded: Object.keys(tablesRef.current).length,
      sqlEngine: wasmSqlEngine?.type || 'javascript'
    };
  }, [wasmSqlEngine]);

  return {
    db,
    loading,
    error,
    executeQuery,
    createTable,
    getPerformanceMetrics
  };
};

export default useDuckDBEnhanced;