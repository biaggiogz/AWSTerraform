/**
 * Enhanced WASM Loader for SUMMARY SUBSYSTEMS
 * Handles loading of specialized WASM modules with performance monitoring
 */

import { wasmLoader, WasmMemoryManager } from './wasm-loader';

class EnhancedWasmLoader extends wasmLoader.constructor {
  constructor() {
    super();
    this.performanceMetrics = new Map();
    this.memoryManagers = new Map();
  }

  /**
   * Load subsystem aggregator WASM module
   * @returns {Promise<Object>} Aggregator module
   */
  async loadSubsystemAggregator() {
    const fallbackImpl = {
      processMultipleCSVs: (csvData) => {
        const startTime = performance.now();
        // JavaScript implementation for parallel CSV processing
        const processed = csvData.map(data => {
          if (Array.isArray(data)) {
            return data.filter(row => row && Object.keys(row).length > 0);
          }
          return data;
        });
        const processingTime = performance.now() - startTime;
        this.recordPerformance('processMultipleCSVs', processingTime, 'js');
        return processed;
      },

      aggregateSubsystemStats: (data) => {
        const startTime = performance.now();
        const stats = new Map();
        
        data.forEach(item => {
          const subsystem = item['SUBSYSTEM'];
          if (!subsystem) return;
          
          if (!stats.has(subsystem)) {
            stats.set(subsystem, {
              totalItems: 0,
              doneItems: 0,
              testPacks: new Set(),
              progressValues: []
            });
          }
          
          const stat = stats.get(subsystem);
          stat.totalItems += 1;
          
          const progress = parseFloat(item['CONSTRUC COORD PROGRESS']) || 0;
          stat.progressValues.push(progress);
          
          if (progress >= 90) stat.doneItems += 1;
          
          if (item['TEST PACK']) {
            item['TEST PACK'].split('|').forEach(tp => {
              const trimmed = tp.trim();
              if (trimmed) stat.testPacks.add(trimmed);
            });
          }
        });
        
        const processingTime = performance.now() - startTime;
        this.recordPerformance('aggregateSubsystemStats', processingTime, 'js');
        return stats;
      },

      mergeDatasets: (datasets) => {
        const startTime = performance.now();
        const merged = [];
        
        datasets.forEach((dataset, index) => {
          if (Array.isArray(dataset)) {
            dataset.forEach(item => {
              merged.push({ ...item, _sourceDataset: index });
            });
          }
        });
        
        const processingTime = performance.now() - startTime;
        this.recordPerformance('mergeDatasets', processingTime, 'js');
        return merged;
      }
    };

    return await this.loadModule(
      'subsystem-aggregator',
      '/wasm/subsystem-aggregator.wasm',
      fallbackImpl
    );
  }

  /**
   * Load test pack processor WASM module
   * @returns {Promise<Object>} Test pack processor module
   */
  async loadTestPackProcessor() {
    const fallbackImpl = {
      expandTestPacks: (data) => {
        const startTime = performance.now();
        const expanded = [];
        
        data.forEach(item => {
          if (!item['TEST PACK']) {
            expanded.push(item);
            return;
          }
          
          const testPacks = item['TEST PACK'].split('|');
          testPacks.forEach(tp => {
            const trimmedTp = tp.trim();
            if (trimmedTp) {
              expanded.push({
                ...item,
                testPack: trimmedTp,
                _originalTestPack: item['TEST PACK']
              });
            }
          });
        });
        
        const processingTime = performance.now() - startTime;
        this.recordPerformance('expandTestPacks', processingTime, 'js');
        return expanded;
      },

      calculateTestPackProgress: (data) => {
        const startTime = performance.now();
        const progressMap = new Map();
        
        data.forEach(item => {
          const key = `${item.subsystem}-${item.testPack}`;
          const progress = parseFloat(item['CONSTRUC COORD PROGRESS']) || 0;
          
          if (!progressMap.has(key)) {
            progressMap.set(key, []);
          }
          progressMap.get(key).push(progress);
        });
        
        // Calculate average progress for each test pack
        const result = data.map(item => {
          const key = `${item.subsystem}-${item.testPack}`;
          const progressValues = progressMap.get(key) || [0];
          const avgProgress = progressValues.reduce((a, b) => a + b, 0) / progressValues.length;
          
          return {
            ...item,
            calculatedProgress: avgProgress
          };
        });
        
        const processingTime = performance.now() - startTime;
        this.recordPerformance('calculateTestPackProgress', processingTime, 'js');
        return result;
      },

      groupTestPacksBySubsystem: (data) => {
        const startTime = performance.now();
        const groups = new Map();
        
        data.forEach(item => {
          const subsystem = item.subsystem || item['SUBSYSTEM'];
          if (!subsystem) return;
          
          if (!groups.has(subsystem)) {
            groups.set(subsystem, []);
          }
          groups.get(subsystem).push(item);
        });
        
        const processingTime = performance.now() - startTime;
        this.recordPerformance('groupTestPacksBySubsystem', processingTime, 'js');
        return groups;
      }
    };

    return await this.loadModule(
      'testpack-processor',
      '/wasm/testpack-processor.wasm',
      fallbackImpl
    );
  }

