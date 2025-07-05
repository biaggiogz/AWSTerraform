/**
 * WASM-enhanced data processor with fallback to original implementation
 * Maintains API compatibility while providing performance improvements
 */

import { 
  processCSVData as wasmProcessCSVData, 
  getUniqueValues as wasmGetUniqueValues,
  calculateMetricsByGroup as wasmCalculateMetricsByGroup
} from '../wasm/data-processor.wasm.js';

// Re-export original functions for compatibility
export { filterData, getStatusIcon } from './dataProcessor.optimized.js';

/**
 * Process raw CSV data into a structured format with WASM optimization
 * @param {string} csvData - Raw CSV data as string
 * @returns {Promise<Array>} - Array of objects representing the data
 */
export const processCSVData = async (csvData) => {
  try {
    return await wasmProcessCSVData(csvData);
  } catch (error) {
    console.error('WASM CSV processing failed, using fallback:', error);
    // Fallback to original implementation
    const { processCSVData: originalProcessCSVData } = await import('./dataProcessor.optimized.js');
    return originalProcessCSVData(csvData);
  }
};

/**
 * Get unique values from a specific field in the data with WASM optimization
 * @param {Array} data - Processed data array
 * @param {string} field - Field name to extract unique values from
 * @returns {Promise<Array>} - Array of unique values
 */
export const getUniqueValues = async (data, field) => {
  try {
    return await wasmGetUniqueValues(data, field);
  } catch (error) {
    console.error('WASM unique values extraction failed, using fallback:', error);
    // Fallback to original implementation
    const { getUniqueValues: originalGetUniqueValues } = await import('./dataProcessor.optimized.js');
    return originalGetUniqueValues(data, field);
  }
};

/**
 * Calculate metrics by grouping field with WASM optimization
 * @param {Array} data - Dataset to analyze
 * @param {string} groupBy - Field to group by
 * @returns {Promise<Object>} - Metrics grouped by the specified field
 */
export const calculateMetricsByGroup = async (data, groupBy) => {
  try {
    return await wasmCalculateMetricsByGroup(data, groupBy);
  } catch (error) {
    console.error('WASM metrics calculation failed, using fallback:', error);
    // Fallback to original implementation
    const { calculateMetricsByGroup: originalCalculateMetricsByGroup } = await import('./dataProcessor.optimized.js');
    return originalCalculateMetricsByGroup(data, groupBy);
  }
};

// Performance monitoring
export const getPerformanceMetrics = () => {
  const { dataProcessorWasm } = require('../wasm/data-processor.wasm.js');
  return {
    usingWasm: dataProcessorWasm.isUsingWasm(),
    module: 'data-processor'
  };
};