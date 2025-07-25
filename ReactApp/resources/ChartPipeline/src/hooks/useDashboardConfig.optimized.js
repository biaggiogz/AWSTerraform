import { useState, useEffect, useMemo } from 'react';

/**
 * Custom hook to manage dashboard configuration based on active dashboard
 * @param {string} activeDashboard - The currently active dashboard
 * @returns {Object} - Dashboard configuration including dataset path and filter mappings
 */
const useDashboardConfig = (activeDashboard) => {
  // Memoize the dashboard configurations to avoid recreating objects on each render
  const dashboardConfigs = useMemo(() => ({
    'LOOP SIGNAL PROGRESS REPORT': {
      datasetPath: '/data/test_of_lazos_updated.csv',
      filterMappings: {
        area: 'Area',
        subsystem: 'SUBS_PRE'
      }
    },
    'INSULATION PROGRESS REPORT': {
      datasetPath: '/data/aislamientos.csv',
      filterMappings: {
        area: 'Area',
        subsystem: 'SUBSYSTEM'
      }
    },
    'INSTRUMENTS REPORT': {
      datasetPath: '/data/control_inst_by_isos.csv',
      filterMappings: {
        isometric: 'ISOMETRIC',
        subsystem: 'SUBSYSTEM' // Use SUBSYSTEM field
      }
    },
    'TEST PACK PROGRESS': {
      datasetPath: '/data/tp_with_progress.csv',
      filterMappings: {
        area: 'tp_unit_tp',
        subsystem: 'subsystem'
      }
    },
    'SUMMARY SUBSYSTEMS': {
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