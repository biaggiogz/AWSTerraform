import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { css, Global } from '@emotion/react';
import {
  Box, VStack, HStack, Text, Badge, Divider, Table, Thead, Tbody, Tr, Th, Td,
  TableContainer, Spinner, Progress, Card, CardBody, Heading, SimpleGrid
} from '@chakra-ui/react';
import Papa from 'papaparse';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';

// Enhanced data processing worker with memory optimization
const createDataWorker = () => {
  const workerCode = `
    // Memory-efficient data structures
    const createOptimizedMap = () => new Map();
    const createOptimizedSet = () => new Set();
    
    self.onmessage = function(e) {
      const { type, data, testPackData, aislData, loopData, subsystemsInfoData, batchSize = 1000 } = e.data;
      
      if (type === 'processSubsystemData') {
        // Process aislamientos data with memory optimization
        const aislStats = createOptimizedMap();
        const processAislBatch = (batch) => {
          batch.forEach(item => {
            const subsystem = item['SUBSYSTEM'];
            if (!subsystem) return;
            
            if (!aislStats.has(subsystem)) {
              aislStats.set(subsystem, { totalItems: 0, doneItems: 0 });
            }
            
            const stats = aislStats.get(subsystem);
            stats.totalItems += 1;
            if (item['DONE'] === 'YES') {
              stats.doneItems += 1;
            }
          });
        };
        
        // Process in batches to prevent memory spikes
        for (let i = 0; i < aislData.length; i += batchSize) {
          const batch = aislData.slice(i, i + batchSize);
          processAislBatch(batch);
        }
        
        // Process loop data with memory optimization
        const loopStats = createOptimizedMap();
        const processLoopBatch = (batch) => {
          batch.forEach(item => {
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
        };
        
        // Process in batches
        for (let i = 0; i < loopData.length; i += batchSize) {
          const batch = loopData.slice(i, i + batchSize);
          processLoopBatch(batch);
        }

        // Process main pipeline data with memory optimization
        const subsystemStats = createOptimizedMap();
        const processMainBatch = (batch) => {
          batch.forEach(item => {
            const subsystem = item['SUBSYSTEM'];
            if (!subsystem) return;

            if (!subsystemStats.has(subsystem)) {
              subsystemStats.set(subsystem, {
                totalItems: 0,
                doneItems: 0,
                testPacks: createOptimizedSet(),
                testPackProgressValues: createOptimizedMap()
              });
            }

            const stats = subsystemStats.get(subsystem);
            stats.totalItems += 1;

            const progress = parseFloat(item['CONSTRUC COORD PROGRESS']) || 0;
            if (progress >= 90) {
              stats.doneItems += 1;
            }

            if (item['TEST PACK']) {
              const testPacks = item['TEST PACK'].split('|');
              testPacks.forEach(tp => {
                const trimmedTp = tp.trim();
                if (trimmedTp) {
                  stats.testPacks.add(trimmedTp);
                  
                  if (!stats.testPackProgressValues.has(trimmedTp)) {
                    stats.testPackProgressValues.set(trimmedTp, progress);
                  } else {
                    const currentProgress = stats.testPackProgressValues.get(trimmedTp);
                    stats.testPackProgressValues.set(trimmedTp, (currentProgress + progress) / 2);
                  }
                }
              });
            }
          });
        };
        
        // Process in batches
        for (let i = 0; i < data.length; i += batchSize) {
          const batch = data.slice(i, i + batchSize);
          processMainBatch(batch);
        }

        // Create expanded data with test pack rows using optimized structures
        const expandedData = [];
        const subsystemCache = createOptimizedMap();
        
        // Pre-cache first items for each subsystem
        data.forEach(item => {
          const subsystem = item['SUBSYSTEM'];
          if (subsystem && !subsystemCache.has(subsystem)) {
            subsystemCache.set(subsystem, {
              serialNumber: item['S/N'] || '',
              fluid: item['FLUID_SUBSYSTEM'] || '',
              description: item['DESCRIPTION'] || '',
              insulation: item['INSULATION'] || ''
            });
          }
        });
        
        subsystemStats.forEach((stats, subsystem) => {
          const aislStat = aislStats.get(subsystem) || { totalItems: 0, doneItems: 0 };
          const loopStat = loopStats.get(subsystem) || { totalLoops: 0, doneLoops: 0, pendingLoops: 0 };
          const testPacksArray = Array.from(stats.testPacks);
          const numTestPacks = testPacksArray.length;
          
          const cachedItem = subsystemCache.get(subsystem) || {};
          
          const testPackProgress = testPacksArray.map(tp => {
            const progressData = testPackData.find(tpd => 
              tpd.TestPack === tp && tpd.SUBSYSTEM === subsystem
            );
            
            const progress = progressData ? 
              parseFloat(progressData.Progress.replace('%', '')) : 
              stats.testPackProgressValues.get(tp) || 0;
            
            return { testPack: tp, progress };
          });

          if (testPackProgress.length === 0) {
            expandedData.push({
              serialNumber: cachedItem.serialNumber, 
              fluid: cachedItem.fluid, 
              subsystem,
              totalItems: stats.totalItems,
              doneItems: stats.doneItems,
              pendingItems: stats.totalItems - stats.doneItems,
              description: cachedItem.description, 
              numTestPacks: 0, 
              testPack: null, 
              testPackProgress: 0,
              insulation: cachedItem.insulation, 
              isFirstRow: true, 
              rowSpan: 1,
              aislTotalItems: aislStat.totalItems,
              aislDoneItems: aislStat.doneItems,
              aislPendingItems: aislStat.totalItems - aislStat.doneItems,
              totalLoops: loopStat.totalLoops,
              doneLoops: loopStat.doneLoops,
              pendingLoops: loopStat.pendingLoops
            });
          } else {
            testPackProgress.forEach((tp, index) => {
              expandedData.push({
                serialNumber: cachedItem.serialNumber, 
                fluid: cachedItem.fluid, 
                subsystem,
                totalItems: stats.totalItems,
                doneItems: stats.doneItems,
                pendingItems: stats.totalItems - stats.doneItems,
                description: cachedItem.description, 
                numTestPacks, 
                testPack: tp.testPack,
                testPackProgress: tp.progress, 
                insulation: cachedItem.insulation,
                isFirstRow: index === 0, 
                rowSpan: testPackProgress.length,
                aislTotalItems: aislStat.totalItems,
                aislDoneItems: aislStat.doneItems,
                aislPendingItems: aislStat.totalItems - aislStat.doneItems,
                totalLoops: loopStat.totalLoops,
                doneLoops: loopStat.doneLoops,
                pendingLoops: loopStat.pendingLoops
              });
            });
          }
        });

        const sortedData = expandedData.sort((a, b) => b.totalItems - a.totalItems);
        
        // Calculate summary statistics with memory optimization
        const processedSubsystems = createOptimizedSet();
        let totalItemsSum = 0;
        let totalDoneItemsSum = 0;
        let totalPendingItemsSum = 0;
        let totalLoopsSum = 0;
        let totalDoneLoopsSum = 0;
        let totalPendingLoopsSum = 0;
        let totalProgressPercent = 0;
        let totalLoopsProgressPercent = 0;
        let subsystemCount = 0;
        
        // Process in batches to prevent blocking
        const processSummaryBatch = (batch) => {
          batch.forEach(row => {
            if (!processedSubsystems.has(row.subsystem)) {
              totalItemsSum += row.aislTotalItems;
              totalDoneItemsSum += row.aislDoneItems;
              totalPendingItemsSum += row.aislPendingItems;
              totalLoopsSum += row.totalLoops;
              totalDoneLoopsSum += row.doneLoops;
              totalPendingLoopsSum += row.pendingLoops;
              
              const progress = row.aislTotalItems > 0 ? (row.aislDoneItems / row.aislTotalItems) * 100 : 0;
              totalProgressPercent += progress;
              
              const loopsProgress = row.totalLoops > 0 ? (row.doneLoops / row.totalLoops) * 100 : 0;
              totalLoopsProgressPercent += loopsProgress;
              
              subsystemCount++;
              processedSubsystems.add(row.subsystem);
            }
          });
        };
        
        for (let i = 0; i < sortedData.length; i += batchSize) {
          const batch = sortedData.slice(i, i + batchSize);
          processSummaryBatch(batch);
        }
        
        const avgProgressItemsPercent = subsystemCount > 0 ? Math.round(totalProgressPercent / subsystemCount) : 0;
        const avgLoopsProgressPercent = subsystemCount > 0 ? Math.round(totalLoopsProgressPercent / subsystemCount) : 0;
        
        // Calculate test pack statistics
        const doneTestPacks = sortedData.filter(row => row.testPack && row.testPackProgress === 100).length;
        const pendingTestPacks = sortedData.filter(row => row.testPack && row.testPackProgress < 100).length;
        
        // Calculate top test packs and subsystems with memory optimization
        const testPackCounts = createOptimizedMap();
        const subsystemCounts = createOptimizedMap();
        
        const processTopsBatch = (batch) => {
          batch.forEach(item => {
            if (item['TEST PACK']) {
              const testPack = item['TEST PACK'];
              testPackCounts.set(testPack, (testPackCounts.get(testPack) || 0) + 1);
            }
            if (item['SUBSYSTEM']) {
              const subsystem = item['SUBSYSTEM'];
              subsystemCounts.set(subsystem, (subsystemCounts.get(subsystem) || 0) + 1);
            }
          });
        };
        
        for (let i = 0; i < data.length; i += batchSize) {
          const batch = data.slice(i, i + batchSize);
          processTopsBatch(batch);
        }
        
        const topTestPacks = Array.from(testPackCounts.entries())
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5);
          
        const topSubsystems = Array.from(subsystemCounts.entries())
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5);
        
        const uniqueTestPacksSet = createOptimizedSet();
        sortedData.forEach(row => {
          if (row.testPack) uniqueTestPacksSet.add(row.testPack);
        });
        
        const summaryStats = {
          uniqueSubsystems: processedSubsystems.size,
          uniqueTestPacks: uniqueTestPacksSet.size,
          totalItemsSum,
          totalDoneItemsSum,
          totalPendingItemsSum,
          doneTestPacks,
          pendingTestPacks,
          totalLoopsSum,
          totalDoneLoopsSum,
          totalPendingLoopsSum,
          avgProgressItemsPercent,
          avgLoopsProgressPercent,
          topTestPacks,
          topSubsystems
        };
        
        // Clean up memory
        aislStats.clear();
        loopStats.clear();
        subsystemStats.clear();
        subsystemCache.clear();
        processedSubsystems.clear();
        testPackCounts.clear();
        subsystemCounts.clear();
        uniqueTestPacksSet.clear();
        
        self.postMessage({ type: 'result', data: sortedData, summaryStats });
      }
    };
  `;
  
  const blob = new Blob([workerCode], { type: 'application/javascript' });
  return new Worker(URL.createObjectURL(blob));
};

