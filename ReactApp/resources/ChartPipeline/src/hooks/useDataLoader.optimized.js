import { useState, useEffect, useMemo } from 'react';
import { processCSVData, getUniqueValues } from '../utils/dataProcessor.optimized';
import useDuckDB from './useDuckDB3';

/**
 * Custom hook to load and process CSV/Parquet data with memoization
 * @param {string} dataPath - Path to the CSV or Parquet file
 * @param {Object} filterMappings - Mappings for filter columns
 * @returns {Object} - Processed data and loading state
 */
const useDataLoader = (dataPath, filterMappings = {}) => {
  const [rawData, setRawData] = useState(null);
  const [processedData, setProcessedData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const {
    createTableFromParquet,
    executeQuery,
    loading: dbLoading,
    error: dbError,
  } = useDuckDB();
  
  const isParquetFile = dataPath && dataPath.endsWith('.parquet');

  // Fetch and process data
  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;
    
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (isParquetFile) {
          // Handle parquet files with DuckDB
          if (dbLoading || dbError) {
            return;
          }
          
          const response = await fetch(dataPath, { signal });
          if (!response.ok) throw new Error(`Failed to fetch Parquet: ${response.status}`);
          
          const parquetBuffer = await response.arrayBuffer();
          await createTableFromParquet('filter_data', parquetBuffer);
          
          // Get all data for filter processing
          const result = await executeQuery(`
            SELECT *
            FROM filter_data
            WHERE tag_loop_tlp is not null
          `);
          
          setProcessedData(result || []);
        } else {
          // Handle CSV files
          const response = await fetch(dataPath, { signal });
          const csvText = await response.text();
          setRawData(csvText);
        }
        
        setLoading(false);
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message);
          setLoading(false);
        }
      }
    };

    if (dataPath) {
      loadData();
    }
    
    return () => controller.abort();
  }, [dataPath, isParquetFile, createTableFromParquet, executeQuery, dbLoading, dbError]);

  // Process CSV data with memoization
  const csvProcessedData = useMemo(() => {
    if (!rawData || isParquetFile) return [];
    return processCSVData(rawData);
  }, [rawData, isParquetFile]);
  
  // Use appropriate processed data
  const finalProcessedData = isParquetFile ? processedData : csvProcessedData;

  // Extract unique values with memoization using the provided mappings
  const areas = useMemo(() => {
    const areaColumn = filterMappings.area || 'Design Area';
    return getUniqueValues(finalProcessedData, areaColumn);
  }, [finalProcessedData, filterMappings.area]);

  const isometric = useMemo(() => {
    const areaColumn = filterMappings.isometric || 'ISOMETRIC';
    return getUniqueValues(finalProcessedData, areaColumn);
  }, [finalProcessedData, filterMappings.isometric]);

  const subsystems = useMemo(() => {
    const subsystemColumn = filterMappings.subsystem || 'SUBSYSTEM';
    return getUniqueValues(finalProcessedData, subsystemColumn);
  }, [finalProcessedData, filterMappings.subsystem]);

  const testPacks = useMemo(() => {
    // Test Pack column might be different between datasets
    const testPackColumn = finalProcessedData[0] && 'TEST PACK' in finalProcessedData[0] ? 'TEST PACK' : 'TEST LOOP';
    return getUniqueValues(finalProcessedData, testPackColumn);
  }, [finalProcessedData]);

  return {
    data: finalProcessedData,
    loading: loading || dbLoading,
    error: error || dbError,
    areas,
    subsystems,
    testPacks,
    filterMappings
  };
};

export default useDataLoader;