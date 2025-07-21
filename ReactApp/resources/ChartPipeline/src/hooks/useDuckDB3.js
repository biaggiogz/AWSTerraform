import { useState, useEffect, useMemo, useCallback } from 'react';
import * as duckdb from '@duckdb/duckdb-wasm';
import * as arrow from 'apache-arrow';

// Use the jsDelivr bundles
const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();

// Singleton pattern for DuckDB instance
let dbInstance = null;
let dbConnection = null;
let initPromise = null;

// Simple query cache
const queryCache = new Map();

/**
 * High-performance DuckDB hook with WASM optimizations
 */
const useDuckDB3 = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Initialize DuckDB with WASM optimizations
  useEffect(() => {
    const initDB = async () => {
      try {
        // If already initializing, wait for that to complete
        if (initPromise) {
          await initPromise;
          setLoading(false);
          return;
        }
        
        // If already initialized, use existing instance
        if (dbInstance && dbConnection) {
          setLoading(false);
          return;
        }
        
        // Create initialization promise
        initPromise = (async () => {
          // Create a minimal logger to improve performance
          const logger = new duckdb.ConsoleLogger(duckdb.LogLevel.ERROR);
          
          // Select the appropriate WASM bundle
          const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);
          
          // Create a worker URL
          const workerUrl = URL.createObjectURL(
            new Blob([`importScripts("${bundle.mainWorker}");`], { type: 'text/javascript' })
          );
          
          // Create worker and instantiate database
          const worker = new Worker(workerUrl);
          const db = new duckdb.AsyncDuckDB(logger, worker);
          await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
          URL.revokeObjectURL(workerUrl);
          
          // Create connection with optimized settings
          const conn = await db.connect();
          
          // Configure DuckDB for better performance
          await conn.query("PRAGMA memory_limit='2GB'");
          
          // Try to enable threading if supported
          try {
            const threads = navigator.hardwareConcurrency || 4;
            await conn.query(`PRAGMA threads=${threads}`);
            console.log(`DuckDB using ${threads} threads`);
          } catch (e) {
            console.log('Threading not fully supported in this browser');
          }
          
          // Enable WASM SIMD if available
          try {
            await conn.query("PRAGMA enable_optimizer");
            await conn.query("SET enable_progress_bar=false");
            await conn.query("SET enable_profiling=false");
          } catch (e) {
            console.log('Some optimizations not available');
          }
          
          // Store shared instances
          dbInstance = db;
          dbConnection = conn;
          
          return { db, conn };
        })();
        
        await initPromise;
        setLoading(false);
      } catch (err) {
        console.error('DuckDB initialization error:', err);
        setError(err.message || String(err));
        setLoading(false);
      }
    };
    
    initDB();
  }, []);
  
  // Create table from Parquet data
  const createTableFromParquet = useCallback(async (tableName, parquetBuffer) => {
    if (!dbInstance || !dbConnection) {
      throw new Error('DuckDB not initialized');
    }
    
    try {
      // Register the Parquet data
      await dbInstance.registerFileBuffer(`${tableName}.parquet`, new Uint8Array(parquetBuffer));
      
      // Create table with optimized settings
      await dbConnection.query(`
        CREATE OR REPLACE TABLE ${tableName} AS 
        SELECT * FROM read_parquet('${tableName}.parquet', binary_as_string=true)
      `);
      
      // Create indexes for commonly filtered columns
      if (tableName === 'master_subsystem') {
        try {
          await dbConnection.query(`CREATE INDEX IF NOT EXISTS idx_${tableName}_item ON ${tableName}(item_isoinst)`);
          await dbConnection.query(`CREATE INDEX IF NOT EXISTS idx_${tableName}_subsystem ON ${tableName}(subsystem)`);
          await dbConnection.query(`CREATE INDEX IF NOT EXISTS idx_${tableName}_tp ON ${tableName}(tp_include_isoinst)`);
          await dbConnection.query(`CREATE INDEX IF NOT EXISTS idx_${tableName}_mounting ON ${tableName}(mounting_on_isoequipack_isoinst)`);
        } catch (e) {
          console.warn('Could not create all indexes:', e);
        }
      }
      
      return true;
    } catch (err) {
      console.error('Error creating table from Parquet:', err);
      throw err;
    }
  }, []);
  
  // Execute SQL query with caching
  const executeQuery = useCallback(async (sql, options = {}) => {
    if (!dbConnection) {
      throw new Error('DuckDB connection not ready');
    }
    
    const { 
      useCache = true,
      cacheKey = sql,
      maxRows = 2000
    } = options;
    
    try {
      // Check cache first
      if (useCache && queryCache.has(cacheKey)) {
        return queryCache.get(cacheKey);
      }
      
      // Add row limit if not already present
      let optimizedSql = sql;
      if (!optimizedSql.toLowerCase().includes('limit ') && maxRows) {
        optimizedSql = optimizedSql.trim();
        if (optimizedSql.endsWith(';')) {
          optimizedSql = optimizedSql.slice(0, -1);
        }
        optimizedSql = `${optimizedSql} LIMIT ${maxRows};`;
      }
      
      // Execute query with timeout protection
      const queryPromise = dbConnection.query(optimizedSql);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Query timeout after 15s')), 15000)
      );
      
      const result = await Promise.race([queryPromise, timeoutPromise]);
      const data = result.toArray();
      
      // Store in cache
      if (useCache) {
        queryCache.set(cacheKey, data);
        
        // Limit cache size
        if (queryCache.size > 50) {
          const firstKey = queryCache.keys().next().value;
          queryCache.delete(firstKey);
        }
      }
      
      return data;
    } catch (err) {
      console.error('Error executing query:', err);
      throw err;
    }
  }, []);
  
  // Clear query cache
  const clearQueryCache = useCallback(() => {
    queryCache.clear();
  }, []);
  
  // Return the hook API
  return useMemo(() => ({
    db: dbInstance,
    connection: dbConnection,
    loading,
    error,
    createTableFromParquet,
    executeQuery,
    clearQueryCache
  }), [loading, error, createTableFromParquet, executeQuery, clearQueryCache]);
};

export default useDuckDB3;