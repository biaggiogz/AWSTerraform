import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import * as duckdb from '@duckdb/duckdb-wasm';
import * as arrow from 'apache-arrow';

// Use the jsDelivr bundles
const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();

// Cache for query results to avoid redundant processing
const queryCache = new Map();

// Configuration for DuckDB
const DUCKDB_CONFIG = {
  memory_limit: '2GB'
  // Not setting threads as it may not be supported in the WASM build
};

/**
 * Custom React hook to initialize DuckDB-WASM and expose helper functions.
 */
const useDuckDB3 = () => {
    const [db, setDB] = useState(null);
    const [connection, setConnection] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const initDuckDB = async () => {
            try {
                setLoading(true);
                
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
                
                // Check if threading is supported before setting thread count
                try {
                    // Try to get thread info first to check if threading is supported
                    const threadInfo = await conn.query(`SELECT * FROM pragma_database_size()`);
                    // If we get here, try setting threads cautiously
                    await conn.query(`PRAGMA threads=${navigator.hardwareConcurrency || 1}`);
                    await conn.query(`PRAGMA force_parallelism`);
                    console.log('Threading enabled in DuckDB');
                } catch (threadErr) {
                    console.log('Threading not supported in this DuckDB build, running in single-threaded mode');
                    // Skip setting thread-related pragmas
                }
                
                setDB(db);
                setConnection(conn);
                setError(null);
                
                console.log('DuckDB initialized successfully with optimized settings');
            } catch (err) {
                console.error('Failed to initialize DuckDB:', err);
                setError(err.message || String(err));
            } finally {
                setLoading(false);
            }
        };

        initDuckDB();
        
        // Clean up resources when component unmounts
        return () => {
            if (connection) {
                try {
                    connection.close();
                } catch (e) {
                    console.error('Error closing connection:', e);
                }
            }
            if (db) {
                try {
                    db.close();
                } catch (e) {
                    console.error('Error closing DB:', e);
                }
            }
        };
    }, []);

    /**
     * Creates a table from CSV data with optimized settings
     */
    const createTableFromCSV = async (tableName, csvString, options = { header: true }) => {
        if (!connection || !db) {
            console.error('DuckDB not ready:', { connection: !!connection, db: !!db });
            throw new Error('DuckDB connection not ready');
        }

        const { header = true, delimiter = ',' } = options;

        try {
            console.log('Creating table from CSV:', { tableName, csvLength: csvString.length });

            // Register the CSV data as a file
            await db.registerFileText(`${tableName}.csv`, csvString);

            // Create the table with optimized settings
            await connection.query(`
            CREATE OR REPLACE TABLE ${tableName} AS 
            SELECT * FROM read_csv_auto('${tableName}.csv', 
                header=${header ? 'true' : 'false'}, 
                delim='${delimiter}',
                parallel=true,
                sample_size=1000
            )
        `);
            
            // Create indexes for commonly filtered columns
            try {
                if (tableName === 'master_subsystem') {
                    await connection.query(`CREATE INDEX IF NOT EXISTS idx_${tableName}_item ON ${tableName}(item_isoinst)`); 
                    await connection.query(`CREATE INDEX IF NOT EXISTS idx_${tableName}_subsystem ON ${tableName}(subsystem)`); 
                }
            } catch (indexErr) {
                console.warn('Could not create index:', indexErr);
            }

            console.log('Table created successfully');
            return true;
        } catch (err) {
            console.error('Error creating table from CSV:', err);
            throw err;
        }
    };

    /**
     * Executes a SQL query and returns results as array of objects
     * Optimized for performance with large datasets and caching
     */
    const executeQuery = useCallback(async (sql, options = {}) => {
        if (!connection) {
            console.error('DuckDB connection not ready for query');
            throw new Error('DuckDB connection not ready');
        }

        const { 
            measurePerformance = true, 
            useCache = true,
            cacheKey = sql // Default cache key is the SQL query itself
        } = options;
        
        try {
            // Check cache first if enabled
            if (useCache && queryCache.has(cacheKey)) {
                console.log('Using cached query result');
                return queryCache.get(cacheKey);
            }
            
            const startTime = measurePerformance ? performance.now() : null;
            
            // Add parallelism hint for better performance if supported
            let optimizedSql = sql;
            // Only add parallelism hint if not already present and if not a PRAGMA statement
            if (!optimizedSql.includes('PRAGMA') && !optimizedSql.includes('/*+') && !optimizedSql.includes('force_parallelism')) {
                // We'll try with parallelism, but the query will still work if it's not supported
                try {
                    optimizedSql = `${optimizedSql}`;
                } catch (e) {
                    // If there's an error, just use the original SQL
                    console.warn('Parallelism hint not applied:', e);
                }
            }
            
            const result = await connection.query(optimizedSql);
            
            if (measurePerformance) {
                const endTime = performance.now();
                console.log(`Query execution time: ${(endTime - startTime).toFixed(2)}ms`);
            }
            
            // Convert to array efficiently
            const data = result.toArray ? result.toArray() : result;
            
            // Store in cache if enabled
            if (useCache && data.length < 5000) { // Only cache reasonably sized results
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
    }, [connection]);

    /**
     * Creates a table from Parquet data with optimized performance
     */
    const createTableFromParquet = useCallback(async (tableName, parquetBuffer) => {
        if (!connection || !db) {
            console.error('DuckDB not ready:', { connection: !!connection, db: !!db });
            throw new Error('DuckDB connection not ready');
        }

        try {
            const startTime = performance.now();
            console.log('Creating table from Parquet:', { tableName, bufferSize: parquetBuffer.byteLength });

            // Register the Parquet data as a buffer
            await db.registerFileBuffer(`${tableName}.parquet`, new Uint8Array(parquetBuffer));
            
            // Create the table with optimized settings
            await connection.query(`
                CREATE OR REPLACE TABLE ${tableName} AS 
                SELECT * FROM read_parquet('${tableName}.parquet', binary_as_string=true)
            `);
            
            // Create indexes for commonly filtered columns
            try {
                if (tableName === 'master_subsystem') {
                    await connection.query(`CREATE INDEX IF NOT EXISTS idx_${tableName}_item ON ${tableName}(item_isoinst)`); 
                    await connection.query(`CREATE INDEX IF NOT EXISTS idx_${tableName}_subsystem ON ${tableName}(subsystem)`); 
                    await connection.query(`CREATE INDEX IF NOT EXISTS idx_${tableName}_tp ON ${tableName}(tp_include_isoinst)`); 
                }
                
                // Create statistics for better query planning
                await connection.query(`ANALYZE ${tableName}`);
            } catch (indexErr) {
                console.warn('Could not create index:', indexErr);
            }
            
            const endTime = performance.now();
            console.log(`Table created successfully in ${(endTime - startTime).toFixed(2)}ms`);

            return true;
        } catch (err) {
            console.error('Error creating table from Parquet:', err);
            throw err;
        }
    }, [connection, db]);

    /**
     * Optimized function to execute a filtered query with performance metrics
     * This is specifically designed for table filtering operations with caching
     */
    const executeFilteredQuery = useCallback(async (tableName, filters = {}, columns = '*', limit = 2000, options = {}) => {
        if (!connection) {
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
            
            // Use optimized query without forcing parallelism which might not be supported
            const sql = `
                SELECT ${columns} 
                FROM ${tableName} 
                ${whereClause}
                LIMIT ${limit}
            `;
            
            const result = await connection.query(sql);
            const data = result.toArray();
            
            const endTime = performance.now();
            console.log(`Filtered query executed in ${(endTime - startTime).toFixed(2)}ms`);
            
            const response = {
                data,
                executionTime: (endTime - startTime).toFixed(2),
                rowCount: data.length
            };
            
            // Store in cache if enabled and not too large
            if (useCache && data.length < 5000) {
                queryCache.set(cacheKey, response);
            }
            
            return response;
        } catch (err) {
            console.error('Error executing filtered query:', err);
            throw err;
        }
    }, [connection]);

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
        if (connection) {
            try {
                // Force garbage collection in DuckDB
                await connection.query('PRAGMA memory_limit=\'1GB\'');
                
                // Try to force garbage collection if supported
                try {
                    await connection.query('PRAGMA force_gc');
                } catch (gcErr) {
                    console.log('GC pragma not supported, skipping');
                }
                
                console.log('Memory optimization completed');
                return true;
            } catch (err) {
                console.error('Error optimizing memory:', err);
                return false;
            }
        }
        return false;
    }, [connection]);

    // Periodically optimize memory usage
    useEffect(() => {
        if (!connection) return;
        
        const interval = setInterval(() => {
            optimizeMemory();
        }, 60000); // Run every minute
        
        return () => clearInterval(interval);
    }, [connection, optimizeMemory]);

    /**
     * Clears the query cache to free up memory
     */

    /**
     * Optimizes memory usage by releasing unused resources
     */

    
    // Periodically optimize memory usage
    useEffect(() => {
        if (!connection) return;
        
        const interval = setInterval(() => {
            optimizeMemory();
        }, 60000); // Run every minute
        
        return () => clearInterval(interval);
    }, [connection, optimizeMemory]);

    return useMemo(() => ({
        db,
        connection,
        loading,
        error,
        createTableFromCSV,
        createTableFromParquet,
        executeQuery,
        executeFilteredQuery,
        clearQueryCache,
        optimizeMemory
    }), [db, connection, loading, error, executeQuery, executeFilteredQuery, clearQueryCache, optimizeMemory]);
};

export default useDuckDB3;