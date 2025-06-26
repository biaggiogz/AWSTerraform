import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { css, Global } from '@emotion/react';
import {
  Box, VStack, HStack, Text, Badge, Divider, Table, Thead, Tbody, Tr, Th, Td,
  TableContainer, Spinner, Progress, Card, CardBody, Heading, SimpleGrid
} from '@chakra-ui/react';
import Papa from 'papaparse';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';

const createDataWorker = () => {
  const workerCode = `
    const createOptimizedMap = () => new Map();
    const createOptimizedSet = () => new Set();
    
    self.onmessage = function(e) {
      const { type, data, testPackData, aislData, loopData, batchSize = 1000 } = e.data;
      
      if (type === 'processSubsystemData') {
        const aislStats = createOptimizedMap();
        for (let i = 0; i < aislData.length; i += batchSize) {
          const batch = aislData.slice(i, i + batchSize);
          batch.forEach(item => {
            const subsystem = item['SUBSYSTEM'];
            if (!subsystem) return;
            if (!aislStats.has(subsystem)) {
              aislStats.set(subsystem, { totalItems: 0, doneItems: 0 });
            }
            const stats = aislStats.get(subsystem);
            stats.totalItems += 1;
            if (item['DONE'] === 'YES') stats.doneItems += 1;
          });
        }
        
        const loopStats = createOptimizedMap();
        for (let i = 0; i < loopData.length; i += batchSize) {
          const batch = loopData.slice(i, i + batchSize);
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
        }

        const subsystemStats = createOptimizedMap();
        const subsystemCache = createOptimizedMap();
        
        for (let i = 0; i < data.length; i += batchSize) {
          const batch = data.slice(i, i + batchSize);
          batch.forEach(item => {
            const subsystem = item['SUBSYSTEM'];
            if (!subsystem) return;

            if (!subsystemStats.has(subsystem)) {
              subsystemStats.set(subsystem, {
                totalItems: 0, doneItems: 0, testPacks: createOptimizedSet(),
                testPackProgressValues: createOptimizedMap()
              });
            }

            if (!subsystemCache.has(subsystem)) {
              subsystemCache.set(subsystem, {
                serialNumber: item['S/N'] || '',
                fluid: item['FLUID_SUBSYSTEM'] || '',
                description: item['DESCRIPTION'] || '',
                insulation: item['INSULATION'] || ''
              });
            }

            const stats = subsystemStats.get(subsystem);
            stats.totalItems += 1;

            const progress = parseFloat(item['CONSTRUC COORD PROGRESS']) || 0;
            if (progress >= 90) stats.doneItems += 1;

            if (item['TEST PACK']) {
              item['TEST PACK'].split('|').forEach(tp => {
                const trimmedTp = tp.trim();
                if (trimmedTp) {
                  stats.testPacks.add(trimmedTp);
                  stats.testPackProgressValues.set(trimmedTp, progress);
                }
              });
            }
          });
        }

        const expandedData = [];
        subsystemStats.forEach((stats, subsystem) => {
          const aislStat = aislStats.get(subsystem) || { totalItems: 0, doneItems: 0 };
          const loopStat = loopStats.get(subsystem) || { totalLoops: 0, doneLoops: 0, pendingLoops: 0 };
          const testPacksArray = Array.from(stats.testPacks);
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
              serialNumber: cachedItem.serialNumber, fluid: cachedItem.fluid, subsystem,
              totalItems: stats.totalItems, doneItems: stats.doneItems,
              pendingItems: stats.totalItems - stats.doneItems,
              description: cachedItem.description, numTestPacks: 0, testPack: null,
              testPackProgress: 0, insulation: cachedItem.insulation, isFirstRow: true, rowSpan: 1,
              aislTotalItems: aislStat.totalItems, aislDoneItems: aislStat.doneItems,
              aislPendingItems: aislStat.totalItems - aislStat.doneItems,
              totalLoops: loopStat.totalLoops, doneLoops: loopStat.doneLoops,
              pendingLoops: loopStat.pendingLoops
            });
          } else {
            testPackProgress.forEach((tp, index) => {
              expandedData.push({
                serialNumber: cachedItem.serialNumber, fluid: cachedItem.fluid, subsystem,
                totalItems: stats.totalItems, doneItems: stats.doneItems,
                pendingItems: stats.totalItems - stats.doneItems,
                description: cachedItem.description, numTestPacks: testPacksArray.length,
                testPack: tp.testPack, testPackProgress: tp.progress,
                insulation: cachedItem.insulation, isFirstRow: index === 0,
                rowSpan: testPackProgress.length,
                aislTotalItems: aislStat.totalItems, aislDoneItems: aislStat.doneItems,
                aislPendingItems: aislStat.totalItems - aislStat.doneItems,
                totalLoops: loopStat.totalLoops, doneLoops: loopStat.doneLoops,
                pendingLoops: loopStat.pendingLoops
              });
            });
          }
        });

        const sortedData = expandedData.sort((a, b) => b.totalItems - a.totalItems);
        
        const processedSubsystems = createOptimizedSet();
        let totalItemsSum = 0, totalDoneItemsSum = 0, totalPendingItemsSum = 0;
        let totalLoopsSum = 0, totalDoneLoopsSum = 0, totalPendingLoopsSum = 0;
        let totalProgressPercent = 0, totalLoopsProgressPercent = 0, subsystemCount = 0;
        
        sortedData.forEach(row => {
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
        
        const doneTestPacks = sortedData.filter(row => row.testPack && row.testPackProgress === 100).length;
        const pendingTestPacks = sortedData.filter(row => row.testPack && row.testPackProgress < 100).length;
        const uniqueTestPacks = new Set(sortedData.filter(row => row.testPack).map(row => row.testPack)).size;
        
        const summaryStats = {
          uniqueSubsystems: processedSubsystems.size, uniqueTestPacks,
          totalItemsSum, totalDoneItemsSum, totalPendingItemsSum,
          doneTestPacks, pendingTestPacks, totalLoopsSum, totalDoneLoopsSum, totalPendingLoopsSum,
          avgProgressItemsPercent: subsystemCount > 0 ? Math.round(totalProgressPercent / subsystemCount) : 0,
          avgLoopsProgressPercent: subsystemCount > 0 ? Math.round(totalLoopsProgressPercent / subsystemCount) : 0
        };
        
        aislStats.clear(); loopStats.clear(); subsystemStats.clear();
        subsystemCache.clear(); processedSubsystems.clear();
        
        self.postMessage({ type: 'result', data: sortedData, summaryStats });
      }
    };
  `;
  
  const blob = new Blob([workerCode], { type: 'application/javascript' });
  return new Worker(URL.createObjectURL(blob));
};

