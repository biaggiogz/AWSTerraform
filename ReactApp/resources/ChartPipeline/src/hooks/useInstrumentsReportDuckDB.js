import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import useDuckDB3 from './useDuckDB3';
import * as arrow from 'apache-arrow';

/**
 * Custom hook for handling DuckDB integration with Instruments Report tables
 * This hook provides SQL query capabilities across all tables in the Instruments Report tab
 */
const useInstrumentsReportDuckDB = (
  controlData, 
  detailsData, 
  dynamicData,
  filteredControlData, 
  filteredDetailsData,
  filteredDynamicData
) => {
  const { 
    loading: duckDBLoading, 
    error, 
    createTableFromParquet, 
    executeQuery,
    clearQueryCache
  } = useDuckDB3();
  
  const [calculations, setCalculations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tableInfo, setTableInfo] = useState({});
  const tablesInitialized = useRef(false);
  const tableDataRef = useRef({
    controlInstrumentsByIsometric: null,
    detailsInstrumentsTable: null,
    dynamicInstrumentTable: null
  });

  // Flatten hierarchical table (dynamicInstrumentTable)
  const flattenHierarchicalTable = useCallback((data) => {
    if (!data || data.length === 0) return [];
    
    // Extract only top-level rows (parent rows)
    // A parent row is one that has children or doesn't have a parent
    const parentRows = data.filter(row => {
      // Identify parent rows based on your data structure
      // This is an example - adjust according to your actual data structure
      return !row.isChild && !row.parentId;
    });
    
    return parentRows.length > 0 ? parentRows : data;
  }, []);

  // Normalize column name for SQL compatibility
  const normalizeColumnName = useCallback((columnName) => {
    // Convert to lowercase
    let normalized = columnName.toLowerCase();
    
    // Replace spaces with underscores
    normalized = normalized.replace(/\s+/g, '_');
    
    // Remove special characters
    normalized = normalized.replace(/[^a-z0-9_]/g, '');
    
    // Ensure it starts with a letter
    if (!/^[a-z]/.test(normalized)) {
      normalized = 'col_' + normalized;
    }
    
    // Ensure it's not empty
    if (!normalized) {
      normalized = 'column';
    }
    
    return normalized;
  }, []);

  // Custom executeQuery wrapper to handle DuckDB limitations
  const safeExecuteQuery = useCallback(async (sql, options = {}) => {
    // For DDL statements (CREATE, INSERT, etc.), don't add LIMIT
    const isDDL = /^\s*(CREATE|INSERT|DROP|ALTER|UPDATE|DELETE)/i.test(sql);
    
    try {
      if (isDDL) {
        // Execute DDL statements directly without LIMIT
        return await executeQuery(sql, { ...options, maxRows: null });
      } else {
        // For regular queries, use the default behavior
        return await executeQuery(sql, options);
      }
    } catch (err) {
      // Handle specific errors
      if (err.message && err.message.includes('syntax error at or near "LIMIT"')) {
        console.warn('LIMIT syntax error detected, retrying without LIMIT');
        // Try again with explicit semicolon to prevent LIMIT from being added
        return await executeQuery(sql.endsWith(';') ? sql : `${sql};`, { ...options, maxRows: null });
      }
      throw err;
    }
  }, [executeQuery]);

  // Update table info for UI display
  const updateTableInfo = useCallback(async () => {
    try {
      // Get list of available tables first
      let availableTables = [];
      try {
        const [tablesResult] = await safeExecuteQuery('SHOW TABLES;');
        if (tablesResult && tablesResult.name) {
          availableTables = [tablesResult.name];
        } else if (Array.isArray(tablesResult)) {
          availableTables = tablesResult.map(t => t.name || t.table_name || '').filter(Boolean);
        }
        console.log('Available tables in DuckDB:', availableTables);
      } catch (e) {
        console.warn('Could not get table list:', e);
      }
      
      // Initialize table info object
      const newTableInfo = {};
      
      // Helper function to safely get table info
      const safeGetTableInfo = async (tableName) => {
        try {
          // Check if table exists in available tables
          if (!availableTables.includes(tableName) && availableTables.length > 0) {
            console.warn(`Table ${tableName} not found in available tables`);
            return {
              totalRows: 0,
              fields: [],
              columnMap: {}
            };
          }
          
          // Get row count
          const [countResult] = await safeExecuteQuery(`SELECT COUNT(*) as count FROM ${tableName};`);
          
          // Get column names
          const [columnsResult] = await safeExecuteQuery(`SELECT * FROM ${tableName} LIMIT 1;`);
          
          // Get column mapping if available
          const columnMap = tableDataRef.current[`${tableName}_columns`] || {};
          
          // Create reverse mapping for display purposes
          const reverseColumnMap = {};
          Object.entries(columnMap).forEach(([original, normalized]) => {
            reverseColumnMap[normalized] = original;
          });
          
          return {
            totalRows: countResult?.count || 0,
            fields: columnsResult ? Object.keys(columnsResult).map(col => reverseColumnMap[col] || col) : [],
            columnMap
          };
        } catch (err) {
          console.warn(`Failed to get info for table ${tableName}:`, err);
          return {
            totalRows: 0,
            fields: [],
            columnMap: {}
          };
        }
      };
      
      // Get info for each table
      newTableInfo.controlInstrumentsByIsometric = await safeGetTableInfo('controlInstrumentsByIsometric');
      newTableInfo.detailsInstrumentsTable = await safeGetTableInfo('detailsInstrumentsTable');
      newTableInfo.dynamicInstrumentTable = await safeGetTableInfo('dynamicInstrumentTable');
      
      // Update state
      setTableInfo(newTableInfo);
      console.log('Table info updated:', newTableInfo);
    } catch (err) {
      console.error('Failed to update table info:', err);
    }
  }, [safeExecuteQuery]);

  // Create a direct table in DuckDB without using Parquet
  const createDirectTable = useCallback(async (tableName, data) => {
    if (!data || data.length === 0) return false;
    
    try {
      // Get column names and create schema with normalized names
      const originalColumns = Object.keys(data[0]);
      const columnMap = {};
      
      // Special case for dynamicInstrumentTable - preserve original column names
      if (tableName === 'dynamicInstrumentTable') {
        // Use original column names for dynamicInstrumentTable
        originalColumns.forEach(col => {
          columnMap[col] = col; // Keep original column names
        });
        
        // Create column definitions for SQL with original names
        const columnDefs = originalColumns.map(col => `"${col}" VARCHAR`).join(', ');
        
        // Create the table - use safeExecuteQuery to avoid LIMIT issues
        await safeExecuteQuery(`CREATE OR REPLACE TABLE ${tableName} (${columnDefs});`);
      } else {
        // Normal case for other tables - normalize column names
        originalColumns.forEach(col => {
          columnMap[col] = normalizeColumnName(col);
        });
        
        // Create column definitions for SQL
        const columnDefs = originalColumns.map(col => `"${columnMap[col]}" VARCHAR`).join(', ');
        
        // Create the table - use safeExecuteQuery to avoid LIMIT issues
        await safeExecuteQuery(`CREATE OR REPLACE TABLE ${tableName} (${columnDefs});`);
      }
      
      // Insert data in batches to avoid memory issues
      const batchSize = 50;
      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);
        
        // Create values for INSERT statement
        const values = batch.map(row => {
          const rowValues = originalColumns.map(col => {
            const val = row[col];
            if (val === null || val === undefined) return 'NULL';
            if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
            return val;
          });
          return `(${rowValues.join(', ')})`;
        }).join(', ');
        
        // Execute INSERT statement - use safeExecuteQuery
        await safeExecuteQuery(`INSERT INTO ${tableName} VALUES ${values};`);
      }
      
      // Store column mapping for later use
      tableDataRef.current[`${tableName}_columns`] = columnMap;
      
      return true;
    } catch (err) {
      console.error(`Error creating direct table ${tableName}:`, err);
      return false;
    }
  }, [safeExecuteQuery, normalizeColumnName]);
  
  // Convert JavaScript array to Arrow Table for DuckDB
  const convertToArrowTable = useCallback((data) => {
    if (!data || data.length === 0) return null;
    
    try {
      // Create a simple object with column arrays
      const columns = {};
      const columnNames = Object.keys(data[0]);
      
      // Initialize column arrays
      columnNames.forEach(name => {
        columns[name] = [];
      });
      
      // Fill column arrays with data
      data.forEach(row => {
        columnNames.forEach(name => {
          columns[name].push(row[name] === undefined ? null : row[name]);
        });
      });
      
      // Create Arrow table
      return arrow.tableFromArrays(columns);
    } catch (err) {
      console.error('Error converting data to Arrow Table:', err);
      console.log('Data sample:', data && data.length > 0 ? data[0] : 'No data');
      return null;
    }
  }, []);

  // Initialize tables with data
  const initializeTables = useCallback(async () => {
    if (duckDBLoading || tablesInitialized.current) return;
    
    setLoading(true);
    try {
      console.log('Initializing DuckDB tables...');
      
      // Store the data references
      tableDataRef.current = {
        controlInstrumentsByIsometric: controlData,
        detailsInstrumentsTable: detailsData,
        dynamicInstrumentTable: dynamicData || controlData // Fallback to controlData if dynamicData not provided
      };
      
      // Log data availability
      console.log('Data availability:', {
        controlData: controlData ? `${controlData.length} rows` : 'No data',
        detailsData: detailsData ? `${detailsData.length} rows` : 'No data',
        dynamicData: dynamicData ? `${dynamicData.length} rows` : 'Using control data'
      });
      
      // Create a simple master table for testing first
      try {
        await safeExecuteQuery(`CREATE OR REPLACE TABLE master_table AS SELECT 1 as id, 'test' as name;`);
        console.log('Created master_table for testing');
      } catch (e) {
        console.error('Failed to create master_table:', e);
      }
      
      // Create tables directly with SQL
      let success = true;
      
      // Create control table
      if (controlData && controlData.length > 0) {
        console.log('Creating controlInstrumentsByIsometric table...');
        const controlSuccess = await createDirectTable('controlInstrumentsByIsometric', controlData);
        if (!controlSuccess) {
          console.error('Failed to create controlInstrumentsByIsometric table');
          success = false;
        } else {
          // Verify table creation
          try {
            const result = await safeExecuteQuery('SELECT COUNT(*) as count FROM controlInstrumentsByIsometric;');
            console.log('controlInstrumentsByIsometric table created with', result[0]?.count || 0, 'rows');
          } catch (e) {
            console.error('Failed to verify controlInstrumentsByIsometric table:', e);
          }
        }
      }
      
      // Create details table
      if (detailsData && detailsData.length > 0) {
        console.log('Creating detailsInstrumentsTable table...');
        const detailsSuccess = await createDirectTable('detailsInstrumentsTable', detailsData);
        if (!detailsSuccess) {
          console.error('Failed to create detailsInstrumentsTable table');
          success = false;
        } else {
          // Verify table creation
          try {
            const result = await safeExecuteQuery('SELECT COUNT(*) as count FROM detailsInstrumentsTable;');
            console.log('detailsInstrumentsTable table created with', result[0]?.count || 0, 'rows');
          } catch (e) {
            console.error('Failed to verify detailsInstrumentsTable table:', e);
          }
        }
      }
      
      // Create dynamic table
      if (dynamicData && dynamicData.length > 0) {
        console.log('Creating dynamicInstrumentTable table...');
        // Flatten hierarchical data
        const flattenedDynamicData = flattenHierarchicalTable(dynamicData);
        const dynamicSuccess = await createDirectTable('dynamicInstrumentTable', flattenedDynamicData);
        if (!dynamicSuccess) {
          console.error('Failed to create dynamicInstrumentTable table');
          success = false;
        } else {
          // Verify table creation
          try {
            const result = await safeExecuteQuery('SELECT COUNT(*) as count FROM dynamicInstrumentTable;');
            console.log('dynamicInstrumentTable table created with', result[0]?.count || 0, 'rows');
          } catch (e) {
            console.error('Failed to verify dynamicInstrumentTable table:', e);
          }
        }
      }
      
      tablesInitialized.current = success;
      
      // Update table info
      await updateTableInfo();
      console.log('Tables initialized successfully:', success);
    } catch (err) {
      console.error('Failed to initialize DuckDB tables:', err);
      tablesInitialized.current = false;
    } finally {
      setLoading(false);
    }
  }, [
    controlData, detailsData, dynamicData, 
    duckDBLoading, createDirectTable, safeExecuteQuery, 
    flattenHierarchicalTable, updateTableInfo
  ]);

  // Update tables with filtered data
  const updateTables = useCallback(async () => {
    if (!tablesInitialized.current) {
      await initializeTables();
      return;
    }
    
    setLoading(true);
    try {
      // Use filtered data if available, otherwise use original data
      const controlDataToUse = filteredControlData || controlData;
      const detailsDataToUse = filteredDetailsData || detailsData;
      const dynamicDataToUse = filteredDynamicData || dynamicData || controlData;
      
      // Only update if data has changed
      if (controlDataToUse !== tableDataRef.current.controlInstrumentsByIsometric) {
        console.log('Updating controlInstrumentsByIsometric table...');
        await createDirectTable('controlInstrumentsByIsometric', controlDataToUse);
        tableDataRef.current.controlInstrumentsByIsometric = controlDataToUse;
      }
      
      if (detailsDataToUse !== tableDataRef.current.detailsInstrumentsTable) {
        console.log('Updating detailsInstrumentsTable table...');
        await createDirectTable('detailsInstrumentsTable', detailsDataToUse);
        tableDataRef.current.detailsInstrumentsTable = detailsDataToUse;
      }
      
      if (dynamicDataToUse !== tableDataRef.current.dynamicInstrumentTable) {
        console.log('Updating dynamicInstrumentTable table...');
        // For dynamic table, we need to flatten the hierarchy and extract only top-level rows
        const flattenedDynamicData = flattenHierarchicalTable(dynamicDataToUse);
        await createDirectTable('dynamicInstrumentTable', flattenedDynamicData);
        tableDataRef.current.dynamicInstrumentTable = dynamicDataToUse;
      }
      
      // Clear query cache after updating tables
      clearQueryCache();
      
      // Update table info
      await updateTableInfo();
    } catch (err) {
      console.error('Failed to update DuckDB tables:', err);
    } finally {
      setLoading(false);
    }
  }, [
    controlData, detailsData, dynamicData,
    filteredControlData, filteredDetailsData, filteredDynamicData,
    initializeTables, createDirectTable, flattenHierarchicalTable, clearQueryCache, updateTableInfo
  ]);

  // Debug function to get actual column names from a table
  const getActualColumnNames = useCallback(async (tableName) => {
    try {
      // Get column names directly from the table
      const result = await safeExecuteQuery(`SELECT * FROM ${tableName} LIMIT 1;`);
      if (result && result.length > 0) {
        const columns = Object.keys(result[0]);
        console.log(`Actual columns in ${tableName}:`, columns);
        return columns;
      }
      return [];
    } catch (err) {
      console.error(`Failed to get column names for ${tableName}:`, err);
      return [];
    }
  }, [safeExecuteQuery]);

  // Transform SQL query to use normalized column names
  const transformSqlQuery = useCallback(async (sqlQuery) => {
    let transformedQuery = sqlQuery;
    
    // Extract table name from query
    const tableMatch = sqlQuery.match(/FROM\s+["']?([^\s"';]+)["']?/i);
    const tableName = tableMatch ? tableMatch[1].replace(/["']/g, '') : null;
    
    if (tableName) {
      // Get actual column names from the table
      const actualColumns = await getActualColumnNames(tableName);
      console.log(`Actual columns in ${tableName}:`, actualColumns);
      
      // Get column mappings for this table
      const columnMap = tableDataRef.current[`${tableName}_columns`] || {};
      
      // Create reverse mapping (normalized -> original)
      const reverseColumnMap = {};
      Object.entries(columnMap).forEach(([original, normalized]) => {
        reverseColumnMap[normalized] = original;
        // Also map lowercase versions
        reverseColumnMap[normalized.toLowerCase()] = original;
      });
      
      // Table-specific column mappings
      const tableSpecificMappings = {
        'controlInstrumentsByIsometric': {
          'done': ['installed_by_teigatmi', 'installed_by_siemsa'],
          'total done': ['installed_by_teigatmi', 'installed_by_siemsa'],
          'DONE': ['installed_by_teigatmi', 'installed_by_siemsa'],
          'TOTAL DONE': ['installed_by_teigatmi', 'installed_by_siemsa'],
          'total inst': ['qty_inst'],
          'TOTAL INST': ['qty_inst']
        },
        'dynamicInstrumentTable': {
          // No mappings needed since we're preserving original column names
        },
        'detailsInstrumentsTable': {
          'tag': ['tag_inst'],
          'TAG': ['tag_inst']
        }
      };
      
      // Get the appropriate mappings for this table
      const commonVariations = tableSpecificMappings[tableName] || {};
      
      // Extract column names from query
      const columnMatches = sqlQuery.match(/"([^"]+)"/g) || [];
      
      // Replace each column name with its normalized version
      for (const match of columnMatches) {
        const columnName = match.replace(/"/g, '');
        const normalizedName = columnMap[columnName];
        
        if (normalizedName && actualColumns.includes(normalizedName)) {
          // Direct mapping exists
          const regex = new RegExp(`"${columnName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`, 'g');
          transformedQuery = transformedQuery.replace(regex, `"${normalizedName}"`);
        } else {
          // Try table-specific variations
          const variations = commonVariations[columnName] || [];
          for (const variant of variations) {
            if (actualColumns.includes(variant)) {
              const regex = new RegExp(`"${columnName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`, 'g');
              transformedQuery = transformedQuery.replace(regex, `"${variant}"`);
              console.log(`Replaced "${columnName}" with "${variant}" in ${tableName}`);
              break;
            }
          }
        }
      }
      
      // Special case for SUM of multiple columns in controlInstrumentsByIsometric
      if (tableName === 'controlInstrumentsByIsometric' && 
          transformedQuery.includes('TOTAL DONE') && 
          !transformedQuery.includes('installed_by_teigatmi')) {
        // Replace "DONE" with sum of TEIGA-TMI and SIEMSA installations
        const donePattern = /SUM\s*\(\s*"([^"]+)"\s*\)/gi;
        if (donePattern.test(transformedQuery)) {
          transformedQuery = transformedQuery.replace(
            donePattern,
            'SUM("installed_by_teigatmi") + SUM("installed_by_siemsa")'
          );
          console.log('Applied special case for TOTAL DONE in controlInstrumentsByIsometric');
        }
      }
    }
    
    return transformedQuery;
  }, [getActualColumnNames]);

  // Execute SQL query
  const executeSQLQuery = useCallback(async (sqlQuery) => {
    if (!sqlQuery.trim()) return [];
    
    setLoading(true);
    try {
      // Initialize tables if not done yet
      if (!tablesInitialized.current) {
        console.log('Tables not initialized, initializing now...');
        await initializeTables();
        
        // Double-check initialization
        if (!tablesInitialized.current) {
          throw new Error('Failed to initialize tables. Check console for errors.');
        }
      }
      
      // List available tables for debugging
      try {
        const [tables] = await safeExecuteQuery('SHOW TABLES;');
        console.log('Available tables:', tables);
      } catch (e) {
        console.warn('Could not list tables:', e);
      }
      
      // Extract table name from query for debugging
      const tableMatch = sqlQuery.match(/FROM\s+["']?([^\s"';]+)["']?/i);
      const tableName = tableMatch ? tableMatch[1].replace(/["']/g, '') : null;
      
      // Debug the dynamicInstrumentTable if that's the target
      if (tableName === 'dynamicInstrumentTable') {
        console.log('Detected dynamicInstrumentTable query');
      }
      
      if (tableName) {
        // Debug column names for this table
        await getActualColumnNames(tableName);
      }
      
      // Transform the query to use normalized column names
      const transformedQuery = await transformSqlQuery(sqlQuery);
      console.log('Original SQL query:', sqlQuery);
      console.log('Transformed SQL query:', transformedQuery);
      
      // Execute the query
      const result = await safeExecuteQuery(transformedQuery);
      console.log('Query result:', result);
      setCalculations(result);
      return result;
    } catch (err) {
      console.error('SQL Query execution failed:', err);
      
      // Provide more helpful error message
      let errorMessage = err.message || 'Query execution failed';
      
      // Check if it's a column not found error
      if (errorMessage.includes('Referenced column') && errorMessage.includes('not found')) {
        // Extract the column name from the error message
        const columnMatch = errorMessage.match(/Referenced column "([^"]+)" not found/i);
        const columnName = columnMatch ? columnMatch[1] : null;
        
        if (columnName) {
          errorMessage += `\n\nThe column "${columnName}" doesn't exist in the table. `;
          errorMessage += '\nAvailable columns are: ' + errorMessage.match(/Candidate bindings: (.+)$/m)?.[1] || 'unknown';
          errorMessage += '\n\nTry using one of these column names instead.';
        }
      }
      // Check if it's a table not found error
      else if (errorMessage.includes('does not exist')) {
        errorMessage += ' - Make sure the table name is correct and data is loaded properly.';
        
        // Try to reinitialize tables
        console.log('Attempting to reinitialize tables...');
        tablesInitialized.current = false;
        try {
          await initializeTables();
        } catch (initErr) {
          console.error('Reinitialization failed:', initErr);
        }
      }
      
      // Try to run a simple query on master_table to verify DuckDB is working
      try {
        const testResult = await safeExecuteQuery('SELECT * FROM master_table;');
        console.log('Test query result:', testResult);
      } catch (testErr) {
        console.error('Even test query failed:', testErr);
      }
      
      setCalculations([{ Error: errorMessage }]);
      return [{ Error: errorMessage }];
    } finally {
      setLoading(false);
    }
  }, [initializeTables, safeExecuteQuery, transformSqlQuery, getActualColumnNames]);

  // Initialize tables on first render
  useEffect(() => {
    if (!duckDBLoading && !tablesInitialized.current) {
      initializeTables();
    }
  }, [duckDBLoading, initializeTables]);

  // Update tables when filtered data changes
  useEffect(() => {
    if (!duckDBLoading && tablesInitialized.current) {
      updateTables();
    }
  }, [filteredControlData, filteredDetailsData, filteredDynamicData, duckDBLoading, updateTables]);

  // Get available tables
  const availableTables = useMemo(() => {
    return Object.keys(tableInfo);
  }, [tableInfo]);

  return {
    calculations,
    loading: loading || duckDBLoading,
    error,
    executeSQLQuery,
    tableInfo,
    availableTables,
    updateTables
  };
};

export default useInstrumentsReportDuckDB;