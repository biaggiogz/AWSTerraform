import { useState, useEffect, useMemo } from 'react';

/**
 * Custom hook to manage dashboard configuration based on active dashboard
 * @param {string} activeDashboard - The currently active dashboard
 * @returns {Object} - Dashboard configuration including dataset path and filter mappings
 */
const useDashboardConfig = (activeDashboard) => {
  // Memoize the dashboard configurations to avoid recreating objects on each render
  const dashboardConfigs = useMemo(() => ({
    'LOOP TESTING PROGRESS REPORT': {
      datasetPath: '/data/test_of_lazos_updated.csv',
      filterMappings: {
        area: 'Area',
        subsystem: 'SUBS_PRE'
      }
    },
    'ISOLATION PROGRESS MONITORING': {
      datasetPath: '/data/aislamientos.csv',
      filterMappings: {
        area: 'SUBSYTEM',
        subsystem: 'SUBSYTEM'
      }
    },
    'Test Pack Progress': {
      datasetPath: '/data/pipelinedata.csv',
      filterMappings: {
        area: 'Design Area',
        subsystem: 'SUBSYSTEM'
      }
    },
    'DEFAULT': {
      datasetPath: '/data/pipelinedata.csv',
      filterMappings: {
        area: 'Design Area',
        subsystem: 'SUBSYSTEM'
      }
    }
  }), []);

  // Use memoized config based on active dashboard
  const [config, setConfig] = useState(dashboardConfigs['DEFAULT']);

  // Only update config when activeDashboard changes
  useEffect(() => {
    // Use the pre-defined config or default if not found
    const newConfig = dashboardConfigs[activeDashboard] || dashboardConfigs['DEFAULT'];
    setConfig(newConfig);
  }, [activeDashboard, dashboardConfigs]);

  return config;
};

export default useDashboardConfig;