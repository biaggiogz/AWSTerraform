import React, { useState, useEffect, useMemo } from 'react';
import { css, Global } from '@emotion/react';
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
  // Define table border color - change this to modify all table borders
  const tableBorderColor = '#3182ce'; // Changed from #e2e8f0 to blue.500 color
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
          pendingLoops: loopStat.pendingLoops
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
            pendingLoops: loopStat.pendingLoops
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
            <Heading size="sm" mb={4}>Subsystem Progress Overview</Heading>
            <TableContainer overflowX="auto">
              <Table variant="simple" size="sm" style={{ tableLayout: 'fixed', borderCollapse: 'collapse', minWidth: '1500px', borderColor: '#3182ce' }}>
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
                    <Th isNumeric style={{ fontSize:'9px',borderRight: '1px solid #e2e8f0', textAlign: 'center' }}>
                      <Text>
                        Progress<br />Items%
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
                    <Th style={{fontSize:'9px', borderRight: '1px solid #e2e8f0',width:'140px', textAlign: 'center' }}>
                      <Text>
                        INSULATION
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
                    <Th isNumeric style={{ fontSize:'9px' , textAlign: 'center'}}>
                      <Text>
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