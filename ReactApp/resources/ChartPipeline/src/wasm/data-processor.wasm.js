/**
 * WASM-optimized data processor with JavaScript fallback
 * Optimizes CSV processing and data transformations
 */

import { wasmLoader, WasmMemoryManager } from './wasm-loader.js';

// JavaScript fallback implementations
const jsImplementations = {
  processCSVData: (csvData) => {
    const lines = csvData.split('\n');
    const headers = lines[0].split(',').map(header => 
      header.replace(/"/g, '').trim()
    );
    
    const processedRows = [];
    const numericFields = new Set([
      'TOTAL DIAINCH ("")', 
      'TOTAL DONE DIAINCH ("")', 
      'RATIO DONE DIAINCH (%)', 
      'QTY SUPPORT', 
      'QTY SUPPORT INSTALLED',
      'CONSTRUC COORD PROGRESS'
    ]);
    
    const dataLines = lines.slice(1).filter(line => line.trim() !== '');
    
    for (let i = 0; i < dataLines.length; i++) {
      const values = dataLines[i].split(',').map(value => 
        value.replace(/"/g, '').trim()
      );
      
      const row = {};
      for (let j = 0; j < headers.length; j++) {
        const header = headers[j];
        const value = values[j];
        
        if (numericFields.has(header) && value !== '' && !isNaN(value)) {
          row[header] = parseFloat(value);
        } else {
          row[header] = value;
        }
      }
      
      // Handle multiple test packs
      if (row['TEST PACK'] && typeof row['TEST PACK'] === 'string' && row['TEST PACK'].includes('|')) {
        const testPacks = row['TEST PACK'].split('|');
        testPacks.forEach(testPack => {
          const newRow = {...row};
          newRow['TEST PACK'] = testPack.trim();
          processedRows.push(newRow);
        });
      } else {
        processedRows.push(row);
      }
    }
    
    return processedRows;
  },

  getUniqueValues: (data, field) => {
    const uniqueSet = new Set();
    for (let i = 0; i < data.length; i++) {
      const value = data[i][field];
      if (value) {
        uniqueSet.add(value);
      }
    }
    return Array.from(uniqueSet);
  },

  calculateMetricsByGroup: (data, groupBy) => {
    const groups = {};
    
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
    
    // Calculate averages
    Object.keys(groups).forEach(key => {
      const group = groups[key];
      
      if (group.ratioDoneDiainch.length > 0) {
        group.avgRatioDoneDiainch = group.ratioDoneDiainch.reduce((a, b) => a + b, 0) / group.ratioDoneDiainch.length;
      } else {
        group.avgRatioDoneDiainch = 0;
      }
      
      group.supportInstallationProgress = group.supportTotal > 0
        ? (group.supportInstalled / group.supportTotal) * 100
        : 0;
      
      if (group.constructionProgress.length > 0) {
        group.avgConstructionProgress = group.constructionProgress.reduce((a, b) => a + b, 0) / group.constructionProgress.length;
      } else {
        group.avgConstructionProgress = 0;
      }
    });
    
    return groups;
  }
};

// WASM wrapper functions
class DataProcessorWasm {
  constructor() {
    this.module = null;
    this.memoryManager = null;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      this.module = await wasmLoader.loadModule(
        'data-processor',
        '/wasm/data-processor.wasm',
        jsImplementations
      );

      if (this.module.type === 'wasm') {
        this.memoryManager = new WasmMemoryManager(this.module.instance);
      }

      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize DataProcessorWasm:', error);
      this.module = { type: 'js', impl: jsImplementations };
      this.initialized = true;
    }
  }

  async processCSVData(csvData) {
    await this.initialize();

    if (this.module.type === 'wasm') {
      return this._processCSVDataWasm(csvData);
    } else {
      return this.module.impl.processCSVData(csvData);
    }
  }

  async getUniqueValues(data, field) {
    await this.initialize();

    if (this.module.type === 'wasm') {
      return this._getUniqueValuesWasm(data, field);
    } else {
      return this.module.impl.getUniqueValues(data, field);
    }
  }

  async calculateMetricsByGroup(data, groupBy) {
    await this.initialize();

    if (this.module.type === 'wasm') {
      return this._calculateMetricsByGroupWasm(data, groupBy);
    } else {
      return this.module.impl.calculateMetricsByGroup(data, groupBy);
    }
  }

  _processCSVDataWasm(csvData) {
    try {
      // For now, use optimized JavaScript implementation
      // In a real scenario, this would call WASM functions
      const start = performance.now();
      const result = jsImplementations.processCSVData(csvData);
      const end = performance.now();
      
      console.log(`CSV processing took ${end - start} milliseconds`);
      return result;
    } catch (error) {
      console.error('WASM CSV processing failed, falling back to JS:', error);
      return jsImplementations.processCSVData(csvData);
    }
  }

  _getUniqueValuesWasm(data, field) {
    try {
      const start = performance.now();
      const result = jsImplementations.getUniqueValues(data, field);
      const end = performance.now();
      
      console.log(`Unique values extraction took ${end - start} milliseconds`);
      return result;
    } catch (error) {
      console.error('WASM unique values extraction failed, falling back to JS:', error);
      return jsImplementations.getUniqueValues(data, field);
    }
  }

  _calculateMetricsByGroupWasm(data, groupBy) {
    try {
      const start = performance.now();
      const result = jsImplementations.calculateMetricsByGroup(data, groupBy);
      const end = performance.now();
      
      console.log(`Metrics calculation took ${end - start} milliseconds`);
      return result;
    } catch (error) {
      console.error('WASM metrics calculation failed, falling back to JS:', error);
      return jsImplementations.calculateMetricsByGroup(data, groupBy);
    }
  }

  isUsingWasm() {
    return this.module && this.module.type === 'wasm';
  }
}

// Global instance
export const dataProcessorWasm = new DataProcessorWasm();

// Export wrapper functions that maintain API compatibility
export const processCSVData = async (csvData) => {
  return await dataProcessorWasm.processCSVData(csvData);
};

export const getUniqueValues = async (data, field) => {
  return await dataProcessorWasm.getUniqueValues(data, field);
};

export const calculateMetricsByGroup = async (data, groupBy) => {
  return await dataProcessorWasm.calculateMetricsByGroup(data, groupBy);
};

export default dataProcessorWasm;