import { useState, useMemo, useCallback } from 'react';
import { 
  applyMultiValueFilters, 
  createVirtualDataset, 
  extractFilterOptions,
  buildRelationshipMaps
} from '../utils/multiValueFilter';

/**
 * Custom hook to manage multi-value filtering for instruments data
 * 
 * @param {Array} controlData - Control instruments dataset
 * @param {Array} detailsData - Details instruments dataset
 * @param {Object} filterMappings - Mappings for filter fields
 * @returns {Object} - Filter state and handlers
 */
const useInstrumentsFilter = (controlData, detailsData, filterMappings) => {
  // State for multi-value filters
  const [multiFilters, setMultiFilters] = useState({});
  
  // State for progress filter
  const [progressFilter, setProgressFilter] = useState(null);
  
  // Extract filter fields from mappings
  const filterFields = useMemo(() => 
    Object.values(filterMappings || {}), 
    [filterMappings]
  );
  
  // Extract unique values for each filter field from control data (primary dataset)
  const filterOptions = useMemo(() => 
    extractFilterOptions(controlData || [], filterFields),
    [controlData, filterFields]
  );
  
  // Build relationship maps between filter fields from control data
  const relationshipMaps = useMemo(() => 
    buildRelationshipMaps(controlData || [], filterFields),
    [controlData, filterFields]
  );
  
  // Create virtual datasets for both control and details data
  const filteredControlData = useMemo(() => 
    createVirtualDataset(
      controlData || [], 
      multiFilters, 
      { progressFilter }
    ),
    [controlData, multiFilters, progressFilter]
  );
  
  const filteredDetailsData = useMemo(() => {
    if (!detailsData || detailsData.length === 0) return { data: [], metadata: {} };
    
    // Apply the same filters to details data, but map the field names appropriately
    const mappedFilters = {};
    Object.keys(multiFilters).forEach(key => {
      if (key === 'ISOMETRIC') {
        // Map ISOMETRIC to MOUNTING ON ISO/EQUI/PACK in details data
        mappedFilters['MOUNTING ON ISO/EQUI/PACK'] = multiFilters[key];
      } else if (key === 'SUSSYTEM' || key === 'SUBSYSTEM') {
        // Map to SUBSYSTEM in details data
        mappedFilters['SUBSYSTEM'] = multiFilters[key];
      } else {
        mappedFilters[key] = multiFilters[key];
      }
    });
    
    return createVirtualDataset(
      detailsData, 
      mappedFilters, 
      { progressFilter }
    );
  }, [detailsData, multiFilters, progressFilter]);
  
  // Handler for updating multi-value filters
  const handleFilterChange = useCallback((filterName, values) => {
    const filterKey = filterMappings[filterName] || filterName;
    
    setMultiFilters(prev => ({
      ...prev,
      [filterKey]: values
    }));
  }, [filterMappings]);
  
  // Handler for updating progress filter
  const handleProgressFilter = useCallback((filterType) => {
    setProgressFilter(prev => prev === filterType ? null : filterType);
  }, []);
  
  // Handler for resetting all filters
  const resetAllFilters = useCallback(() => {
    setMultiFilters({});
    setProgressFilter(null);
  }, []);
  
  return {
    // Data
    filteredControlData: filteredControlData.data,
    filteredDetailsData: filteredDetailsData.data,
    controlMetadata: filteredControlData.metadata,
    detailsMetadata: filteredDetailsData.metadata,
    filterOptions,
    relationshipMaps,
    
    // State
    multiFilters,
    progressFilter,
    
    // Handlers
    handleFilterChange,
    handleProgressFilter,
    resetAllFilters
  };
};

export default useInstrumentsFilter;