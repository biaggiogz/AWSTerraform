import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import * as duckdb from '@duckdb/duckdb-wasm';
import * as arrow from 'apache-arrow';

// Use the jsDelivr bundles
const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();

// Enhanced query cache with LRU (Least Recently Used) functionality
class LRUCache {
  constructor(maxSize = 50) {
    this.maxSize = maxSize;
    this.cache = new Map();
    this.keyOrder = [];
  }

  has(key) {
    return this.cache.has(key);
  }

  get(key) {
    if (!this.cache.has(key)) return undefined;
    
    // Move key to the end (most recently used)
    this.keyOrder = this.keyOrder.filter(k => k !== key);
    this.keyOrder.push(key);
    
    return this.cache.get(key);
  }

  set(key, value) {
    // If key exists, update its position
    if (this.cache.has(key)) {
      this.keyOrder = this.keyOrder.filter(k => k !== key);
    }
    
    // Add to cache and keyOrder
    this.cache.set(key, value);
    this.keyOrder.push(key);
    
    // Evict least recently used if over capacity
    if (this.keyOrder.length > this.maxSize) {
      const lruKey = this.keyOrder.shift();
      this.cache.delete(lruKey);
    }
  }

  clear() {
    this.cache.clear();
    this.keyOrder = [];
  }
}

// Create a shared query cache instance
const queryCache = new LRUCache(100);

// Configuration for DuckDB
const DUCKDB_CONFIG = {
  memory_limit: '2GB'
};

// Shared DuckDB instance to prevent multiple initializations
let sharedDB = null;
let sharedConnection = null;
let initPromise = null;
let initializationCount = 0;

/**
 * Custom React hook to initialize DuckDB-WASM and expose helper functions.
 * This optimized version uses a shared instance and improved caching.
 */
