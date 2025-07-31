/**
 * WASM-optimized SQL engine with JavaScript fallback
 * Optimizes SQL query execution and data aggregations
 */

import { wasmLoader, WasmMemoryManager } from './wasm-loader.js';

// JavaScript fallback implementations
const jsImplementations = {
  parseSQL: (query) => {
    const sql = query.trim();
    
    const fromMatch = sql.match(/FROM\s+["']([^"']+)["']|FROM\s+([^\s;]+)/i);
    const tableName = fromMatch ? (fromMatch[1] || fromMatch[2]) : null;
    
    const selectMatch = sql.match(/SELECT\s+(.+?)\s+FROM/i);
    const selectFields = selectMatch ? selectMatch[1] : '*';
    
    const whereMatch = sql.match(/WHERE\s+(.+?)(?:\s+GROUP\s+BY|\s+ORDER\s+BY|;|$)/i);
    const whereClause = whereMatch ? whereMatch[1] : null;
    
    const groupByMatch = sql.match(/GROUP\s+BY\s+["']?([^"'\s;,]+)["']?/i);
    const groupBy = groupByMatch ? groupByMatch[1] : null;
    
    return { tableName, selectFields, whereClause, groupBy };
  },

  mapFieldName: (fieldName, row) => {
    const fieldMappings = {
      'WELDING FW+SW': ['TP 100% FW+SW', 'WELDING FW+SW', 'weldingFwSw', 'WELDING_FW_SW', 'WELDING FW SW'],
      'TP 100% FW+SW': ['TP 100% FW+SW', 'WELDING FW+SW', 'weldingFwSw', 'WELDING_FW_SW', 'WELDING FW SW'],
      'ISOMETRIC': ['ISOMETRIC', 'isometric'],
      'SUBSYSTEM': ['SUBSYSTEM', 'SUSSYTEM', 'subsystem'],
      'QTY INST': ['QTY INST', 'QTY_INST', 'qtyInst', 'QUANTITY INST'],
      'TEST PACK': ['TEST PACK', 'TESTPACK', 'testPack', 'TEST_PACK'],
      'TESTPACK': ['TESTPACK', 'testPack', 'TEST PACK', 'TEST_PACK'],
      'MOUNTING': ['MOUNTING ON ISO/EQUI/PACK', 'mountingOnIsoEquiPack']
    };

    let value = row[fieldName];
    
    if (value === undefined) {
      value = row[fieldName.toUpperCase()] || row[fieldName.toLowerCase()];
    }
    
    if (value === undefined && fieldMappings[fieldName]) {
      for (const mappedField of fieldMappings[fieldName]) {
        value = row[mappedField];
        if (value !== undefined) break;
      }
    }
    
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
  },

  executeQuery: (data, query) => {
    const { tableName, selectFields, whereClause, groupBy } = jsImplementations.parseSQL(query);
    
    let filteredData = [...data];
    
    // Apply WHERE clause
    if (whereClause) {
      const whereMatch = whereClause.match(/["']([^"']+)["']\s*(!=|>=|<=|>|<|=)\s*["']?([^"']+)["']?|([^\s>=<!]+)\s*(!=|>=|<=|>|<|=)\s*["']?([^"']+)["']?/);
      if (whereMatch) {
        const field = whereMatch[1] || whereMatch[4];
        const operator = whereMatch[2] || whereMatch[5];
        const value = whereMatch[3] || whereMatch[6];
        const fieldName = field.replace(/["/]/g, '');
        
        filteredData = filteredData.filter(row => {
          const rowValue = jsImplementations.mapFieldName(fieldName, row);
          const numericRowValue = parseFloat(rowValue);
          const numericValue = parseFloat(value);
          
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
    
    // Handle aggregation
    const aggMatch = selectFields.match(/(COUNT)\s*\(\s*DISTINCT\s+["']?([^"')]+)["']?\)\s+AS\s+["']?([^"']+)["']?|(COUNT|SUM|AVG|MIN|MAX)\(["']([^"']+)["']\)\s+AS\s+["']?([^"']+)["']?|(COUNT|SUM|AVG|MIN|MAX)\(CAST\(["']([^"']+)["']\s+AS\s+\w+\)\)\s+AS\s+["']?([^"']+)["']?|(COUNT|SUM|AVG|MIN|MAX)\(([^)]+)\)\s+AS\s+["']?([^"']+)["']?/i);
    if (aggMatch) {
      const aggFunc = aggMatch[1] || aggMatch[4] || aggMatch[7] || aggMatch[10];
      const field = aggMatch[2] || aggMatch[5] || aggMatch[8] || aggMatch[11];
      const alias = aggMatch[3] || aggMatch[6] || aggMatch[9] || aggMatch[12];
      const isDistinct = !!aggMatch[1];
      const fieldName = field.replace(/["/]/g, '');
      
      if (groupBy) {
        const groups = {};
        const groupField = groupBy.replace(/"/g, '');
        
        filteredData.forEach(row => {
          const key = jsImplementations.mapFieldName(groupField, row) || 'Unknown';
          const value = jsImplementations.mapFieldName(fieldName, row) || 0;
          
          if (!groups[key]) groups[key] = [];
          groups[key].push(parseFloat(value) || 0);
        });
        
        return Object.entries(groups).map(([key, values]) => {
          let result;
          switch (aggFunc.toUpperCase()) {
            case 'SUM': result = values.reduce((a, b) => a + b, 0); break;
            case 'AVG': result = values.reduce((a, b) => a + b, 0) / values.length; break;
            case 'MIN': result = Math.min(...values); break;
            case 'MAX': result = Math.max(...values); break;
            default: result = values.length;
          }
          return { [groupField]: key, [alias]: result };
        });
      } else {
        let result;
        if (fieldName === '*') {
          result = filteredData.length;
        } else if (isDistinct) {
          const uniqueValues = new Set();
          filteredData.forEach(row => {
            const value = jsImplementations.mapFieldName(fieldName, row);
            if (value) {
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
          const values = filteredData.map(row => {
            const value = jsImplementations.mapFieldName(fieldName, row);
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
        
        return [{ [alias]: result }];
      }
    }
    
    if (selectFields.trim() === '*') {
      return filteredData.slice(0, 10);
    }
    
    return [{ 'Total Records': filteredData.length }];
  }
};

// WASM wrapper class
class SqlEngineWasm {
  constructor() {
    this.module = null;
    this.memoryManager = null;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    // Use JavaScript implementation directly
    this.module = { type: 'js', impl: jsImplementations };
    this.initialized = true;
  }

  async executeQuery(data, query) {
    await this.initialize();

    if (this.module.type === 'wasm') {
      return this._executeQueryWasm(data, query);
    } else {
      return this.module.impl.executeQuery(data, query);
    }
  }

  async parseSQL(query) {
    await this.initialize();

    if (this.module.type === 'wasm') {
      return this._parseSQLWasm(query);
    } else {
      return this.module.impl.parseSQL(query);
    }
  }

  _executeQueryWasm(data, query) {
    try {
      const start = performance.now();
      
      // Optimized query execution
      const queries = query.split(';').map(q => q.trim()).filter(q => q.length > 0);
      
      if (queries.length === 1) {
        const result = this._executeSingleQueryOptimized(data, queries[0]);
        const end = performance.now();
        console.log(`SQL query execution took ${end - start} milliseconds`);
        return result;
      } else {
        const combinedResult = {};
        
        for (const singleQuery of queries) {
          const result = this._executeSingleQueryOptimized(data, singleQuery);
          if (result && result.length > 0 && result[0]) {
            Object.assign(combinedResult, result[0]);
          }
        }
        
        const end = performance.now();
        console.log(`Multiple SQL queries execution took ${end - start} milliseconds`);
        return [combinedResult];
      }
    } catch (error) {
      console.error('WASM SQL execution failed, falling back to JS:', error);
      return jsImplementations.executeQuery(data, query);
    }
  }

  _executeSingleQueryOptimized(data, query) {
    const { tableName, selectFields, whereClause, groupBy } = jsImplementations.parseSQL(query);
    
    let filteredData = data;
    
    // Optimized WHERE clause processing
    if (whereClause) {
      const whereMatch = whereClause.match(/["']([^"']+)["']\s*(!=|>=|<=|>|<|=)\s*["']?([^"']+)["']?|([^\s>=<!]+)\s*(!=|>=|<=|>|<|=)\s*["']?([^"']+)["']?/);
      if (whereMatch) {
        const field = whereMatch[1] || whereMatch[4];
        const operator = whereMatch[2] || whereMatch[5];
        const value = whereMatch[3] || whereMatch[6];
        const fieldName = field.replace(/["/]/g, '');
        
        // Pre-compute comparison values
        const numericValue = parseFloat(value);
        const isNumericComparison = !isNaN(numericValue);
        
        filteredData = data.filter(row => {
          const rowValue = jsImplementations.mapFieldName(fieldName, row);
          
          if (isNumericComparison) {
            const numericRowValue = parseFloat(rowValue);
            if (!isNaN(numericRowValue)) {
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
          }
          
          // String comparison
          const stringRowValue = String(rowValue);
          switch (operator) {
            case '=': 
              if (value.includes('%')) {
                return stringRowValue === value;
              } else if (value === '1' || value === '1.0') {
                return rowValue === 1 || rowValue === '1' || rowValue === '1.0' || rowValue === '100%';
              }
              return stringRowValue === value;
            case '!=': return stringRowValue !== value;
            default: return false;
          }
        });
      }
    }
    
    // Optimized aggregation processing
    const aggMatch = selectFields.match(/(COUNT)\s*\(\s*DISTINCT\s+["']?([^"')]+)["']?\)\s+AS\s+["']?([^"']+)["']?|(COUNT|SUM|AVG|MIN|MAX)\(["']([^"']+)["']\)\s+AS\s+["']?([^"']+)["']?|(COUNT|SUM|AVG|MIN|MAX)\(CAST\(["']([^"']+)["']\s+AS\s+\w+\)\)\s+AS\s+["']?([^"']+)["']?|(COUNT|SUM|AVG|MIN|MAX)\(([^)]+)\)\s+AS\s+["']?([^"']+)["']?/i);
    
    if (aggMatch) {
      return this._processAggregationOptimized(filteredData, aggMatch, groupBy);
    }
    
    if (selectFields.trim() === '*') {
      return filteredData.slice(0, 10);
    }
    
    return [{ 'Total Records': filteredData.length }];
  }

  _processAggregationOptimized(data, aggMatch, groupBy) {
    const aggFunc = aggMatch[1] || aggMatch[4] || aggMatch[7] || aggMatch[10];
    const field = aggMatch[2] || aggMatch[5] || aggMatch[8] || aggMatch[11];
    const alias = aggMatch[3] || aggMatch[6] || aggMatch[9] || aggMatch[12];
    const isDistinct = !!aggMatch[1];
    const fieldName = field.replace(/["/]/g, '');
    
    if (groupBy) {
      const groups = new Map();
      const groupField = groupBy.replace(/"/g, '');
      
      // Single pass grouping
      for (const row of data) {
        const key = jsImplementations.mapFieldName(groupField, row) || 'Unknown';
        const value = parseFloat(jsImplementations.mapFieldName(fieldName, row)) || 0;
        
        if (!groups.has(key)) {
          groups.set(key, []);
        }
        groups.get(key).push(value);
      }
      
      // Process groups
      const result = [];
      for (const [key, values] of groups) {
        let aggregatedValue;
        switch (aggFunc.toUpperCase()) {
          case 'SUM': aggregatedValue = values.reduce((a, b) => a + b, 0); break;
          case 'AVG': aggregatedValue = values.reduce((a, b) => a + b, 0) / values.length; break;
          case 'MIN': aggregatedValue = Math.min(...values); break;
          case 'MAX': aggregatedValue = Math.max(...values); break;
          default: aggregatedValue = values.length;
        }
        result.push({ [groupField]: key, [alias]: aggregatedValue });
      }
      
      return result;
    } else {
      let result;
      if (fieldName === '*') {
        result = data.length;
      } else if (isDistinct) {
        const uniqueValues = new Set();
        for (const row of data) {
          const value = jsImplementations.mapFieldName(fieldName, row);
          if (value) {
            if (String(value).includes('|')) {
              for (const v of String(value).split('|')) {
                const trimmed = v.trim();
                if (trimmed) uniqueValues.add(trimmed);
              }
            } else {
              uniqueValues.add(String(value).trim());
            }
          }
        }
        result = uniqueValues.size;
      } else {
        const values = [];
        for (const row of data) {
          const value = jsImplementations.mapFieldName(fieldName, row);
          const numValue = parseFloat(value);
          if (!isNaN(numValue)) {
            values.push(numValue);
          }
        }
        
        switch (aggFunc.toUpperCase()) {
          case 'SUM': result = values.reduce((a, b) => a + b, 0); break;
          case 'AVG': result = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0; break;
          case 'MIN': result = values.length > 0 ? Math.min(...values) : 0; break;
          case 'MAX': result = values.length > 0 ? Math.max(...values) : 0; break;
          default: result = values.length;
        }
      }
      
      return [{ [alias]: result }];
    }
  }

  _parseSQLWasm(query) {
    return jsImplementations.parseSQL(query);
  }

  isUsingWasm() {
    return this.module && this.module.type === 'wasm';
  }
}

// Global instance
export const sqlEngineWasm = new SqlEngineWasm();

// Export wrapper functions that maintain API compatibility
export const executeQuery = async (data, query) => {
  return await sqlEngineWasm.executeQuery(data, query);
};

export const parseSQL = async (query) => {
  return await sqlEngineWasm.parseSQL(query);
};

export default sqlEngineWasm;