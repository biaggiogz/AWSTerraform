import React, { useMemo } from 'react';
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
  Divider
} from '@chakra-ui/react';

/**
 * Summary Subsystems component showing aggregated data
 * @param {Array} data - Filtered dataset
 */
const SummarySubsystems = ({ data }) => {
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
            <strong>Data Source:</strong> pipelinedata.csv | 
            <strong> Filter Columns:</strong> Test Pack, Subsystem
          </Text>
        </Box>
      </VStack>
    </Box>
  );
};

export default SummarySubsystems;