/**
 * Performance monitoring utilities for SolidJS + WASM integration
 * Provides real-time performance tracking and framework comparison
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      react: {
        renderTimes: [],
        memoryUsage: [],
        componentCount: 0,
        totalOperations: 0
      },
      solidjs: {
        renderTimes: [],
        memoryUsage: [],
        componentCount: 0,
        totalOperations: 0
      },
      wasm: {
        operationTimes: [],
        totalOperations: 0,
        failureCount: 0,
        successRate: 100
      }
    };
    
    this.isMonitoring = false;
    this.monitoringInterval = null;
    this.observers = [];
    this.performanceThresholds = {
      slowRender: 16, // 16ms (60fps)
      memoryWarning: 100, // 100MB
      wasmFailureRate: 10 // 10%
    };
  }

  // Start performance monitoring
  startMonitoring(interval = 1000) {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    console.log('🔍 Performance monitoring started');
    
    // Monitor memory usage
    this.monitoringInterval = setInterval(() => {
      this.collectMemoryMetrics();
      this.checkPerformanceThresholds();
      this.notifyObservers();
    }, interval);
    
    // Monitor React/SolidJS component rendering
    this.setupRenderMonitoring();
    
    // Monitor WASM operations
    this.setupWasmMonitoring();
  }

  // Stop performance monitoring
  stopMonitoring() {
    if (!this.isMonitoring) return;
    
    this.isMonitoring = false;
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    console.log('⏹️ Performance monitoring stopped');
  }

  // Record React component render time
  recordReactRender(componentName, renderTime) {
    this.metrics.react.renderTimes.push({
      component: componentName,
      time: renderTime,
      timestamp: Date.now()
    });
    
    this.metrics.react.totalOperations++;
    
    // Keep only last 100 measurements
    if (this.metrics.react.renderTimes.length > 100) {
      this.metrics.react.renderTimes.shift();
    }
    
    if (renderTime > this.performanceThresholds.slowRender) {
      console.warn(`⚠️ Slow React render: ${componentName} took ${renderTime.toFixed(2)}ms`);
    }
  }

  // Record SolidJS component render time
  recordSolidJSRender(componentName, renderTime) {
    this.metrics.solidjs.renderTimes.push({
      component: componentName,
      time: renderTime,
      timestamp: Date.now()
    });
    
    this.metrics.solidjs.totalOperations++;
    
    // Keep only last 100 measurements
    if (this.metrics.solidjs.renderTimes.length > 100) {
      this.metrics.solidjs.renderTimes.shift();
    }
    
    if (renderTime > this.performanceThresholds.slowRender) {
      console.warn(`⚠️ Slow SolidJS render: ${componentName} took ${renderTime.toFixed(2)}ms`);
    }
  }

  // Record WASM operation
  recordWasmOperation(operationName, operationTime, success = true) {
    this.metrics.wasm.operationTimes.push({
      operation: operationName,
      time: operationTime,
      success,
      timestamp: Date.now()
    });
    
    this.metrics.wasm.totalOperations++;
    
    if (!success) {
      this.metrics.wasm.failureCount++;
    }
    
    // Update success rate
    this.metrics.wasm.successRate = 
      ((this.metrics.wasm.totalOperations - this.metrics.wasm.failureCount) / 
       this.metrics.wasm.totalOperations) * 100;
    
    // Keep only last 100 measurements
    if (this.metrics.wasm.operationTimes.length > 100) {
      this.metrics.wasm.operationTimes.shift();
    }
  }

  // Collect memory usage metrics
  collectMemoryMetrics() {
    if (performance.memory) {
      const memoryInfo = {
        used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024), // MB
        total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024), // MB
        limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024), // MB
        timestamp: Date.now()
      };
      
      // Estimate React vs SolidJS memory usage based on component counts
      const totalComponents = this.metrics.react.componentCount + this.metrics.solidjs.componentCount;
      
      if (totalComponents > 0) {
        const reactRatio = this.metrics.react.componentCount / totalComponents;
        const solidjsRatio = this.metrics.solidjs.componentCount / totalComponents;
        
        this.metrics.react.memoryUsage.push({
          ...memoryInfo,
          estimated: Math.round(memoryInfo.used * reactRatio)
        });
        
        this.metrics.solidjs.memoryUsage.push({
          ...memoryInfo,
          estimated: Math.round(memoryInfo.used * solidjsRatio)
        });
      }
      
      // Keep only last 60 measurements (1 minute at 1s intervals)
      if (this.metrics.react.memoryUsage.length > 60) {
        this.metrics.react.memoryUsage.shift();
      }
      if (this.metrics.solidjs.memoryUsage.length > 60) {
        this.metrics.solidjs.memoryUsage.shift();
      }
    }
  }

  // Setup render monitoring
  setupRenderMonitoring() {
    // Monitor React renders via React DevTools API (if available)
    if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      const originalOnCommitFiberRoot = window.__REACT_DEVTOOLS_GLOBAL_HOOK__.onCommitFiberRoot;
      
      window.__REACT_DEVTOOLS_GLOBAL_HOOK__.onCommitFiberRoot = (id, root, ...args) => {
        const startTime = performance.now();
        
        if (originalOnCommitFiberRoot) {
          originalOnCommitFiberRoot(id, root, ...args);
        }
        
        const endTime = performance.now();
        this.recordReactRender('React Component', endTime - startTime);
        
        return originalOnCommitFiberRoot ? originalOnCommitFiberRoot(id, root, ...args) : undefined;
      };
    }
    
    // Monitor SolidJS renders via global hook
    if (window.solidjsPerformanceHook) {
      window.solidjsPerformanceHook.onRender = (componentName, renderTime) => {
        this.recordSolidJSRender(componentName, renderTime);
      };
    }
  }

  // Setup WASM monitoring
  setupWasmMonitoring() {
    // Monitor ultra processor if available
    if (window.ultraWasmProcessor) {
      const originalFilterTable = window.ultraWasmProcessor.filterTable;
      const originalSearchData = window.ultraWasmProcessor.searchData;
      const originalCategorizeProgress = window.ultraWasmProcessor.categorizeProgress;
      
      window.ultraWasmProcessor.filterTable = async (...args) => {
        const startTime = performance.now();
        try {
          const result = await originalFilterTable.apply(window.ultraWasmProcessor, args);
          const endTime = performance.now();
          this.recordWasmOperation('filterTable', endTime - startTime, true);
          return result;
        } catch (error) {
          const endTime = performance.now();
          this.recordWasmOperation('filterTable', endTime - startTime, false);
          throw error;
        }
      };
      
      window.ultraWasmProcessor.searchData = async (...args) => {
        const startTime = performance.now();
        try {
          const result = await originalSearchData.apply(window.ultraWasmProcessor, args);
          const endTime = performance.now();
          this.recordWasmOperation('searchData', endTime - startTime, true);
          return result;
        } catch (error) {
          const endTime = performance.now();
          this.recordWasmOperation('searchData', endTime - startTime, false);
          throw error;
        }
      };
      
      window.ultraWasmProcessor.categorizeProgress = async (...args) => {
        const startTime = performance.now();
        try {
          const result = await originalCategorizeProgress.apply(window.ultraWasmProcessor, args);
          const endTime = performance.now();
          this.recordWasmOperation('categorizeProgress', endTime - startTime, true);
          return result;
        } catch (error) {
          const endTime = performance.now();
          this.recordWasmOperation('categorizeProgress', endTime - startTime, false);
          throw error;
        }
      };
    }
  }

  // Check performance thresholds and issue warnings
  checkPerformanceThresholds() {
    // Check memory usage
    const latestReactMemory = this.metrics.react.memoryUsage[this.metrics.react.memoryUsage.length - 1];
    const latestSolidJSMemory = this.metrics.solidjs.memoryUsage[this.metrics.solidjs.memoryUsage.length - 1];
    
    if (latestReactMemory && latestReactMemory.used > this.performanceThresholds.memoryWarning) {
      console.warn(`⚠️ High memory usage detected: ${latestReactMemory.used}MB`);
    }
    
    // Check WASM failure rate
    if (this.metrics.wasm.successRate < (100 - this.performanceThresholds.wasmFailureRate)) {
      console.warn(`⚠️ High WASM failure rate: ${(100 - this.metrics.wasm.successRate).toFixed(1)}%`);
    }
  }

  // Get performance comparison
  getPerformanceComparison() {
    const reactAvgRender = this.getAverageRenderTime('react');
    const solidjsAvgRender = this.getAverageRenderTime('solidjs');
    const wasmAvgOperation = this.getAverageWasmTime();
    
    const reactMemory = this.getAverageMemoryUsage('react');
    const solidjsMemory = this.getAverageMemoryUsage('solidjs');
    
    return {
      rendering: {
        react: {
          averageTime: reactAvgRender,
          operations: this.metrics.react.totalOperations,
          components: this.metrics.react.componentCount
        },
        solidjs: {
          averageTime: solidjsAvgRender,
          operations: this.metrics.solidjs.totalOperations,
          components: this.metrics.solidjs.componentCount
        },
        improvement: reactAvgRender > 0 ? (reactAvgRender / solidjsAvgRender) : 1
      },
      memory: {
        react: reactMemory,
        solidjs: solidjsMemory,
        reduction: reactMemory > 0 ? ((reactMemory - solidjsMemory) / reactMemory) * 100 : 0
      },
      wasm: {
        averageTime: wasmAvgOperation,
        operations: this.metrics.wasm.totalOperations,
        successRate: this.metrics.wasm.successRate
      }
    };
  }

  // Helper methods
  getAverageRenderTime(framework) {
    const renderTimes = this.metrics[framework].renderTimes;
    if (renderTimes.length === 0) return 0;
    
    const sum = renderTimes.reduce((acc, item) => acc + item.time, 0);
    return Math.round((sum / renderTimes.length) * 100) / 100;
  }

  getAverageMemoryUsage(framework) {
    const memoryUsage = this.metrics[framework].memoryUsage;
    if (memoryUsage.length === 0) return 0;
    
    const sum = memoryUsage.reduce((acc, item) => acc + (item.estimated || item.used), 0);
    return Math.round((sum / memoryUsage.length) * 100) / 100;
  }

  getAverageWasmTime() {
    const operationTimes = this.metrics.wasm.operationTimes;
    if (operationTimes.length === 0) return 0;
    
    const sum = operationTimes.reduce((acc, item) => acc + item.time, 0);
    return Math.round((sum / operationTimes.length) * 100) / 100;
  }

  // Observer pattern for real-time updates
  addObserver(callback) {
    this.observers.push(callback);
  }

  removeObserver(callback) {
    this.observers = this.observers.filter(obs => obs !== callback);
  }

  notifyObservers() {
    const comparison = this.getPerformanceComparison();
    this.observers.forEach(callback => {
      try {
        callback(comparison);
      } catch (error) {
        console.error('Performance monitor observer error:', error);
      }
    });
  }

  // Update component counts
  updateComponentCount(framework, count) {
    this.metrics[framework].componentCount = count;
  }

  // Get current metrics
  getCurrentMetrics() {
    return {
      ...this.metrics,
      isMonitoring: this.isMonitoring,
      thresholds: this.performanceThresholds
    };
  }

  // Reset all metrics
  resetMetrics() {
    this.metrics = {
      react: {
        renderTimes: [],
        memoryUsage: [],
        componentCount: 0,
        totalOperations: 0
      },
      solidjs: {
        renderTimes: [],
        memoryUsage: [],
        componentCount: 0,
        totalOperations: 0
      },
      wasm: {
        operationTimes: [],
        totalOperations: 0,
        failureCount: 0,
        successRate: 100
      }
    };
    
    console.log('📊 Performance metrics reset');
  }
}

// Create global instance
const performanceMonitor = new PerformanceMonitor();

// Auto-start monitoring if enabled
if (typeof window !== 'undefined') {
  window.solidjsPerformanceMonitor = performanceMonitor;
  
  // Check for auto-start flag
  if (localStorage.getItem('solidjs-performance-monitoring') === 'true') {
    performanceMonitor.startMonitoring();
  }
}

export default performanceMonitor;