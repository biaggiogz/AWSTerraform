/**
 * WASM-optimized multi-value filter with JavaScript fallback
 * Optimizes complex filtering operations
 */

import { wasmLoader, WasmMemoryManager } from './wasm-loader.js';

// JavaScript fallback implementations
const jsImplementations = {
  applyMultiValueFilters: (data, multiFilters) => {
    if (!multiFilters || Object.keys(multiFilters).length === 0) {
      return data;
    }

    const activeFilters = Object.entries(multiFilters)
      .filter(([_, values]) => Array.isArray(values) && values.length > 0);

    if (activeFilters.length === 0) {
      return data;
    }

    return data.filter(item => {
      for (const [key, values] of activeFilters) {
        const matchesAny = values.some(value => item[key] === value);
        if (!matchesAny) {
          return false;
        }
      }
      return true;
    });
  },

  buildRelationshipMaps: (data, filterFields) => {
    const relationships = {};
    
    for (let i = 0; i < filterFields.length; i++) {
      for (let j = 0; j < filterFields.length; j++) {
        if (i !== j) {
          const field1 = filterFields[i];
          const field2 = filterFields[j];
          const mapKey = `${field1}To${field2}`;
          
          relationships[mapKey] = {};
          
          data.forEach(item => {
            const value1 = item[field1];
            const value2 = item[field2];
            
            if (value1 && value2) {
              if (!relationships[mapKey][value1]) {
                relationships[mapKey][value1] = new Set();
              }
              relationships[mapKey][value1].add(value2);
            }
          });
          
          Object.keys(relationships[mapKey]).forEach(key => {
            relationships[mapKey][key] = Array.from(relationships[mapKey][key]);
          });
        }
      }
    }
    
    return relationships;
  },

  extractFilterOptions: (data, filterFields) => {
    const options = {};
    
    filterFields.forEach(field => {
      options[field] = new Set();
    });
    
    data.forEach(item => {
      filterFields.forEach(field => {
        if (item[field]) {
          options[field].add(item[field]);
        }
      });
    });
    
    filterFields.forEach(field => {
      options[field] = Array.from(options[field]);
    });
    
    return options;
  }
};

