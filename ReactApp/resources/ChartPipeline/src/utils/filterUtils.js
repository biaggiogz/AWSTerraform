/**
 * Utility functions for filter compatibility between components
 */

/**
 * Extract subsystems that match the selected test packs
 * @param {Array} data - The data array containing subsystem and test pack information
 * @param {Array} selectedTPIds - Array of selected test pack IDs
 * @returns {Set} - Set of matching subsystem names
 */
export const extractMatchingSubsystems = (data, selectedTPIds) => {
  const matchingSubsystems = new Set();
  
  if (!data || !selectedTPIds || selectedTPIds.length === 0) {
    return matchingSubsystems;
  }
  
  data.forEach(row => {
    if (row.subsystem && row.list_includes_tp_id) {
      let tpIds = [];
      if (typeof row.list_includes_tp_id === 'string') {
        tpIds = row.list_includes_tp_id.includes('|') 
          ? row.list_includes_tp_id.split('|') 
          : [row.list_includes_tp_id];
      } else if (Array.isArray(row.list_includes_tp_id)) {
        tpIds = row.list_includes_tp_id.map(id => String(id));
      } else if (row.list_includes_tp_id !== undefined && row.list_includes_tp_id !== null) {
        tpIds = [String(row.list_includes_tp_id)];
      }
      
      // Check if any of the selected TPs are in this subsystem
      const hasSelectedTP = tpIds.some(tpId => selectedTPIds.includes(tpId));
      
      if (hasSelectedTP) {
        matchingSubsystems.add(row.subsystem);
      }
    }
  });
  
  return matchingSubsystems;
};

/**
 * Filter data based on matching subsystems
 * @param {Array} data - The data array to filter
 * @param {Set|Array} matchingSubsystems - Set or Array of subsystem names to match
 * @returns {Array} - Filtered data containing only rows with matching subsystems
 */
export const filterByMatchingSubsystems = (data, matchingSubsystems) => {
  if (!data || !matchingSubsystems || 
      (matchingSubsystems instanceof Set && matchingSubsystems.size === 0) ||
      (Array.isArray(matchingSubsystems) && matchingSubsystems.length === 0)) {
    console.log('No matching subsystems to filter by, returning all data');
    return data;
  }
  
  const subsystemSet = matchingSubsystems instanceof Set 
    ? matchingSubsystems 
    : new Set(matchingSubsystems);
  
  console.log('Filtering by', subsystemSet.size, 'matching subsystems:', Array.from(subsystemSet).slice(0, 5).join(', ') + (subsystemSet.size > 5 ? '...' : ''));
  
  const filtered = data.filter(row => subsystemSet.has(row.subsystem));
  console.log('Filtered data from', data.length, 'to', filtered.length, 'rows');
  
  return filtered;
};