  /**
   * Load statistical calculations WASM module
   * @returns {Promise<Object>} Stats calculator module
   */
  async loadStatsCalculator() {
    const fallbackImpl = {
      calculateAverages: (values) => {
        const startTime = performance.now();
        const numericValues = values.filter(v => !isNaN(parseFloat(v))).map(v => parseFloat(v));
        const average = numericValues.length > 0 ? 
          numericValues.reduce((a, b) => a + b, 0) / numericValues.length : 0;
        
        const processingTime = performance.now() - startTime;
        this.recordPerformance('calculateAverages', processingTime, 'js');
        return average;
      },

      computeProgressPercentages: (done, total) => {
        const startTime = performance.now();
        const percentage = total > 0 ? (done / total) * 100 : 0;
        
        const processingTime = performance.now() - startTime;
        this.recordPerformance('computeProgressPercentages', processingTime, 'js');
        return Math.round(percentage * 100) / 100; // Round to 2 decimal places
      },

      aggregateLoopStatistics: (loopData) => {
        const startTime = performance.now();
        const stats = {
          totalLoops: loopData.length,
          completedLoops: 0,
          pendingLoops: 0,
          averageCompletion: 0
        };
        
        let totalCompletion = 0;
        loopData.forEach(loop => {
          const completion = loop['OK=100%'] === '100.00%' ? 100 : 0;
          totalCompletion += completion;
          
          if (completion === 100) {
            stats.completedLoops += 1;
          } else {
            stats.pendingLoops += 1;
          }
        });
        
        stats.averageCompletion = stats.totalLoops > 0 ? 
          totalCompletion / stats.totalLoops : 0;
        
        const processingTime = performance.now() - startTime;
        this.recordPerformance('aggregateLoopStatistics', processingTime, 'js');
        return stats;
      }
    };

    return await this.loadModule(
      'stats-calculator',
      '/wasm/stats-calculator.wasm',
      fallbackImpl
    );
  }

  /**
   * Record performance metrics for operations
   * @param {string} operation - Operation name
   * @param {number} time - Processing time in milliseconds
   * @param {string} type - 'wasm' or 'js'
   */
  recordPerformance(operation, time, type) {
    if (!this.performanceMetrics.has(operation)) {
      this.performanceMetrics.set(operation, []);
    }
    
    this.performanceMetrics.get(operation).push({
      time,
      type,
      timestamp: Date.now()
    });
  }

  /**
   * Get performance comparison between WASM and JavaScript implementations
   * @returns {Object} Performance metrics
   */
  getPerformanceComparison() {
    const comparison = {};
    
    this.performanceMetrics.forEach((metrics, operation) => {
      const wasmMetrics = metrics.filter(m => m.type === 'wasm');
      const jsMetrics = metrics.filter(m => m.type === 'js');
      
      const wasmAvg = wasmMetrics.length > 0 ? 
        wasmMetrics.reduce((sum, m) => sum + m.time, 0) / wasmMetrics.length : 0;
      const jsAvg = jsMetrics.length > 0 ? 
        jsMetrics.reduce((sum, m) => sum + m.time, 0) / jsMetrics.length : 0;
      
      comparison[operation] = {
        wasmAverage: Math.round(wasmAvg * 100) / 100,
        jsAverage: Math.round(jsAvg * 100) / 100,
        performanceGain: jsAvg > 0 ? Math.round((jsAvg / wasmAvg) * 100) / 100 : 1,
        wasmCount: wasmMetrics.length,
        jsCount: jsMetrics.length
      };
    });
    
    return comparison;
  }

  /**
   * Initialize memory manager for a WASM instance
   * @param {string} moduleName - Module name
   * @param {Object} wasmInstance - WASM instance
   * @returns {WasmMemoryManager} Memory manager
   */
  initializeMemoryManager(moduleName, wasmInstance) {
    const memoryManager = new WasmMemoryManager(wasmInstance);
    this.memoryManagers.set(moduleName, memoryManager);
    return memoryManager;
  }

  /**
   * Clean up all memory managers
   */
  cleanup() {
    this.memoryManagers.forEach(manager => {
      manager.freeAll();
    });
    this.memoryManagers.clear();
  }

  /**
   * Get overall performance metrics
   * @returns {Object} Overall metrics
   */
  getOverallMetrics() {
    const totalOperations = Array.from(this.performanceMetrics.values())
      .reduce((sum, metrics) => sum + metrics.length, 0);
    
    const wasmOperations = Array.from(this.performanceMetrics.values())
      .reduce((sum, metrics) => sum + metrics.filter(m => m.type === 'wasm').length, 0);
    
    return {
      totalOperations,
      wasmOperations,
      jsOperations: totalOperations - wasmOperations,
      wasmUtilization: totalOperations > 0 ? (wasmOperations / totalOperations) * 100 : 0,
      modulesLoaded: this.modules.size,
      memoryManagersActive: this.memoryManagers.size
    };
  }
}

// Export enhanced WASM loader instance
export const enhancedWasmLoader = new EnhancedWasmLoader();

export default enhancedWasmLoader;