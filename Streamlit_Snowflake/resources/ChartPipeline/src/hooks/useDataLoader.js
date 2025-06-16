import { useState, useEffect } from 'react';
import { processCSVData, getUniqueValues } from '../utils/dataProcessor';

/**
 * Custom hook to load and process CSV data
 * @param {string} csvPath - Path to the CSV file
 * @returns {Object} - Processed data and loading state
 */
const useDataLoader = (csvPath) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [areas, setAreas] = useState([]);
  const [subsystems, setSubsystems] = useState([]);
  const [testPacks, setTestPacks] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const response = await fetch(csvPath);
        const csvText = await response.text();
        
        // Process the CSV data
        const processedData = processCSVData(csvText);
        setData(processedData);
        
        // Extract unique values for filters
        setAreas(getUniqueValues(processedData, 'Design Area'));
        setSubsystems(getUniqueValues(processedData, 'SUBSYSTEM'));
        setTestPacks(getUniqueValues(processedData, 'TEST PACK'));
        
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    loadData();
  }, [csvPath]);

  return {
    data,
    loading,
    error,
    areas,
    subsystems,
    testPacks
  };
};

export default useDataLoader;