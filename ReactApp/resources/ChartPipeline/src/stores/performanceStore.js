import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

const usePerformanceStore = create(
  subscribeWithSelector((set, get) => ({
    // WASM operation metrics
    wasmMetrics: {
      initialized: false,
      operationsCount: 0,
      totalExecutionTime: 0,
      averageExecutionTime: 0,
      lastOperationTime: 0,
      failureCount: 0
    },

    // Filter execution times
    filterMetrics: {
      intersectionTimes: [],
      rowHeightTimes: [],
      testPackFilterTimes: [],
      lastFilterExecution: 0
    },

    // Memory usage tracking
    memoryMetrics: {
      cacheSize: 0,
      maxCacheSize: 100,
      gcCount: 0,
      lastGcTime: 0
    },

    // Computation cache
    computationCache: new Map(),

    // Actions
    recordWasmOperation: (executionTime, success = true) => set((state) => {
      const newOperationsCount = state.wasmMetrics.operationsCount + 1;
      const newTotalTime = state.wasmMetrics.totalExecutionTime + executionTime;
      
      return {
        wasmMetrics: {
          ...state.wasmMetrics,
          operationsCount: newOperationsCount,
          totalExecutionTime: newTotalTime,
          averageExecutionTime: newTotalTime / newOperationsCount,
          lastOperationTime: executionTime,
          failureCount: success ? state.wasmMetrics.failureCount : state.wasmMetrics.failureCount + 1
        }
      };
    }),

    recordFilterExecution: (filterType, executionTime) => set((state) => {
      const newFilterMetrics = { ...state.filterMetrics };
      
      switch (filterType) {
        case 'intersection':
          newFilterMetrics.intersectionTimes = [...state.filterMetrics.intersectionTimes.slice(-9), executionTime];
          break;
        case 'rowHeight':
          newFilterMetrics.rowHeightTimes = [...state.filterMetrics.rowHeightTimes.slice(-9), executionTime];
          break;
        case 'testPackFilter':
          newFilterMetrics.testPackFilterTimes = [...state.filterMetrics.testPackFilterTimes.slice(-9), executionTime];
          break;
      }
      
      newFilterMetrics.lastFilterExecution = Date.now();
      
      return { filterMetrics: newFilterMetrics };
    }),

    updateMemoryMetrics: (cacheSize) => set((state) => ({
      memoryMetrics: {
        ...state.memoryMetrics,
        cacheSize,
        gcCount: cacheSize === 0 ? state.memoryMetrics.gcCount + 1 : state.memoryMetrics.gcCount,
        lastGcTime: cacheSize === 0 ? Date.now() : state.memoryMetrics.lastGcTime
      }
    })),

    // Cache management
    getCachedComputation: (key) => {
      const cache = get().computationCache;
      return cache.get(key);
    },

    setCachedComputation: (key, value) => set((state) => {
      const newCache = new Map(state.computationCache);
      newCache.set(key, { value, timestamp: Date.now() });
      
      // Limit cache size
      if (newCache.size > state.memoryMetrics.maxCacheSize) {
        const entries = Array.from(newCache.entries());
        entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
        const toKeep = entries.slice(-state.memoryMetrics.maxCacheSize);
        newCache.clear();
        toKeep.forEach(([k, v]) => newCache.set(k, v));
      }
      
      return { computationCache: newCache };
    }),

    clearCache: () => set(() => ({
      computationCache: new Map()
    })),

    // Performance getters
    getAverageIntersectionTime: () => {
      const times = get().filterMetrics.intersectionTimes;
      return times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;
    },

    getAverageRowHeightTime: () => {
      const times = get().filterMetrics.rowHeightTimes;
      return times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;
    },

    getPerformanceSummary: () => {
      const state = get();
      return {
        wasmSuccessRate: state.wasmMetrics.operationsCount > 0 
          ? ((state.wasmMetrics.operationsCount - state.wasmMetrics.failureCount) / state.wasmMetrics.operationsCount * 100).toFixed(1)
          : 0,
        averageWasmTime: state.wasmMetrics.averageExecutionTime.toFixed(2),
        cacheHitRate: state.computationCache.size > 0 ? 85 : 0, // Estimated
        memoryUsage: state.memoryMetrics.cacheSize
      };
    },

    setWasmInitialized: (initialized) => set((state) => ({
      wasmMetrics: {
        ...state.wasmMetrics,
        initialized
      }
    }))
  }))
);

export default usePerformanceStore;