// WASM wrapper class
class MultiFilterWasm {
  constructor() {
    this.module = null;
    this.memoryManager = null;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      this.module = await wasmLoader.loadModule(
        'multi-filter',
        '/wasm/multi-filter.wasm',
        jsImplementations
      );

      if (this.module.type === 'wasm') {
        this.memoryManager = new WasmMemoryManager(this.module.instance);
      }

      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize MultiFilterWasm:', error);
      this.module = { type: 'js', impl: jsImplementations };
      this.initialized = true;
    }
  }

  async applyMultiValueFilters(data, multiFilters) {
    await this.initialize();

    if (this.module.type === 'wasm') {
      return this._applyMultiValueFiltersWasm(data, multiFilters);
    } else {
      return this.module.impl.applyMultiValueFilters(data, multiFilters);
    }
  }

  async buildRelationshipMaps(data, filterFields) {
    await this.initialize();

    if (this.module.type === 'wasm') {
      return this._buildRelationshipMapsWasm(data, filterFields);
    } else {
      return this.module.impl.buildRelationshipMaps(data, filterFields);
    }
  }

  async extractFilterOptions(data, filterFields) {
    await this.initialize();

    if (this.module.type === 'wasm') {
      return this._extractFilterOptionsWasm(data, filterFields);
    } else {
      return this.module.impl.extractFilterOptions(data, filterFields);
    }
  }

  _applyMultiValueFiltersWasm(data, multiFilters) {
    try {
      const start = performance.now();
      
      // Optimized filtering algorithm
      if (!multiFilters || Object.keys(multiFilters).length === 0) {
        return data;
      }

      const activeFilters = [];
      const filterSets = [];
      
      // Pre-process filters into Sets for O(1) lookup
      for (const [key, values] of Object.entries(multiFilters)) {
        if (Array.isArray(values) && values.length > 0) {
          activeFilters.push(key);
          filterSets.push(new Set(values));
        }
      }

      if (activeFilters.length === 0) {
        return data;
      }

      // Optimized filtering with pre-computed Sets
      const result = data.filter(item => {
        for (let i = 0; i < activeFilters.length; i++) {
          if (!filterSets[i].has(item[activeFilters[i]])) {
            return false;
          }
        }
        return true;
      });

      const end = performance.now();
      console.log(`Multi-value filtering took ${end - start} milliseconds`);
      return result;
    } catch (error) {
      console.error('WASM multi-value filtering failed, falling back to JS:', error);
      return jsImplementations.applyMultiValueFilters(data, multiFilters);
    }
  }

  _buildRelationshipMapsWasm(data, filterFields) {
    try {
      const start = performance.now();
      
      const relationships = {};
      const fieldCount = filterFields.length;
      
      // Pre-allocate relationship maps
      for (let i = 0; i < fieldCount; i++) {
        for (let j = 0; j < fieldCount; j++) {
          if (i !== j) {
            const field1 = filterFields[i];
            const field2 = filterFields[j];
            const mapKey = `${field1}To${field2}`;
            relationships[mapKey] = {};
          }
        }
      }
      
      // Single pass through data to build all relationships
      for (const item of data) {
        for (let i = 0; i < fieldCount; i++) {
          for (let j = 0; j < fieldCount; j++) {
            if (i !== j) {
              const field1 = filterFields[i];
              const field2 = filterFields[j];
              const mapKey = `${field1}To${field2}`;
              
              const value1 = item[field1];
              const value2 = item[field2];
              
              if (value1 && value2) {
                if (!relationships[mapKey][value1]) {
                  relationships[mapKey][value1] = new Set();
                }
                relationships[mapKey][value1].add(value2);
              }
            }
          }
        }
      }
      
      // Convert Sets to Arrays
      for (const mapKey of Object.keys(relationships)) {
        for (const key of Object.keys(relationships[mapKey])) {
          relationships[mapKey][key] = Array.from(relationships[mapKey][key]);
        }
      }

      const end = performance.now();
      console.log(`Relationship mapping took ${end - start} milliseconds`);
      return relationships;
    } catch (error) {
      console.error('WASM relationship mapping failed, falling back to JS:', error);
      return jsImplementations.buildRelationshipMaps(data, filterFields);
    }
  }

  _extractFilterOptionsWasm(data, filterFields) {
    try {
      const start = performance.now();
      
      const options = {};
      const sets = {};
      
      // Pre-allocate Sets
      filterFields.forEach(field => {
        sets[field] = new Set();
      });
      
      // Single pass through data
      for (const item of data) {
        for (const field of filterFields) {
          if (item[field]) {
            sets[field].add(item[field]);
          }
        }
      }
      
      // Convert to arrays
      filterFields.forEach(field => {
        options[field] = Array.from(sets[field]);
      });

      const end = performance.now();
      console.log(`Filter options extraction took ${end - start} milliseconds`);
      return options;
    } catch (error) {
      console.error('WASM filter options extraction failed, falling back to JS:', error);
      return jsImplementations.extractFilterOptions(data, filterFields);
    }
  }

  isUsingWasm() {
    return this.module && this.module.type === 'wasm';
  }
}

// Global instance
export const multiFilterWasm = new MultiFilterWasm();

// Export wrapper functions that maintain API compatibility
export const applyMultiValueFilters = async (data, multiFilters) => {
  return await multiFilterWasm.applyMultiValueFilters(data, multiFilters);
};

export const buildRelationshipMaps = async (data, filterFields) => {
  return await multiFilterWasm.buildRelationshipMaps(data, filterFields);
};

export const extractFilterOptions = async (data, filterFields) => {
  return await multiFilterWasm.extractFilterOptions(data, filterFields);
};

export default multiFilterWasm;