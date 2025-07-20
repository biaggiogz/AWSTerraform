import { useState, useEffect, useMemo, useCallback } from 'react';
import * as duckdb from '@duckdb/duckdb-wasm';
import * as arrow from 'apache-arrow';

// Use the jsDelivr bundles
const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();

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
                
                // Create a logger
                const logger = new duckdb.ConsoleLogger();
                
                // Select a bundle based on browser checks
                const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);
                
                // Create a URL for the worker
                const worker_url = URL.createObjectURL(
                    new Blob([`importScripts("${bundle.mainWorker}");`], {type: 'text/javascript'})
                );
                
                // Create a worker and instantiate the database
                const worker = new Worker(worker_url);
                const db = new duckdb.AsyncDuckDB(logger, worker);
                await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
                URL.revokeObjectURL(worker_url);
                
                // Create a connection
                const conn = await db.connect();
                
                setDB(db);
                setConnection(conn);
                setError(null);
                
                console.log('DuckDB initialized successfully');
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
     * Creates a table from CSV data
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

            // Create the table from the registered file
            // Fix: Use named parameters instead of struct syntax
            await connection.query(`
            CREATE OR REPLACE TABLE ${tableName} AS 
            SELECT * FROM read_csv_auto('${tableName}.csv', 
                header=${header ? 'true' : 'false'}, 
                delim='${delimiter}'
            )
        `);

            console.log('Table created successfully');
            return true;
        } catch (err) {
            console.error('Error creating table from CSV:', err);
            throw err;
        }
    };

    /**
     * Executes a SQL query and returns results as array of objects
     * Optimized for performance with large datasets
     */
    const executeQuery = useCallback(async (sql, options = {}) => {
        if (!connection) {
            console.error('DuckDB connection not ready for query');
            throw new Error('DuckDB connection not ready');
        }

        const { measurePerformance = true, batchSize = 500 } = options;
        
        try {
            const startTime = measurePerformance ? performance.now() : null;
            console.log('Executing query:', sql);
            
            // For large result sets, we can use streaming to improve performance
            const result = await connection.query(sql);
            
            if (measurePerformance) {
                const endTime = performance.now();
                console.log(`Query execution time: ${(endTime - startTime).toFixed(2)}ms`);
            }
            
            // Convert to array efficiently
            const data = result.toArray ? result.toArray() : result;
            
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
            console.log('Registering Parquet buffer...');
            await db.registerFileBuffer(`${tableName}.parquet`, new Uint8Array(parquetBuffer));
            console.log('Parquet buffer registered successfully');

            // Create the table from the registered file with optimized settings
            // Use CREATE TABLE AS instead of SELECT * to improve performance
            console.log('Creating table from Parquet file...');
            await connection.query(`
                CREATE OR REPLACE TABLE ${tableName} AS 
                SELECT * FROM read_parquet('${tableName}.parquet')
            `);
            
            // Create indexes for commonly filtered columns to improve query performance
            // This significantly speeds up filtering operations
            try {
                // Create indexes on columns that will be frequently filtered
                await connection.query(`CREATE INDEX IF NOT EXISTS idx_${tableName}_item ON ${tableName}(item_isoinst)`);
                console.log('Created index on item_isoinst column');
            } catch (indexErr) {
                // Index creation is optional, so we'll just log errors
                console.warn('Could not create index:', indexErr);
            }
            
            // Get table statistics
            const tableInfo = await connection.query(`DESCRIBE ${tableName}`);
            const countResult = await connection.query(`SELECT COUNT(*) as count FROM ${tableName}`);
            
            const endTime = performance.now();
            console.log(`Table created successfully with ${tableInfo.length} columns`);
            console.log(`Loaded ${countResult.get(0).count} rows from Parquet file`);
            console.log(`Total table creation time: ${(endTime - startTime).toFixed(2)}ms`);

            return true;
        } catch (err) {
            console.error('Error creating table from Parquet:', err);
            throw err;
        }
    }, [connection, db]);

    /**
     * Optimized function to execute a filtered query with performance metrics
     * This is specifically designed for table filtering operations
     */
    const executeFilteredQuery = useCallback(async (tableName, filters = {}, columns = '*', limit = 2000) => {
        if (!connection) {
            throw new Error('DuckDB connection not ready');
        }
        
        const startTime = performance.now();
        
        try {
            // Build WHERE clause from filters
            const whereConditions = [];
            Object.entries(filters).forEach(([column, value]) => {
                if (value && value.trim() !== '') {
                    // Use ILIKE for case-insensitive matching
                    whereConditions.push(`${column} ILIKE '%${value}%'`);
                }
            });
            
            const whereClause = whereConditions.length > 0 
                ? `WHERE ${whereConditions.join(' AND ')}` 
                : '';
            
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
            console.log(`Returned ${data.length} rows`);
            
            return {
                data,
                executionTime: (endTime - startTime).toFixed(2),
                rowCount: data.length
            };
        } catch (err) {
            console.error('Error executing filtered query:', err);
            throw err;
        }
    }, [connection]);

    return useMemo(() => ({
        db,
        connection,
        loading,
        error,
        createTableFromCSV,
        createTableFromParquet,
        executeQuery,
        executeFilteredQuery,
    }), [db, connection, loading, error, executeQuery, executeFilteredQuery]);
};

export default useDuckDB3;