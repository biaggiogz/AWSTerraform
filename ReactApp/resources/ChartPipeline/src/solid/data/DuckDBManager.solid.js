/**
 * DuckDBManager.solid.js
 * Core database management with direct DuckDB-Wasm integration
 * 
 * Performance Target: <50ms query execution for complex joins
 */

import { createSignal, createResource, onCleanup } from 'solid-js';
import * as duckdb from '@duckdb/duckdb-wasm';

// Memory-efficient singleton pattern
let duckDBInstance = null;
let connectionInstance = null;
let initializationPromise = null;

/**
 * DuckDB Manager with optimized WASM integration
 */
export const createDuckDBManager = () => {
  const [status, setStatus] = createSignal('initializing');
  const [error, setError] = createSignal(null);
  const [memoryUsage, setMemoryUsage] = createSignal(0);
  
  // Initialize DuckDB only once
  const initialize = async () => {
    if (initializationPromise) {
      return initializationPromise;
    }
    
    try {
      setStatus('loading');
      
      // Performance optimization: Use CDN for WASM files
      const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();
      
      // Select the bundle based on browser features
      const bundle = await duckdb.selectBundle({
        mvp: {
          mainModule: JSDELIVR_BUNDLES.mvp.mainModule,
          mainWorker: JSDELIVR_BUNDLES.mvp.mainWorker,
        },
        eh: {
          mainModule: JSDELIVR_BUNDLES.eh.mainModule,
          mainWorker: JSDELIVR_BUNDLES.eh.mainWorker,
        }
      });
      
      // Instantiate the asynchronous version of DuckDB
      const worker = new Worker(bundle.mainWorker);
      const logger = new duckdb.ConsoleLogger();
      
      // Create a database with optimized settings
      duckDBInstance = new duckdb.AsyncDuckDB(logger, worker);
      await duckDBInstance.instantiate(bundle.mainModule);
      
      // Configure for performance
      await duckDBInstance.open({
        path: ':memory:',
        query: {
          castBigIntToDouble: true,
          castTimestampToDate: true
        }
      });
      
      // Create an optimized connection
      connectionInstance = await duckDBInstance.connect();
      
      setStatus('ready');
      
      // Start memory monitoring
      startMemoryMonitoring();
      
      return { db: duckDBInstance, connection: connectionInstance };
    } catch (err) {
      setError(err);
      setStatus('error');
      console.error('DuckDB initialization error:', err);
      throw err;
    }
  };
  
  // Create a resource for initialization
  const [dbResource] = createResource(initialize);
  
  // Memory monitoring for automatic garbage collection
  const startMemoryMonitoring = () => {
    const interval = setInterval(async () => {
      if (duckDBInstance) {
        try {
          const memUsage = await duckDBInstance.getMemoryUsage();
          setMemoryUsage(memUsage);
          
          // Automatic garbage collection when memory usage is high
          if (memUsage > 100 * 1024 * 1024) { // 100MB threshold
            console.log('High memory usage detected, running garbage collection');
            await duckDBInstance.runQuery('PRAGMA memory_limit=\'500MB\'');
          }
        } catch (err) {
          console.warn('Memory monitoring error:', err);
        }
      }
    }, 5000);
    
    onCleanup(() => clearInterval(interval));
  };
  
  /**
   * Load CSV data with optimized settings
   * @param {string} name - Table name
   * @param {string} url - CSV file URL
   * @param {Object} options - Loading options
   */
  const loadCSV = async (name, url, options = {}) => {
    try {
      const { db, connection } = await dbResource();
      
      // Fetch the CSV file with streaming for large files
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch CSV: ${response.statusText}`);
      }
      
      // Use streaming for large files
      const blob = await response.blob();
      
      // Register the blob as a file buffer
      await db.registerFileBuffer(url, new Uint8Array(await blob.arrayBuffer()));
      
      // Create table from CSV with optimized settings
      const defaultOptions = {
        delimiter: ',',
        header: true,
        skipRows: 0,
        compression: 'auto',
        dateFormat: '%Y-%m-%d',
        timestampFormat: '%Y-%m-%d %H:%M:%S',
        sample_size: 1000,
        all_varchar: false,
        ...options
      };
      
      // Optimized query for CSV import
      const query = `
        CREATE TABLE ${name} AS 
        SELECT * FROM read_csv_auto(
          '${url}',
          delim='${defaultOptions.delimiter}',
          header=${defaultOptions.header},
          skip=${defaultOptions.skipRows},
          sample_size=${defaultOptions.sample_size},
          all_varchar=${defaultOptions.all_varchar}
        )
      `;
      
      await connection.query(query);
      
      // Create indexes for performance (if specified)
      if (options.indexes) {
        for (const idx of options.indexes) {
          await connection.query(`CREATE INDEX idx_${name}_${idx} ON ${name}(${idx})`);
        }
      }
      
      return { success: true, tableName: name };
    } catch (err) {
      setError(err);
      console.error('CSV loading error:', err);
      return { success: false, error: err.message };
    }
  };
  
  /**
   * Execute SQL query with performance optimization
   * @param {string} query - SQL query
   * @param {Object} params - Query parameters
   */
  const executeQuery = async (query, params = {}) => {
    try {
      const startTime = performance.now();
      const { connection } = await dbResource();
      
      // Execute the query with parameters
      const result = await connection.query(query, params);
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      // Log slow queries for optimization
      if (executionTime > 50) {
        console.warn(`Slow query detected (${executionTime.toFixed(2)}ms): ${query}`);
      }
      
      return { 
        success: true, 
        data: result, 
        executionTime,
        columns: result.schema.fields.map(f => f.name)
      };
    } catch (err) {
      setError(err);
      console.error('Query execution error:', err);
      return { 
        success: false, 
        error: err.message,
        query
      };
    }
  };
  
  /**
   * Close the database connection and clean up resources
   */
  const close = async () => {
    try {
      if (connectionInstance) {
        await connectionInstance.close();
      }
      if (duckDBInstance) {
        await duckDBInstance.terminate();
        duckDBInstance = null;
        connectionInstance = null;
        initializationPromise = null;
      }
      setStatus('closed');
    } catch (err) {
      console.error('Error closing DuckDB:', err);
    }
  };
  
  // Clean up on component unmount
  onCleanup(() => {
    close();
  });
  
  return {
    status,
    error,
    memoryUsage,
    dbResource,
    loadCSV,
    executeQuery,
    close
  };
};

export default createDuckDBManager;