import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { css, Global } from '@emotion/react';
import {
  Box, VStack, HStack, Text, SimpleGrid, Card, CardBody, Heading, Badge, Divider,
  Table, Thead, Tbody, Tr, Th, Td, TableContainer, Spinner, Progress, Button
} from '@chakra-ui/react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { FixedSizeList as List } from 'react-window';

// Web Worker for data processing
const createDataWorker = () => {
  const workerCode = `
    self.onmessage = function(e) {
      const { type, data, aislData, loopData, batchSize = 500 } = e.data;
      
      if (type === 'processSubsystemData') {
        const aislStats = new Map();
        const loopStats = new Map();
        const subsystemStats = new Map();
        
        // Process in batches to prevent memory spikes
        const processBatch = (items, processor) => {
          for (let i = 0; i < items.length; i += batchSize) {
            const batch = items.slice(i, i + batchSize);
            processor(batch);
          }
        };
        
        // Process aislamientos data
        processBatch(aislData, (batch) => {
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
        });
        
        // Process loop data
        processBatch(loopData, (batch) => {
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
        });
        
        // Process main data
        processBatch(data, (batch) => {
          batch.forEach(item => {
            const subsystem = item['SUBSYSTEM'];
            if (!subsystem) return;
            if (!subsystemStats.has(subsystem)) {
              subsystemStats.set(subsystem, {
                totalItems: 0, doneItems: 0, testPacks: new Set(),
                testPackProgressValues: new Map(), serialNumber: item['S/N'] || '',
                fluid: item['FLUID_SUBSYSTEM'] || '', description: item['DESCRIPTION'] || '',
                insulation: item['INSULATION'] || '', traceados: item['TRACEADOS'] || '',
                priority: item['PRIORITY'] || '', hito: item['HITO'] || '',
                teigaReinstatement: item['TEIGA REINSTATEMENT'] || '',
                teigaInsulation: item['TEIGA INSULATION'] || '',
                siemsa: item['SIEMSA'] || '', technip: item['TECHNIP'] || ''
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
                  if (!stats.testPackProgressValues.has(trimmedTp)) {
                    stats.testPackProgressValues.set(trimmedTp, []);
                  }
                  stats.testPackProgressValues.get(trimmedTp).push(progress);
                }
              });
            }
          });
        });
        
        // Create expanded data
        const expandedData = [];
        subsystemStats.forEach((stats, subsystem) => {
          const aislStat = aislStats.get(subsystem) || { totalItems: 0, doneItems: 0 };
          const loopStat = loopStats.get(subsystem) || { totalLoops: 0, doneLoops: 0, pendingLoops: 0 };
          const testPacksArray = Array.from(stats.testPacks);
          
          const testPackProgress = testPacksArray.map(tp => {
            const progressValues = stats.testPackProgressValues.get(tp) || [];
            const avgProgress = progressValues.length > 0 ? 
              progressValues.reduce((sum, val) => sum + val, 0) / progressValues.length : 0;
            return { testPack: tp, progress: avgProgress };
          });
          
          if (testPackProgress.length === 0) {
            expandedData.push({
              serialNumber: stats.serialNumber, fluid: stats.fluid, subsystem,
              totalItems: stats.totalItems, doneItems: stats.doneItems,
              pendingItems: stats.totalItems - stats.doneItems,
              description: stats.description, numTestPacks: 0, testPack: null,
              testPackProgress: 0, insulation: stats.insulation, isFirstRow: true, rowSpan: 1,
              aislTotalItems: aislStat.totalItems, aislDoneItems: aislStat.doneItems,
              aislPendingItems: aislStat.totalItems - aislStat.doneItems,
              totalLoops: loopStat.totalLoops, doneLoops: loopStat.doneLoops,
              pendingLoops: loopStat.pendingLoops, traceados: stats.traceados,
              priority: stats.priority, hito: stats.hito,
              teigaReinstatement: stats.teigaReinstatement,
              teigaInsulation: stats.teigaInsulation, siemsa: stats.siemsa,
              technip: stats.technip
            });
          } else {
            testPackProgress.forEach((tp, index) => {
              expandedData.push({
                serialNumber: stats.serialNumber, fluid: stats.fluid, subsystem,
                totalItems: stats.totalItems, doneItems: stats.doneItems,
                pendingItems: stats.totalItems - stats.doneItems,
                description: stats.description, numTestPacks: testPacksArray.length,
                testPack: tp.testPack, testPackProgress: tp.progress,
                insulation: stats.insulation, isFirstRow: index === 0,
                rowSpan: testPackProgress.length,
                aislTotalItems: aislStat.totalItems, aislDoneItems: aislStat.doneItems,
                aislPendingItems: aislStat.totalItems - aislStat.doneItems,
                totalLoops: loopStat.totalLoops, doneLoops: loopStat.doneLoops,
                pendingLoops: loopStat.pendingLoops, traceados: stats.traceados,
                priority: stats.priority, hito: stats.hito,
                teigaReinstatement: stats.teigaReinstatement,
                teigaInsulation: stats.teigaInsulation, siemsa: stats.siemsa,
                technip: stats.technip
              });
            });
          }
        });
        
        const sortedData = expandedData.sort((a, b) => b.totalItems - a.totalItems);
        
        // Calculate summary stats
        const processedSubsystems = new Set();
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
        
        self.postMessage({ type: 'result', data: sortedData, summaryStats });
      }
    };
  `;
  const blob = new Blob([workerCode], { type: 'application/javascript' });
  return new Worker(URL.createObjectURL(blob));
};

