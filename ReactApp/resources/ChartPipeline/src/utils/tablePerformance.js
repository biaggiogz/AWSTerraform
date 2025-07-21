/**
 * Table Performance Optimization Utilities
 * 
 * This file contains utilities to optimize table rendering performance
 * and measure performance metrics.
 */

/**
 * Measures the performance of a function execution
 * 
 * @param {Function} fn - Function to measure
 * @returns {Promise<{result: any, executionTime: number}>} - Result and execution time
 */
export const measurePerformance = async (fn) => {
  const startTime = performance.now();
  const result = await fn();
  const endTime = performance.now();
  
  return {
    result,
    executionTime: endTime - startTime
  };
};

/**
 * Analyzes table performance metrics
 * 
 * @param {Object} metrics - Performance metrics
 * @returns {Object} - Analysis results
 */
export const analyzeTablePerformance = (metrics) => {
  const { loadTime, queryTime, renderTime, rowCount } = metrics;
  
  // Calculate metrics per row
  const queryTimePerRow = queryTime / rowCount;
  const renderTimePerRow = renderTime / rowCount;
  const totalTimePerRow = (loadTime + queryTime + renderTime) / rowCount;
  
  // Identify bottlenecks
  const bottlenecks = [];
  
  if (queryTime > loadTime && queryTime > renderTime) {
    bottlenecks.push('Query execution');
  }
  
  if (renderTime > loadTime && renderTime > queryTime) {
    bottlenecks.push('Rendering');
  }
  
  if (loadTime > queryTime && loadTime > renderTime) {
    bottlenecks.push('Data loading');
  }
  
  // Recommendations based on bottlenecks
  const recommendations = [];
  
  if (bottlenecks.includes('Query execution')) {
    recommendations.push('Optimize SQL queries');
    recommendations.push('Add indexes to frequently filtered columns');
    recommendations.push('Limit result set size');
  }
  
  if (bottlenecks.includes('Rendering')) {
    recommendations.push('Implement virtualization');
    recommendations.push('Reduce columns or simplify cell rendering');
    recommendations.push('Use pagination instead of loading all data at once');
  }
  
  if (bottlenecks.includes('Data loading')) {
    recommendations.push('Use Parquet instead of CSV');
    recommendations.push('Implement data caching');
    recommendations.push('Load data in smaller chunks');
  }
  
  return {
    metrics: {
      queryTimePerRow,
      renderTimePerRow,
      totalTimePerRow
    },
    bottlenecks,
    recommendations
  };
};

/**
 * Monitors table performance during user interaction
 * 
 * @param {Function} callback - Callback function to receive metrics
 * @returns {Function} - Function to stop monitoring
 */
export const monitorTablePerformance = (callback) => {
  if (!callback || typeof callback !== 'function') {
    throw new Error('Callback function is required');
  }
  
  let frameCount = 0;
  let lastTime = performance.now();
  let animationFrameId = null;
  
  // FPS calculation
  const calculateFps = () => {
    const now = performance.now();
    const elapsed = now - lastTime;
    
    if (elapsed >= 1000) { // Update every second
      const fps = Math.round((frameCount * 1000) / elapsed);
      
      // Get memory usage if available
      let memoryUsage = null;
      if (window.performance && window.performance.memory) {
        const memory = window.performance.memory;
        memoryUsage = {
          usedJSHeapSize: Math.round(memory.usedJSHeapSize / (1024 * 1024)),
          totalJSHeapSize: Math.round(memory.totalJSHeapSize / (1024 * 1024))
        };
      }
      
      callback({ fps, memoryUsage });
      
      // Reset counters
      frameCount = 0;
      lastTime = now;
    }
    
    frameCount++;
    animationFrameId = requestAnimationFrame(calculateFps);
  };
  
  // Start monitoring
  animationFrameId = requestAnimationFrame(calculateFps);
  
  // Return function to stop monitoring
  return () => {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }
  };
};

/**
 * Optimizes table data for rendering
 * 
 * @param {Array} data - Original data array
 * @param {Object} options - Optimization options
 * @returns {Array} - Optimized data
 */
export const optimizeTableData = (data, options = {}) => {
  const {
    maxRows = 1000,
    formatDates = true,
    convertNumbers = true,
    removeEmptyColumns = true
  } = options;
  
  if (!data || !data.length) return [];
  
  // Limit rows if needed
  const limitedData = maxRows > 0 && data.length > maxRows
    ? data.slice(0, maxRows)
    : data;
  
  // Find empty columns if needed
  let emptyColumns = [];
  if (removeEmptyColumns) {
    const columns = Object.keys(limitedData[0] || {});
    emptyColumns = columns.filter(col => 
      limitedData.every(row => 
        row[col] === null || 
        row[col] === undefined || 
        row[col] === ''
      )
    );
  }
  
  // Process data
  return limitedData.map(row => {
    const newRow = { ...row };
    
    // Remove empty columns
    emptyColumns.forEach(col => {
      delete newRow[col];
    });
    
    // Format dates
    if (formatDates) {
      Object.entries(newRow).forEach(([key, value]) => {
        // Check if value might be a timestamp
        if (typeof value === 'number' && value > 1000000000) {
          try {
            const date = new Date(value > 9999999999 ? value : value * 1000);
            if (!isNaN(date.getTime())) {
              newRow[key] = date.toISOString();
            }
          } catch (e) {
            // Keep original value if date conversion fails
          }
        }
      });
    }
    
    // Convert string numbers to actual numbers
    if (convertNumbers) {
      Object.entries(newRow).forEach(([key, value]) => {
        if (typeof value === 'string' && !isNaN(value) && value.trim() !== '') {
          newRow[key] = Number(value);
        }
      });
    }
    
    return newRow;
  });
};