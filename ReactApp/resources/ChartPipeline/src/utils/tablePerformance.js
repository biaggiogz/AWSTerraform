/**
 * Utility for measuring and optimizing table performance
 */

/**
 * Measures the performance of a function
 * @param {Function} fn - The function to measure
 * @param {Array} args - Arguments to pass to the function
 * @returns {Object} - Performance metrics
 */
export const measurePerformance = async (fn, ...args) => {
  const start = performance.now();
  const result = await fn(...args);
  const end = performance.now();
  
  return {
    result,
    executionTime: end - start,
    formattedTime: `${(end - start).toFixed(2)}ms`
  };
};

/**
 * Analyzes table rendering performance
 * @param {Object} tableRef - React ref to the table container
 * @returns {Object} - Performance metrics
 */
export const analyzeTablePerformance = (tableRef) => {
  if (!tableRef.current) return null;
  
  const metrics = {
    domNodes: 0,
    renderTime: 0,
    memoryUsage: null
  };
  
  // Count DOM nodes
  const countNodes = (element) => {
    let count = 1; // Count the element itself
    for (let i = 0; i < element.children.length; i++) {
      count += countNodes(element.children[i]);
    }
    return count;
  };
  
  // Measure render time
  const start = performance.now();
  metrics.domNodes = countNodes(tableRef.current);
  metrics.renderTime = performance.now() - start;
  
  // Get memory usage if available
  if (window.performance && window.performance.memory) {
    metrics.memoryUsage = {
      usedJSHeapSize: Math.round(window.performance.memory.usedJSHeapSize / (1024 * 1024)),
      totalJSHeapSize: Math.round(window.performance.memory.totalJSHeapSize / (1024 * 1024))
    };
  }
  
  return metrics;
};

/**
 * Optimizes DuckDB query based on data size
 * @param {string} baseQuery - The base SQL query
 * @param {Object} options - Optimization options
 * @returns {string} - Optimized query
 */
export const optimizeDuckDBQuery = (baseQuery, options = {}) => {
  const {
    rowLimit = 2000,
    useIndexes = true,
    columns = '*'
  } = options;
  
  // Extract the table name from the query
  const tableNameMatch = baseQuery.match(/FROM\s+([^\s]+)/i);
  const tableName = tableNameMatch ? tableNameMatch[1] : null;
  
  if (!tableName) return baseQuery;
  
  // Build optimized query
  let optimizedQuery = `SELECT ${columns} FROM ${tableName}`;
  
  // Add WHERE clause if present in original query
  const whereMatch = baseQuery.match(/WHERE\s+(.*?)(?:ORDER BY|GROUP BY|LIMIT|$)/i);
  if (whereMatch) {
    optimizedQuery += ` WHERE ${whereMatch[1]}`;
  }
  
  // Add LIMIT
  optimizedQuery += ` LIMIT ${rowLimit}`;
  
  return optimizedQuery;
};

/**
 * Monitors and reports on table performance
 * @param {Function} callback - Callback to receive performance reports
 * @returns {Function} - Function to stop monitoring
 */
export const monitorTablePerformance = (callback) => {
  let frameCount = 0;
  let lastTime = performance.now();
  let rafId;
  
  const measure = () => {
    const now = performance.now();
    frameCount++;
    
    // Report every second
    if (now - lastTime > 1000) {
      const fps = Math.round((frameCount * 1000) / (now - lastTime));
      
      callback({
        fps,
        timestamp: now,
        memoryUsage: window.performance?.memory ? {
          usedJSHeapSize: Math.round(window.performance.memory.usedJSHeapSize / (1024 * 1024)),
          totalJSHeapSize: Math.round(window.performance.memory.totalJSHeapSize / (1024 * 1024))
        } : null
      });
      
      frameCount = 0;
      lastTime = now;
    }
    
    rafId = requestAnimationFrame(measure);
  };
  
  measure();
  
  // Return function to stop monitoring
  return () => {
    cancelAnimationFrame(rafId);
  };
};