// Row component for virtualized table
const Row = React.memo(({ data, index, style }) => {
  const row = data[index];
  const progressPercent = row.totalItems > 0 ? Math.round((row.doneItems / row.totalItems) * 100) : 0;
  
  return (
    <Tr key={`${row.subsystem}-${row.testPack || 'no-tp'}-${index}`} style={style}>
      {/* S/N - Merged cell */}
      {row.isFirstRow && (
        <Td 
          fontWeight="medium" 
          rowSpan={row.rowSpan}
          style={{ 
            verticalAlign: 'middle',
            textAlign: 'center',
            backgroundColor: '#f7fafc',
            borderRight: '1px solid #e2e8f0'
          }}
        >
          <Text fontSize="sm" fontWeight="bold">
            {row.serialNumber}
          </Text>
        </Td>
      )}
      
      {/* FLUID - Merged cell */}
      {row.isFirstRow && (
        <Td 
          fontWeight="medium" 
          rowSpan={row.rowSpan}
          style={{ 
            verticalAlign: 'middle',
            textAlign: 'center',
            backgroundColor: '#f7fafc',
            borderRight: '1px solid #e2e8f0'
          }}
        >
          <Text fontSize="sm" fontWeight="bold">
            {row.fluid}
          </Text>
        </Td>
      )}
      
      {/* SUBSYSTEM - Merged cell */}
      {row.isFirstRow && (
        <Td 
          fontWeight="medium" 
          rowSpan={row.rowSpan}
          style={{ 
            verticalAlign: 'middle',
            textAlign: 'center',
            backgroundColor: '#f7fafc',
            borderRight: '1px solid #e2e8f0',
            width: '150px',
            maxWidth: '150px',
            overflow: 'hidden'
          }}
        >
          <Text fontSize="sm" fontWeight="bold" isTruncated title={row.subsystem}>
            {row.subsystem}
          </Text>
        </Td>
      )}
      
      {/* TOTAL ITEMS - Merged cell */}
      {row.isFirstRow && (
        <Td 
          isNumeric 
          rowSpan={row.rowSpan}
          style={{ 
            verticalAlign: 'middle',
            textAlign: 'center',
            backgroundColor: '#f7fafc',
            borderRight: '1px solid #e2e8f0'
          }}
        >
          <Text fontSize="sm" fontWeight="semibold">
            {row.aislTotalItems.toLocaleString()}
          </Text>
        </Td>
      )}
      
      {/* DONE ITEMS - Merged cell */}
      {row.isFirstRow && (
        <Td 
          isNumeric 
          rowSpan={row.rowSpan}
          style={{ 
            verticalAlign: 'middle',
            textAlign: 'center',
            backgroundColor: '#f7fafc',
            borderRight: '1px solid #e2e8f0'
          }}
        >
          <Text fontSize="sm" fontWeight="semibold">
            {row.aislDoneItems.toLocaleString()}
          </Text>
        </Td>
      )}
      
      {/* PENDING ITEMS - Merged cell */}
      {row.isFirstRow && (
        <Td 
          isNumeric 
          rowSpan={row.rowSpan}
          style={{ 
            verticalAlign: 'middle',
            textAlign: 'center',
            backgroundColor: '#f7fafc',
            borderRight: '1px solid #e2e8f0'
          }}
        >
          <Text fontSize="sm" fontWeight="semibold">
            {row.aislPendingItems.toLocaleString()}
          </Text>
        </Td>
      )}
      
      {/* Progress Items% - Merged cell */}
      {row.isFirstRow && (
        <Td
          isNumeric
          rowSpan={row.rowSpan}
          style={{
            verticalAlign: 'middle',
            textAlign: 'center',
            backgroundColor: '#f7fafc',
            borderRight: '1px solid #e2e8f0'
          }}
        >
          <Box display="flex" flexDirection="column" alignItems="center" height="60px" justifyContent="center">
            <Box position="relative" width="30px" height="60px" mb="2">
              <Box
                position="absolute"
                bottom="0"
                left="0"
                width="30px"
                height="60px"
                border="1px solid #e2e8f0"
                bg="#0E2148"
              />
              <Box
                position="absolute"
                bottom="0"
                left="0"
                width="30px"
                height={`${row.aislTotalItems > 0 ? Math.round((row.aislDoneItems / row.aislTotalItems) * 100) : 0}%`}
                bg={row.aislTotalItems > 0 ? 
                  (row.aislDoneItems / row.aislTotalItems * 100 === 100 ? "green.500" : 
                   row.aislDoneItems / row.aislTotalItems * 100 > 50 ? "blue.500" : "red.500") : "gray.500"}
                zIndex="2"
              />
            </Box>
            <Text
              fontSize="xs"
              fontWeight="bold"
              color="black"
            >
              {row.aislTotalItems > 0 ? Math.round((row.aislDoneItems / row.aislTotalItems) * 100) : 0}%
            </Text>
          </Box>
        </Td>
      )}
      
      {/* DESCRIPTION - Merged cell */}
      {row.isFirstRow && (
        <Td 
          fontWeight="medium" 
          rowSpan={row.rowSpan}
          style={{ 
            verticalAlign: 'middle',
            textAlign: 'left',
            backgroundColor: '#f7fafc',
            borderRight: '1px solid #e2e8f0'
          }}
        >
          <Text fontSize="sm" fontWeight="bold">
            {row.description}
          </Text>
        </Td>
      )}
      
      {/* N°TP - Merged cell */}
      {row.isFirstRow && (
        <Td 
          isNumeric 
          rowSpan={row.rowSpan}
          style={{ 
            verticalAlign: 'middle',
            textAlign: 'center',
            backgroundColor: '#f7fafc',
            borderRight: '1px solid #e2e8f0'
          }}
        >
          <Text fontSize="sm" fontWeight="bold">
            {row.numTestPacks}
          </Text>
        </Td>
      )}
      
      {/* TP's INCLUDE - Individual cell per row */}
      <Td style={{ textAlign: 'center', padding: '8px', borderRight: '1px solid #e2e8f0' }}>
        {row.testPack && (
          <Text fontSize="sm" fontWeight="medium">
            {row.testPack}
          </Text>
        )}
      </Td>
      
      {/* PROGRESS TEST PACK - Individual cell per row */}
      <Td style={{ padding: '8px', textAlign: 'center', borderRight: '1px solid #e2e8f0' }}>
        {row.testPack && (
          <Box position="relative" width="100px" margin="0 auto">
            <Progress 
              value={Math.round(row.testPackProgress)} 
              size="md" 
              colorScheme={row.testPackProgress === 100 ? "green" : row.testPackProgress > 50 ? "blue" : "red"}
              width="100px"
              borderRadius="md"
              backgroundColor="#0E2148"
            />
            <Text 
              position="absolute" 
              top="50%" 
              left="50%" 
              transform="translate(-50%, -50%)" 
              fontSize="xs" 
              fontWeight="bold" 
              color="white"
              textShadow="0px 0px 2px rgba(0,0,0,0.7)"
            >
              {Math.round(row.testPackProgress)}%
            </Text>
          </Box>
        )}
      </Td>
      
      {/* INSULATION - Individual cell per row */}
      <Td style={{ textAlign: 'center', padding: '8px', borderRight: '1px solid #e2e8f0' }}>
        <Text fontSize="sm" fontWeight="medium">
          {row.insulation}
        </Text>
      </Td>
      
      {/* TOTAL LOOP (Signal) - Merged cell */}
      {row.isFirstRow && (
        <Td 
          isNumeric 
          rowSpan={row.rowSpan}
          style={{ 
            verticalAlign: 'middle',
            textAlign: 'center',
            backgroundColor: '#f7fafc',
            borderRight: '1px solid #e2e8f0'
          }}
        >
          <Text fontSize="sm" fontWeight="semibold">
            {row.totalLoops.toLocaleString()}
          </Text>
        </Td>
      )}
      
      {/* LOOP (Signal) DONE - Merged cell */}
      {row.isFirstRow && (
        <Td 
          isNumeric 
          rowSpan={row.rowSpan}
          style={{ 
            verticalAlign: 'middle',
            textAlign: 'center',
            backgroundColor: '#f7fafc',
            borderRight: '1px solid #e2e8f0'
          }}
        >
          <Text fontSize="sm" fontWeight="semibold">
            {row.doneLoops.toLocaleString()}
          </Text>
        </Td>
      )}
      
      {/* LOOP (Signal) PENDING - Merged cell */}
      {row.isFirstRow && (
        <Td 
          isNumeric 
          rowSpan={row.rowSpan}
          style={{ 
            verticalAlign: 'middle',
            textAlign: 'center',
            backgroundColor: '#f7fafc',
            borderRight: '1px solid #e2e8f0'
          }}
        >
          <Text fontSize="sm" fontWeight="semibold">
            {row.pendingLoops.toLocaleString()}
          </Text>
        </Td>
      )}
      
      {/* PROGRESS LOOPS% - Merged cell */}
      {row.isFirstRow && (
        <Td 
          isNumeric 
          rowSpan={row.rowSpan}
          style={{ 
            verticalAlign: 'middle',
            textAlign: 'center',
            backgroundColor: '#f7fafc'
          }}
        >
          <Box display="flex" flexDirection="column" alignItems="center" height="60px" justifyContent="center">
            <Box position="relative" width="30px" height="60px" mb="2">
              <Box 
                position="absolute"
                bottom="0"
                left="0"
                width="30px"
                height="60px" 
                border="1px solid #e2e8f0" 
                bg="#0E2148"
              />
              <Box 
                position="absolute"
                bottom="0"
                left="0"
                width="30px"
                height={`${row.totalLoops > 0 ? Math.round((row.doneLoops / row.totalLoops) * 100) : 0}%`} 
                bg={row.totalLoops > 0 ? 
                  (row.doneLoops / row.totalLoops * 100 === 100 ? "green.500" : 
                   row.doneLoops / row.totalLoops * 100 > 50 ? "blue.500" : "red.500") : "gray.500"}
                zIndex="2"
              />
            </Box>
            <Text 
              fontSize="xs" 
              fontWeight="bold"
              color="black"
            >
              {row.totalLoops > 0 ? Math.round((row.doneLoops / row.totalLoops) * 100) : 0}%
            </Text>
          </Box>
        </Td>
      )}
    </Tr>
  );
});

