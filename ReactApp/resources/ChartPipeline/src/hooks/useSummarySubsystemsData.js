import { useState, useEffect, useMemo } from 'react';
import Papa from 'papaparse';
import { wasmLoader } from '../wasm/wasm-loader';
import useDuckDBEnhanced from './useDuckDB.enhanced';

export const useSummarySubsystemsData = (filteredData = []) => {
  const [data, setData] = useState([]);
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
          // Load data for Table B
          const response = await fetch('/data/pipelinedata.csv');
          const csvText = await response.text();
          
          Papa.parse(csvText, {
            header: true,
            complete: (results) => setData(results.data),
            error: (error) => setError(`Error parsing CSV: ${error.message}`)
          });
        }
        
        // Load only ssm.csv for Table A
        const ssmResponse = await fetch('/data/ssm.csv');
        const ssmCsvText = await ssmResponse.text();

        // Parse SSM CSV file
        Papa.parse(ssmCsvText, {
          header: true,
          dynamicTyping: true, // Convert numeric strings to numbers
          complete: (results) => {
            console.log('SSM CSV data sample:', results.data[0]);
            // Store the SSM data in the component state for Table A
            window.ssmData = results.data;
            setLoading(false);
          },
          error: (error) => {
            setError(`Error parsing SSM CSV: ${error.message}`);
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
    if (data.length > 0) {
      createTable('pipelinedata', data);
    }
  }, [data, createTable]);

  // Use SSM CSV data directly for TableA
  const tableAData = useMemo(() => {
    // Use the SSM data from window object (set during data loading)
    const ssmData = window.ssmData || [];
    if (!ssmData.length) return [];

    const startTime = performance.now();
    
    // Log the field names from the first item to help with debugging
    if (ssmData.length > 0) {
      console.log('SSM data fields:', Object.keys(ssmData[0]));
    }
    
    // Use the SSM data directly without transformation
    // Just make sure numeric fields are properly converted
    const result = ssmData.map(item => {
      // Convert string values to numbers where needed
      const numericFields = ['total_insulation', 'done_insulation', 'pending_insulation', 
                            'total_loop', 'done_loop', 'pending_loop', 'n_distinct_tps'];
      
      const processedItem = { ...item };
      
      // Convert numeric fields from strings to numbers
      numericFields.forEach(field => {
        if (processedItem[field] && typeof processedItem[field] === 'string') {
          processedItem[field] = parseFloat(processedItem[field]) || 0;
        }
      });
      
      return processedItem;
    }).sort((a, b) => (b.total_insulation || 0) - (a.total_insulation || 0));

    const processingTime = performance.now() - startTime;
    console.log(`TableA processing time: ${processingTime.toFixed(2)}ms`);
    console.log('Processed TableA data sample:', result[0]);

    return result;
  }, [loading]); // Depend on loading to ensure we have the data

  // Process data for TableB (Test Pack Details) using SQL specification
  const tableBData = useMemo(() => {
    if (!data.length) return [];

    const startTime = performance.now();
    
    // Get all unique subsystems from the dataset
    const allSubsystems = new Set();
    data.forEach(item => {
      if (item['SUBSYSTEM']) allSubsystems.add(item['SUBSYSTEM']);
    });

    // Process progress data - group by SUBSYSTEM and TEST PACK, then calculate averages
    const progressMap = new Map();
    data.forEach(item => {
      const subsystem = item['SUBSYSTEM'];
      const testPack = item['TEST PACK'];
      if (!subsystem || !testPack) return;

      const key = `${subsystem}|${testPack}`;
      if (!progressMap.has(key)) {
        progressMap.set(key, {
          subsystem,
          testPack,
          progressValues: [],
          traceados: item['TRACEADOS'] || '',
          priority: item['PRIORITY'] || '',
          hito: item['HITO'] || '',
          teigaReinstatement: item['TEIGA REINSTATEMENT'] || '',
          teigaInsulation: item['TEIGA INSULATION'] || '',
          siemsa: item['SIEMSA'] || '',
          technip: item['TECHNIP'] || ''
        });
      }
      
      const progress = parseFloat(item['CONSTRUC COORD PROGRESS']) || 0;
      progressMap.get(key).progressValues.push(progress);
    });

    // Expand test packs and calculate average progress
    const expandedData = [];
    progressMap.forEach((groupData) => {
      const testPacks = groupData.testPack.split('|');
      const avgProgress = groupData.progressValues.reduce((sum, val) => sum + val, 0) / groupData.progressValues.length;
      
      testPacks.forEach(tp => {
        const trimmedTp = tp.trim();
        if (trimmedTp) {
          expandedData.push({
            subsystem: groupData.subsystem,
            testPack: trimmedTp,
            testPackProgress: avgProgress,
            traceados: groupData.traceados,
            priority: groupData.priority,
            hito: groupData.hito,
            teigaReinstatement: groupData.teigaReinstatement,
            teigaInsulation: groupData.teigaInsulation,
            siemsa: groupData.siemsa,
            technip: groupData.technip
          });
        }
      });
    });

    const processingTime = performance.now() - startTime;
    console.log(`TableB processing time: ${processingTime.toFixed(2)}ms`);

    return expandedData.sort((a, b) => a.subsystem.localeCompare(b.subsystem));
  }, [data]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    if (!tableAData.length) return {};

    const startTime = performance.now();
    
    // Use WASM stats calculator if available
    const statsCalculator = wasmModules.statsCalculator;
    
    if (statsCalculator && statsCalculator.type === 'wasm') {
      console.log('Using WASM stats calculator for summary statistics');
    }

    // JavaScript fallback implementation
    const uniqueSubsystems = new Set(tableAData.map(item => item.subsystem)).size;
    const uniqueTestPacks = tableAData.reduce((sum, item) => sum + (item.n_distinct_tps || 0), 0);
    
    const totalItemsSum = tableAData.reduce((sum, item) => sum + (item.total_insulation || 0), 0);
    const totalDoneItemsSum = tableAData.reduce((sum, item) => sum + (item.done_insulation || 0), 0);
    const totalPendingItemsSum = tableAData.reduce((sum, item) => sum + (item.pending_insulation || 0), 0);
    
    const totalLoopsSum = tableAData.reduce((sum, item) => sum + (item.total_loop || 0), 0);
    const totalPendingLoopsSum = tableAData.reduce((sum, item) => sum + (item.pending_loop || 0), 0);
    
    // Estimate test pack completion based on insulation completion
    const doneTestPacks = Math.round(uniqueTestPacks * (totalDoneItemsSum / (totalItemsSum || 1)));
    const pendingTestPacks = uniqueTestPacks - doneTestPacks;
    
    const avgProgressItemsPercent = tableAData.length > 0 ? 
      Math.round(tableAData.reduce((sum, item) => {
        const totalItems = item.total_insulation || 0;
        const doneItems = item.done_insulation || 0;
        const progress = totalItems > 0 ? (doneItems / totalItems) * 100 : 0;
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
  }, [tableAData, wasmModules.statsCalculator]);

  return {
    tableAData,
    tableBData,
    loading,
    error,
    summaryStats
  };
};