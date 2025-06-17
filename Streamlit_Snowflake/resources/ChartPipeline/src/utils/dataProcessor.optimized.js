/**
 * Data processing utility functions for pipeline data
 */

/**
 * Process raw CSV data into a structured format with optimized parsing
 * @param {string} csvData - Raw CSV data as string
 * @returns {Array} - Array of objects representing the data
 */
export const processCSVData = (csvData) => {
  const lines = csvData.split('\n');
  const headers = lines[0].split(',').map(header => 
    header.replace(/\"/g, '').trim()
  );
  
  // Pre-allocate array for better performance
  const processedRows = [];
  const numericFields = new Set([
    'TOTAL DIAINCH ("")', 
    'TOTAL DONE DIAINCH ("")', 
    'RATIO DONE DIAINCH (%)', 
    'QTY SUPPORT', 
    'QTY SUPPORT INSTALLED',
    'CONSTRUC COORD PROGRESS'
  ]);
  
  // Process only non-empty lines
  const dataLines = lines.slice(1).filter(line => line.trim() !== '');
  
  // Pre-allocate for better performance
  const rowsToProcess = [];
  
  // First pass - split lines and handle multiple test packs
  for (let i = 0; i < dataLines.length; i++) {
    const values = dataLines[i].split(',').map(value => 
      value.replace(/\"/g, '').trim()
    );
    
    const row = {};
    for (let j = 0; j < headers.length; j++) {
      const header = headers[j];
      const value = values[j];
      
      // Convert numeric values to numbers
      if (numericFields.has(header) && value !== '' && !isNaN(value)) {
        row[header] = parseFloat(value);
      } else {
        row[header] = value;
      }
    }
    
    // Handle multiple test packs separated by '|'
    if (row['TEST PACK'] && typeof row['TEST PACK'] === 'string' && row['TEST PACK'].includes('|')) {
      const testPacks = row['TEST PACK'].split('|');
      testPacks.forEach(testPack => {
        const newRow = {...row};
        newRow['TEST PACK'] = testPack.trim();
        rowsToProcess.push(newRow);
      });
    } else {
      rowsToProcess.push(row);
    }
  }
  
  // Add all processed rows at once for better performance
  processedRows.push(...rowsToProcess);
  
  return processedRows;
};

/**
 * Get unique values from a specific field in the data using Set for better performance
 * @param {Array} data - Processed data array
 * @param {string} field - Field name to extract unique values from
 * @returns {Array} - Array of unique values
 */
export const getUniqueValues = (data, field) => {
  // Use Set for O(1) lookups and automatic deduplication
  const uniqueSet = new Set();
  
  // Single loop through data
  for (let i = 0; i < data.length; i++) {
    const value = data[i][field];
    if (value) {
      uniqueSet.add(value);
    }
  }
  
  return Array.from(uniqueSet);
};

/**
 * Filter data based on selected filters with optimized implementation
 * @param {Array} data - Full dataset
 * @param {Object} filters - Object containing filter criteria
 * @returns {Array} - Filtered dataset
 */
export const filterData = (data, filters) => {
  // Quick return if no filters are applied
  if (Object.values(filters).every(v => !v)) {
    return data;
  }
  
  // Get only active filters
  const activeFilters = Object.entries(filters).filter(([_, value]) => value);
  
  // If no active filters, return all data
  if (activeFilters.length === 0) {
    return data;
  }
  
  return data.filter(item => {
    // Check each active filter criteria
    for (const [key, value] of activeFilters) {
      if (item[key] !== value) {
        return false;
      }
    }
    return true;
  });
};

/**
 * Calculate metrics by grouping field with optimized implementation
 * @param {Array} data - Dataset to analyze
 * @param {string} groupBy - Field to group by
 * @returns {Object} - Metrics grouped by the specified field
 */
export const calculateMetricsByGroup = (data, groupBy) => {
  const groups = {};
  
  // Group data by the specified field
  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    const groupValue = item[groupBy];
    if (!groupValue) continue;
    
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
    groups[groupValue].totalDiainch += parseFloat(item['TOTAL DIAINCH ("")'] || 0);
    groups[groupValue].totalDoneDiainch += parseFloat(item['TOTAL DONE DIAINCH ("")'] || 0);
    
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
  }
  
  // Calculate averages and percentages
  const groupKeys = Object.keys(groups);
  for (let i = 0; i < groupKeys.length; i++) {
    const key = groupKeys[i];
    const group = groups[key];
    
    // Calculate welding progress ratio average
    const ratioLength = group.ratioDoneDiainch.length;
    if (ratioLength > 0) {
      let sum = 0;
      for (let j = 0; j < ratioLength; j++) {
        sum += group.ratioDoneDiainch[j];
      }
      group.avgRatioDoneDiainch = sum / ratioLength;
    } else {
      group.avgRatioDoneDiainch = 0;
    }
    
    // Calculate support installation progress
    group.supportInstallationProgress = group.supportTotal > 0
      ? (group.supportInstalled / group.supportTotal) * 100
      : 0;
    
    // Calculate construction progress average
    const progressLength = group.constructionProgress.length;
    if (progressLength > 0) {
      let sum = 0;
      for (let j = 0; j < progressLength; j++) {
        sum += group.constructionProgress[j];
      }
      group.avgConstructionProgress = sum / progressLength;
    } else {
      group.avgConstructionProgress = 0;
    }
  }
  
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