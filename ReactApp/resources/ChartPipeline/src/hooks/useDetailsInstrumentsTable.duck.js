import { useState, useEffect, useMemo } from 'react';
import { initializeDuckDB, createDuckDBTable, queryDuckDB } from '../utils/duckdb-processor';

/**
 * Custom hook for DuckDB-powered DetailsInstrumentsTable
 * Provides high-performance SQL-based filtering and data processing
 * 
 * @param {Array} data - Raw data from master_subsystem.csv
 * @param {Object} filters - Filter criteria
 * @returns {Object} - Processed data and table operations
 */
const useDetailsInstrumentsTable = (data, filters = {}) => {
  const [duckDB, setDuckDB] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processedData, setProcessedData] = useState([]);
  const [tableInfo, setTableInfo] = useState({
    totalRows: 0,
    filteredRows: 0,
    columns: []
  });

  // Initialize DuckDB
  useEffect(() => {
    const initialize = async () => {
      try {
        setLoading(true);
        const db = await initializeDuckDB();
        setDuckDB(db);
        setLoading(false);
      } catch (err) {
        console.error('Failed to initialize DuckDB:', err);
        setError('Failed to initialize DuckDB. Using fallback processing.');
        setLoading(false);
      }
    };

    initialize();
  }, []);

  // Create table when data changes
  useEffect(() => {
    if (!duckDB || !data || data.length === 0) return;

    const createTable = async () => {
      try {
        await createDuckDBTable(duckDB, 'instruments_details', data);
        
        // Get initial table info
        const result = await queryDuckDB(duckDB, `
          SELECT 
            COUNT(*) as total,
            COUNT(CASE WHEN pid_isoinst IS NOT NULL THEN 1 END) as valid
          FROM instruments_details
        `);
        
        if (result && result.length > 0) {
          setTableInfo(prev => ({
            ...prev,
            totalRows: result[0].total,
            filteredRows: result[0].valid
          }));
        }
        
        // Get column info
        const columnsResult = await queryDuckDB(duckDB, `
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'instruments_details'
          ORDER BY ordinal_position
        `);
        
        if (columnsResult && columnsResult.length > 0) {
          setTableInfo(prev => ({
            ...prev,
            columns: columnsResult.map(row => row.column_name)
          }));
        }
      } catch (err) {
        console.error('Failed to create DuckDB table:', err);
        setError('Failed to create DuckDB table. Using fallback processing.');
      }
    };

    createTable();
  }, [duckDB, data]);

  // Process data with filters
  useEffect(() => {
    if (!duckDB || !data || data.length === 0) return;

    const processData = async () => {
      try {
        // Build WHERE clause from filters
        const whereConditions = [];
        
        if (filters.isometric) {
          whereConditions.push(`mounting_on_isoequipack_isoinst = '${filters.isometric}'`);
        }
        
        if (filters.subsystem) {
          whereConditions.push(`subsystem = '${filters.subsystem}'`);
        }
        
        if (filters.testPack) {
          // Handle pipe-separated values
          whereConditions.push(`tp_isoinst LIKE '%${filters.testPack}%'`);
        }
        
        // Always filter out null P&ID values
        whereConditions.push('pid_isoinst IS NOT NULL');
        
        const whereClause = whereConditions.length > 0 
          ? `WHERE ${whereConditions.join(' AND ')}` 
          : 'WHERE pid_isoinst IS NOT NULL';
        
        // Execute query
        const query = `
          SELECT 
            item_isoinst,
            tag_inst_e3d_isoinst,
            tag_inst_isoinst,
            pid_isoinst,
            instrument_type_isoinst,
            subsystem,
            tp_include_isoinst,
            tp_isoinst,
            progress_tp_isoinst,
            hito_isoinst,
            teiga_reinstatement_isoinst,
            teiga_insulation_isoinst,
            siemsa_isoinst,
            ten_isoinst,
            mounting_on_isoequipack_isoinst,
            on_isoinst,
            scope__by_isoinst,
            teigatmi_isoinst,
            installed_teigatmi_isoinst,
            siemsa1_isoinst,
            installed_isoinst,
            wired_isoinst,
            connected_isoinst,
            cable_test_isoinst,
            qcf_isoinst,
            ok100_isoinst,
            with__without_signal_isoinst,
            warehouse_code_isoinst,
            delivery_isoinst,
            date_isoinst,
            vendor_isoinst,
            comments_isoinst
          FROM instruments_details
          ${whereClause}
          ORDER BY item_isoinst
        `;
        
        const result = await queryDuckDB(duckDB, query);
        
        if (result) {
          setProcessedData(result);
          setTableInfo(prev => ({
            ...prev,
            filteredRows: result.length
          }));
        }
      } catch (err) {
        console.error('Failed to process data with DuckDB:', err);
        setError('Failed to process data with DuckDB. Using fallback processing.');
        
        // Fallback to JS filtering
        const filteredData = data.filter(row => {
          if (!row.pid_isoinst) return false;
          
          if (filters.isometric && row.mounting_on_isoequipack_isoinst !== filters.isometric) {
            return false;
          }
          
          if (filters.subsystem && row.subsystem !== filters.subsystem) {
            return false;
          }
          
          if (filters.testPack && !row.tp_isoinst?.includes(filters.testPack)) {
            return false;
          }
          
          return true;
        });
        
        setProcessedData(filteredData);
        setTableInfo(prev => ({
          ...prev,
          filteredRows: filteredData.length
        }));
      }
    };

    processData();
  }, [duckDB, data, filters]);

  // Execute custom SQL query
  const executeQuery = async (sql) => {
    if (!duckDB) {
      setError('DuckDB not initialized');
      return null;
    }
    
    try {
      return await queryDuckDB(duckDB, sql);
    } catch (err) {
      console.error('Failed to execute SQL query:', err);
      setError(`Failed to execute SQL query: ${err.message}`);
      return null;
    }
  };

  return {
    data: processedData,
    loading,
    error,
    tableInfo,
    executeQuery
  };
};

export default useDetailsInstrumentsTable;