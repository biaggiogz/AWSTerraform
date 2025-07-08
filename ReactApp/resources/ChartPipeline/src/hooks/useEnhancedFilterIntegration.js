import { useState, useCallback, useEffect, useRef } from 'react';
import { multiFilterWasm } from '../wasm/multi-filter.wasm';

const useEnhancedFilterIntegration = (tableAData, tableBData, globalTableRegistry) => {
  const [activeFilters, setActiveFilters] = useState({});
  const [filteredData, setFilteredData] = useState({
    tableA: tableAData,
    tableB: tableBData,
    crossTab: {}
  });
  const [localMetrics, setLocalMetrics] = useState(new Map());
  const [globalMetrics, setGlobalMetrics] = useState(new Map());
  const filterCache = useRef(new Map());

  // Apply filters to data with WASM acceleration
  const applyFilters = useCallback(async (data, filters, tableName) => {
    if (!data || data.length === 0) return data;
    
    const cacheKey = `${tableName}_${JSON.stringify(filters)}`;
    if (filterCache.current.has(cacheKey)) {
      return filterCache.current.get(cacheKey);
    }

    try {
      let filteredResult;
      
      if (multiFilterWasm.isUsingWasm()) {
        filteredResult = await multiFilterWasm.applyMultiValueFilters(data, filters);
      } else {
        // JavaScript fallback
        filteredResult = data.filter(item => {
          for (const [key, values] of Object.entries(filters)) {
            if (Array.isArray(values) && values.length > 0) {
              if (!values.includes(item[key])) {
                return false;
              }
            }
          }
          return true;
        });
      }

      // Cache result
      filterCache.current.set(cacheKey, filteredResult);
      
      // Limit cache size
      if (filterCache.current.size > 20) {
        const firstKey = filterCache.current.keys().next().value;
        filterCache.current.delete(firstKey);
      }

      return filteredResult;
    } catch (error) {
      console.error('Filter application failed:', error);
      return data;
    }
  }, []);

  // Update filters and apply to all relevant data
  const updateFilters = useCallback(async (newFilters) => {
    setActiveFilters(newFilters);

    // Apply filters to main tables
    const [filteredTableA, filteredTableB] = await Promise.all([
      applyFilters(tableAData, newFilters, 'tableA'),
      applyFilters(tableBData, newFilters, 'tableB')
    ]);

    // Apply filters to cross-tab tables
    const crossTabFiltered = {};
    const crossTabPromises = [];
    
    if (globalTableRegistry) {
      const availableTables = globalTableRegistry.getAvailableTables();
      
      for (const tableName of availableTables) {
        const tableInfo = globalTableRegistry.getTable(tableName);
        if (tableInfo && tableInfo.data) {
          crossTabPromises.push(
            applyFilters(tableInfo.data, newFilters, tableName).then(filtered => {
              crossTabFiltered[tableName] = filtered;
            })
          );
        }
      }
    }

    await Promise.all(crossTabPromises);

    setFilteredData({
      tableA: filteredTableA,
      tableB: filteredTableB,
      crossTab: crossTabFiltered
    });

    // Update local metrics
    updateLocalMetrics(newFilters);
  }, [tableAData, tableBData, globalTableRegistry, applyFilters]);

  // Update local metrics when filters change
  const updateLocalMetrics = useCallback(async (filters) => {
    const updatedMetrics = new Map();
    
    for (const [metricId, metric] of localMetrics) {
      if (!metric.isFrozen) {
        try {
          // Re-calculate metric with filtered data
          const newValue = await calculateMetricValue(metric, filters);
          updatedMetrics.set(metricId, {
            ...metric,
            value: newValue,
            lastUpdated: Date.now()
          });
        } catch (error) {
          console.error(`Failed to update local metric ${metricId}:`, error);
          updatedMetrics.set(metricId, metric);
        }
      } else {
        updatedMetrics.set(metricId, metric);
      }
    }
    
    setLocalMetrics(updatedMetrics);
  }, [localMetrics]);

  // Calculate metric value (simplified implementation)
  const calculateMetricValue = useCallback(async (metric, filters) => {
    // This would integrate with the SQL execution system
    // For now, return a mock calculation
    const baseValue = metric.baseValue || 0;
    const filterCount = Object.keys(filters).length;
    return Math.max(0, baseValue - (filterCount * 10));
  }, []);

  // Add local metric
  const addLocalMetric = useCallback((metricId, metricConfig) => {
    const newMetric = {
      ...metricConfig,
      id: metricId,
      isLocal: true,
      isFrozen: false,
      lastUpdated: Date.now()
    };
    
    setLocalMetrics(prev => new Map(prev).set(metricId, newMetric));
  }, []);

  // Add global metric
  const addGlobalMetric = useCallback((metricId, metricConfig) => {
    const newMetric = {
      ...metricConfig,
      id: metricId,
      isLocal: false,
      isFrozen: true, // Global metrics are always frozen
      lastUpdated: Date.now()
    };
    
    setGlobalMetrics(prev => new Map(prev).set(metricId, newMetric));
  }, []);

  // Toggle metric freeze state
  const toggleMetricFreeze = useCallback((metricId) => {
    setLocalMetrics(prev => {
      const newMap = new Map(prev);
      const metric = newMap.get(metricId);
      if (metric) {
        newMap.set(metricId, { ...metric, isFrozen: !metric.isFrozen });
      }
      return newMap;
    });
  }, []);

  // Get filter statistics
  const getFilterStats = useCallback(() => {
    const stats = {
      activeFilters: Object.keys(activeFilters).length,
      filteredRows: {
        tableA: filteredData.tableA?.length || 0,
        tableB: filteredData.tableB?.length || 0,
        crossTab: Object.keys(filteredData.crossTab).length
      },
      originalRows: {
        tableA: tableAData?.length || 0,
        tableB: tableBData?.length || 0
      },
      localMetrics: localMetrics.size,
      globalMetrics: globalMetrics.size,
      cacheSize: filterCache.current.size
    };

    stats.reductionPercentage = {
      tableA: stats.originalRows.tableA > 0 ? 
        Math.round((1 - stats.filteredRows.tableA / stats.originalRows.tableA) * 100) : 0,
      tableB: stats.originalRows.tableB > 0 ? 
        Math.round((1 - stats.filteredRows.tableB / stats.originalRows.tableB) * 100) : 0
    };

    return stats;
  }, [activeFilters, filteredData, tableAData, tableBData, localMetrics, globalMetrics]);

  // Clear filter cache
  const clearFilterCache = useCallback(() => {
    filterCache.current.clear();
    console.log('Filter cache cleared');
  }, []);

  // Initialize with empty filters
  useEffect(() => {
    updateFilters({});
  }, [tableAData, tableBData]);

  return {
    activeFilters,
    filteredData,
    localMetrics,
    globalMetrics,
    updateFilters,
    addLocalMetric,
    addGlobalMetric,
    toggleMetricFreeze,
    getFilterStats,
    clearFilterCache
  };
};

export default useEnhancedFilterIntegration;