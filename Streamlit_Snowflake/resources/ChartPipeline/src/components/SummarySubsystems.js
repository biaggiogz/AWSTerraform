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
  Spinner
} from '@chakra-ui/react';
import Papa from 'papaparse'; // You'll need to install this: npm install papaparse

/**
 * Summary Subsystems component showing aggregated data directly from CSV
 */
const SummarySubsystems = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load CSV data directly
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/data/aislamientos.csv');
        const csvText = await response.text();
        
        Papa.parse(csvText, {
          header: true,
          complete: (results) => {
            setData(results.data);
            setLoading(false);
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
  // Calculate subsystem progress statistics based on SQL logic
  const subsystemProgressData = useMemo(() => {
    if (!data || data.length === 0) {
      return [];
    }

    const subsystemStats = {};

    data.forEach(item => {
      const subsystem = item['SUBSYSTEM'];
      if (!subsystem) return;

      if (!subsystemStats[subsystem]) {
        subsystemStats[subsystem] = {
          totalItems: 0,
          doneItems: 0
        };
      }

      subsystemStats[subsystem].totalItems += 1;

      // Check if all progress fields are completed (value = 1)
      const isCompleted = item['DONE'] === 'YES';



      if (isCompleted) {
        subsystemStats[subsystem].doneItems += 1;
      }
    });

    return Object.entries(subsystemStats).map(([subsystem, stats]) => ({
      subsystem,
      totalItems: stats.totalItems,
      doneItems: stats.doneItems,
      pendingItems: stats.totalItems - stats.doneItems
    })).sort((a, b) => b.totalItems - a.totalItems);
  }, [data]);

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
            <Heading size="md" mb={4}>Subsystem Progress</Heading>
            <TableContainer>
              <Table variant="simple" size="sm">
                <Thead>
                  <Tr>
                    <Th>Subsystem</Th>
                    <Th isNumeric>Total Items</Th>
                    <Th isNumeric>Done Items</Th>
                    <Th isNumeric>Pending Items</Th>
                    <Th isNumeric>Progress %</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {subsystemProgressData.map((row) => {
                    const progressPercent = row.totalItems > 0 ? Math.round((row.doneItems / row.totalItems) * 100) : 0;
                    return (
                      <Tr key={row.subsystem}>
                        <Td fontWeight="medium">{row.subsystem}</Td>
                        <Td isNumeric>{row.totalItems.toLocaleString()}</Td>
                        <Td isNumeric>
                          <Badge colorScheme="green" variant="outline">
                            {row.doneItems.toLocaleString()}
                          </Badge>
                        </Td>
                        <Td isNumeric>
                          <Badge colorScheme="orange" variant="outline">
                            {row.pendingItems.toLocaleString()}
                          </Badge>
                        </Td>
                        <Td isNumeric>
                          <Badge 
                            colorScheme={progressPercent === 100 ? "green" : progressPercent > 50 ? "yellow" : "red"}
                            variant="solid"
                          >
                            {progressPercent}%
                          </Badge>
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
            <strong>Data Source:</strong> aislamientos.csv | 
            <strong>Progress Fields:</strong> Avance Distanciadores, Avance Aislamiento, Avance Chapa, Avance Cajas, Avance Rematar
          </Text>
        </Box>
      </VStack>
    </Box>
  );
};

export default SummarySubsystems;