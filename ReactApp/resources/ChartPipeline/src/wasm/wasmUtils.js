import wasmBridge from './wasmBridge.js';

let wasmInitialized = false;

export const initializeWasm = async () => {
  if (wasmInitialized) return true;
  
  try {
    wasmInitialized = await wasmBridge.initialize();
    // Only log success in development
    if (process.env.NODE_ENV === 'development') {
      console.log('WASM Filter Engine initialized:', wasmInitialized);
    }
    return wasmInitialized;
  } catch (error) {
    // Silently fail and use JS fallback
    return false;
  }
};

export const intersectFilterSets = (sets) => {
  if (sets.length === 0) return [];
  if (sets.length === 1) return sets[0];
  
  let result = sets[0];
  
  for (let i = 1; i < sets.length; i++) {
    result = wasmBridge.intersectSubsystems(result, sets[i]);
    if (result.length === 0) break;
  }
  
  return result;
};

export const calculateTableRowHeights = (descriptions) => {
  const textLengths = descriptions.map(desc => (desc || '').length);
  return wasmBridge.calculateRowHeights(textLengths);
};

export const filterRowsByTestPacks = (testPackIds, rowData) => {
  return wasmBridge.filterByTestPacksJS(testPackIds, rowData);
};

export const calculateAggregateMetrics = (data, field, filterIndices = null) => {
  const values = data.map(row => parseFloat(row[field]) || 0);
  const indices = filterIndices || data.map((_, i) => i);
  return wasmBridge.calculateMetricSumJS(values, indices);
};

export const getWasmStatus = () => ({
  initialized: wasmInitialized,
  available: typeof WebAssembly !== 'undefined'
});

export default {
  initializeWasm,
  intersectFilterSets,
  calculateTableRowHeights,
  filterRowsByTestPacks,
  calculateAggregateMetrics,
  getWasmStatus
};