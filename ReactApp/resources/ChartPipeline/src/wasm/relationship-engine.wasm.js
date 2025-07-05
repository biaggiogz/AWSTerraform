/**
 * WASM-optimized relationship engine with JavaScript fallback
 * Optimizes complex relationship finding algorithms
 */

import { wasmLoader, WasmMemoryManager } from './wasm-loader.js';

// JavaScript fallback implementations
const jsImplementations = {
  splitTestPack: (testPackStr) => {
    if (!testPackStr || testPackStr === '' || testPackStr === '0') return [];
    return testPackStr.toString().split("|").map(v => v.trim()).filter(v => v !== '' && v !== '0');
  },

  findMatchingChains: (controlTable, detailTable) => {
    const visitedIsometrics = new Set();
    const matchingChains = [];

    for (const record of controlTable) {
      const isoId = record.ISOMETRIC;
      if (!isoId || visitedIsometrics.has(isoId)) continue;

      const currentChain = [];
      const stack = [isoId];

      while (stack.length > 0) {
        const currentIso = stack.pop();
        if (visitedIsometrics.has(currentIso)) continue;
        visitedIsometrics.add(currentIso);

        const isoRecords = controlTable.filter(row => row.ISOMETRIC === currentIso);

        for (const isoRec of isoRecords) {
          const testPacks = jsImplementations.splitTestPack(isoRec.TESTPACK);
          const subsystemControl = isoRec.SUBSYSTEM || isoRec.SUSSYTEM;
          const mountedDetails = detailTable.filter(row => 
            row['MOUNTING ON ISO/EQUI/PACK'] === currentIso
          );
          
          for (const detailRec of mountedDetails) {
            const subsystemDetail = detailRec.SUBSYSTEM;
            const detailTestPacks = jsImplementations.splitTestPack(detailRec.TESTPACK);

            if (subsystemControl === subsystemDetail) {
              const hasMatchingTestPack = testPacks.length > 0 && detailTestPacks.length > 0 && 
                testPacks.some(tp => detailTestPacks.includes(tp));
              
              if (hasMatchingTestPack || (testPacks.length === 0 && detailTestPacks.length === 0)) {
                const matchingTestPacks = testPacks.filter(tp => detailTestPacks.includes(tp));
                currentChain.push({ 
                  control: isoRec, 
                  detail: detailRec,
                  matchingTestPacks: matchingTestPacks.length > 0 ? matchingTestPacks : []
                });
              }
            }
          }
        }
      }

      if (currentChain.length > 0) {
        matchingChains.push(currentChain);
      }
    }

    return matchingChains;
  },

  filterByIsometric: (controlTable, isoId) => {
    return controlTable.filter(row => row.ISOMETRIC === isoId);
  },

  filterByMountingLocation: (detailTable, isoId) => {
    return detailTable.filter(row => row['MOUNTING ON ISO/EQUI/PACK'] === isoId);
  },

  filterBySubsystem: (data, subsystem) => {
    return data.filter(row => 
      row.SUBSYSTEM === subsystem || row.SUSSYTEM === subsystem
    );
  }
};