// Virtualized Row Component
const Row = React.memo(({ data, index, style }) => {
  const row = data[index];
  return (
    <div style={style}>
      <Table variant="simple" size="sm">
        <Tbody>
          <Tr>
            {row.isFirstRow && (
              <Td rowSpan={row.rowSpan} style={{ verticalAlign: 'middle', textAlign: 'center', backgroundColor: '#f7fafc' }}>
                <Text fontSize="sm" fontWeight="bold">{row.serialNumber}</Text>
              </Td>
            )}
            {row.isFirstRow && (
              <Td rowSpan={row.rowSpan} style={{ verticalAlign: 'middle', textAlign: 'center', backgroundColor: '#f7fafc' }}>
                <Text fontSize="sm" fontWeight="bold">{row.fluid}</Text>
              </Td>
            )}
            {row.isFirstRow && (
              <Td rowSpan={row.rowSpan} style={{ verticalAlign: 'middle', textAlign: 'center', backgroundColor: '#f7fafc' }}>
                <Text fontSize="sm" fontWeight="bold" isTruncated title={row.subsystem}>{row.subsystem}</Text>
              </Td>
            )}
            {row.isFirstRow && (
              <Td rowSpan={row.rowSpan} style={{ verticalAlign: 'middle', textAlign: 'center', backgroundColor: '#f7fafc' }}>
                <Text fontSize="sm" fontWeight="semibold">{row.aislTotalItems.toLocaleString()}</Text>
              </Td>
            )}
            {row.isFirstRow && (
              <Td rowSpan={row.rowSpan} style={{ verticalAlign: 'middle', textAlign: 'center', backgroundColor: '#f7fafc' }}>
                <Text fontSize="sm" fontWeight="semibold">{row.aislDoneItems.toLocaleString()}</Text>
              </Td>
            )}
            {row.isFirstRow && (
              <Td rowSpan={row.rowSpan} style={{ verticalAlign: 'middle', textAlign: 'center', backgroundColor: '#f7fafc' }}>
                <Text fontSize="sm" fontWeight="semibold">{row.aislPendingItems.toLocaleString()}</Text>
              </Td>
            )}
            {row.isFirstRow && (
              <Td rowSpan={row.rowSpan} style={{ verticalAlign: 'middle', textAlign: 'center', backgroundColor: '#f7fafc' }}>
                <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center">
                  <Progress 
                    value={row.aislTotalItems > 0 ? Math.round((row.aislDoneItems / row.aislTotalItems) * 100) : 0}
                    size="md" 
                    width="30px"
                    height="60px"
                    orientation="vertical"
                    borderRadius="md"
                    backgroundColor="#0E2148"
                    colorScheme={row.aislTotalItems > 0 ? (row.aislDoneItems / row.aislTotalItems * 100 === 100 ? "green" : 
                             row.aislDoneItems / row.aislTotalItems * 100 > 50 ? "blue" : "red") : "gray"}
                  />
                  <Text fontSize="xs" fontWeight="bold" color="black" mt={2}>
                    {row.aislTotalItems > 0 ? Math.round((row.aislDoneItems / row.aislTotalItems) * 100) : 0}%
                  </Text>
                </Box>
              </Td>
            )}
            <Td style={{ textAlign: 'center', padding: '8px' }}>
              {row.testPack && <Text fontSize="sm" fontWeight="medium">{row.testPack}</Text>}
            </Td>
            <Td style={{ padding: '8px', textAlign: 'center' }}>
              {row.testPack && (
                <Box position="relative" width="100px" margin="0 auto">
                  <Progress value={Math.round(row.testPackProgress)} size="md" 
                           colorScheme={row.testPackProgress === 100 ? "green" : row.testPackProgress > 50 ? "blue" : "red"}
                           width="100px" borderRadius="md" backgroundColor="#0E2148" />
                  <Text position="absolute" top="50%" left="50%" transform="translate(-50%, -50%)" 
                        fontSize="xs" fontWeight="bold" color="white" textShadow="0px 0px 2px rgba(0,0,0,0.7)">
                    {Math.round(row.testPackProgress)}%
                  </Text>
                </Box>
              )}
            </Td>
          </Tr>
        </Tbody>
      </Table>
    </div>
  );
});

