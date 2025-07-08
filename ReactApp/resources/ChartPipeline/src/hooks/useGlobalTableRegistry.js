import { useState, useCallback, useRef, useEffect } from 'react';
import { dataProcessorWasm } from '../wasm/data-processor.wasm';

// Global table registry for cross-tab access
const globalTableRegistry = new Map();
const registryListeners = new Set();

const useGlobalTableRegistry = () => {
  const [tables, setTables] = useState(new Map(globalTableRegistry));
  const listenerRef = useRef();

  // Register listener for global updates
  useEffect(() => {
    const listener = () => {
      setTables(new Map(globalTableRegistry));
    };
    
    listenerRef.current = listener;
    registryListeners.add(listener);
    
    return () => {
      registryListeners.delete(listener);
    };
  }, []);

  // Notify all listeners of registry changes
  const notifyListeners = useCallback(() => {
    registryListeners.forEach(listener => listener());
  }, []);

  // Register table globally
  const registerTable = useCallback(async (tableName, data, metadata = {}) => {
    if (!data || data.length === 0) return false;

    try {
      // Process data with WASM if available
      let processedData = data;
      if (dataProcessorWasm.isUsingWasm()) {
        const uniqueValues = await dataProcessorWasm.getUniqueValues(data, 'SUBSYSTEM');
        metadata.uniqueSubsystems = uniqueValues;
      }

      const tableInfo = {
        name: tableName,
        data: processedData,
        metadata: {
          ...metadata,
          rowCount: processedData.length,
          columns: processedData.length > 0 ? Object.keys(processedData[0]) : [],
          registeredAt: Date.now(),
          source: metadata.source || 'unknown'
        }
      };

      globalTableRegistry.set(tableName, tableInfo);
      notifyListeners();
      
      console.log(`Table "${tableName}" registered globally with ${processedData.length} rows`);
      return true;
    } catch (error) {
      console.error(`Failed to register table "${tableName}":`, error);
      return false;
    }
  }, [notifyListeners]);

  // Auto-register SUMMARY SUBSYSTEMS tables
  const registerSummarySubsystemsTables = useCallback(async (tableAData, tableBData) => {
    const results = await Promise.all([
      registerTable('subsystem_overview', tableAData, { 
        source: 'SUMMARY_SUBSYSTEMS_A',
        description: 'Subsystem overview with items and loops progress'
      }),
      registerTable('test_pack_details', tableBData, { 
        source: 'SUMMARY_SUBSYSTEMS_B',
        description: 'Test pack details with progress and contractor info'
      })
    ]);
    
    return results.every(result => result);
  }, [registerTable]);

  // Register cross-tab tables from other dashboard tabs
  const registerCrossTabTables = useCallback(async (crossTabData) => {
    const registrationPromises = [];

    // Control Instruments data
    if (crossTabData.controlInstruments) {
      registrationPromises.push(
        registerTable('control_instruments', crossTabData.controlInstruments, {
          source: 'INSTRUMENTS_TAB',
          description: 'Control instruments data from Instruments tab'
        })
      );
    }

    // Details Instruments data
    if (crossTabData.detailsInstruments) {
      registrationPromises.push(
        registerTable('details_instruments', crossTabData.detailsInstruments, {
          source: 'INSTRUMENTS_TAB',
          description: 'Details instruments data from Instruments tab'
        })
      );
    }

    // Insulation Progress data
    if (crossTabData.insulationProgress) {
      registrationPromises.push(
        registerTable('insulation_progress', crossTabData.insulationProgress, {
          source: 'INSULATION_TAB',
          description: 'Insulation progress data from Insulation tab'
        })
      );
    }

    // Loop Test data
    if (crossTabData.loopTest) {
      registrationPromises.push(
        registerTable('loop_test', crossTabData.loopTest, {
          source: 'LOOP_TEST_TAB',
          description: 'Loop test data from Loop Test tab'
        })
      );
    }

    const results = await Promise.all(registrationPromises);
    return results.every(result => result);
  }, [registerTable]);

  // Get table by name
  const getTable = useCallback((tableName) => {
    return globalTableRegistry.get(tableName);
  }, []);

  // Get all available tables
  const getAvailableTables = useCallback(() => {
    return Array.from(globalTableRegistry.keys());
  }, []);

  // Get tables by source
  const getTablesBySource = useCallback((source) => {
    const result = [];
    for (const [name, info] of globalTableRegistry) {
      if (info.metadata.source === source) {
        result.push({ name, ...info });
      }
    }
    return result;
  }, []);

  // Unregister table
  const unregisterTable = useCallback((tableName) => {
    const deleted = globalTableRegistry.delete(tableName);
    if (deleted) {
      notifyListeners();
      console.log(`Table "${tableName}" unregistered`);
    }
    return deleted;
  }, [notifyListeners]);

  // Get registry statistics
  const getRegistryStats = useCallback(() => {
    const stats = {
      totalTables: globalTableRegistry.size,
      totalRows: 0,
      sources: new Set(),
      tablesBySource: {}
    };

    for (const [name, info] of globalTableRegistry) {
      stats.totalRows += info.metadata.rowCount;
      stats.sources.add(info.metadata.source);
      
      if (!stats.tablesBySource[info.metadata.source]) {
        stats.tablesBySource[info.metadata.source] = [];
      }
      stats.tablesBySource[info.metadata.source].push(name);
    }

    stats.sources = Array.from(stats.sources);
    return stats;
  }, []);

  return {
    tables,
    registerTable,
    registerSummarySubsystemsTables,
    registerCrossTabTables,
    getTable,
    getAvailableTables,
    getTablesBySource,
    unregisterTable,
    getRegistryStats
  };
};

export default useGlobalTableRegistry;