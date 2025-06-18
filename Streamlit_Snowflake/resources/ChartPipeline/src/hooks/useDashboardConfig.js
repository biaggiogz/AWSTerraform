import { useState, useEffect } from 'react';

/**
 * Custom hook to manage dashboard configuration based on active dashboard
 * @param {string} activeDashboard - The currently active dashboard
 * @returns {Object} - Dashboard configuration including dataset path and filter mappings
 */
const useDashboardConfig = (activeDashboard) => {
  const [config, setConfig] = useState({
    datasetPath: '',
    filterMappings: {
      area: '',
      subsystem: ''
    }
  });

  useEffect(() => {
    // Configure dataset and filter mappings based on active dashboard
    if (activeDashboard === 'TAG_LOOP Metrics') {
      setConfig({
        datasetPath: '/data/test_of_lazos_updated.csv',
        filterMappings: {
          area: 'Area',
          subsystem: 'SUBS_PRE'
        }
      });
    } else {
      // Default configuration for Test Pack Construction Progress
      setConfig({
        datasetPath: '/data/pipelinedata.csv',
        filterMappings: {
          area: 'Design Area',
          subsystem: 'SUBSYSTEM'
        }
      });
    }
  }, [activeDashboard]);

  return config;
};

export default useDashboardConfig;