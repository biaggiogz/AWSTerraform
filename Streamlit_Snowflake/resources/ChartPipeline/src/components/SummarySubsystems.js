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
 */
const SummarySubsystems = () => {
  const [data, setData] = useState([]);
  const [testPackData, setTestPackData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load CSV data directly
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Load main data
        const response = await fetch('/data/pipelinedata.csv');
        const csvText = await response.text();
        
        // Load test pack data
        const testPackResponse = await fetch('/data/test_pack_progress.csv');
        const testPackCsvText = await testPackResponse.text();
        
        Papa.parse(csvText, {
          header: true,
          complete: (results) => {
            setData(results.data);
            
            // Parse test pack data
            Papa.parse(testPackCsvText, {
              header: true,
              complete: (testPackResults) => {
                setTestPackData(testPackResults.data);
                setLoading(false);
              },
              error: (error) => {
                setError(`Error parsing test pack CSV: ${error.message}`);
                setLoading(false);
              }
            });
          },
          error: (error) => {
            setError(`Error parsing CSV: ${error.message}`);
            setLoading(false);
          }
        });
      } catch (error) {
        setError(`Error fetching CSV: ${error.message}`);
        setLoading(false);
      }
    };

    fetchData();
  }, []);
  // Calculate subsystem progress statistics with TEST PACK data
  const subsystemProgressData = useMemo(() => {
    if (!data || data.length === 0 || !testPackData || testPackData.length === 0) {
      return [];
    }

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
          rowSpan: 1
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
            rowSpan: testPackProgress.length
          });
        });
      }
    });

    return expandedData.sort((a, b) => b.totalItems - a.totalItems);
  }, [data, testPackData]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        totalRecords: 0,
        uniqueTestPacks: 0,
        uniqueSubsystems: 0,
        uniqueDesignAreas: 0,
        testPackBreakdown: {},
        subsystemBreakdown: {}
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
      <VStack spacing={6} align="stretch">
        <Box textAlign="center">
          <Heading size="lg" mb={2}>Summary Subsystems</Heading>
          <Text color="gray.600">Overview of pipeline data by Test Pack and Subsystem</Text>
        </Box>

        {/* Summary Statistics */}
        <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
          <Stat>
            <StatLabel>Total Records</StatLabel>
            <StatNumber>{summaryStats.totalRecords.toLocaleString()}</StatNumber>
            <StatHelpText>Pipeline items</StatHelpText>
          </Stat>
          <Stat>
            <StatLabel>Test Packs</StatLabel>
            <StatNumber>{summaryStats.uniqueTestPacks}</StatNumber>
            <StatHelpText>Unique test packs</StatHelpText>
          </Stat>
          <Stat>
            <StatLabel>Subsystems</StatLabel>
            <StatNumber>{summaryStats.uniqueSubsystems}</StatNumber>
            <StatHelpText>Unique subsystems</StatHelpText>
          </Stat>
          <Stat>
            <StatLabel>Design Areas</StatLabel>
            <StatNumber>{summaryStats.uniqueDesignAreas}</StatNumber>
            <StatHelpText>Unique areas</StatHelpText>
          </Stat>
        </SimpleGrid>

        <Divider />

        {/* Subsystem Progress Table */}
        <Card>
          <CardBody>
            <Heading size="md" mb={4}>Subsystem Progress with Test Packs</Heading>
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
                    <Th>
                      <Text align="center">
                        PROGRESS<br />TEST PACK
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
                              {row.totalItems.toLocaleString()}
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
                              {row.doneItems.toLocaleString()}
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
                              {row.pendingItems.toLocaleString()}
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
                            <Badge 
                              colorScheme={progressPercent === 100 ? "green" : progressPercent > 50 ? "yellow" : "red"}
                              variant="solid"
                            >
                              {progressPercent}%
                            </Badge>
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
                        <Td style={{ padding: '8px', textAlign: 'center' }}>
                          {row.testPack && (
                            <Box position="relative" width="100px" margin="0 auto">
                              <Progress 
                                value={Math.round(row.testPackProgress)} 
                                size="md" 
                                colorScheme={row.testPackProgress === 100 ? "green" : row.testPackProgress > 50 ? "blue" : "red"}
                                width="100px"
                                borderRadius="md"
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

        {/* Data Source Information */}
        <Box bg="gray.50" p={4} borderRadius="md">
          <Text fontSize="sm" color="gray.600" textAlign="center">
            <strong>Data Source:</strong> pipelinedata.csv, test_pack_progress.csv | 
            <strong>SQL Logic:</strong> Implements unnest(string_to_array(TEST PACK, '|')) with row merging and vertical centering
          </Text>
        </Box>
      </VStack>
    </Box>
  );
};

export default SummarySubsystems;