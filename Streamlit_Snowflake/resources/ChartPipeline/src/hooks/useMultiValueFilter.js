import { useState, useMemo, useCallback } from 'react';
import { 
  applyMultiValueFilters, 
  createVirtualDataset, 
  extractFilterOptions,
  buildRelationshipMaps
} from '../utils/multiValueFilter';

/**
 * Custom hook to manage multi-value filtering
 * 
 * @param {Array} rawData - Original unfiltered dataset
 * @param {Object} filterMappings - Mappings for filter fields (e.g., {area: 'Area', subsystem: 'SUBS_PRE'})
 * @returns {Object} - Filter state and handlers
 */
const useMultiValueFilter = (rawData, filterMappings) => {
  // State for multi-value filters
  const [multiFilters, setMultiFilters] = useState({});
  
  // State for progress filter
  const [progressFilter, setProgressFilter] = useState(null);
  
  // Extract filter fields from mappings
  const filterFields = useMemo(() => 
    Object.values(filterMappings || {}), 
    [filterMappings]
  );
  
  // Extract unique values for each filter field
  const filterOptions = useMemo(() => 
    extractFilterOptions(rawData || [], filterFields),
    [rawData, filterFields]
  );
  
  // Build relationship maps between filter fields
  const relationshipMaps = useMemo(() => 
    buildRelationshipMaps(rawData || [], filterFields),
    [rawData, filterFields]
  );
  
  // Create virtual dataset based on filters
  const virtualDataset = useMemo(() => 
    createVirtualDataset(
      rawData || [], 
      multiFilters, 
      { progressFilter }
    ),
    [rawData, multiFilters, progressFilter]
  );
  
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
    filteredData: virtualDataset.data,
    metadata: virtualDataset.metadata,
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

export default useMultiValueFilter;