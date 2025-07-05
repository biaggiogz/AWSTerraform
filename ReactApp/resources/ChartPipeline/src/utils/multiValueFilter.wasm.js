/**
 * WASM-enhanced multi-value filter with fallback to original implementation
 * Maintains API compatibility while providing performance improvements
 */

import { 
  applyMultiValueFilters as wasmApplyMultiValueFilters,
  buildRelationshipMaps as wasmBuildRelationshipMaps,
  extractFilterOptions as wasmExtractFilterOptions
} from '../wasm/multi-filter.wasm.js';

// Re-export original functions for compatibility
export { createVirtualDataset } from './multiValueFilter.js';

/**
 * Filter data based on multi-value filters with WASM optimization
 * @param {Array} data - Raw dataset to filter
 * @param {Object} multiFilters - Object with filter keys and arrays of selected values
 * @returns {Promise<Array>} - Filtered dataset
 */
export const applyMultiValueFilters = async (data, multiFilters) => {
  try {
    return await wasmApplyMultiValueFilters(data, multiFilters);
  } catch (error) {
    console.error('WASM multi-value filtering failed, using fallback:', error);
    // Fallback to original implementation
    const { applyMultiValueFilters: originalApplyMultiValueFilters } = await import('./multiValueFilter.js');
    return originalApplyMultiValueFilters(data, multiFilters);
  }
};

/**
 * Build relationship maps between different filter fields with WASM optimization
 * @param {Array} data - Dataset to analyze
 * @param {Array} filterFields - Array of field names to map relationships
 * @returns {Promise<Object>} - Object with relationship maps
 */
export const buildRelationshipMaps = async (data, filterFields) => {
  try {
    return await wasmBuildRelationshipMaps(data, filterFields);
  } catch (error) {
    console.error('WASM relationship mapping failed, using fallback:', error);
    // Fallback to original implementation
    const { buildRelationshipMaps: originalBuildRelationshipMaps } = await import('./multiValueFilter.js');
    return originalBuildRelationshipMaps(data, filterFields);
  }
};

/**
 * Extract unique values for each filter field with WASM optimization
 * @param {Array} data - Dataset to analyze
 * @param {Array} filterFields - Array of field names to extract values from
 * @returns {Promise<Object>} - Object with field names as keys and arrays of unique values
 */
export const extractFilterOptions = async (data, filterFields) => {
  try {
    return await wasmExtractFilterOptions(data, filterFields);
  } catch (error) {
    console.error('WASM filter options extraction failed, using fallback:', error);
    // Fallback to original implementation
    const { extractFilterOptions: originalExtractFilterOptions } = await import('./multiValueFilter.js');
    return originalExtractFilterOptions(data, filterFields);
  }
};

// Performance monitoring
export const getPerformanceMetrics = () => {
  const { multiFilterWasm } = require('../wasm/multi-filter.wasm.js');
  return {
    usingWasm: multiFilterWasm.isUsingWasm(),
    module: 'multi-filter'
  };
};