const Row = React.memo(({ data, index, style }) => {
  const row = data[index];
  
  return (
    <Tr key={`${row.subsystem}-${row.testPack || 'no-tp'}-${index}`} style={style}>
      {row.isFirstRow && (
        <Td 
          fontWeight="medium" rowSpan={row.rowSpan}
          style={{ verticalAlign: 'middle', textAlign: 'center', backgroundColor: '#f7fafc', borderRight: '1px solid #e2e8f0' }}
        >
          <Text fontSize="sm" fontWeight="bold">{row.serialNumber}</Text>
        </Td>
      )}
      
      {row.isFirstRow && (
        <Td 
          fontWeight="medium" rowSpan={row.rowSpan}
          style={{ verticalAlign: 'middle', textAlign: 'center', backgroundColor: '#f7fafc', borderRight: '1px solid #e2e8f0' }}
        >
          <Text fontSize="sm" fontWeight="bold">{row.fluid}</Text>
        </Td>
      )}
      
      {row.isFirstRow && (
        <Td 
          fontWeight="medium" rowSpan={row.rowSpan}
          style={{ verticalAlign: 'middle', textAlign: 'center', backgroundColor: '#f7fafc', borderRight: '1px solid #e2e8f0' }}
        >
          <Text fontSize="sm" fontWeight="bold" isTruncated title={row.subsystem}>{row.subsystem}</Text>
        </Td>
      )}
      
      {row.isFirstRow && (
        <Td 
          isNumeric rowSpan={row.rowSpan}
          style={{ verticalAlign: 'middle', textAlign: 'center', backgroundColor: '#f7fafc', borderRight: '1px solid #e2e8f0' }}
        >
          <Text fontSize="sm" fontWeight="semibold">{row.aislTotalItems.toLocaleString()}</Text>
        </Td>
      )}
      
      {row.isFirstRow && (
        <Td 
          isNumeric rowSpan={row.rowSpan}
          style={{ verticalAlign: 'middle', textAlign: 'center', backgroundColor: '#f7fafc', borderRight: '1px solid #e2e8f0' }}
        >
          <Text fontSize="sm" fontWeight="semibold">{row.aislDoneItems.toLocaleString()}</Text>
        </Td>
      )}
      
      {row.isFirstRow && (
        <Td 
          isNumeric rowSpan={row.rowSpan}
          style={{ verticalAlign: 'middle', textAlign: 'center', backgroundColor: '#f7fafc', borderRight: '1px solid #e2e8f0' }}
        >
          <Text fontSize="sm" fontWeight="semibold">{row.aislPendingItems.toLocaleString()}</Text>
        </Td>
      )}
      
      {row.isFirstRow && (
        <Td
          isNumeric rowSpan={row.rowSpan}
          style={{ verticalAlign: 'middle', textAlign: 'center', backgroundColor: '#f7fafc', borderRight: '1px solid #e2e8f0' }}
        >
          <Box display="flex" flexDirection="column" alignItems="center" height="60px" justifyContent="center">
            <Box position="relative" width="30px" height="60px" mb="2">
              <Box position="absolute" bottom="0" left="0" width="30px" height="60px" border="1px solid #e2e8f0" bg="#0E2148" />
              <Box
                position="absolute" bottom="0" left="0" width="30px"
                height={`${row.aislTotalItems > 0 ? Math.round((row.aislDoneItems / row.aislTotalItems) * 100) : 0}%`}
                bg={row.aislTotalItems > 0 ? 
                  (row.aislDoneItems / row.aislTotalItems * 100 === 100 ? "green.500" : 
                   row.aislDoneItems / row.aislTotalItems * 100 > 50 ? "blue.500" : "red.500") : "gray.500"}
                zIndex="2"
              />
            </Box>
            <Text fontSize="xs" fontWeight="bold" color="black">
              {row.aislTotalItems > 0 ? Math.round((row.aislDoneItems / row.aislTotalItems) * 100) : 0}%
            </Text>
          </Box>
        </Td>
      )}
      
      {row.isFirstRow && (
        <Td 
          fontWeight="medium" rowSpan={row.rowSpan}
          style={{ verticalAlign: 'middle', textAlign: 'left', backgroundColor: '#f7fafc', borderRight: '1px solid #e2e8f0' }}
        >
          <Text fontSize="sm" fontWeight="bold">{row.description}</Text>
        </Td>
      )}
      
      {row.isFirstRow && (
        <Td 
          isNumeric rowSpan={row.rowSpan}
          style={{ verticalAlign: 'middle', textAlign: 'center', backgroundColor: '#f7fafc', borderRight: '1px solid #e2e8f0' }}
        >
          <Text fontSize="sm" fontWeight="bold">{row.numTestPacks}</Text>
        </Td>
      )}
      
      <Td style={{ textAlign: 'center', padding: '8px', borderRight: '1px solid #e2e8f0' }}>
        {row.testPack && <Text fontSize="sm" fontWeight="medium">{row.testPack}</Text>}
      </Td>
      
      <Td style={{ padding: '8px', textAlign: 'center', borderRight: '1px solid #e2e8f0' }}>
        {row.testPack && (
          <Box position="relative" width="100px" margin="0 auto">
            <Progress 
              value={Math.round(row.testPackProgress)} size="md" 
              colorScheme={row.testPackProgress === 100 ? "green" : row.testPackProgress > 50 ? "blue" : "red"}
              width="100px" borderRadius="md" backgroundColor="#0E2148"
            />
            <Text 
              position="absolute" top="50%" left="50%" transform="translate(-50%, -50%)" 
              fontSize="xs" fontWeight="bold" color="white" textShadow="0px 0px 2px rgba(0,0,0,0.7)"
            >
              {Math.round(row.testPackProgress)}%
            </Text>
          </Box>
        )}
      </Td>
      
      <Td style={{ textAlign: 'center', padding: '8px', borderRight: '1px solid #e2e8f0' }}>
        <Text fontSize="sm" fontWeight="medium">{row.insulation}</Text>
      </Td>
      
      {row.isFirstRow && (
        <Td 
          isNumeric rowSpan={row.rowSpan}
          style={{ verticalAlign: 'middle', textAlign: 'center', backgroundColor: '#f7fafc', borderRight: '1px solid #e2e8f0' }}
        >
          <Text fontSize="sm" fontWeight="semibold">{row.totalLoops.toLocaleString()}</Text>
        </Td>
      )}
      
      {row.isFirstRow && (
        <Td 
          isNumeric rowSpan={row.rowSpan}
          style={{ verticalAlign: 'middle', textAlign: 'center', backgroundColor: '#f7fafc', borderRight: '1px solid #e2e8f0' }}
        >
          <Text fontSize="sm" fontWeight="semibold">{row.doneLoops.toLocaleString()}</Text>
        </Td>
      )}
      
      {row.isFirstRow && (
        <Td 
          isNumeric rowSpan={row.rowSpan}
          style={{ verticalAlign: 'middle', textAlign: 'center', backgroundColor: '#f7fafc', borderRight: '1px solid #e2e8f0' }}
        >
          <Text fontSize="sm" fontWeight="semibold">{row.pendingLoops.toLocaleString()}</Text>
        </Td>
      )}
      
      {row.isFirstRow && (
        <Td 
          isNumeric rowSpan={row.rowSpan}
          style={{ verticalAlign: 'middle', textAlign: 'center', backgroundColor: '#f7fafc' }}
        >
          <Box display="flex" flexDirection="column" alignItems="center" height="60px" justifyContent="center">
            <Box position="relative" width="30px" height="60px" mb="2">
              <Box position="absolute" bottom="0" left="0" width="30px" height="60px" border="1px solid #e2e8f0" bg="#0E2148" />
              <Box 
                position="absolute" bottom="0" left="0" width="30px"
                height={`${row.totalLoops > 0 ? Math.round((row.doneLoops / row.totalLoops) * 100) : 0}%`} 
                bg={row.totalLoops > 0 ? 
                  (row.doneLoops / row.totalLoops * 100 === 100 ? "green.500" : 
                   row.doneLoops / row.totalLoops * 100 > 50 ? "blue.500" : "red.500") : "gray.500"}
                zIndex="2"
              />
            </Box>
            <Text fontSize="xs" fontWeight="bold" color="black">
              {row.totalLoops > 0 ? Math.round((row.doneLoops / row.totalLoops) * 100) : 0}%
            </Text>
          </Box>
        </Td>
      )}
    </Tr>
  );
});

