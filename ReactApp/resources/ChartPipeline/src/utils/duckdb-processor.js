/**
 * DuckDB processor utility for high-performance SQL operations
 * Provides a lightweight SQL engine for client-side data processing
 */

// Flag to track DuckDB initialization status
let duckDBInitialized = false;

/**
 * Initialize DuckDB
 * @returns {Promise<Object>} - DuckDB instance
 */
export const initializeDuckDB = async () => {
  if (duckDBInitialized) {
    return window.duckdb;
  }
  
  try {
    // Check if DuckDB is already loaded
    if (window.duckdb) {
      duckDBInitialized = true;
      return window.duckdb;
    }
    
    // Load DuckDB WASM module
    // In a real implementation, this would load the actual DuckDB WASM module
    // For now, we'll create a mock implementation
    window.duckdb = createMockDuckDB();
    
    duckDBInitialized = true;
    console.log('✅ DuckDB initialized');
    return window.duckdb;
  } catch (error) {
    console.error('❌ Failed to initialize DuckDB:', error);
    throw new Error(`DuckDB initialization failed: ${error.message}`);
  }
};

/**
 * Create a DuckDB table from data
 * @param {Object} db - DuckDB instance
 * @param {string} tableName - Name of the table to create
 * @param {Array} data - Data to insert into the table
 * @returns {Promise<boolean>} - Whether table creation was successful
 */
export const createDuckDBTable = async (db, tableName, data) => {
  if (!db || !tableName || !data || data.length === 0) {
    throw new Error('Invalid parameters for createDuckDBTable');
  }
  
  try {
    // In a real implementation, this would create a table in DuckDB
    // For now, we'll simulate successful table creation
    db.tables = db.tables || {};
    db.tables[tableName] = data;
    
    console.log(`✅ Created DuckDB table: ${tableName} with ${data.length} rows`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to create DuckDB table ${tableName}:`, error);
    throw new Error(`Table creation failed: ${error.message}`);
  }
};

/**
 * Execute a SQL query against DuckDB
 * @param {Object} db - DuckDB instance
 * @param {string} sql - SQL query to execute
 * @returns {Promise<Array>} - Query results
 */
export const queryDuckDB = async (db, sql) => {
  if (!db || !sql) {
    throw new Error('Invalid parameters for queryDuckDB');
  }
  
  try {
    // In a real implementation, this would execute a SQL query in DuckDB
    // For now, we'll simulate query execution with basic filtering
    
    // Parse the SQL query to extract table name and where conditions
    const tableMatch = sql.match(/FROM\s+([^\s]+)/i);
    const tableName = tableMatch ? tableMatch[1] : null;
    
    if (!tableName || !db.tables || !db.tables[tableName]) {
      throw new Error(`Table ${tableName} not found`);
    }
    
    const data = db.tables[tableName];
    
    // Handle COUNT queries
    if (sql.includes('COUNT(*)')) {
      return [{ total: data.length, valid: data.filter(row => row.pid_isoinst).length }];
    }
    
    // Handle information_schema queries
    if (sql.includes('information_schema.columns')) {
      if (data.length === 0) return [];
      
      const sampleRow = data[0];
      return Object.keys(sampleRow).map(column_name => ({ column_name }));
    }
    
    // Handle WHERE conditions
    let filteredData = data;
    const whereMatch = sql.match(/WHERE\s+(.+?)(?:ORDER\s+BY|LIMIT|$)/i);
    
    if (whereMatch) {
      const whereConditions = whereMatch[1].split('AND').map(condition => condition.trim());
      
      filteredData = data.filter(row => {
        for (const condition of whereConditions) {
          // Handle IS NOT NULL conditions
          if (condition.includes('IS NOT NULL')) {
            const fieldMatch = condition.match(/(\w+)\s+IS\s+NOT\s+NULL/i);
            if (fieldMatch) {
              const field = fieldMatch[1];
              if (!row[field]) return false;
            }
          }
          // Handle equality conditions
          else if (condition.includes('=')) {
            const [field, value] = condition.split('=').map(part => part.trim());
            const cleanField = field.replace(/`/g, '');
            const cleanValue = value.replace(/'/g, '');
            
            if (row[cleanField] !== cleanValue) return false;
          }
          // Handle LIKE conditions
          else if (condition.includes('LIKE')) {
            const [field, pattern] = condition.split('LIKE').map(part => part.trim());
            const cleanField = field.replace(/`/g, '');
            const cleanPattern = pattern.replace(/'/g, '').replace(/%/g, '');
            
            if (!row[cleanField] || !row[cleanField].includes(cleanPattern)) return false;
          }
        }
        
        return true;
      });
    }
    
    // Handle SELECT fields
    const selectMatch = sql.match(/SELECT\s+(.+?)\s+FROM/i);
    if (selectMatch && !selectMatch[1].includes('*')) {
      const fields = selectMatch[1].split(',').map(field => {
        const trimmed = field.trim();
        const asMatch = trimmed.match(/(\w+)\s+AS\s+(\w+)/i);
        return asMatch ? { source: asMatch[1], alias: asMatch[2] } : { source: trimmed, alias: trimmed };
      });
      
      return filteredData.map(row => {
        const result = {};
        fields.forEach(({ source, alias }) => {
          result[alias] = row[source];
        });
        return result;
      });
    }
    
    // Handle ORDER BY
    const orderByMatch = sql.match(/ORDER\s+BY\s+(\w+)/i);
    if (orderByMatch) {
      const orderField = orderByMatch[1];
      filteredData.sort((a, b) => {
        if (!a[orderField]) return 1;
        if (!b[orderField]) return -1;
        return a[orderField].localeCompare(b[orderField]);
      });
    }
    
    return filteredData;
  } catch (error) {
    console.error('❌ Failed to execute DuckDB query:', error);
    throw new Error(`Query execution failed: ${error.message}`);
  }
};

/**
 * Create a mock DuckDB implementation
 * @returns {Object} - Mock DuckDB instance
 */
const createMockDuckDB = () => {
  return {
    tables: {},
    version: () => '0.8.1',
    connect: () => ({ query: (sql) => queryDuckDB(window.duckdb, sql) }),
    close: () => console.log('Mock DuckDB connection closed')
  };
};

export default {
  initializeDuckDB,
  createDuckDBTable,
  queryDuckDB
};