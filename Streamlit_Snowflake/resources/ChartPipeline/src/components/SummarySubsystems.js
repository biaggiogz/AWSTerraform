import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  SimpleGrid,
  Card,
  CardBody,
  Heading,
  Badge,
  Divider,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Spinner,
  Progress
} from '@chakra-ui/react';
import Papa from 'papaparse'; // You'll need to install this: npm install papaparse

/**
 * Summary Subsystems component showing aggregated data directly from CSV
 * @param {Object} props - Component props
 * @param {Array} props.data - Filtered dataset from parent component
 */
const SummarySubsystems = ({ data: filteredData = [] }) => {
  const [data, setData] = useState([]);
  const [testPackData, setTestPackData] = useState([]);
  const [aislData, setAislData] = useState([]);
  const [loopData, setLoopData] = useState([]);
  const [subsystemsInfoData, setSubsystemsInfoData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
        const testPackResponse = await fetch('/data/test_pack_progress.csv');
        const testPackCsvText = await testPackResponse.text();
        
        const aislResponse = await fetch('/data/aislamientos.csv');
        const aislCsvText = await aislResponse.text();
        
        const loopResponse = await fetch('/data/test_of_lazos_updated.csv');
        const loopCsvText = await loopResponse.text();
        
        const subsystemsInfoResponse = await fetch('/data/subsystems_info.csv');
        const subsystemsInfoCsvText = await subsystemsInfoResponse.text();
        
        // Parse test pack data
        Papa.parse(testPackCsvText, {
          header: true,
          complete: (testPackResults) => {
            setTestPackData(testPackResults.data);
            
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
          },
          error: (error) => {
            setError(`Error parsing test pack CSV: ${error.message}`);
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
    if (!data || data.length === 0 || !testPackData || testPackData.length === 0 || !aislData || aislData.length === 0 || !loopData || loopData.length === 0 || !subsystemsInfoData || subsystemsInfoData.length === 0) {
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
          testPackProgressValues: {} // Store progress values for each test pack
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

      // Add test pack if available
      if (item['TEST PACK']) {
        const testPacks = item['TEST PACK'].split('|');
        testPacks.forEach(tp => {
          if (tp.trim()) {
            subsystemStats[subsystem].testPacks.add(tp.trim());
            
            // Store progress for this test pack
            if (!subsystemStats[subsystem].testPackProgressValues[tp.trim()]) {
              subsystemStats[subsystem].testPackProgressValues[tp.trim()] = progress;
            } else {
              // If we have multiple entries for the same test pack, average the progress
              subsystemStats[subsystem].testPackProgressValues[tp.trim()] = 
                (subsystemStats[subsystem].testPackProgressValues[tp.trim()] + progress) / 2;
            }
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
      
      // Get description for this subsystem
      const subsystemInfo = subsystemsInfoData.find(info => info.SUBSYSTEM === subsystem);
      const description = subsystemInfo ? subsystemInfo.DESCRIPTION : '';
      const testPacksArray = Array.from(stats.testPacks);
      const numTestPacks = testPacksArray.length;
      
      // Get test pack progress data
      const testPackProgress = testPacksArray.map(tp => {
        const progressData = testPackData.find(tpd => 
          tpd.TestPack === tp && tpd.SUBSYSTEM === subsystem
        );
        
        // Use the progress from testPackData if available, otherwise use the calculated progress
        const progress = progressData ? 
          parseFloat(progressData.Progress.replace('%', '')) : 
          stats.testPackProgressValues[tp] || 0;
        
        return {
          testPack: tp,
          progress: progress
        };
      });

      // If no test packs, create single row
      if (testPackProgress.length === 0) {
        expandedData.push({
          subsystem,
          totalItems: stats.totalItems,
          doneItems: stats.doneItems,
          pendingItems: stats.totalItems - stats.doneItems,
          numTestPacks: 0,
          testPack: null,
          testPackProgress: 0,
          isFirstRow: true,
          rowSpan: 1,
          aislTotalItems: aislStat.totalItems,
          aislDoneItems: aislStat.doneItems,
          aislPendingItems: aislStat.totalItems - aislStat.doneItems,
          totalLoops: loopStat.totalLoops,
          doneLoops: loopStat.doneLoops,
          pendingLoops: loopStat.pendingLoops,
          description: description
        });
      } else {
        // Create multiple rows for test packs
        testPackProgress.forEach((tp, index) => {
          expandedData.push({
            subsystem,
            totalItems: stats.totalItems,
            doneItems: stats.doneItems,
            pendingItems: stats.totalItems - stats.doneItems,
            numTestPacks: numTestPacks,
            testPack: tp.testPack,
            testPackProgress: tp.progress,
            isFirstRow: index === 0,
            rowSpan: testPackProgress.length,
            aislTotalItems: aislStat.totalItems,
            aislDoneItems: aislStat.doneItems,
            aislPendingItems: aislStat.totalItems - aislStat.doneItems,
            totalLoops: loopStat.totalLoops,
            doneLoops: loopStat.doneLoops,
            pendingLoops: loopStat.pendingLoops,
            description: description
          });
        });
      }
    });

    return expandedData.sort((a, b) => b.totalItems - a.totalItems);
  }, [data, testPackData, aislData, loopData, subsystemsInfoData]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    if (!data || data.length === 0) {
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
    const designAreas = new Set();
    const testPackCounts = {};
    const subsystemCounts = {};

    data.forEach(item => {
      if (item['TEST PACK']) {
        testPacks.add(item['TEST PACK']);
        testPackCounts[item['TEST PACK']] = (testPackCounts[item['TEST PACK']] || 0) + 1;
      }
      if (item['SUBSYSTEM']) {
        subsystems.add(item['SUBSYSTEM']);
        subsystemCounts[item['SUBSYSTEM']] = (subsystemCounts[item['SUBSYSTEM']] || 0) + 1;
      }
      if (item['Design Area']) {
        designAreas.add(item['Design Area']);
      }
    });

    return {
      totalRecords: data.length,
      uniqueTestPacks: testPacks.size,
      uniqueSubsystems: subsystems.size,
      uniqueDesignAreas: designAreas.size,
      testPackBreakdown: testPackCounts,
      subsystemBreakdown: subsystemCounts
    };
  }, [data]);
  
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
      <VStack spacing={2} align="stretch">
        <Box textAlign="center">
          <Heading size="sm" mb={2}>Summary</Heading>
        </Box>

        {/* Summary Statistics */}
        <SimpleGrid columns={{ base: 2, md: 11 }} spacing={4}>
          <Stat>
            <StatLabel>Subsystems</StatLabel>
            <StatNumber>{summaryStats.uniqueSubsystems}</StatNumber>
          </Stat>
          <Stat>
            <StatLabel>Total Items</StatLabel>
            <StatNumber>{totalItemsSum.toLocaleString()}</StatNumber>
          </Stat>
          <Stat>
            <StatLabel>Total Done Items</StatLabel>
            <StatNumber>{totalDoneItemsSum.toLocaleString()}</StatNumber>
          </Stat>
          <Stat>
            <StatLabel>Total Pending Items</StatLabel>
            <StatNumber>{totalPendingItemsSum.toLocaleString()}</StatNumber>
          </Stat>
          <Stat>
            <StatLabel>Avg Progress Items%</StatLabel>
            <StatNumber>{avgProgressItemsPercent}%</StatNumber>
          </Stat>
          <Stat>
            <StatLabel>Avg Test Pack Progress%</StatLabel>
            <StatNumber>{avgTestPackProgress}%</StatNumber>
          </Stat>
          <Stat>
            <StatLabel>Total Test Packs</StatLabel>
            <StatNumber>{summaryStats.uniqueTestPacks}</StatNumber>
          </Stat>
          <Stat>
            <StatLabel>Total Loops</StatLabel>
            <StatNumber>{totalLoopsSum.toLocaleString()}</StatNumber>
          </Stat>
          <Stat>
            <StatLabel>Total Loops Done</StatLabel>
            <StatNumber>{totalDoneLoopsSum.toLocaleString()}</StatNumber>
          </Stat>
          <Stat>
            <StatLabel>Total Loops Pending</StatLabel>
            <StatNumber>{totalPendingLoopsSum.toLocaleString()}</StatNumber>
          </Stat>
          <Stat>
            <StatLabel>Avg Loops Progress%</StatLabel>
            <StatNumber>{avgLoopsProgressPercent}%</StatNumber>
          </Stat>
        </SimpleGrid>

        <Divider />

        {/* Subsystem Progress Table */}
        <Card>
          <CardBody>
            <Heading size="sm" mb={4}>Subsystem Progress Overview</Heading>
            <TableContainer>
              <Table variant="simple" size="sm" style={{ tableLayout: 'fixed', borderCollapse: 'collapse' }}>
                <Thead bg="gray.50">
                  <Tr>
                    <Th style={{ borderRight: '1px solid #e2e8f0' }}>SUBSYSTEM</Th>
                    <Th isNumeric style={{ borderRight: '1px solid #e2e8f0' }}>
                      <Text align="center">
                        TOTAL<br />ITEMS
                      </Text>
                    </Th>
                    <Th isNumeric style={{ borderRight: '1px solid #e2e8f0' }}>
                      <Text align="center">
                        DONE<br />ITEMS
                      </Text>
                    </Th>
                    <Th isNumeric style={{ borderRight: '1px solid #e2e8f0' }}>
                      <Text align="center">
                        PENDING<br />ITEMS
                      </Text>
                    </Th>
                    <Th isNumeric style={{ borderRight: '1px solid #e2e8f0' }}>
                      <Text align="center">
                        Progress<br />Items%
                      </Text>
                    </Th>
                    <Th style={{ borderRight: '1px solid #e2e8f0' }}>
                      <Text align="center">
                        DESCRIPTION
                      </Text>
                    </Th>
                    <Th isNumeric style={{ borderRight: '1px solid #e2e8f0' }}>
                      <Text align="center">
                        N°TP
                      </Text>
                    </Th>
                    <Th style={{ borderRight: '1px solid #e2e8f0' }}>
                      <Text align="center">
                        TP's<br />INCLUDE
                      </Text>
                    </Th>
                    <Th style={{ borderRight: '1px solid #e2e8f0' }}>
                      <Text align="center">
                        PROGRESS<br />TEST PACK
                      </Text>
                    </Th>
                    <Th isNumeric style={{ borderRight: '1px solid #e2e8f0' }}>
                      <Text align="center">
                        TOTAL LOOP<br />(Signal)
                      </Text>
                    </Th>
                    <Th isNumeric style={{ borderRight: '1px solid #e2e8f0' }}>
                      <Text align="center">
                        LOOP (Signal)<br />DONE
                      </Text>
                    </Th>
                    <Th isNumeric style={{ borderRight: '1px solid #e2e8f0' }}>
                      <Text align="center">
                        LOOP (Signal)<br />PENDING
                      </Text>
                    </Th>
                    <Th isNumeric>
                      <Text align="center">
                        PROGRESS<br />LOOPS%
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
                        {/* SUBSYSTEM - Merged cell */}
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
                            <Badge colorScheme="green" variant="outline">
                              {row.aislDoneItems.toLocaleString()}
                            </Badge>
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
                            <Badge colorScheme="orange" variant="outline">
                              {row.aislPendingItems.toLocaleString()}
                            </Badge>
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
                            <Box position="relative" width="100px" margin="0 auto">
                              <Progress 
                                value={row.aislTotalItems > 0 ? Math.round((row.aislDoneItems / row.aislTotalItems) * 100) : 0} 
                                size="md" 
                                colorScheme={row.aislTotalItems > 0 ? 
                                  (row.aislDoneItems / row.aislTotalItems * 100 === 100 ? "green" : 
                                   row.aislDoneItems / row.aislTotalItems * 100 > 50 ? "blue" : "red") : "gray"}
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
                                {row.aislTotalItems > 0 ? Math.round((row.aislDoneItems / row.aislTotalItems) * 100) : 0}%
                              </Text>
                            </Box>
                          </Td>
                        )}
                        
                        {/* DESCRIPTION - Merged cell */}
                        {row.isFirstRow && (
                          <Td 
                            rowSpan={row.rowSpan}
                            style={{ 
                              verticalAlign: 'middle',
                              textAlign: 'center',
                              backgroundColor: '#f7fafc',
                              borderRight: '1px solid #e2e8f0'
                            }}
                          >
                            <Text fontSize="sm">
                              {row.description || ''}
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
                            <Badge colorScheme="green" variant="outline">
                              {row.doneLoops.toLocaleString()}
                            </Badge>
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
                            <Badge colorScheme="orange" variant="outline">
                              {row.pendingLoops.toLocaleString()}
                            </Badge>
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
                            <Box position="relative" width="100px" margin="0 auto">
                              <Progress 
                                value={row.totalLoops > 0 ? Math.round((row.doneLoops / row.totalLoops) * 100) : 0} 
                                size="md" 
                                colorScheme={row.totalLoops > 0 ? 
                                  (row.doneLoops / row.totalLoops * 100 === 100 ? "green" : 
                                   row.doneLoops / row.totalLoops * 100 > 50 ? "blue" : "red") : "gray"}
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
                                {row.totalLoops > 0 ? Math.round((row.doneLoops / row.totalLoops) * 100) : 0}%
                              </Text>
                            </Box>
                          </Td>
                        )}
                        

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