const SummarySubsystems = ({ data: filteredData = [] }) => {
  const [subsystemProgressData, setSubsystemProgressData] = useState([]);
  const [summaryStats, setSummaryStats] = useState({
    uniqueSubsystems: 0, uniqueTestPacks: 0, totalItemsSum: 0, totalDoneItemsSum: 0,
    totalPendingItemsSum: 0, doneTestPacks: 0, pendingTestPacks: 0, totalLoopsSum: 0,
    totalDoneLoopsSum: 0, totalPendingLoopsSum: 0, avgProgressItemsPercent: 0, avgLoopsProgressPercent: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [worker, setWorker] = useState(null);
  const abortControllerRef = useRef(null);
  const dataCache = useRef(new Map());

  useEffect(() => {
    const newWorker = createDataWorker();
    setWorker(newWorker);
    
    return () => {
      if (newWorker) newWorker.terminate();
      if (abortControllerRef.current) abortControllerRef.current.abort();
      dataCache.current.clear();
    };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (abortControllerRef.current) abortControllerRef.current.abort();
        abortControllerRef.current = new AbortController();
        const { signal } = abortControllerRef.current;
        
        const cacheKey = JSON.stringify(filteredData?.slice(0, 10) || 'default');
        
        if (dataCache.current.has(cacheKey)) {
          const cachedResult = dataCache.current.get(cacheKey);
          setSubsystemProgressData(cachedResult.data);
          setSummaryStats(cachedResult.summaryStats);
          setLoading(false);
          return;
        }
        
        const dataSources = [
          { url: '/data/test_pack_progress.csv', name: 'testPackData' },
          { url: '/data/aislamientos.csv', name: 'aislData' },
          { url: '/data/test_of_lazos_updated.csv', name: 'loopData' }
        ];
        
        if (!filteredData || filteredData.length === 0) {
          dataSources.unshift({ url: '/data/pipelinedata.csv', name: 'mainData' });
        }
        
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
        
        const parsedData = {};
        const parsePromises = csvTexts.map((csvText, index) => {
          return new Promise((resolve, reject) => {
            if (signal.aborted) {
              reject(new Error('Request aborted'));
              return;
            }
            
            Papa.parse(csvText, {
              header: true,
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
        
        parsedResults.forEach(result => {
          parsedData[result.name] = result.data;
        });
        
        const mainData = filteredData && filteredData.length > 0 ? filteredData : parsedData.mainData;
        
        if (worker && !signal.aborted) {
          worker.onmessage = (e) => {
            if (e.data.type === 'result' && !signal.aborted) {
              const result = { data: e.data.data, summaryStats: e.data.summaryStats };
              
              if (dataCache.current.size > 5) {
                const firstKey = dataCache.current.keys().next().value;
                dataCache.current.delete(firstKey);
              }
              dataCache.current.set(cacheKey, result);
              
              setSubsystemProgressData(result.data);
              setSummaryStats(result.summaryStats);
              setLoading(false);
            }
          };
          
          worker.postMessage({
            type: 'processSubsystemData', data: mainData,
            testPackData: parsedData.testPackData, aislData: parsedData.aislData,
            loopData: parsedData.loopData,
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

    if (worker) fetchData();
  }, [filteredData, worker]);

  const rowRenderer = useCallback(({ index, style }) => {
    return <Row data={subsystemProgressData} index={index} style={style} />;
  }, [subsystemProgressData]);
  
  const memoizedSummaryStats = useMemo(() => summaryStats, [summaryStats]);
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
      <Global styles={css`table th, table td { border-color: #555879 !important; }`} />
      <VStack spacing={2} align="stretch">
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

        <Card>
          <CardBody>
            <Heading size="sm" mb={4}>Subsystem Progress Overview</Heading>
            <Box height="600px" width="100%">
              <AutoSizer>
                {({ height, width }) => (
                  <List
                    height={height} itemCount={memoizedProgressData.length} itemSize={80} width={width}
                    itemData={memoizedProgressData} overscanCount={5}
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
      </VStack>
    </Box>
  );
};

export default React.memo(SummarySubsystems);