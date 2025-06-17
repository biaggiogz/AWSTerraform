import { useState, useEffect, useMemo } from 'react';
import { processCSVData, getUniqueValues } from '../utils/dataProcessor';

/**
 * Custom hook to load and process CSV data with memoization
 * @param {string} csvPath - Path to the CSV file
 * @returns {Object} - Processed data and loading state
 */
const useDataLoader = (csvPath) => {
  const [rawData, setRawData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch data only once
  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;
    
    const loadData = async () => {
      try {
        setLoading(true);
        const response = await fetch(csvPath, { signal });
        const csvText = await response.text();
        setRawData(csvText);
        setLoading(false);
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message);
          setLoading(false);
        }
      }
    };

    loadData();
    
    // Cleanup function to abort fetch if component unmounts
    return () => controller.abort();
  }, [csvPath]);

  // Process data with memoization to avoid unnecessary recalculations
  const processedData = useMemo(() => {
    if (!rawData) return [];
    return processCSVData(rawData);
  }, [rawData]);

  // Extract unique values with memoization
  const areas = useMemo(() => {
    return getUniqueValues(processedData, 'Design Area');
  }, [processedData]);

  const subsystems = useMemo(() => {
    return getUniqueValues(processedData, 'SUBSYSTEM');
  }, [processedData]);

  const testPacks = useMemo(() => {
    return getUniqueValues(processedData, 'TEST PACK');
  }, [processedData]);

  return {
    data: processedData,
    loading,
    error,
    areas,
    subsystems,
    testPacks
  };
};

export default useDataLoader;