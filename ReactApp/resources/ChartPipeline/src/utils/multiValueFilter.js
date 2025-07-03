/**
 * Utility functions for multi-value filtering
 */

/**
 * Filter data based on multi-value filters using OR logic within each filter type
 * and AND logic between different filter types
 * 
 * @param {Array} data - Raw dataset to filter
 * @param {Object} multiFilters - Object with filter keys and arrays of selected values
 * @returns {Array} - Filtered dataset
 */
export const applyMultiValueFilters = (data, multiFilters) => {
  // Quick return if no filters are applied
  if (!multiFilters || Object.keys(multiFilters).length === 0) {
    return data;
  }

  // Get only active filters (those with at least one value)
  const activeFilters = Object.entries(multiFilters)
    .filter(([_, values]) => Array.isArray(values) && values.length > 0);

  // If no active filters, return all data
  if (activeFilters.length === 0) {
    return data;
  }

  return data.filter(item => {
    // For each filter type (e.g., area, subsystem)
    for (const [key, values] of activeFilters) {
      // Check if the item matches ANY of the selected values for this filter type (OR logic)
      const matchesAny = values.some(value => item[key] === value);
      
      // If it doesn't match any value for this filter type, exclude it (AND logic between filter types)
      if (!matchesAny) {
        return false;
      }
    }
    // Item matched at least one value for each filter type
    return true;
  });
};

/**
 * Create a virtual dataset based on physical filters
 * 
 * @param {Array} rawData - Original unfiltered dataset
 * @param {Object} physicalFilters - Multi-value filters from filter panel
 * @param {Object} virtualFilters - Additional filters to apply (e.g., progress filters)
 * @returns {Object} - Object containing filtered data and metadata
 */
export const createVirtualDataset = (rawData, physicalFilters, virtualFilters = {}) => {
  // First apply the physical filters (multi-value)
  const physicallyFiltered = applyMultiValueFilters(rawData, physicalFilters);
  
  // Then apply any virtual filters if needed
  let virtuallyFiltered = physicallyFiltered;
  
  // Apply progress filter if present
  if (virtualFilters.progressFilter) {
    virtuallyFiltered = physicallyFiltered.filter(item => {
      const progressStr = item['OK=100%']?.toString().replace('%', '').trim();
      const progress = parseFloat(progressStr) || 0;
      
      switch (virtualFilters.progressFilter) {
        case 'LOOP (Signal) DONE':
          return progress === 100;
        case 'LOOP (Signal) PENDING':
          return progress < 100;
        case 'DOSSIER COMPLETED':
          return item['DOSSIER'] && item['DOSSIER'].toString().trim() !== '';
        case 'TOTAL LOOP (Signal)':
          return true; // Show all loops
        default:
          return true;
      }
    });
  }
  
  return {
    data: virtuallyFiltered,
    metadata: {
      totalCount: rawData.length,
      filteredCount: virtuallyFiltered.length,
      physicalFilteredCount: physicallyFiltered.length
    }
  };
};

/**
 * Extract unique values for each filter field, considering relationships
 * 
 * @param {Array} data - Dataset to analyze
 * @param {Array} filterFields - Array of field names to extract values from
 * @returns {Object} - Object with field names as keys and arrays of unique values
 */
export const extractFilterOptions = (data, filterFields) => {
  const options = {};
  
  // Initialize options for each field
  filterFields.forEach(field => {
    options[field] = new Set();
  });
  
  // Extract unique values for each field
  data.forEach(item => {
    filterFields.forEach(field => {
      if (item[field]) {
        options[field].add(item[field]);
      }
    });
  });
  
  // Convert Sets to Arrays
  filterFields.forEach(field => {
    options[field] = Array.from(options[field]);
  });
  
  return options;
};

/**
 * Build relationship maps between different filter fields
 * 
 * @param {Array} data - Dataset to analyze
 * @param {Array} filterFields - Array of field names to map relationships
 * @returns {Object} - Object with relationship maps
 */
export const buildRelationshipMaps = (data, filterFields) => {
  const relationships = {};
  
  // Create relationship maps for each pair of fields
  for (let i = 0; i < filterFields.length; i++) {
    for (let j = 0; j < filterFields.length; j++) {
      if (i !== j) {
        const field1 = filterFields[i];
        const field2 = filterFields[j];
        const mapKey = `${field1}To${field2}`;
        
        relationships[mapKey] = {};
        
        // Build the relationship map
        data.forEach(item => {
          const value1 = item[field1];
          const value2 = item[field2];
          
          if (value1 && value2) {
            if (!relationships[mapKey][value1]) {
              relationships[mapKey][value1] = new Set();
            }
            relationships[mapKey][value1].add(value2);
          }
        });
        
        // Convert Sets to Arrays
        Object.keys(relationships[mapKey]).forEach(key => {
          relationships[mapKey][key] = Array.from(relationships[mapKey][key]);
        });
      }
    }
  }
  
  return relationships;
};