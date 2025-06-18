import { useState, useEffect } from 'react';
import { processCSVData, getUniqueValues } from '../utils/dataProcessor';

/**
 * Custom hook to load and process CSV data
 * @param {string} csvPath - Path to the CSV file
 * @param {Object} filterMappings - Mappings for filter columns
 * @returns {Object} - Processed data and loading state
 */
const useDataLoader = (csvPath, filterMappings = {}) => {
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
        
        // Extract unique values for filters using the provided mappings
        const areaColumn = filterMappings.area || 'Design Area';
        const subsystemColumn = filterMappings.subsystem || 'SUBSYSTEM';
        
        setAreas(getUniqueValues(processedData, areaColumn));
        setSubsystems(getUniqueValues(processedData, subsystemColumn));
        
        // Test Pack column might be different between datasets
        const testPackColumn = processedData[0] && 'TEST PACK' in processedData[0] ? 'TEST PACK' : 'TEST LOOP';
        setTestPacks(getUniqueValues(processedData, testPackColumn));
        
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    if (csvPath) {
      loadData();
    }
  }, [csvPath, filterMappings]);

  return {
    data,
    loading,
    error,
    areas,
    subsystems,
    testPacks,
    filterMappings
  };
};

export default useDataLoader;