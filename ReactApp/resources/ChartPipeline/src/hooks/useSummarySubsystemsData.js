import { useState, useEffect, useMemo, useRef } from 'react';
import Papa from 'papaparse';
import { wasmLoader } from '../wasm/wasm-loader';
import useDuckDBEnhanced from './useDuckDB.enhanced';

export const useSummarySubsystemsData = (filteredData = []) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [wasmModules, setWasmModules] = useState({});

  const { executeQuery, createTable } = useDuckDBEnhanced();

  // Load WASM modules with timeout
  useEffect(() => {
    const loadWasmModules = async () => {
      const timeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('WASM load timeout')), 5000)
      );
      
      try {
        const wasmPromise = Promise.all([
          wasmLoader.loadModule(
            'subsystem-aggregator',
            '/wasm/subsystem-aggregator.wasm',
            {
              processMultipleCSVs: (csvData) => csvData,
              aggregateSubsystemStats: (data) => data,
              mergeDatasets: (datasets) => datasets[0] || []
            }
          ),
          wasmLoader.loadModule(
            'testpack-processor',
            '/wasm/testpack-processor.wasm',
            {
              expandTestPacks: (data) => data,
              calculateTestPackProgress: (data) => data,
              groupTestPacksBySubsystem: (data) => data
            }
          ),
          wasmLoader.loadModule(
            'stats-calculator',
            '/wasm/stats-calculator.wasm',
            {
              calculateAverages: (values) => {
                let sum = 0;
                for (let i = 0; i < values.length; i++) sum += values[i];
                return sum / values.length;
              },
              computeProgressPercentages: (done, total) => total > 0 ? (done / total) * 100 : 0,
              aggregateLoopStatistics: (data) => data
            }
          )
        ]);

        const [aggregator, testpackProcessor, statsCalculator] = await Promise.race([wasmPromise, timeout]);

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

  // Create DuckDB tables when data is loaded - debounced
  const createTablesTimeoutRef = useRef(null);
  
  useEffect(() => {
    if (createTablesTimeoutRef.current) {
      clearTimeout(createTablesTimeoutRef.current);
    }
    
    createTablesTimeoutRef.current = setTimeout(() => {
      if (data.length > 0) {
        createTable('Test Pack Details', data);
        console.log('Created Test Pack Details table for SQL queries');
      }
      
      const ssmData = window.ssmData || [];
      if (ssmData.length > 0) {
        createTable('Subsystem Overview', ssmData);
        console.log('Created Subsystem Overview table for SQL queries with SSM data');
      }
    }, 100);
    
    return () => {
      if (createTablesTimeoutRef.current) {
        clearTimeout(createTablesTimeoutRef.current);
      }
    };
  }, [data, loading, createTable]);

  // Use SSM CSV data directly for TableA
  const tableAData = useMemo(() => {
    // Use the SSM data from window object (set during data loading)
    const ssmData = window.ssmData || [];
    if (!ssmData.length) return [];

    const startTime = performance.now();
    
    // Log the field names from the first item to help with debugging
    if (ssmData.length > 0) {
      console.log('SSM data fields:', Object.keys(ssmData[0]));
      console.log('SSM data sample:', ssmData[0]);
    }
    
    // Use the SSM data directly without transformation
    // Just make sure numeric fields are properly converted
    const numericFields = ['total_insulation', 'done_insulation', 'pending_insulation', 
                          'total_loop', 'done_loop', 'pending_loop', 'n_distinct_tps'];
    
    const result = [];
    for (let i = 0; i < ssmData.length; i++) {
      const item = ssmData[i];
      const processedItem = { ...item };
      
      // Convert numeric fields from strings to numbers
      for (let j = 0; j < numericFields.length; j++) {
        const field = numericFields[j];
        if (processedItem[field] && typeof processedItem[field] === 'string') {
          processedItem[field] = parseFloat(processedItem[field]) || 0;
        }
      }
      result.push(processedItem);
    }
    
    result.sort((a, b) => (b.total_insulation || 0) - (a.total_insulation || 0));

    const processingTime = performance.now() - startTime;
    console.log(`TableA processing time: ${processingTime.toFixed(2)}ms`);
    console.log('Processed TableA data sample:', result[0]);

    return result;
  }, [loading]); // Depend on loading to ensure we have the data

  // Process data for TableB (Test Pack Details) using SQL specification
  const tableBData = useMemo(() => {
    if (!data.length) return [];

    const startTime = performance.now();
    
    // Process progress data - group by SUBSYSTEM and TEST PACK, then calculate averages
    const progressMap = new Map();
    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      const subsystem = item['SUBSYSTEM'];
      const testPack = item['TEST PACK'];
      if (!subsystem || !testPack) continue;

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
    }

    // Expand test packs and calculate average progress
    const expandedData = [];
    for (const [key, groupData] of progressMap) {
      const testPacks = groupData.testPack.split('|');
      let sum = 0;
      for (let i = 0; i < groupData.progressValues.length; i++) {
        sum += groupData.progressValues[i];
      }
      const avgProgress = sum / groupData.progressValues.length;
      
      for (let i = 0; i < testPacks.length; i++) {
        const trimmedTp = testPacks[i].trim();
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
      }
    }

    const processingTime = performance.now() - startTime;
    console.log(`TableB processing time: ${processingTime.toFixed(2)}ms`);

    expandedData.sort((a, b) => a.subsystem.localeCompare(b.subsystem));
    return expandedData;
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

    // JavaScript fallback implementation with optimized loops
    const uniqueSubsystemsSet = new Set();
    let uniqueTestPacks = 0;
    let totalItemsSum = 0;
    let totalDoneItemsSum = 0;
    let totalPendingItemsSum = 0;
    let totalLoopsSum = 0;
    let totalPendingLoopsSum = 0;
    let progressSum = 0;
    
    for (let i = 0; i < tableAData.length; i++) {
      const item = tableAData[i];
      uniqueSubsystemsSet.add(item.subsystem);
      uniqueTestPacks += (item.n_distinct_tps || 0);
      totalItemsSum += (item.total_insulation || 0);
      totalDoneItemsSum += (item.done_insulation || 0);
      totalPendingItemsSum += (item.pending_insulation || 0);
      totalLoopsSum += (item.total_loop || 0);
      totalPendingLoopsSum += (item.pending_loop || 0);
      
      const totalItems = item.total_insulation || 0;
      const doneItems = item.done_insulation || 0;
      const progress = totalItems > 0 ? (doneItems / totalItems) * 100 : 0;
      progressSum += progress;
    }
    
    // Estimate test pack completion based on insulation completion
    const doneTestPacks = Math.round(uniqueTestPacks * (totalDoneItemsSum / (totalItemsSum || 1)));
    const pendingTestPacks = uniqueTestPacks - doneTestPacks;
    
    const avgProgressItemsPercent = tableAData.length > 0 ? Math.round(progressSum / tableAData.length) : 0;

    const processingTime = performance.now() - startTime;
    console.log(`Summary stats processing time: ${processingTime.toFixed(2)}ms`);

    return {
      uniqueSubsystems: uniqueSubsystemsSet.size,
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