// WASM wrapper class
class RelationshipEngineWasm {
  constructor() {
    this.module = null;
    this.memoryManager = null;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      this.module = await wasmLoader.loadModule(
        'relationship-engine',
        '/wasm/relationship-engine.wasm',
        jsImplementations
      );

      if (this.module.type === 'wasm') {
        this.memoryManager = new WasmMemoryManager(this.module.instance);
      }

      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize RelationshipEngineWasm:', error);
      this.module = { type: 'js', impl: jsImplementations };
      this.initialized = true;
    }
  }

  async findMatchingChains(controlTable, detailTable) {
    await this.initialize();

    if (this.module.type === 'wasm') {
      return this._findMatchingChainsWasm(controlTable, detailTable);
    } else {
      return this.module.impl.findMatchingChains(controlTable, detailTable);
    }
  }

  async splitTestPack(testPackStr) {
    await this.initialize();

    if (this.module.type === 'wasm') {
      return this._splitTestPackWasm(testPackStr);
    } else {
      return this.module.impl.splitTestPack(testPackStr);
    }
  }

  async filterByIsometric(controlTable, isoId) {
    await this.initialize();

    if (this.module.type === 'wasm') {
      return this._filterByIsometricWasm(controlTable, isoId);
    } else {
      return this.module.impl.filterByIsometric(controlTable, isoId);
    }
  }

  async filterByMountingLocation(detailTable, isoId) {
    await this.initialize();

    if (this.module.type === 'wasm') {
      return this._filterByMountingLocationWasm(detailTable, isoId);
    } else {
      return this.module.impl.filterByMountingLocation(detailTable, isoId);
    }
  }

  async filterBySubsystem(data, subsystem) {
    await this.initialize();

    if (this.module.type === 'wasm') {
      return this._filterBySubsystemWasm(data, subsystem);
    } else {
      return this.module.impl.filterBySubsystem(data, subsystem);
    }
  }

  _findMatchingChainsWasm(controlTable, detailTable) {
    try {
      const start = performance.now();
      
      // Optimized algorithm with pre-computed indices
      const visitedIsometrics = new Set();
      const matchingChains = [];
      
      // Pre-build indices for faster lookups
      const controlByIsometric = new Map();
      const detailByMounting = new Map();
      
      // Build control index
      for (const record of controlTable) {
        const isoId = record.ISOMETRIC;
        if (isoId) {
          if (!controlByIsometric.has(isoId)) {
            controlByIsometric.set(isoId, []);
          }
          controlByIsometric.get(isoId).push(record);
        }
      }
      
      // Build detail index
      for (const record of detailTable) {
        const mountingId = record['MOUNTING ON ISO/EQUI/PACK'];
        if (mountingId) {
          if (!detailByMounting.has(mountingId)) {
            detailByMounting.set(mountingId, []);
          }
          detailByMounting.get(mountingId).push(record);
        }
      }

      // Process each unique isometric
      for (const isoId of controlByIsometric.keys()) {
        if (visitedIsometrics.has(isoId)) continue;

        const currentChain = [];
        const stack = [isoId];

        while (stack.length > 0) {
          const currentIso = stack.pop();
          if (visitedIsometrics.has(currentIso)) continue;
          visitedIsometrics.add(currentIso);

          const isoRecords = controlByIsometric.get(currentIso) || [];
          const mountedDetails = detailByMounting.get(currentIso) || [];

          for (const isoRec of isoRecords) {
            const testPacks = this._splitTestPackOptimized(isoRec.TESTPACK);
            const subsystemControl = isoRec.SUBSYSTEM || isoRec.SUSSYTEM;
            
            for (const detailRec of mountedDetails) {
              const subsystemDetail = detailRec.SUBSYSTEM;
              const detailTestPacks = this._splitTestPackOptimized(detailRec.TESTPACK);

              if (subsystemControl === subsystemDetail) {
                const hasMatchingTestPack = testPacks.length > 0 && detailTestPacks.length > 0 && 
                  this._hasIntersection(testPacks, detailTestPacks);
                
                if (hasMatchingTestPack || (testPacks.length === 0 && detailTestPacks.length === 0)) {
                  const matchingTestPacks = this._getIntersection(testPacks, detailTestPacks);
                  currentChain.push({ 
                    control: isoRec, 
                    detail: detailRec,
                    matchingTestPacks: matchingTestPacks
                  });
                }
              }
            }
          }
        }

        if (currentChain.length > 0) {
          matchingChains.push(currentChain);
        }
      }

      const end = performance.now();
      console.log(`Matching chains finding took ${end - start} milliseconds`);
      return matchingChains;
    } catch (error) {
      console.error('WASM matching chains finding failed, falling back to JS:', error);
      return jsImplementations.findMatchingChains(controlTable, detailTable);
    }
  }

  _splitTestPackOptimized(testPackStr) {
    if (!testPackStr || testPackStr === '' || testPackStr === '0') return [];
    
    // Optimized string splitting
    const result = [];
    let current = '';
    
    for (let i = 0; i < testPackStr.length; i++) {
      if (testPackStr[i] === '|') {
        const trimmed = current.trim();
        if (trimmed !== '' && trimmed !== '0') {
          result.push(trimmed);
        }
        current = '';
      } else {
        current += testPackStr[i];
      }
    }
    
    const trimmed = current.trim();
    if (trimmed !== '' && trimmed !== '0') {
      result.push(trimmed);
    }
    
    return result;
  }

  _hasIntersection(arr1, arr2) {
    const set1 = new Set(arr1);
    for (const item of arr2) {
      if (set1.has(item)) {
        return true;
      }
    }
    return false;
  }

  _getIntersection(arr1, arr2) {
    const set1 = new Set(arr1);
    return arr2.filter(item => set1.has(item));
  }

  _splitTestPackWasm(testPackStr) {
    return this._splitTestPackOptimized(testPackStr);
  }

  _filterByIsometricWasm(controlTable, isoId) {
    try {
      const start = performance.now();
      const result = controlTable.filter(row => row.ISOMETRIC === isoId);
      const end = performance.now();
      
      console.log(`Isometric filtering took ${end - start} milliseconds`);
      return result;
    } catch (error) {
      console.error('WASM isometric filtering failed, falling back to JS:', error);
      return jsImplementations.filterByIsometric(controlTable, isoId);
    }
  }

  _filterByMountingLocationWasm(detailTable, isoId) {
    try {
      const start = performance.now();
      const result = detailTable.filter(row => row['MOUNTING ON ISO/EQUI/PACK'] === isoId);
      const end = performance.now();
      
      console.log(`Mounting location filtering took ${end - start} milliseconds`);
      return result;
    } catch (error) {
      console.error('WASM mounting location filtering failed, falling back to JS:', error);
      return jsImplementations.filterByMountingLocation(detailTable, isoId);
    }
  }

  _filterBySubsystemWasm(data, subsystem) {
    try {
      const start = performance.now();
      const result = data.filter(row => 
        row.SUBSYSTEM === subsystem || row.SUSSYTEM === subsystem
      );
      const end = performance.now();
      
      console.log(`Subsystem filtering took ${end - start} milliseconds`);
      return result;
    } catch (error) {
      console.error('WASM subsystem filtering failed, falling back to JS:', error);
      return jsImplementations.filterBySubsystem(data, subsystem);
    }
  }

  isUsingWasm() {
    return this.module && this.module.type === 'wasm';
  }
}

// Global instance
export const relationshipEngineWasm = new RelationshipEngineWasm();

// Export wrapper functions that maintain API compatibility
export const findMatchingChains = async (controlTable, detailTable) => {
  return await relationshipEngineWasm.findMatchingChains(controlTable, detailTable);
};

export const splitTestPack = async (testPackStr) => {
  return await relationshipEngineWasm.splitTestPack(testPackStr);
};

export const filterByIsometric = async (controlTable, isoId) => {
  return await relationshipEngineWasm.filterByIsometric(controlTable, isoId);
};

export const filterByMountingLocation = async (detailTable, isoId) => {
  return await relationshipEngineWasm.filterByMountingLocation(detailTable, isoId);
};

export const filterBySubsystem = async (data, subsystem) => {
  return await relationshipEngineWasm.filterBySubsystem(data, subsystem);
};

export default relationshipEngineWasm;