/**
 * Utility functions for data processing and transformation
 */

// Parse CSV data and convert string values to appropriate types
export const parseData = (rawData) => {
  return rawData
    .filter(row => Object.values(row).some(val => val)) // Remove empty rows
    .map(row => ({
      ...row,
      // Convert string percentages to numbers
      'RATIO DONE DIAINCH (%)': parseFloat(row['RATIO DONE DIAINCH (%)'] || 0),
      'RATIO DONE SHOP DIAINCH (%)': parseFloat(row['RATIO DONE SHOP DIAINCH (%)'] || 0),
      'RATIO DONE FIELD DIAINCH (%)': parseFloat(row['RATIO DONE FIELD DIAINCH (%)'] || 0),
      'PROGRESS SW+FW (%)': parseFloat(row['PROGRESS SW+FW (%)'] || 0),
      '% PROGRESS DELIVERY IN SITE': parseFloat(row['% PROGRESS DELIVERY IN SITE'] || 0),
      '% PROGRESS ERECTED': parseFloat(row['% PROGRESS ERECTED'] || 0),
      'QTY Welds Shop (SW)': parseInt(row['QTY Welds Shop (SW)'] || 0, 10),
      'QTY Welds Field (FW)': parseInt(row['QTY Welds Field (FW)'] || 0, 10),
      'TOTAL DIAINCH (\"\")': parseFloat(row['TOTAL DIAINCH (\"\")'] || 0),
      'TOTAL DONE DIAINCH (\"\")': parseFloat(row['TOTAL DONE DIAINCH (\"\")'] || 0),
    }));
};

// Group data by a specific field and calculate statistics
export const groupByField = (data, field) => {
  const groups = {};
  
  data.forEach(item => {
    const key = item[field] || 'Unknown';
    
    if (!groups[key]) {
      groups[key] = [];
    }
    
    groups[key].push(item);
  });
  
  return groups;
};

// Calculate average value for a specific field across grouped data
export const calculateAverage = (data, field) => {
  if (data.length === 0) return 0;
  
  const sum = data.reduce((acc, item) => {
    const value = parseFloat(item[field] || 0);
    return acc + (isNaN(value) ? 0 : value);
  }, 0);
  
  return sum / data.length;
};

// Generate a color from a string value
export const stringToColor = (str) => {
  const colors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
  
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
};