const SummarySubsystems = ({ data: filteredData = [] }) => {
  const [data, setData] = useState([]);

  const [aislData, setAislData] = useState([]);
  const [loopData, setLoopData] = useState([]);
  const [subsystemsInfoData, setSubsystemsInfoData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [worker, setWorker] = useState(null);
  const abortControllerRef = useRef(null);
  const dataCache = useRef(new Map());
  const workerRef = useRef(null);

  // Initialize worker
  useEffect(() => {
    workerRef.current = createDataWorker();
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

  // Load CSV data directly or use filtered data if provided
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Use filtered data if available, otherwise fetch from CSV
        if (filteredData && filteredData.length > 0) {
          setData(filteredData);
        } else {
          // Load main data from CSV if no filtered data
          const response = await fetch('/data/pipelinedata.csv');
          const csvText = await response.text();
          
          Papa.parse(csvText, {
            header: true,
            complete: (results) => {
              setData(results.data);
            },
            error: (error) => {
              setError(`Error parsing CSV: ${error.message}`);
            }
          });
        }
        
        // Always load these supporting datasets
        const aislResponse = await fetch('/data/aislamientos.csv');
        const aislCsvText = await aislResponse.text();
        
        const loopResponse = await fetch('/data/test_of_lazos_updated.csv');
        const loopCsvText = await loopResponse.text();
        
        const subsystemsInfoResponse = await fetch('/data/subsystems_info.csv');
        const subsystemsInfoCsvText = await subsystemsInfoResponse.text();
        
        // Parse aislamientos data
        Papa.parse(aislCsvText, {
          header: true,
          complete: (aislResults) => {
            setAislData(aislResults.data);
            
            // Parse loop data
            Papa.parse(loopCsvText, {
              header: true,
              complete: (loopResults) => {
                setLoopData(loopResults.data);
                
                // Parse subsystems info data
                Papa.parse(subsystemsInfoCsvText, {
                  header: true,
                  complete: (subsystemsInfoResults) => {
                    setSubsystemsInfoData(subsystemsInfoResults.data);
                    setLoading(false);
                  },
                  error: (error) => {
                    setError(`Error parsing subsystems info CSV: ${error.message}`);
                    setLoading(false);
                  }
                });
              },
              error: (error) => {
                setError(`Error parsing loop CSV: ${error.message}`);
                setLoading(false);
              }
            });
          },
          error: (error) => {
            setError(`Error parsing aislamientos CSV: ${error.message}`);
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
  
  // Calculate subsystem progress statistics with TEST PACK data
  const subsystemProgressData = useMemo(() => {
    if (!data || data.length === 0 || !aislData || aislData.length === 0 || !loopData || loopData.length === 0 || !subsystemsInfoData || subsystemsInfoData.length === 0) {
      return [];
    }
    
    // Process aislamientos data according to SQL transformation
    const aislStats = {};
    aislData.forEach(item => {
      const subsystem = item['SUBSYSTEM'];
      if (!subsystem) return;
      
      if (!aislStats[subsystem]) {
        aislStats[subsystem] = {
          totalItems: 0,
          doneItems: 0
        };
      }
      
      // Count total items per subsystem
      aislStats[subsystem].totalItems += 1;
      
      // Count done items where DONE = 'YES'
      if (item['DONE'] === 'YES') {
        aislStats[subsystem].doneItems += 1;
      }
    });
    
    // Process loop data according to SQL transformation
    const loopStats = {};
    loopData.forEach(item => {
      const subsystem = item['SUBS_PRE'];
      if (!subsystem) return;
      
      if (!loopStats[subsystem]) {
        loopStats[subsystem] = {
          totalLoops: 0,
          doneLoops: 0,
          pendingLoops: 0
        };
      }
      
      // Count total loops per subsystem
      loopStats[subsystem].totalLoops += 1;
      
      // Count done loops where OK=100% = '100.00%'
      if (item['OK=100%'] === '100.00%') {
        loopStats[subsystem].doneLoops += 1;
      } else {
        loopStats[subsystem].pendingLoops += 1;
      }
    });

    const subsystemStats = {};

    // Process main pipeline data
    data.forEach(item => {
      const subsystem = item['SUBSYSTEM'];
      if (!subsystem) return;

      if (!subsystemStats[subsystem]) {
        subsystemStats[subsystem] = {
          totalItems: 0,
          doneItems: 0,
          testPacks: new Set(),
          testPackProgressValues: {}, // Store progress values for each test pack
          traceados: item['TRACEADOS'] || '',
          priority: item['PRIORITY'] || '',
          hito: item['HITO'] || '',
          teigaReinstatement: item['TEIGA REINSTATEMENT'] || '',
          teigaInsulation: item['TEIGA INSULATION'] || '',
          siemsa: item['SIEMSA'] || '',
          technip: item['TECHNIP'] || ''
        };
      }

      subsystemStats[subsystem].totalItems += 1;

      // Check completion based on CONSTRUC COORD PROGRESS
      const progress = parseFloat(item['CONSTRUC COORD PROGRESS']) || 0;
      if (progress >= 90) {
        subsystemStats[subsystem].doneItems += 1;
      }

      // Progress calculation based on CONSTRUC COORD PROGRESS
      const overallProgress = parseFloat(item['PROGRESS SW+FW (%)']) || 0;

      // Add test pack if available and calculate average progress
      if (item['TEST PACK']) {
        const testPacks = item['TEST PACK'].split('|');
        testPacks.forEach(tp => {
          const trimmedTp = tp.trim();
          if (trimmedTp) {
            subsystemStats[subsystem].testPacks.add(trimmedTp);
            
            // Store progress values for averaging
            if (!subsystemStats[subsystem].testPackProgressValues[trimmedTp]) {
              subsystemStats[subsystem].testPackProgressValues[trimmedTp] = [];
            }
            subsystemStats[subsystem].testPackProgressValues[trimmedTp].push(progress);
          }
        });
      }
    });

    // Create expanded data with test pack rows
    const expandedData = [];
    
    Object.entries(subsystemStats).forEach(([subsystem, stats]) => {
      // Get aislamientos stats for this subsystem
      const aislStat = aislStats[subsystem] || { totalItems: 0, doneItems: 0 };
      
      // Get loop stats for this subsystem
      const loopStat = loopStats[subsystem] || { totalLoops: 0, doneLoops: 0, pendingLoops: 0 };
      
      // Get subsystem info
      const subsystemInfo = subsystemsInfoData.find(info => info.SUBSYSTEM === subsystem);
      const testPacksArray = Array.from(stats.testPacks);
      const numTestPacks = testPacksArray.length;
      
      // Get additional data from the first item for this subsystem
      const firstItem = data.find(item => item['SUBSYSTEM'] === subsystem) || {};
      const serialNumber = firstItem['S/N'] || '';
      const fluid = firstItem['FLUID_SUBSYSTEM'] || '';
      const description = firstItem['DESCRIPTION'] || '';
      const insulation = firstItem['INSULATION'] || '';
      
      // Calculate average test pack progress from CONSTRUC COORD PROGRESS
      const testPackProgress = testPacksArray.map(tp => {
        const progressValues = stats.testPackProgressValues[tp] || [];
        const avgProgress = progressValues.length > 0 ? 
          progressValues.reduce((sum, val) => sum + val, 0) / progressValues.length : 0;
        
        return {
          testPack: tp,
          progress: avgProgress
        };
      });

      // If no test packs, create single row
      if (testPackProgress.length === 0) {
        expandedData.push({
          serialNumber,
          fluid,
          subsystem,
          totalItems: stats.totalItems,
          doneItems: stats.doneItems,
          pendingItems: stats.totalItems - stats.doneItems,
          description,
          numTestPacks: 0,
          testPack: null,
          testPackProgress: 0,
          insulation,
          isFirstRow: true,
          rowSpan: 1,
          aislTotalItems: aislStat.totalItems,
          aislDoneItems: aislStat.doneItems,
          aislPendingItems: aislStat.totalItems - aislStat.doneItems,
          totalLoops: loopStat.totalLoops,
          doneLoops: loopStat.doneLoops,
          pendingLoops: loopStat.pendingLoops,
          traceados: stats.traceados,
          priority: stats.priority,
          hito: stats.hito,
          teigaReinstatement: stats.teigaReinstatement,
          teigaInsulation: stats.teigaInsulation,
          siemsa: stats.siemsa,
          technip: stats.technip
        });
      } else {
        // Create multiple rows for test packs
        testPackProgress.forEach((tp, index) => {
          expandedData.push({
            serialNumber,
            fluid,
            subsystem,
            totalItems: stats.totalItems,
            doneItems: stats.doneItems,
            pendingItems: stats.totalItems - stats.doneItems,
            description,
            numTestPacks: numTestPacks,
            testPack: tp.testPack,
            testPackProgress: tp.progress,
            insulation,
            isFirstRow: index === 0,
            rowSpan: testPackProgress.length,
            aislTotalItems: aislStat.totalItems,
            aislDoneItems: aislStat.doneItems,
            aislPendingItems: aislStat.totalItems - aislStat.doneItems,
            totalLoops: loopStat.totalLoops,
            doneLoops: loopStat.doneLoops,
            pendingLoops: loopStat.pendingLoops,
            traceados: stats.traceados,
            priority: stats.priority,
            hito: stats.hito,
            teigaReinstatement: stats.teigaReinstatement,
            teigaInsulation: stats.teigaInsulation,
            siemsa: stats.siemsa,
            technip: stats.technip
          });
        });
      }
    });

    return expandedData.sort((a, b) => b.totalItems - a.totalItems);
  }, [data, aislData, loopData, subsystemsInfoData]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    if (!subsystemProgressData || subsystemProgressData.length === 0) {
      return {
        totalRecords: 0,
        uniqueTestPacks: 0,
        uniqueSubsystems: 0,
        uniqueDesignAreas: 0,
        testPackBreakdown: {},
        subsystemBreakdown: {},
        totalItems: 0
      };
    }

    const testPacks = new Set();
    const subsystems = new Set();
    const testPackCounts = {};
    const subsystemCounts = {};

    subsystemProgressData.forEach(item => {
      if (item.testPack) {
        testPacks.add(item.testPack);
        testPackCounts[item.testPack] = (testPackCounts[item.testPack] || 0) + 1;
      }
      if (item.subsystem) {
        subsystems.add(item.subsystem);
        subsystemCounts[item.subsystem] = (subsystemCounts[item.subsystem] || 0) + 1;
      }
    });

    return {
      totalRecords: subsystemProgressData.length,
      uniqueTestPacks: testPacks.size,
      uniqueSubsystems: subsystems.size,
      uniqueDesignAreas: 0,
      testPackBreakdown: testPackCounts,
      subsystemBreakdown: subsystemCounts
    };
  }, [subsystemProgressData]);
  
  // Calculate total items from subsystem progress data
  const totalItemsSum = useMemo(() => {
    if (!subsystemProgressData || subsystemProgressData.length === 0) {
      return 0;
    }
    
    // Create a Set to store unique subsystems to avoid double counting
    const processedSubsystems = new Set();
    let totalSum = 0;
    
    subsystemProgressData.forEach(row => {
      // Only count each subsystem once
      if (!processedSubsystems.has(row.subsystem)) {
        totalSum += row.aislTotalItems;
        processedSubsystems.add(row.subsystem);
      }
    });
    
    return totalSum;
  }, [subsystemProgressData]);
  
  // Calculate total done items from subsystem progress data
  const totalDoneItemsSum = useMemo(() => {
    if (!subsystemProgressData || subsystemProgressData.length === 0) {
      return 0;
    }
    
    // Create a Set to store unique subsystems to avoid double counting
    const processedSubsystems = new Set();
    let totalDoneSum = 0;
    
    subsystemProgressData.forEach(row => {
      // Only count each subsystem once
      if (!processedSubsystems.has(row.subsystem)) {
        totalDoneSum += row.aislDoneItems;
        processedSubsystems.add(row.subsystem);
      }
    });
    
    return totalDoneSum;
  }, [subsystemProgressData]);

  // Calculate total pending items from subsystem progress data
  const totalPendingItemsSum = useMemo(() => {
    if (!subsystemProgressData || subsystemProgressData.length === 0) {
      return 0;
    }
    
    // Create a Set to store unique subsystems to avoid double counting
    const processedSubsystems = new Set();
    let totalPendingSum = 0;
    
    subsystemProgressData.forEach(row => {
      // Only count each subsystem once
      if (!processedSubsystems.has(row.subsystem)) {
        totalPendingSum += row.aislPendingItems;
        processedSubsystems.add(row.subsystem);
      }
    });
    
    return totalPendingSum;
  }, [subsystemProgressData]);

  // Calculate average progress items percentage
  const avgProgressItemsPercent = useMemo(() => {
    if (!subsystemProgressData || subsystemProgressData.length === 0) {
      return 0;
    }
    
    const processedSubsystems = new Set();
    let totalProgress = 0;
    let count = 0;
    
    subsystemProgressData.forEach(row => {
      if (!processedSubsystems.has(row.subsystem)) {
        const progress = row.aislTotalItems > 0 ? (row.aislDoneItems / row.aislTotalItems) * 100 : 0;
        totalProgress += progress;
        count++;
        processedSubsystems.add(row.subsystem);
      }
    });
    
    return count > 0 ? Math.round(totalProgress / count) : 0;
  }, [subsystemProgressData]);

  // Calculate average test pack progress percentage
  const avgTestPackProgress = useMemo(() => {
    if (!subsystemProgressData || subsystemProgressData.length === 0) {
      return 0;
    }
    
    let totalProgress = 0;
    let count = 0;
    
    subsystemProgressData.forEach(row => {
      if (row.testPack && row.testPackProgress > 0) {
        totalProgress += row.testPackProgress;
        count++;
      }
    });
    
    return count > 0 ? Math.round(totalProgress / count) : 0;
  }, [subsystemProgressData]);

  // Calculate total loops sum
  const totalLoopsSum = useMemo(() => {
    if (!subsystemProgressData || subsystemProgressData.length === 0) {
      return 0;
    }
    
    const processedSubsystems = new Set();
    let totalSum = 0;
    
    subsystemProgressData.forEach(row => {
      if (!processedSubsystems.has(row.subsystem)) {
        totalSum += row.totalLoops;
        processedSubsystems.add(row.subsystem);
      }
    });
    
    return totalSum;
  }, [subsystemProgressData]);

  // Calculate total done loops sum
  const totalDoneLoopsSum = useMemo(() => {
    if (!subsystemProgressData || subsystemProgressData.length === 0) {
      return 0;
    }
    
    const processedSubsystems = new Set();
    let totalSum = 0;
    
    subsystemProgressData.forEach(row => {
      if (!processedSubsystems.has(row.subsystem)) {
        totalSum += row.doneLoops;
        processedSubsystems.add(row.subsystem);
      }
    });
    
    return totalSum;
  }, [subsystemProgressData]);

  // Calculate total pending loops sum
  const totalPendingLoopsSum = useMemo(() => {
    if (!subsystemProgressData || subsystemProgressData.length === 0) {
      return 0;
    }
    
    const processedSubsystems = new Set();
    let totalSum = 0;
    
    subsystemProgressData.forEach(row => {
      if (!processedSubsystems.has(row.subsystem)) {
        totalSum += row.pendingLoops;
        processedSubsystems.add(row.subsystem);
      }
    });
    
    return totalSum;
  }, [subsystemProgressData]);

  // Calculate average loops progress percentage
  const avgLoopsProgressPercent = useMemo(() => {
    if (!subsystemProgressData || subsystemProgressData.length === 0) {
      return 0;
    }
    
    const processedSubsystems = new Set();
    let totalProgress = 0;
    let count = 0;
    
    subsystemProgressData.forEach(row => {
      if (!processedSubsystems.has(row.subsystem)) {
        const progress = row.totalLoops > 0 ? (row.doneLoops / row.totalLoops) * 100 : 0;
        totalProgress += progress;
        count++;
        processedSubsystems.add(row.subsystem);
      }
    });
    
    return count > 0 ? Math.round(totalProgress / count) : 0;
  }, [subsystemProgressData]);

  // Calculate done test packs (PROGRESS TEST PACK = 100%)
  const doneTestPacks = useMemo(() => {
    if (!subsystemProgressData || subsystemProgressData.length === 0) {
      return 0;
    }
    
    return subsystemProgressData.filter(row => 
      row.testPack && row.testPackProgress === 100
    ).length;
  }, [subsystemProgressData]);

  // Calculate pending test packs (PROGRESS TEST PACK < 100%)
  const pendingTestPacks = useMemo(() => {
    if (!subsystemProgressData || subsystemProgressData.length === 0) {
      return 0;
    }
    
    return subsystemProgressData.filter(row => 
      row.testPack && row.testPackProgress < 100
    ).length;
  }, [subsystemProgressData]);

  // Get top 5 test packs and subsystems by count
  const topTestPacks = useMemo(() => {
    return Object.entries(summaryStats.testPackBreakdown)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);
  }, [summaryStats.testPackBreakdown]);

  const topSubsystems = useMemo(() => {
    return Object.entries(summaryStats.subsystemBreakdown)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);
  }, [summaryStats.subsystemBreakdown]);

  // Export data preparation
  const prepareExportData = useCallback(() => {
    return subsystemProgressData.map(row => ({
      'S/N': row.serialNumber,
      'FLUID': row.fluid,
      'SUBSYSTEM': row.subsystem,
      'TOTAL ITEMS': row.aislTotalItems,
      'DONE ITEMS': row.aislDoneItems,
      'PENDING ITEMS': row.aislPendingItems,
      'DESCRIPTION': row.description,
      'N°TP': row.numTestPacks,
      'TP INCLUDE': row.testPack || '',
      'PROGRESS TEST PACK': row.testPack ? `${Math.round(row.testPackProgress)}%` : '',
      'TRACEADOS': row.traceados,
      'TOTAL LOOP': row.totalLoops,
      'LOOP DONE': row.doneLoops,
      'LOOP PENDING': row.pendingLoops,
      'PRIORITY': row.priority,
      'HITO': row.hito,
      'TEIGA REINSTATEMENT': row.teigaReinstatement,
      'TEIGA INSULATION': row.teigaInsulation,
      'SIEMSA': row.siemsa,
      'TECHNIP': row.technip
    }));
  }, [subsystemProgressData]);

  // Export to CSV function
  const exportToCSV = useCallback(() => {
    const csvData = prepareExportData();
    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'subsystem_progress_data.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [prepareExportData]);

  // Export to Excel function
  const exportToExcel = useCallback(() => {
    const excelData = prepareExportData();
    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Subsystem Progress');
    XLSX.writeFile(wb, 'subsystem_progress_data.xlsx');
  }, [prepareExportData]);

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
          table {
            border-collapse: separate !important;
            border-spacing: 0 !important;
          }
          table th, table td {
            border: 1px solid #e2e8f0 !important;
            vertical-align: middle !important;
          }
        `}
      />
      <VStack spacing={2} align="stretch">

        {/* Summary Statistics */}
        <Box width="100%" overflowX="auto">
          <TableContainer>
            <Table variant="simple" size="sm" style={{ tableLayout: 'fixed', width: '100%' }}>
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
                  <Td style={{ textAlign: 'center', borderRight: '1px solid #e2e8f0', fontWeight: 'bold' }}>{summaryStats.uniqueSubsystems}</Td>
                  <Td style={{ textAlign: 'center', borderRight: '1px solid #e2e8f0', fontWeight: 'bold' }}>{totalItemsSum.toLocaleString()}</Td>
                  <Td style={{ textAlign: 'center', borderRight: '1px solid #e2e8f0', fontWeight: 'bold' }}>{totalDoneItemsSum.toLocaleString()}</Td>
                  <Td style={{ textAlign: 'center', borderRight: '1px solid #e2e8f0', fontWeight: 'bold' }}>{totalPendingItemsSum.toLocaleString()}</Td>
                  <Td style={{ textAlign: 'center', borderRight: '1px solid #e2e8f0', fontWeight: 'bold' }}>{summaryStats.uniqueTestPacks}</Td>
                  <Td style={{ textAlign: 'center', borderRight: '1px solid #e2e8f0', fontWeight: 'bold' }}>{doneTestPacks}</Td>
                  <Td style={{ textAlign: 'center', borderRight: '1px solid #e2e8f0', fontWeight: 'bold' }}>{pendingTestPacks}</Td>
                  <Td style={{ textAlign: 'center', borderRight: '1px solid #e2e8f0', fontWeight: 'bold' }}>{totalLoopsSum.toLocaleString()}</Td>
                  <Td style={{ textAlign: 'center', fontWeight: 'bold' }}>{totalPendingLoopsSum.toLocaleString()}</Td>
                </Tr>
              </Tbody>
            </Table>
          </TableContainer>
        </Box>

        <Divider />

        {/* Subsystem Progress Table */}
        <Card>
          <CardBody>
            <HStack justify="space-between" mb={4}>
              <Heading size="sm">Subsystem Progress Overview</Heading>
              <HStack spacing={2}>
                <Button colorScheme="blue" size="sm" onClick={exportToCSV}>
                  Export CSV
                </Button>
                <Button colorScheme="green" size="sm" onClick={exportToExcel}>
                  Export Excel
                </Button>
              </HStack>
            </HStack>
            <TableContainer overflowX="auto">
              <Table variant="simple" size="sm" style={{ tableLayout: 'fixed', minWidth: '2200px' }}>
                <Thead bg="gray.50">
                  <Tr>
                    <Th style={{ fontSize:'9px',borderRight: '1px solid #e2e8f0', width: '60px', textAlign: 'center' }}>
                      <Text>
                        S/N
                      </Text>
                    </Th>
                    <Th style={{fontSize:'9px', borderRight: '1px solid #e2e8f0', width: '60px', textAlign: 'center' }}>
                      <Text>
                        FLUID
                      </Text>
                    </Th>
                    <Th style={{fontSize:'9px', borderRight: '1px solid #e2e8f0', width: '140px', textAlign: 'center' }}>SUBSYSTEM</Th>
                    <Th isNumeric style={{ fontSize:'9px',borderRight: '1px solid #e2e8f0',  textAlign: 'center' }}>
                      <Text>
                        TOTAL<br />ITEMS
                      </Text>
                    </Th>
                    <Th isNumeric style={{fontSize:'9px', borderRight: '1px solid #e2e8f0', textAlign: 'center' }}>
                      <Text>
                        DONE<br />ITEMS
                      </Text>
                    </Th>
                    <Th isNumeric style={{fontSize:'9px', borderRight: '1px solid #e2e8f0', textAlign: 'center' }}>
                      <Text>
                        PENDING<br />ITEMS
                      </Text>
                    </Th>
                    <Th style={{ fontSize:'9px',borderRight: '1px solid #e2e8f0', width: '140px',textAlign: 'center' }}>
                      <Text>
                        DESCRIPTION
                      </Text>
                    </Th>
                    <Th isNumeric style={{fontSize:'9px', borderRight: '1px solid #e2e8f0', textAlign: 'center' }}>
                      <Text>
                        N°TP
                      </Text>
                    </Th>
                    <Th style={{ fontSize:'9px',borderRight: '1px solid #e2e8f0', textAlign: 'center' }}>
                      <Text>
                        TP's<br />INCLUDE
                      </Text>
                    </Th>
                    <Th style={{ fontSize:'9px',borderRight: '1px solid #e2e8f0',width:'140px', textAlign: 'center' }}>
                      <Text>
                        PROGRESS<br />TEST PACK
                      </Text>
                    </Th>
                    <Th style={{fontSize:'9px', borderRight: '1px solid #e2e8f0',width:'100px', textAlign: 'center' }}>
                      <Text>
                        TRACEADOS
                      </Text>
                    </Th>
                    <Th isNumeric style={{ fontSize:'9px',borderRight: '1px solid #e2e8f0', width:'80px', textAlign: 'center' }}>
                      <Text>
                        TOTAL<br />LOOP<br />(Signal)
                      </Text>
                    </Th>
                    <Th isNumeric style={{ fontSize:'9px',borderRight: '1px solid #e2e8f0', width:'80px',textAlign: 'center' }}>
                      <Text>
                        LOOP<br />(Signal)<br />DONE
                      </Text>
                    </Th>
                    <Th isNumeric style={{ fontSize:'9px',borderRight: '1px solid #e2e8f0',width:'80px', textAlign: 'center' }}>
                      <Text>
                        LOOP<br />(Signal)<br />PENDING
                      </Text>
                    </Th>
                    <Th style={{fontSize:'9px', borderRight: '1px solid #e2e8f0',width:'80px', textAlign: 'center' }}>
                      <Text>
                        PRIORITY
                      </Text>
                    </Th>
                    <Th style={{fontSize:'9px', borderRight: '1px solid #e2e8f0',width:'80px', textAlign: 'center' }}>
                      <Text>
                        HITO
                      </Text>
                    </Th>
                    <Th style={{fontSize:'9px', borderRight: '1px solid #e2e8f0',width:'120px', textAlign: 'center' }}>
                      <Text>
                        TEIGA<br />REINSTATEMENT
                      </Text>
                    </Th>
                    <Th style={{fontSize:'9px', borderRight: '1px solid #e2e8f0',width:'120px', textAlign: 'center' }}>
                      <Text>
                        TEIGA<br />INSULATION
                      </Text>
                    </Th>
                    <Th style={{fontSize:'9px', borderRight: '1px solid #e2e8f0',width:'80px', textAlign: 'center' }}>
                      <Text>
                        SIEMSA
                      </Text>
                    </Th>
                    <Th style={{ fontSize:'9px' , textAlign: 'center'}}>
                      <Text>
                        TECHNIP
                      </Text>
                    </Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {subsystemProgressData.map((row, index) => {
                    const progressPercent = row.totalItems > 0 ? Math.round((row.doneItems / row.totalItems) * 100) : 0;
                    const key = `${row.subsystem}-${row.testPack || 'no-tp'}-${index}`;
                    
                    return (
                      <Tr key={key}>
                        {/* S/N - Merged cell */}
                        {row.isFirstRow && (
                          <Td 
                            fontWeight="medium" 
                            rowSpan={row.rowSpan}
                            textAlign="center"
                            verticalAlign="middle"
                            backgroundColor="#f7fafc"
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
                            textAlign="center"
                            verticalAlign="middle"
                            backgroundColor="#f7fafc"
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
                              {row.description && row.description.length > 15 ? 
                                row.description.split(' ').map((word, i, arr) => {
                                  // Add a line break between words
                                  return (
                                    <React.Fragment key={i}>
                                      {i > 0 && <br />}
                                      {word}
                                    </React.Fragment>
                                  );
                                }) : 
                                row.description}
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
                        <Td textAlign="center" p={2}>
                          {row.testPack && (
                            <Text fontSize="sm" fontWeight="medium">
                              {row.testPack}
                            </Text>
                          )}
                        </Td>
                        
                        {/* PROGRESS TEST PACK - Individual cell per row */}
                        <Td textAlign="center" p={2}>
                          {row.testPack && (
                            <Box position="relative" width="100px" margin="0 auto">
                              <Progress 
                                value={Math.round(row.testPackProgress)} 
                                size="md" 
                                width="100px"
                                borderRadius="md"
                                backgroundColor="#0E2148"
                                colorScheme="teal"
                              />
                              <Text 
                                position="absolute" 
                                top="50%" 
                                left="50%" 
                                transform="translate(-50%, -50%)" 
                                fontSize="xs" 
                                fontWeight="bold" 
                                color="white"
                                textShadow="1px 1px 2px rgba(0,0,0,0.8)"
                              >
                                {Math.round(row.testPackProgress)}%
                              </Text>
                            </Box>
                          )}
                        </Td>
                        
                        {/* TRACEADOS - Individual cell per row */}
                        <Td style={{ textAlign: 'center', padding: '8px', borderRight: '1px solid #e2e8f0' }}>
                          <Text fontSize="sm" fontWeight="medium">
                            {row.traceados}
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
                        
                        {/* PRIORITY - Individual cell per row */}
                        <Td style={{ textAlign: 'center', padding: '8px', borderRight: '1px solid #e2e8f0' }}>
                          <Text fontSize="sm" fontWeight="medium">
                            {row.priority}
                          </Text>
                        </Td>
                        
                        {/* HITO - Individual cell per row */}
                        <Td style={{ textAlign: 'center', padding: '8px', borderRight: '1px solid #e2e8f0' }}>
                          <Text fontSize="sm" fontWeight="medium">
                            {row.hito}
                          </Text>
                        </Td>
                        
                        {/* TEIGA REINSTATEMENT - Individual cell per row */}
                        <Td style={{ textAlign: 'center', padding: '8px', borderRight: '1px solid #e2e8f0' }}>
                          <Text fontSize="sm" fontWeight="medium">
                            {row.teigaReinstatement}
                          </Text>
                        </Td>
                        
                        {/* TEIGA INSULATION - Individual cell per row */}
                        <Td style={{ textAlign: 'center', padding: '8px', borderRight: '1px solid #e2e8f0' }}>
                          <Text fontSize="sm" fontWeight="medium">
                            {row.teigaInsulation}
                          </Text>
                        </Td>
                        
                        {/* SIEMSA - Individual cell per row */}
                        <Td style={{ textAlign: 'center', padding: '8px', borderRight: '1px solid #e2e8f0' }}>
                          <Text fontSize="sm" fontWeight="medium">
                            {row.siemsa}
                          </Text>
                        </Td>
                        
                        {/* TECHNIP - Individual cell per row */}
                        <Td style={{ textAlign: 'center', padding: '8px' }}>
                          <Text fontSize="sm" fontWeight="medium">
                            {row.technip}
                          </Text>
                        </Td>
                        

                      </Tr>
                    );
                  })}
                </Tbody>
              </Table>
            </TableContainer>
            {subsystemProgressData.length === 0 && (
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
                {topTestPacks.map(([testPack, count], index) => (
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
                {topTestPacks.length === 0 && (
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
                {topSubsystems.map(([subsystem, count], index) => (
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
                {topSubsystems.length === 0 && (
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

export default SummarySubsystems;