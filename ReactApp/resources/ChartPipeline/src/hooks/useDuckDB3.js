import { useState, useEffect, useMemo } from 'react';
import * as duckdb from '@duckdb/duckdb-wasm';

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
     */
    const executeQuery = async (sql) => {
        if (!connection) {
            console.error('DuckDB connection not ready for query');
            throw new Error('DuckDB connection not ready');
        }

        try {
            console.log('Executing query:', sql);
            const result = await connection.query(sql);
            console.log('Query executed successfully');
            return result.toArray ? result.toArray() : result;
        } catch (err) {
            console.error('Error executing query:', err);
            throw err;
        }
    };

    return useMemo(() => ({
        db,
        connection,
        loading,
        error,
        createTableFromCSV,
        executeQuery,
    }), [db, connection, loading, error]);
};

export default useDuckDB3;