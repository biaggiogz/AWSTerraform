import { useState, useEffect, useMemo } from 'react';
import { processCSVData, getUniqueValues } from '../utils/dataProcessor.optimized';

/**
 * Custom hook to load and process CSV data with memoization
 * @param {string} csvPath - Path to the CSV file
 * @param {Object} filterMappings - Mappings for filter columns
 * @returns {Object} - Processed data and loading state
 */
const useDataLoader = (csvPath, filterMappings = {}) => {
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

    if (csvPath) {
      loadData();
    }
    
    // Cleanup function to abort fetch if component unmounts
    return () => controller.abort();
  }, [csvPath]);

  // Process data with memoization to avoid unnecessary recalculations
  const processedData = useMemo(() => {
    if (!rawData) return [];
    return processCSVData(rawData);
  }, [rawData]);

  // Extract unique values with memoization using the provided mappings
  const areas = useMemo(() => {
    const areaColumn = filterMappings.area || 'Design Area';
    return getUniqueValues(processedData, areaColumn);
  }, [processedData, filterMappings.area]);

  const subsystems = useMemo(() => {
    const subsystemColumn = filterMappings.subsystem || 'SUBSYSTEM';
    return getUniqueValues(processedData, subsystemColumn);
  }, [processedData, filterMappings.subsystem]);

  const testPacks = useMemo(() => {
    // Test Pack column might be different between datasets
    const testPackColumn = processedData[0] && 'TEST PACK' in processedData[0] ? 'TEST PACK' : 'TEST LOOP';
    return getUniqueValues(processedData, testPackColumn);
  }, [processedData]);

  return {
    data: processedData,
    loading,
    error,
    areas,
    subsystems,
    testPacks,
    filterMappings
  };
};

export default useDataLoader;