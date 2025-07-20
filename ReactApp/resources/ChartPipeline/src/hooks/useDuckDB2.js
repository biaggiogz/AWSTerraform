import { useState, useEffect, useMemo } from 'react';
import {
    AsyncDuckDB,
    selectBundle,
    getJsDelivrBundles,
    ConsoleLogger, // ✅ Correct logger
} from '@duckdb/duckdb-wasm';

/**
 * Custom React hook to initialize DuckDB-WASM and expose helper functions.
 */
const useDuckDB2 = () => {
    const [db, setDB] = useState(null);
    const [connection, setConnection] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const initDuckDB = async () => {
            try {
                setLoading(true);

                const bundles = getJsDelivrBundles();
                const bundle = await selectBundle(bundles);

                // ✅ Use DuckDB’s built-in ConsoleLogger
                const logger = new ConsoleLogger();

                const duckdb = new AsyncDuckDB(bundle.mainModule, bundle.pthreadWorker, logger);
                await duckdb.instantiate();

                const conn = await duckdb.connect();

                setDB(duckdb);
                setConnection(conn);
                setError(null);
            } catch (err) {
                console.error('Failed to initialize DuckDB:', err);
                setError(err);
            } finally {
                setLoading(false);
            }
        };

        initDuckDB();
    }, []);

    const createTableFromCSV = async (tableName, csvString, options = { header: true }) => {
        if (!connection || !db) throw new Error('DuckDB connection not ready');

        const { header, delimiter = ',' } = options;

        try {
            const encoder = new TextEncoder();
            const csvBuffer = encoder.encode(csvString);
            const tempFileName = `temp_${tableName}.csv`;

            await db.registerFileBuffer(tempFileName, csvBuffer);

            await connection.query(`
        CREATE OR REPLACE TABLE ${tableName} AS 
        SELECT * FROM read_csv_auto('${tempFileName}', {
          header: ${header},
          delim: '${delimiter}'
        })
      `);
        } catch (err) {
            console.error('Error creating table from CSV:', err);
            throw err;
        }
    };

    const executeQuery = async (sql) => {
        if (!connection) throw new Error('DuckDB connection not ready');

        const result = await connection.query(sql);
        return result.toArray();
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

export default useDuckDB2;
