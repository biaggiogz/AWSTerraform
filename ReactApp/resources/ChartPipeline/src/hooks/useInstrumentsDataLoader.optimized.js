import { useState, useEffect, useMemo } from 'react';
import { processCSVData, getUniqueValues } from '../utils/dataProcessor.optimized';

/**
 * Custom hook to load and process multiple CSV datasets for the Instruments Report
 * @param {Object} filterMappings - Mappings for filter columns
 * @returns {Object} - Processed data and loading state
 */
const useInstrumentsDataLoader = (filterMappings = {}) => {
  const [controlData, setControlData] = useState(null);
  const [detailsData, setDetailsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch both datasets
  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;
    
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load both datasets in parallel
        const [controlResponse, detailsResponse] = await Promise.all([
          fetch('/data/control_inst_by_isos.csv', { signal }),
          fetch('/data/details_inst.csv', { signal })
        ]);
        
        const [controlText, detailsText] = await Promise.all([
          controlResponse.text(),
          detailsResponse.text()
        ]);
        
        setControlData(controlText);
        setDetailsData(detailsText);
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
  }, []);

  // Process control instruments data
  const processedControlData = useMemo(() => {
    if (!controlData) return [];
    return processCSVData(controlData);
  }, [controlData]);

  // Process details instruments data
  const processedDetailsData = useMemo(() => {
    if (!detailsData) return [];
    return processCSVData(detailsData);
  }, [detailsData]);

  // Extract unique values for filters from control data (primary dataset)
  const isometrics = useMemo(() => {
    const isometricColumn = filterMappings.isometric || 'ISOMETRIC';
    return getUniqueValues(processedControlData, isometricColumn);
  }, [processedControlData, filterMappings.isometric]);

  const subsystems = useMemo(() => {
    const subsystemColumn = filterMappings.subsystem || 'SUSSYTEM';
    return getUniqueValues(processedControlData, subsystemColumn);
  }, [processedControlData, filterMappings.subsystem]);

  return {
    controlData: processedControlData,
    detailsData: processedDetailsData,
    loading,
    error,
    isometrics,
    subsystems,
    filterMappings
  };
};

export default useInstrumentsDataLoader;