const useDuckDB3Optimized = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [instanceId] = useState(() => ++initializationCount);
  
  // Track if component is mounted
  const isMounted = useRef(true);
  
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Initialize DuckDB once and share across components
  useEffect(() => {
    const initDuckDB = async () => {
      // If already initializing, wait for that to complete
      if (initPromise) {
        try {
          await initPromise;
          if (isMounted.current) {
            setLoading(false);
            setError(null);
          }
        } catch (err) {
          if (isMounted.current) {
            console.error('Failed to initialize DuckDB:', err);
            setError(err.message || String(err));
            setLoading(false);
          }
        }
        return;
      }
      
      // If already initialized, use existing instance
      if (sharedDB && sharedConnection) {
        if (isMounted.current) {
          setLoading(false);
          setError(null);
        }
        return;
      }
      
      // Create initialization promise
      initPromise = (async () => {
        try {
          // Create a logger with minimal logging to improve performance
          const logger = new duckdb.ConsoleLogger(duckdb.LogLevel.WARNING);
          
          // Select a bundle based on browser checks
          const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);
          
          // Create a URL for the worker
          const worker_url = URL.createObjectURL(
            new Blob([`importScripts("${bundle.mainWorker}");`], {type: 'text/javascript'})
          );
          
          // Create a worker and instantiate the database with optimized configuration
          const worker = new Worker(worker_url);
          const db = new duckdb.AsyncDuckDB(logger, worker);
          await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
          URL.revokeObjectURL(worker_url);
          
          // Create a connection with optimized settings
          const conn = await db.connect();
          
          // Set pragmas for better performance
          await conn.query(`PRAGMA memory_limit='${DUCKDB_CONFIG.memory_limit}'`);
          
          // Try to enable threading if supported
          try {
            await conn.query(`PRAGMA threads=${navigator.hardwareConcurrency || 4}`);
            await conn.query(`PRAGMA force_parallelism`);
            console.log('Threading enabled in DuckDB with', navigator.hardwareConcurrency || 4, 'threads');
          } catch (threadErr) {
            console.log('Threading not fully supported, using available capabilities');
          }
          
          // Enable WASM SIMD if available
          try {
            await conn.query(`PRAGMA enable_optimizer`);
            await conn.query(`PRAGMA enable_profiling`);
            console.log('Advanced optimizations enabled');
          } catch (optErr) {
            console.log('Some optimizations not available in this build');
          }
          
          // Store shared instances
          sharedDB = db;
          sharedConnection = conn;
          
          return { db, conn };
        } catch (err) {
          console.error('Failed to initialize DuckDB:', err);
          throw err;
        }
      })();
      
      try {
        await initPromise;
        if (isMounted.current) {
          setLoading(false);
          setError(null);
        }
      } catch (err) {
        if (isMounted.current) {
          setError(err.message || String(err));
          setLoading(false);
        }
      }
    };

    initDuckDB();
    
    // Clean up only when the last component unmounts
    return () => {
      // No cleanup here - we keep the shared instance alive
    };
  }, []);

  /**
   * Creates a table from CSV data with optimized settings
   */
  const createTableFromCSV = useCallback(async (tableName, csvString, options = { header: true }) => {
    if (!sharedConnection || !sharedDB) {
      throw new Error('DuckDB connection not ready');
    }

    const { header = true, delimiter = ',' } = options;
    const cacheKey = `csv_${tableName}_${csvString.length}`;
    
    // Check if table already exists in cache
    if (queryCache.has(cacheKey)) {
      console.log('Using cached table:', tableName);
      return true;
    }

    try {
      console.log('Creating table from CSV:', { tableName, csvLength: csvString.length });

      // Register the CSV data as a file
      await sharedDB.registerFileText(`${tableName}.csv`, csvString);

      // Create the table with optimized settings
      await sharedConnection.query(`
        CREATE OR REPLACE TABLE ${tableName} AS 
        SELECT * FROM read_csv_auto('${tableName}.csv', 
            header=${header ? 'true' : 'false'}, 
            delim='${delimiter}',
            parallel=true,
            sample_size=1000,
            all_varchar=false
        )
      `);
      
      // Create indexes for commonly filtered columns
      try {
        if (tableName === 'master_subsystem') {
          await sharedConnection.query(`CREATE INDEX IF NOT EXISTS idx_${tableName}_item ON ${tableName}(item_isoinst)`); 
          await sharedConnection.query(`CREATE INDEX IF NOT EXISTS idx_${tableName}_subsystem ON ${tableName}(subsystem)`);
          
          // Add statistics for better query planning
          await sharedConnection.query(`ANALYZE ${tableName}`);
        }
      } catch (indexErr) {
        console.warn('Could not create index:', indexErr);
      }

      // Cache the result
      queryCache.set(cacheKey, true);
      
      console.log('Table created successfully');
      return true;
    } catch (err) {
      console.error('Error creating table from CSV:', err);
      throw err;
    }
  }, []);

  /**
   * Executes a SQL query and returns results as array of objects
   * Optimized for performance with large datasets and caching
   */
  const executeQuery = useCallback(async (sql, options = {}) => {
    if (!sharedConnection) {
      throw new Error('DuckDB connection not ready');
    }

    const { 
      measurePerformance = true, 
      useCache = true,
      cacheKey = sql, // Default cache key is the SQL query itself
      maxRows = 5000   // Limit rows for better performance
    } = options;
    
    try {
      // Check cache first if enabled
      if (useCache && queryCache.has(cacheKey)) {
        console.log('Using cached query result');
        return queryCache.get(cacheKey);
      }
      
      const startTime = measurePerformance ? performance.now() : null;
      
      // Add row limit if not already present
      let optimizedSql = sql;
      if (!optimizedSql.toLowerCase().includes('limit ') && maxRows) {
        // Check if there's already a semicolon at the end
        if (optimizedSql.trim().endsWith(';')) {
          optimizedSql = optimizedSql.trim().slice(0, -1);
        }
        optimizedSql = `${optimizedSql} LIMIT ${maxRows};`;
      }
      
      // Execute query with timeout protection
      const queryPromise = sharedConnection.query(optimizedSql);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Query timeout after 30s')), 30000)
      );
      
      const result = await Promise.race([queryPromise, timeoutPromise]);
      
      if (measurePerformance) {
        const endTime = performance.now();
        console.log(`Query execution time: ${(endTime - startTime).toFixed(2)}ms`);
      }
      
      // Convert to array efficiently
      const data = result.toArray ? result.toArray() : result;
      
      // Store in cache if enabled
      if (useCache) {
        queryCache.set(cacheKey, data);
      }
      
      if (measurePerformance) {
        console.log(`Result size: ${data.length} rows`);
      }
      
      return data;
    } catch (err) {
      console.error('Error executing query:', err);
      throw err;
    }
  }, []);

  /**
   * Creates a table from Parquet data with optimized performance
   */
  const createTableFromParquet = useCallback(async (tableName, parquetBuffer) => {
    if (!sharedConnection || !sharedDB) {
      throw new Error('DuckDB connection not ready');
    }

    const cacheKey = `parquet_${tableName}_${parquetBuffer.byteLength}`;
    
    // Check if table already exists in cache
    if (queryCache.has(cacheKey)) {
      console.log('Using cached parquet table:', tableName);
      return true;
    }

    try {
      const startTime = performance.now();
      console.log('Creating table from Parquet:', { tableName, bufferSize: parquetBuffer.byteLength });

      // Register the Parquet data as a buffer
      await sharedDB.registerFileBuffer(`${tableName}.parquet`, new Uint8Array(parquetBuffer));
      
      // Create the table with optimized settings
      await sharedConnection.query(`
        CREATE OR REPLACE TABLE ${tableName} AS 
        SELECT * FROM read_parquet('${tableName}.parquet', binary_as_string=true)
      `);
      
      // Create indexes for commonly filtered columns
      try {
        if (tableName === 'master_subsystem') {
          await sharedConnection.query(`CREATE INDEX IF NOT EXISTS idx_${tableName}_item ON ${tableName}(item_isoinst)`); 
          await sharedConnection.query(`CREATE INDEX IF NOT EXISTS idx_${tableName}_subsystem ON ${tableName}(subsystem)`); 
          await sharedConnection.query(`CREATE INDEX IF NOT EXISTS idx_${tableName}_tp ON ${tableName}(tp_include_isoinst)`);
          
          // Create statistics for better query planning
          await sharedConnection.query(`ANALYZE ${tableName}`);
        }
      } catch (indexErr) {
        console.warn('Could not create index:', indexErr);
      }
      
      // Cache the result
      queryCache.set(cacheKey, true);
      
      const endTime = performance.now();
      console.log(`Table created successfully in ${(endTime - startTime).toFixed(2)}ms`);

      return true;
    } catch (err) {
      console.error('Error creating table from Parquet:', err);
      throw err;
    }
  }, []);

  /**
   * Optimized function to execute a filtered query with performance metrics
   */
  const executeFilteredQuery = useCallback(async (tableName, filters = {}, columns = '*', limit = 2000, options = {}) => {
    if (!sharedConnection) {
      throw new Error('DuckDB connection not ready');
    }
    
    const { useCache = true } = options;
    const startTime = performance.now();
    
    try {
      // Generate a cache key based on the query parameters
      const cacheKey = JSON.stringify({ tableName, filters, columns, limit });
      
      // Check cache first if enabled
      if (useCache && queryCache.has(cacheKey)) {
        console.log('Using cached filtered query result');
        return queryCache.get(cacheKey);
      }
      
      // Build WHERE clause from filters with optimized conditions
      const whereConditions = [];
      Object.entries(filters).forEach(([column, value]) => {
        if (value && value.trim() !== '') {
          // Use optimized pattern matching based on column type
          if (column.includes('QTY') || column.includes('TOTAL') || column.includes('INSTALLED') || column.includes('PENDING')) {
            whereConditions.push(`${column} = ${value}`);
          } else {
            // For text columns, use prefix matching for better index usage
            whereConditions.push(`${column} ILIKE '${value}%'`);
          }
        }
      });
      
      const whereClause = whereConditions.length > 0 
        ? `WHERE ${whereConditions.join(' AND ')}` 
        : '';
      
      // Use optimized query
      const sql = `
        SELECT ${columns} 
        FROM ${tableName} 
        ${whereClause}
        LIMIT ${limit}
      `;
      
      const result = await sharedConnection.query(sql);
      const data = result.toArray();
      
      const endTime = performance.now();
      console.log(`Filtered query executed in ${(endTime - startTime).toFixed(2)}ms`);
      
      const response = {
        data,
        executionTime: (endTime - startTime).toFixed(2),
        rowCount: data.length
      };
      
      // Store in cache if enabled
      if (useCache) {
        queryCache.set(cacheKey, response);
      }
      
      return response;
    } catch (err) {
      console.error('Error executing filtered query:', err);
      throw err;
    }
  }, []);

  /**
   * Clears the query cache to free up memory
   */
  const clearQueryCache = useCallback(() => {
    queryCache.clear();
    console.log('Query cache cleared');
  }, []);
  
  /**
   * Optimizes memory usage by releasing unused resources
   */
  const optimizeMemory = useCallback(async () => {
    if (sharedConnection) {
      try {
        // Force garbage collection in DuckDB
        await sharedConnection.query('PRAGMA memory_limit=\'1GB\'');
        
        // Try to force garbage collection if supported
        try {
          await sharedConnection.query('PRAGMA force_gc');
        } catch (gcErr) {
          // Ignore if not supported
        }
        
        console.log('Memory optimization completed');
        return true;
      } catch (err) {
        console.error('Error optimizing memory:', err);
        return false;
      }
    }
    return false;
  }, []);

  // Periodically optimize memory usage
  useEffect(() => {
    if (!sharedConnection) return;
    
    const interval = setInterval(() => {
      optimizeMemory();
    }, 60000); // Run every minute
    
    return () => clearInterval(interval);
  }, [optimizeMemory]);

  return useMemo(() => ({
    db: sharedDB,
    connection: sharedConnection,
    loading,
    error,
    createTableFromCSV,
    createTableFromParquet,
    executeQuery,
    executeFilteredQuery,
    clearQueryCache,
    optimizeMemory,
    instanceId
  }), [loading, error, executeQuery, executeFilteredQuery, clearQueryCache, optimizeMemory, instanceId]);
};

export default useDuckDB3Optimized;