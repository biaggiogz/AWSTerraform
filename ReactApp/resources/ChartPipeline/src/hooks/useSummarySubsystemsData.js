import { useState, useEffect, useMemo } from 'react';
import Papa from 'papaparse';
import { wasmLoader } from '../wasm/wasm-loader';
import useDuckDBEnhanced from './useDuckDB.enhanced';

export const useSummarySubsystemsData = (filteredData = []) => {
  const [data, setData] = useState([]);
  const [aislData, setAislData] = useState([]);
  const [loopData, setLoopData] = useState([]);
  const [subsystemsInfoData, setSubsystemsInfoData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [wasmModules, setWasmModules] = useState({});

  const { executeQuery, createTable } = useDuckDBEnhanced();

  // Load WASM modules
  useEffect(() => {
    const loadWasmModules = async () => {
      try {
        const [aggregator, testpackProcessor, statsCalculator] = await Promise.all([
          wasmLoader.loadModule(
            'subsystem-aggregator',
            '/wasm/subsystem-aggregator.wasm',
            // JavaScript fallback
            {
              processMultipleCSVs: (csvData) => csvData,
              aggregateSubsystemStats: (data) => data,
              mergeDatasets: (datasets) => datasets[0] || []
            }
          ),
          wasmLoader.loadModule(
            'testpack-processor',
            '/wasm/testpack-processor.wasm',
            // JavaScript fallback
            {
              expandTestPacks: (data) => data,
              calculateTestPackProgress: (data) => data,
              groupTestPacksBySubsystem: (data) => data
            }
          ),
          wasmLoader.loadModule(
            'stats-calculator',
            '/wasm/stats-calculator.wasm',
            // JavaScript fallback
            {
              calculateAverages: (values) => values.reduce((a, b) => a + b, 0) / values.length,
              computeProgressPercentages: (done, total) => total > 0 ? (done / total) * 100 : 0,
              aggregateLoopStatistics: (data) => data
            }
          )
        ]);

        setWasmModules({
          aggregator,
          testpackProcessor,
          statsCalculator
        });
      } catch (err) {
        console.warn('WASM modules failed to load, using JavaScript fallbacks:', err);
        setWasmModules({});
      }
    };

    loadWasmModules();
  }, []);

  // Load CSV data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Use filtered data if available, otherwise fetch from CSV
        if (filteredData && filteredData.length > 0) {
          setData(filteredData);
        } else {
          const response = await fetch('/data/pipelinedata.csv');
          const csvText = await response.text();
          
          Papa.parse(csvText, {
            header: true,
            complete: (results) => setData(results.data),
            error: (error) => setError(`Error parsing CSV: ${error.message}`)
          });
        }
        
        // Load supporting datasets
        const [aislResponse, loopResponse, subsystemsInfoResponse] = await Promise.all([
          fetch('/data/aislamientos.csv'),
          fetch('/data/test_of_lazos_updated.csv'),
          fetch('/data/subsystems_info.csv')
        ]);

        const [aislCsvText, loopCsvText, subsystemsInfoCsvText] = await Promise.all([
          aislResponse.text(),
          loopResponse.text(),
          subsystemsInfoResponse.text()
        ]);

        // Parse all CSV files
        Papa.parse(aislCsvText, {
          header: true,
          complete: (results) => setAislData(results.data),
          error: (error) => setError(`Error parsing aislamientos CSV: ${error.message}`)
        });

        Papa.parse(loopCsvText, {
          header: true,
          complete: (results) => setLoopData(results.data),
          error: (error) => setError(`Error parsing loop CSV: ${error.message}`)
        });

        Papa.parse(subsystemsInfoCsvText, {
          header: true,
          complete: (results) => {
            setSubsystemsInfoData(results.data);
            setLoading(false);
          },
          error: (error) => {
            setError(`Error parsing subsystems info CSV: ${error.message}`);
            setLoading(false);
          }
        });

      } catch (error) {
        setError(`Error fetching CSV: ${error.message}`);
        setLoading(false);
      }
    };

    fetchData();
  }, [filteredData]);

  // Create DuckDB tables when data is loaded
  useEffect(() => {
    if (data.length > 0 && aislData.length > 0 && loopData.length > 0 && subsystemsInfoData.length > 0) {
      createTable('pipelinedata', data);
      createTable('aislamientos', aislData);
      createTable('loops', loopData);
      createTable('subsystems', subsystemsInfoData);
    }
  }, [data, aislData, loopData, subsystemsInfoData, createTable]);

  // Process data for TableA (Subsystem Overview)
  const tableAData = useMemo(() => {
    if (!data.length || !aislData.length || !loopData.length) return [];

    const startTime = performance.now();
    
    // Use WASM aggregator if available
    const aggregator = wasmModules.aggregator;
    
    if (aggregator && aggregator.type === 'wasm') {
      // WASM implementation would go here
      console.log('Using WASM aggregator for TableA data processing');
    }

    // JavaScript fallback implementation
    const subsystemStats = new Map();
    const aislStats = new Map();
    const loopStats = new Map();

    // Process aislamientos data
    aislData.forEach(item => {
      const subsystem = item['SUBSYSTEM'];
      if (!subsystem) return;
      
      if (!aislStats.has(subsystem)) {
        aislStats.set(subsystem, { totalItems: 0, doneItems: 0 });
      }
      
      const stats = aislStats.get(subsystem);
      stats.totalItems += 1;
      if (item['DONE'] === 'YES') stats.doneItems += 1;
    });

    // Process loop data
    loopData.forEach(item => {
      const subsystem = item['SUBS_PRE'];
      if (!subsystem) return;
      
      if (!loopStats.has(subsystem)) {
        loopStats.set(subsystem, { totalLoops: 0, doneLoops: 0, pendingLoops: 0 });
      }
      
      const stats = loopStats.get(subsystem);
      stats.totalLoops += 1;
      if (item['OK=100%'] === '100.00%') {
        stats.doneLoops += 1;
      } else {
        stats.pendingLoops += 1;
      }
    });

    // Process main data for subsystem overview
    data.forEach(item => {
      const subsystem = item['SUBSYSTEM'];
      if (!subsystem) return;

      if (!subsystemStats.has(subsystem)) {
        subsystemStats.set(subsystem, {
          serialNumber: item['S/N'] || '',
          fluid: item['FLUID_SUBSYSTEM'] || '',
          description: item['DESCRIPTION'] || '',
          testPacks: new Set()
        });
      }

      const stats = subsystemStats.get(subsystem);
      if (item['TEST PACK']) {
        item['TEST PACK'].split('|').forEach(tp => {
          const trimmedTp = tp.trim();
          if (trimmedTp) stats.testPacks.add(trimmedTp);
        });
      }
    });

    // Create TableA data
    const result = Array.from(subsystemStats.entries()).map(([subsystem, stats]) => {
      const aislStat = aislStats.get(subsystem) || { totalItems: 0, doneItems: 0 };
      const loopStat = loopStats.get(subsystem) || { totalLoops: 0, doneLoops: 0, pendingLoops: 0 };

      return {
        subsystem,
        serialNumber: stats.serialNumber,
        fluid: stats.fluid,
        description: stats.description,
        totalItems: aislStat.totalItems,
        doneItems: aislStat.doneItems,
        pendingItems: aislStat.totalItems - aislStat.doneItems,
        numTestPacks: stats.testPacks.size,
        totalLoops: loopStat.totalLoops,
        doneLoops: loopStat.doneLoops,
        pendingLoops: loopStat.pendingLoops
      };
    }).sort((a, b) => b.totalItems - a.totalItems);

    const processingTime = performance.now() - startTime;
    console.log(`TableA processing time: ${processingTime.toFixed(2)}ms`);

    return result;
  }, [data, aislData, loopData, wasmModules]);

  // Process data for TableB (Test Pack Details)
  const tableBData = useMemo(() => {
    if (!data.length) return [];

    const startTime = performance.now();
    
    // Use WASM testpack processor if available
    const testpackProcessor = wasmModules.testpackProcessor;
    
    if (testpackProcessor && testpackProcessor.type === 'wasm') {
      console.log('Using WASM testpack processor for TableB data processing');
    }

    // JavaScript fallback implementation
    const expandedData = [];

    data.forEach(item => {
      const subsystem = item['SUBSYSTEM'];
      if (!subsystem || !item['TEST PACK']) return;

      const testPacks = item['TEST PACK'].split('|');
      const progress = parseFloat(item['CONSTRUC COORD PROGRESS']) || 0;

      testPacks.forEach(tp => {
        const trimmedTp = tp.trim();
        if (trimmedTp) {
          expandedData.push({
            subsystem,
            testPack: trimmedTp,
            testPackProgress: progress,
            traceados: item['TRACEADOS'] || '',
            priority: item['PRIORITY'] || '',
            hito: item['HITO'] || '',
            teigaReinstatement: item['TEIGA REINSTATEMENT'] || '',
            teigaInsulation: item['TEIGA INSULATION'] || '',
            siemsa: item['SIEMSA'] || '',
            technip: item['TECHNIP'] || ''
          });
        }
      });
    });

    const processingTime = performance.now() - startTime;
    console.log(`TableB processing time: ${processingTime.toFixed(2)}ms`);

    return expandedData.sort((a, b) => a.subsystem.localeCompare(b.subsystem));
  }, [data, wasmModules]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    if (!tableAData.length || !tableBData.length) return {};

    const startTime = performance.now();
    
    // Use WASM stats calculator if available
    const statsCalculator = wasmModules.statsCalculator;
    
    if (statsCalculator && statsCalculator.type === 'wasm') {
      console.log('Using WASM stats calculator for summary statistics');
    }

    // JavaScript fallback implementation
    const uniqueSubsystems = new Set(tableAData.map(item => item.subsystem)).size;
    const uniqueTestPacks = new Set(tableBData.map(item => item.testPack)).size;
    
    const totalItemsSum = tableAData.reduce((sum, item) => sum + item.totalItems, 0);
    const totalDoneItemsSum = tableAData.reduce((sum, item) => sum + item.doneItems, 0);
    const totalPendingItemsSum = tableAData.reduce((sum, item) => sum + item.pendingItems, 0);
    
    const totalLoopsSum = tableAData.reduce((sum, item) => sum + item.totalLoops, 0);
    const totalPendingLoopsSum = tableAData.reduce((sum, item) => sum + item.pendingLoops, 0);
    
    const doneTestPacks = tableBData.filter(item => item.testPackProgress === 100).length;
    const pendingTestPacks = tableBData.filter(item => item.testPackProgress < 100).length;
    
    const avgProgressItemsPercent = tableAData.length > 0 ? 
      Math.round(tableAData.reduce((sum, item) => {
        const progress = item.totalItems > 0 ? (item.doneItems / item.totalItems) * 100 : 0;
        return sum + progress;
      }, 0) / tableAData.length) : 0;

    const processingTime = performance.now() - startTime;
    console.log(`Summary stats processing time: ${processingTime.toFixed(2)}ms`);

    return {
      uniqueSubsystems,
      uniqueTestPacks,
      totalItemsSum,
      totalDoneItemsSum,
      totalPendingItemsSum,
      totalLoopsSum,
      totalPendingLoopsSum,
      doneTestPacks,
      pendingTestPacks,
      avgProgressItemsPercent
    };
  }, [tableAData, tableBData, wasmModules]);

  return {
    tableAData,
    tableBData,
    loading,
    error,
    summaryStats
  };
};