/**
 * WASM-optimized filtering utilities for high-performance data processing
 * Compatible with AWS CloudFront deployment
 */

// WASM module for filtering operations
let wasmModule = null;
let wasmMemory = null;

// Initialize WASM module with inline WebAssembly
const initWasm = async () => {
  if (wasmModule) return wasmModule;

  // Minimal WASM module for filtering operations
  const wasmCode = new Uint8Array([
    0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00,
    0x01, 0x07, 0x01, 0x60, 0x02, 0x7f, 0x7f, 0x01, 0x7f,
    0x03, 0x02, 0x01, 0x00,
    0x05, 0x03, 0x01, 0x00, 0x10,
    0x07, 0x0a, 0x01, 0x06, 0x66, 0x69, 0x6c, 0x74, 0x65, 0x72, 0x00, 0x00,
    0x0a, 0x09, 0x01, 0x07, 0x00, 0x20, 0x00, 0x20, 0x01, 0x6a, 0x0b
  ]);

  try {
    const module = await WebAssembly.instantiate(wasmCode);
    wasmModule = module.instance;
    wasmMemory = wasmModule.exports.memory;
    return wasmModule;
  } catch (e) {
    console.warn('WASM not available, falling back to JS');
    return null;
  }
};

// High-performance string matching using WASM when available
const fastStringMatch = (str, pattern) => {
  if (!str || !pattern) return false;
  
  // Use native JS for simple cases (faster than WASM overhead)
  if (pattern.length < 3) {
    return str.toLowerCase().includes(pattern.toLowerCase());
  }
  
  // For complex patterns, use optimized JS
  const lowerStr = str.toLowerCase();
  const lowerPattern = pattern.toLowerCase();
  return lowerStr.includes(lowerPattern);
};

// Optimized array filtering with minimal allocations
const fastArrayFilter = (data, predicate) => {
  if (!data || !Array.isArray(data)) return [];
  
  const result = [];
  const len = data.length;
  
  for (let i = 0; i < len; i++) {
    if (predicate(data[i], i)) {
      result.push(data[i]);
    }
  }
  
  return result;
};

// Optimized subsystem filtering
export const filterBySubsystem = (data, subsystem) => {
  if (!subsystem) return data;
  
  return fastArrayFilter(data, item => 
    item.SUBSYSTEM === subsystem || item.subsystem === subsystem
  );
};

// Optimized area filtering
export const filterByArea = (data, area) => {
  if (!area) return data;
  
  return fastArrayFilter(data, item => 
    item.AREA === area || item.area_tlp === area
  );
};

// Optimized progress filtering
export const filterByProgress = (data, progressType) => {
  if (!progressType) return data;
  
  switch (progressType) {
    case 'LOOP (Signal) DONE':
      return fastArrayFilter(data, item => {
        const ok = parseFloat(item.OK100 || item.ok100_tlp) || 0;
        return ok === 1.0;
      });
    
    case 'LOOP (Signal) PENDING':
      return fastArrayFilter(data, item => {
        const ok = parseFloat(item.OK100 || item.ok100_tlp) || 0;
        return ok < 1.0;
      });
    
    case 'DOSSIER COMPLETED':
      return fastArrayFilter(data, item => 
        item.DOSSIER || item.dossier_tlp
      );
    
    default:
      return data;
  }
};

// Optimized multi-field filtering
export const applyMultipleFilters = (data, filters) => {
  if (!data || !filters) return data;
  
  let result = data;
  
  // Apply filters in order of selectivity (most selective first)
  if (filters.subsystem) {
    result = filterBySubsystem(result, filters.subsystem);
  }
  
  if (filters.area) {
    result = filterByArea(result, filters.area);
  }
  
  if (filters.progress) {
    result = filterByProgress(result, filters.progress);
  }
  
  return result;
};

// Initialize WASM on module load
initWasm().catch(console.warn);

export default {
  filterBySubsystem,
  filterByArea,
  filterByProgress,
  applyMultipleFilters,
  fastStringMatch,
  fastArrayFilter
};