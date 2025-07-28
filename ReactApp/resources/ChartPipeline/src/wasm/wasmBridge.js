import { initWasm, getWasmModule } from './filterEngine.wasm.js';

class WasmBridge {
  constructor() {
    this.module = null;
    this.memory = null;
    this.initialized = false;
    this.operationQueue = [];
    this.isProcessing = false;
  }

  async initialize() {
    try {
      const success = await initWasm();
      if (success) {
        this.module = getWasmModule();
        this.memory = this.module.exports.memory;
        this.initialized = true;
        this.processQueue();
      }
      return success;
    } catch (error) {
      console.warn('WASM initialization failed, falling back to JS:', error);
      return false;
    }
  }

  queueOperation(operation) {
    return new Promise((resolve, reject) => {
      this.operationQueue.push({ operation, resolve, reject });
      if (this.initialized && !this.isProcessing) {
        this.processQueue();
      }
    });
  }

  async processQueue() {
    if (this.isProcessing || this.operationQueue.length === 0) return;
    
    this.isProcessing = true;
    
    while (this.operationQueue.length > 0) {
      const { operation, resolve, reject } = this.operationQueue.shift();
      try {
        const result = await operation();
        resolve(result);
      } catch (error) {
        reject(error);
      }
    }
    
    this.isProcessing = false;
  }

  intersectSubsystems(set1, set2) {
    if (!this.initialized) {
      return this.intersectSubsystemsJS(set1, set2);
    }

    try {
      const memory = new Int32Array(this.memory.buffer);
      const set1Ptr = 0;
      const set2Ptr = set1.length * 4;

      // Copy data to WASM memory
      memory.set(set1, set1Ptr / 4);
      memory.set(set2, set2Ptr / 4);

      const resultPtr = this.module.exports.intersect_subsystems(
        set1Ptr, set1.length, set2Ptr, set2.length
      );

      const resultSize = memory[(resultPtr - 4) / 4];
      const result = new Array(resultSize);
      
      for (let i = 0; i < resultSize; i++) {
        result[i] = memory[resultPtr / 4 + i];
      }

      return result;
    } catch (error) {
      console.warn('WASM operation failed, using JS fallback:', error);
      return this.intersectSubsystemsJS(set1, set2);
    }
  }

  calculateRowHeights(textLengths) {
    if (!this.initialized) {
      return this.calculateRowHeightsJS(textLengths);
    }

    try {
      const memory = new Int32Array(this.memory.buffer);
      const lengthsPtr = 0;
      
      memory.set(textLengths, lengthsPtr / 4);
      
      const resultPtr = this.module.exports.calculate_batch_heights(lengthsPtr, textLengths.length);
      const result = new Array(textLengths.length);
      
      for (let i = 0; i < textLengths.length; i++) {
        result[i] = memory[resultPtr / 4 + i];
      }

      return result;
    } catch (error) {
      console.warn('WASM operation failed, using JS fallback:', error);
      return this.calculateRowHeightsJS(textLengths);
    }
  }

  intersectSubsystemsJS(set1, set2) {
    const result = [];
    const set2Set = new Set(set2);
    
    for (const item of set1) {
      if (set2Set.has(item)) {
        result.push(item);
      }
    }
    
    return result;
  }

  calculateRowHeightsJS(textLengths) {
    const charsPerLine = 15;
    const baseHeight = 40;
    const lineHeight = 16;
    
    return textLengths.map(length => {
      const linesNeeded = Math.ceil(length / charsPerLine);
      return Math.max(baseHeight, baseHeight + (linesNeeded - 1) * lineHeight);
    });
  }

  filterByTestPacksJS(tpIds, rowTpLists, listSizes) {
    const tpSet = new Set(tpIds.map(String));
    const result = [];
    
    for (let i = 0; i < listSizes.length; i++) {
      const currentList = rowTpLists.slice(i * 10, i * 10 + listSizes[i]);
      
      if (currentList.some(tpId => tpSet.has(String(tpId)))) {
        result.push(i);
      }
    }
    
    return result;
  }

  calculateMetricSumJS(values, indices) {
    return indices.reduce((sum, index) => sum + (values[index] || 0), 0);
  }
}

export default new WasmBridge();