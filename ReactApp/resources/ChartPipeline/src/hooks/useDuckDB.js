import { useState, useEffect, useRef, useCallback } from 'react';

// JavaScript-based SQL parser with reactive filtering
const useDuckDB = () => {
  const [db, setDb] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const tablesRef = useRef({});
  const filteredTablesRef = useRef({});
  const [lastQueryResult, setLastQueryResult] = useState([]);
  const [lastQuery, setLastQuery] = useState('');

  useEffect(() => {
    setDb({ type: 'js-sql' });
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

  const parseSQL = (query) => {
    const sql = query.trim();
    
    // Extract table name - handle quoted names with spaces
    const fromMatch = sql.match(/FROM\s+["']([^"']+)["']|FROM\s+([^\s;]+)/i);
    const tableName = fromMatch ? (fromMatch[1] || fromMatch[2]) : null;
    
    // Extract SELECT fields
    const selectMatch = sql.match(/SELECT\s+(.+?)\s+FROM/i);
    const selectFields = selectMatch ? selectMatch[1] : '*';
    
    // Extract WHERE clause
    const whereMatch = sql.match(/WHERE\s+(.+?)(?:\s+GROUP\s+BY|\s+ORDER\s+BY|;|$)/i);
    const whereClause = whereMatch ? whereMatch[1] : null;
    
    // Extract GROUP BY
    const groupByMatch = sql.match(/GROUP\s+BY\s+["']?([^"'\s;,]+)["']?/i);
    const groupBy = groupByMatch ? groupByMatch[1] : null;
    
    return { tableName, selectFields, whereClause, groupBy };
  };

  const mapFieldName = (fieldName, row) => {
    // Field name mappings for different tables
    const fieldMappings = {
      // General mappings
      'WELDING FW+SW': ['TP 100% FW+SW', 'WELDING FW+SW', 'weldingFwSw', 'WELDING_FW_SW', 'WELDING FW SW'],
      'TP 100% FW+SW': ['TP 100% FW+SW', 'WELDING FW+SW', 'weldingFwSw', 'WELDING_FW_SW', 'WELDING FW SW'],
      'ISOMETRIC': ['ISOMETRIC', 'isometric'],
      'SUBSYSTEM': ['SUBSYSTEM', 'SUSSYTEM', 'subsystem'],
      'QTY INST': ['QTY INST', 'QTY_INST', 'qtyInst', 'QUANTITY INST'],
      'TEST PACK': ['TEST PACK', 'TESTPACK', 'testPack', 'TEST_PACK'],
      'TESTPACK': ['TESTPACK', 'testPack', 'TEST PACK', 'TEST_PACK'],
      'MOUNTING': ['MOUNTING ON ISO/EQUI/PACK', 'mountingOnIsoEquiPack'],
      
      // Specific mappings for Subsystem Overview table (ssm.csv)
      'testPack': ['n_distinct_tps', 'nn_tps', 'n_tps', 'testPack'],
      'total_items': ['total_insulation', 'total_items', 'Total Insul'],
      'done_items': ['done_insulation', 'done_items', 'Done Insul'],
      'pending_items': ['pending_insulation', 'pending_items', 'Pending Insul'],
      'total_loops': ['total_loop', 'total_loops', 'TOTAL LOOP'],
      'done_loops': ['done_loop', 'done_loops', 'LOOP DONE'],
      'pending_loops': ['pending_loop', 'pending_loops', 'LOOP PENDING'],
      'total_inst': ['total_inst', 'TOTAL INST'],
      'done_inst': ['done_inst', 'DONE INST'],
      'pending_inst': ['pending_inst', 'PENDING INST']
    };

    // First try exact match (case sensitive)
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
    
    // Fuzzy matching for fields with special characters
    if (value === undefined) {
      const rowKeys = Object.keys(row);
      
      // Try to find field by partial matching (remove special chars and spaces)
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
    
    // Debug logging for problematic fields
    if (['testPack', 'total_items', 'done_items', 'pending_items', 'total_loops', 'WELDING FW+SW', 'TP 100% FW+SW', 'QTY INST', 'TEST PACK'].includes(fieldName)) {
      console.log(`Field: ${fieldName}, Available keys:`, Object.keys(row).slice(0, 10), 'Value found:', value);
    }
    
    return value;
  };

  const executeSingleQuery = async (singleQuery) => {
    const { tableName, selectFields, whereClause, groupBy } = parseSQL(singleQuery);
    
    // Use filtered data if available, otherwise use original data
    let data = filteredTablesRef.current[tableName] || tablesRef.current[tableName] || [];
    
    if (data.length === 0) {
      const availableTables = Object.keys(tablesRef.current);
      return [{ 'Error': `Table '${tableName}' not found. Available: ${availableTables.join(', ')}` }];
    }
      
    // Apply WHERE clause
    if (whereClause) {
      // Support multiple comparison operators: =, >=, <=, >, <, !=
      // Improved regex to handle quoted field names with spaces and special characters
      const whereMatch = whereClause.match(/["']([^"']+)["']\s*(!=|>=|<=|>|<|=)\s*["']?([^"']+)["']?|([^\s>=<!]+)\s*(!=|>=|<=|>|<|=)\s*["']?([^"']+)["']?/);
      if (whereMatch) {
        const field = whereMatch[1] || whereMatch[4]; // quoted or unquoted field name
        const operator = whereMatch[2] || whereMatch[5];
        const value = whereMatch[3] || whereMatch[6];
        const fieldName = field.replace(/["/]/g, ''); // remove quotes
        
        data = data.filter(row => {
          const rowValue = mapFieldName(fieldName, row);
          const numericRowValue = parseFloat(rowValue);
          const numericValue = parseFloat(value);
          
          // Handle numeric comparisons
          if (!isNaN(numericRowValue) && !isNaN(numericValue)) {
            switch (operator) {
              case '>=': return numericRowValue >= numericValue;
              case '<=': return numericRowValue <= numericValue;
              case '>': return numericRowValue > numericValue;
              case '<': return numericRowValue < numericValue;
              case '=': return numericRowValue === numericValue;
              default: return false;
            }
          }
          
          // Handle string/percentage comparisons for = and != operators
          if (operator === '=') {
            if (value.includes('%')) {
              return String(rowValue) === value;
            } else if (value === '1' || value === '1.0') {
              return rowValue === 1 || rowValue === '1' || rowValue === '1.0' || rowValue === '100%';
            }
            return String(rowValue) === value;
          }
          
          if (operator === '!=') {
            return String(rowValue) !== value;
          }
          
          return false;
        });
      }
    }
    
    // Handle SELECT with aggregation (including DISTINCT and CAST) - support multiple metrics
    const aggRegex = /(COUNT)\s*\(\s*DISTINCT\s+["']?([^"')]+)["']?\)\s+AS\s+["']?([^"']+)["']?|(COUNT|SUM|AVG|MIN|MAX)\(["']([^"']+)["']\)\s+AS\s+["']?([^"']+)["']?|(COUNT|SUM|AVG|MIN|MAX)\(CAST\(["']([^"']+)["']\s+AS\s+\w+\)\)\s+AS\s+["']?([^"']+)["']?|(COUNT|SUM|AVG|MIN|MAX)\(([^)]+)\)\s+AS\s+["']?([^"']+)["']?/gi;
    const aggMatches = [...selectFields.matchAll(aggRegex)];
    
    if (aggMatches.length > 0) {
      // Process multiple aggregations in single query
      const results = {};
      
      for (const aggMatch of aggMatches) {
        const aggFunc = aggMatch[1] || aggMatch[4] || aggMatch[7] || aggMatch[10];
        const field = aggMatch[2] || aggMatch[5] || aggMatch[8] || aggMatch[11];
        const alias = aggMatch[3] || aggMatch[6] || aggMatch[9] || aggMatch[12];
        const isDistinct = !!aggMatch[1]; // true if COUNT(DISTINCT ...)
        const fieldName = field.replace(/["/]/g, ''); // remove quotes
        
        let result;
        if (fieldName === '*') {
          result = data.length;
        } else if (isDistinct) {
          // Handle COUNT(DISTINCT field) with pipe-separated values
          const uniqueValues = new Set();
          data.forEach(row => {
            const value = mapFieldName(fieldName, row);
            if (value) {
              // Split by pipe if it contains pipe-separated values
              if (String(value).includes('|')) {
                String(value).split('|').forEach(v => {
                  const trimmed = v.trim();
                  if (trimmed) uniqueValues.add(trimmed);
                });
              } else {
                uniqueValues.add(String(value).trim());
              }
            }
          });
          result = uniqueValues.size;
        } else {
          const values = data.map(row => {
            const value = mapFieldName(fieldName, row);
            // Handle CAST to INTEGER - convert to number, skip non-numeric values
            if (aggFunc.toUpperCase() === 'SUM' && fieldName === 'INSTALLED (TEIGA-TMI)') {
              const numValue = parseInt(value);
              return isNaN(numValue) ? 0 : numValue;
            }
            return parseFloat(value) || 0;
          }).filter(v => !isNaN(v));
          
          switch (aggFunc.toUpperCase()) {
            case 'SUM': result = values.reduce((a, b) => a + b, 0); break;
            case 'AVG': result = values.reduce((a, b) => a + b, 0) / values.length; break;
            case 'MIN': result = Math.min(...values); break;
            case 'MAX': result = Math.max(...values); break;
            default: result = values.length;
          }
        }
        
        results[alias] = result;
      }
      
      return [results];
    }
    
    // Handle simple SELECT *
    if (selectFields.trim() === '*') {
      return data.slice(0, 10);
    }
    
    // Default: return count
    return [{ 'Total Records': data.length }];
  };

  const executeQuery = useCallback(async (query) => {
    try {
      // Split multiple queries by semicolon
      const queries = query.split(';').map(q => q.trim()).filter(q => q.length > 0);
      
      if (queries.length === 1) {
        // Single query
        return await executeSingleQuery(queries[0]);
      } else {
        // Multiple queries - merge all results into single object
        const combinedResult = {};
        
        for (const singleQuery of queries) {
          const result = await executeSingleQuery(singleQuery);
          if (result && result.length > 0 && result[0]) {
            // Merge each query result into the combined object
            Object.assign(combinedResult, result[0]);
          }
        }
        
        return [combinedResult];
      }
    } catch (err) {
      console.error('SQL Parse Error:', err);
      return [{ 'Error': `Query failed: ${err.message}` }];
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
    
    // Debug: Log the actual data structure
    if (data.length > 0) {
      console.log(`Creating table: ${tableName}`);
      console.log('Sample row keys:', Object.keys(data[0]));
      console.log('Sample row:', data[0]);
      
      // Specifically check for welding field
      const weldingFields = Object.keys(data[0]).filter(key => 
        key.includes('WELDING') || key.includes('FW') || key.includes('SW') || key.includes('TP')
      );
      console.log('Welding-related fields:', weldingFields);
    }
    
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

export default useDuckDB;