/**
 * Optimized Summary Subsystems component showing aggregated data directly from CSV
 * @param {Object} props - Component props
 * @param {Array} props.data - Filtered dataset from parent component
 */
const SummarySubsystems = ({ data: filteredData = [] }) => {
  // Define table border color
  const tableBorderColor = '#3182ce';
  const [data, setData] = useState([]);
  const [subsystemProgressData, setSubsystemProgressData] = useState([]);
  const [summaryStats, setSummaryStats] = useState({
    uniqueSubsystems: 0,
    uniqueTestPacks: 0,
    totalItemsSum: 0,
    totalDoneItemsSum: 0,
    totalPendingItemsSum: 0,
    doneTestPacks: 0,
    pendingTestPacks: 0,
    totalLoopsSum: 0,
    totalDoneLoopsSum: 0,
    totalPendingLoopsSum: 0,
    avgProgressItemsPercent: 0,
    avgLoopsProgressPercent: 0,
    topTestPacks: [],
    topSubsystems: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [worker, setWorker] = useState(null);
  const abortControllerRef = useRef(null);
  const dataCache = useRef(new Map());
  const cleanupTimeoutRef = useRef(null);

  // Initialize web worker with cleanup
  useEffect(() => {
    const newWorker = createDataWorker();
    setWorker(newWorker);
    
    return () => {
      if (newWorker) {
        newWorker.terminate();
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (cleanupTimeoutRef.current) {
        clearTimeout(cleanupTimeoutRef.current);
      }
      // Clear cache on unmount
      dataCache.current.clear();
    };
  }, []);

  // Enhanced data loading with caching and request cancellation
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Cancel previous request if exists
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
        
        // Create new abort controller
        abortControllerRef.current = new AbortController();
        const { signal } = abortControllerRef.current;
        
        // Generate cache key
        const cacheKey = JSON.stringify(filteredData?.slice(0, 10) || 'default');
        
        // Check cache first
        if (dataCache.current.has(cacheKey)) {
          const cachedResult = dataCache.current.get(cacheKey);
          setSubsystemProgressData(cachedResult.data);
          setSummaryStats(cachedResult.summaryStats);
          setLoading(false);
          return;
        }
        
        // Prepare data sources
        const dataSources = [
          { url: '/data/test_pack_progress.csv', name: 'testPackData' },
          { url: '/data/aislamientos.csv', name: 'aislData' },
          { url: '/data/test_of_lazos_updated.csv', name: 'loopData' },
          { url: '/data/subsystems_info.csv', name: 'subsystemsInfoData' }
        ];
        
        // Add main data source if no filtered data
        if (!filteredData || filteredData.length === 0) {
          dataSources.unshift({ url: '/data/pipelinedata.csv', name: 'mainData' });
        }
        
        // Fetch all data in parallel with abort signal
        const responses = await Promise.all(
          dataSources.map(source => 
            fetch(source.url, { signal })
              .then(response => {
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                return response;
              })
          )
        );
        
        if (signal.aborted) return;
        
        const csvTexts = await Promise.all(responses.map(response => response.text()));
        
        if (signal.aborted) return;
        
        // Parse all CSV data with progressive loading
        const parsedData = {};
        const parsePromises = csvTexts.map((csvText, index) => {
          return new Promise((resolve, reject) => {
            if (signal.aborted) {
              reject(new Error('Request aborted'));
              return;
            }
            
            Papa.parse(csvText, {
              header: true,
              chunk: (results, parser) => {
                if (signal.aborted) {
                  parser.abort();
                  reject(new Error('Request aborted'));
                }
              },
              complete: (results) => {
                if (signal.aborted) {
                  reject(new Error('Request aborted'));
                  return;
                }
                resolve({ name: dataSources[index].name, data: results.data });
              },
              error: (error) => {
                reject(new Error(`Error parsing ${dataSources[index].name}: ${error.message}`));
              }
            });
          });
        });
        
        const parsedResults = await Promise.all(parsePromises);
        
        if (signal.aborted) return;
        
        // Organize parsed data
        parsedResults.forEach(result => {
          parsedData[result.name] = result.data;
        });
        
        // Set main data
        const mainData = filteredData && filteredData.length > 0 ? filteredData : parsedData.mainData;
        setData(mainData);
        
        // Process data in web worker if available
        if (worker && !signal.aborted) {
          worker.onmessage = (e) => {
            if (e.data.type === 'result' && !signal.aborted) {
              const result = {
                data: e.data.data,
                summaryStats: e.data.summaryStats
              };
              
              // Cache the result with size limit
              if (dataCache.current.size > 5) {
                const firstKey = dataCache.current.keys().next().value;
                dataCache.current.delete(firstKey);
              }
              dataCache.current.set(cacheKey, result);
              
              setSubsystemProgressData(result.data);
              setSummaryStats(result.summaryStats);
              setLoading(false);
              
              // Schedule cleanup
              cleanupTimeoutRef.current = setTimeout(() => {
                if (dataCache.current.size > 3) {
                  const keysToDelete = Array.from(dataCache.current.keys()).slice(0, 2);
                  keysToDelete.forEach(key => dataCache.current.delete(key));
                }
              }, 30000); // Cleanup after 30 seconds
            }
          };
          
          worker.postMessage({
            type: 'processSubsystemData',
            data: mainData,
            testPackData: parsedData.testPackData,
            aislData: parsedData.aislData,
            loopData: parsedData.loopData,
            subsystemsInfoData: parsedData.subsystemsInfoData,
            batchSize: Math.min(1000, Math.max(100, Math.floor(mainData.length / 10)))
          });
        }
      } catch (error) {
        if (error.name !== 'AbortError') {
          setError(`Error fetching data: ${error.message}`);
          setLoading(false);
        }
      }
    };

    if (worker) {
      fetchData();
    }
  }, [filteredData, worker]);

  // Enhanced memoized row renderer with RAF throttling
  const rowRenderer = useCallback(({ index, style }) => {
    return <Row data={subsystemProgressData} index={index} style={style} />;
  }, [subsystemProgressData]);
  
  // Memoized summary statistics to prevent unnecessary recalculations
  const memoizedSummaryStats = useMemo(() => summaryStats, [summaryStats]);
  
  // Memoized progress data with intelligent comparison
  const memoizedProgressData = useMemo(() => {
    return subsystemProgressData.slice(0, Math.min(subsystemProgressData.length, 1000));
  }, [subsystemProgressData]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="300px">
        <Spinner size="xl" />
        <Text ml={4}>Loading data...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={6} textAlign="center" color="red.500">
        <Heading size="md">Error Loading Data</Heading>
        <Text mt={2}>{error}</Text>
      </Box>
    );
  }

  return (
    <Box p={6}>
      <Global
        styles={css`
          table th, table td {
            border-color: #555879 !important;
          }
        `}
      />
      <VStack spacing={2} align="stretch">
        {/* Summary Statistics */}
        <Box width="100%" overflowX="auto">
          <TableContainer>
            <Table variant="simple" size="sm" style={{ tableLayout: 'fixed', borderCollapse: 'collapse', width: '100%', borderColor: '#3182ce' }}>
              <Thead bg="gray.50">
                <Tr>
                  <Th style={{ textAlign: 'center', borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>Subsystems</Th>
                  <Th style={{ textAlign: 'center', borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>Total Items</Th>
                  <Th style={{ textAlign: 'center', borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>Done Items</Th>
                  <Th style={{ textAlign: 'center', borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>Pending Items</Th>
                  <Th style={{ textAlign: 'center', borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>Total Test Packs</Th>
                  <Th style={{ textAlign: 'center', borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>Done Test Packs</Th>
                  <Th style={{ textAlign: 'center', borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>Pending Test Packs</Th>
                  <Th style={{ textAlign: 'center', borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>Total Loops</Th>
                  <Th style={{ textAlign: 'center', borderBottom: '1px solid #e2e8f0' }}>Loops Pending</Th>
                </Tr>
              </Thead>
              <Tbody>
                <Tr>
                  <Td style={{ textAlign: 'center', borderRight: '1px solid #e2e8f0', fontWeight: 'bold' }}>{memoizedSummaryStats.uniqueSubsystems}</Td>
                  <Td style={{ textAlign: 'center', borderRight: '1px solid #e2e8f0', fontWeight: 'bold' }}>{memoizedSummaryStats.totalItemsSum.toLocaleString()}</Td>
                  <Td style={{ textAlign: 'center', borderRight: '1px solid #e2e8f0', fontWeight: 'bold' }}>{memoizedSummaryStats.totalDoneItemsSum.toLocaleString()}</Td>
                  <Td style={{ textAlign: 'center', borderRight: '1px solid #e2e8f0', fontWeight: 'bold' }}>{memoizedSummaryStats.totalPendingItemsSum.toLocaleString()}</Td>
                  <Td style={{ textAlign: 'center', borderRight: '1px solid #e2e8f0', fontWeight: 'bold' }}>{memoizedSummaryStats.uniqueTestPacks}</Td>
                  <Td style={{ textAlign: 'center', borderRight: '1px solid #e2e8f0', fontWeight: 'bold' }}>{memoizedSummaryStats.doneTestPacks}</Td>
                  <Td style={{ textAlign: 'center', borderRight: '1px solid #e2e8f0', fontWeight: 'bold' }}>{memoizedSummaryStats.pendingTestPacks}</Td>
                  <Td style={{ textAlign: 'center', borderRight: '1px solid #e2e8f0', fontWeight: 'bold' }}>{memoizedSummaryStats.totalLoopsSum.toLocaleString()}</Td>
                  <Td style={{ textAlign: 'center', fontWeight: 'bold' }}>{memoizedSummaryStats.totalPendingLoopsSum.toLocaleString()}</Td>
                </Tr>
              </Tbody>
            </Table>
          </TableContainer>
        </Box>

        <Divider />

        {/* Subsystem Progress Table with Virtualization */}
        <Card>
          <CardBody>
            <Heading size="sm" mb={4}>Subsystem Progress Overview</Heading>
            <Box height="600px" width="100%">
              <AutoSizer>
                {({ height, width }) => (
                  <List
                    height={height}
                    itemCount={memoizedProgressData.length}
                    itemSize={80}
                    width={width}
                    itemData={memoizedProgressData}
                    overscanCount={5}
                  >
                    {rowRenderer}
                  </List>
                )}
              </AutoSizer>
            </Box>
            {memoizedProgressData.length === 0 && (
              <Text color="gray.500" fontSize="sm" textAlign="center" py={4}>
                No subsystem progress data available
              </Text>
            )}
          </CardBody>
        </Card>

        <Divider />

        {/* Top Test Packs and Subsystems */}
        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
          <Card>
            <CardBody>
              <Heading size="md" mb={4}>Top Test Packs</Heading>
              <VStack spacing={3} align="stretch">
                {memoizedSummaryStats.topTestPacks.map(([testPack, count], index) => (
                  <HStack key={testPack} justify="space-between">
                    <HStack>
                      <Badge colorScheme="blue" variant="solid">
                        #{index + 1}
                      </Badge>
                      <Text fontSize="sm" fontWeight="medium">
                        {testPack}
                      </Text>
                    </HStack>
                    <Badge colorScheme="green" variant="outline">
                      {count} items
                    </Badge>
                  </HStack>
                ))}
                {memoizedSummaryStats.topTestPacks.length === 0 && (
                  <Text color="gray.500" fontSize="sm">
                    No test pack data available
                  </Text>
                )}
              </VStack>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <Heading size="md" mb={4}>Top Subsystems</Heading>
              <VStack spacing={3} align="stretch">
                {memoizedSummaryStats.topSubsystems.map(([subsystem, count], index) => (
                  <HStack key={subsystem} justify="space-between">
                    <HStack>
                      <Badge colorScheme="purple" variant="solid">
                        #{index + 1}
                      </Badge>
                      <Text fontSize="sm" fontWeight="medium">
                        {subsystem}
                      </Text>
                    </HStack>
                    <Badge colorScheme="orange" variant="outline">
                      {count} items
                    </Badge>
                  </HStack>
                ))}
                {memoizedSummaryStats.topSubsystems.length === 0 && (
                  <Text color="gray.500" fontSize="sm">
                    No subsystem data available
                  </Text>
                )}
              </VStack>
            </CardBody>
          </Card>
        </SimpleGrid>
      </VStack>
    </Box>
  );
};

export default React.memo(SummarySubsystems);