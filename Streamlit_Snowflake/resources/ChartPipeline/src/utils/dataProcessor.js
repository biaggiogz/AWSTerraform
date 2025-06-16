/**
 * Data processing utility functions for pipeline data
 */

/**
 * Process raw CSV data into a structured format
 * @param {string} csvData - Raw CSV data as string
 * @returns {Array} - Array of objects representing the data
 */
export const processCSVData = (csvData) => {
  const lines = csvData.split('\n');
  const headers = lines[0].split(',').map(header => 
    header.replace(/"/g, '').trim()
  );
  
  return lines.slice(1)
    .filter(line => line.trim() !== '')
    .map(line => {
      const values = line.split(',').map(value => 
        value.replace(/"/g, '').trim()
      );
      
      const row = {};
      headers.forEach((header, index) => {
        // Convert numeric values to numbers
        const value = values[index];
        row[header] = !isNaN(value) && value !== '' ? parseFloat(value) : value;
      });
      
      return row;
    });
};

/**
 * Get unique values from a specific field in the data
 * @param {Array} data - Processed data array
 * @param {string} field - Field name to extract unique values from
 * @returns {Array} - Array of unique values
 */
export const getUniqueValues = (data, field) => {
  return [...new Set(data.map(item => item[field]))].filter(Boolean);
};

/**
 * Filter data based on selected filters
 * @param {Array} data - Full dataset
 * @param {Object} filters - Object containing filter criteria
 * @returns {Array} - Filtered dataset
 */
export const filterData = (data, filters) => {
  return data.filter(item => {
    // Check each filter criteria
    for (const [key, value] of Object.entries(filters)) {
      if (value && item[key] !== value) {
        return false;
      }
    }
    return true;
  });
};

/**
 * Calculate metrics by grouping field
 * @param {Array} data - Dataset to analyze
 * @param {string} groupBy - Field to group by
 * @returns {Object} - Metrics grouped by the specified field
 */
export const calculateMetricsByGroup = (data, groupBy) => {
  const groups = {};
  
  // Group data by the specified field
  data.forEach(item => {
    const groupValue = item[groupBy];
    if (!groupValue) return;
    
    if (!groups[groupValue]) {
      groups[groupValue] = {
        totalDiainch: 0,
        totalDoneDiainch: 0,
        ratioDoneDiainch: [],
        supportInstalled: 0,
        supportTotal: 0,
        constructionProgress: []
      };
    }
    
    // Accumulate metrics
    groups[groupValue].totalDiainch += parseFloat(item['TOTAL DIAINCH (")'] || 0);
    groups[groupValue].totalDoneDiainch += parseFloat(item['TOTAL DONE DIAINCH (")'] || 0);
    
    if (item['RATIO DONE DIAINCH (%)']) {
      groups[groupValue].ratioDoneDiainch.push(parseFloat(item['RATIO DONE DIAINCH (%)']));
    }
    
    if (item['QTY SUPPORT'] && item['QTY SUPPORT'] > 0) {
      groups[groupValue].supportTotal += parseFloat(item['QTY SUPPORT']);
      groups[groupValue].supportInstalled += parseFloat(item['QTY SUPPORT INSTALLED'] || 0);
    }
    
    if (item['CONSTRUC COORD PROGRESS']) {
      groups[groupValue].constructionProgress.push(parseFloat(item['CONSTRUC COORD PROGRESS']));
    }
  });
  
  // Calculate averages and percentages
  Object.keys(groups).forEach(key => {
    const group = groups[key];
    
    // Calculate welding progress ratio average
    group.avgRatioDoneDiainch = group.ratioDoneDiainch.length > 0
      ? group.ratioDoneDiainch.reduce((sum, val) => sum + val, 0) / group.ratioDoneDiainch.length
      : 0;
    
    // Calculate support installation progress
    group.supportInstallationProgress = group.supportTotal > 0
      ? (group.supportInstalled / group.supportTotal) * 100
      : 0;
    
    // Calculate construction progress average
    group.avgConstructionProgress = group.constructionProgress.length > 0
      ? group.constructionProgress.reduce((sum, val) => sum + val, 0) / group.constructionProgress.length
      : 0;
  });
  
  return groups;
};

/**
 * Get status icon based on progress percentage
 * @param {number} progress - Progress percentage
 * @returns {string} - Status icon
 */
export const getStatusIcon = (progress) => {
  if (progress >= 90) return '✅';
  if (progress >= 70) return '⚠️';
  return '❌';
};