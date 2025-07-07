import React from 'react';
import { Box, HStack, VStack, Text, Badge, Button, Table, Thead, Tbody, Tr, Th, Td } from '@chakra-ui/react';

const SummaryStatsPanel = ({ summaryStats, performanceMetrics, selectedSubsystem, onClearFilter }) => {
  return (
    <Box p={4} borderWidth="1px" borderRadius="lg" bg="white">
      <HStack justify="space-between" align="center" mb={4}>
        <Text fontSize="lg" fontWeight="bold">Summary Statistics</Text>
        <HStack spacing={2}>
          {selectedSubsystem && (
            <HStack>
              <Badge colorScheme="blue" variant="solid">
                Filtered: {selectedSubsystem}
              </Badge>
              <Button size="sm" variant="outline" onClick={onClearFilter}>
                Clear Filter
              </Button>
            </HStack>
          )}
          {performanceMetrics.wasmEnabled && (
            <Badge colorScheme="green" variant="solid">
              WASM Optimized
            </Badge>
          )}
        </HStack>
      </HStack>
      
      <Box overflowX="auto" border="1px solid" borderColor="gray.200" borderRadius="md">
        <Table variant="simple" size="sm">
          <Thead bg="gray.50">
            <Tr>
              <Th textAlign="center">Subsystems</Th>
              <Th textAlign="center">Total Items</Th>
              <Th textAlign="center">Done Items</Th>
              <Th textAlign="center">Pending Items</Th>
              <Th textAlign="center">Total Test Packs</Th>
              <Th textAlign="center">Done Test Packs</Th>
              <Th textAlign="center">Pending Test Packs</Th>
              <Th textAlign="center">Total Loops</Th>
              <Th textAlign="center">Loops Pending</Th>
              <Th textAlign="center">Avg Progress</Th>
            </Tr>
          </Thead>
          <Tbody>
            <Tr>
              <Td textAlign="center" fontWeight="bold">
                {summaryStats?.uniqueSubsystems || 0}
              </Td>
              <Td textAlign="center" fontWeight="bold">
                {summaryStats?.totalItemsSum?.toLocaleString() || 0}
              </Td>
              <Td textAlign="center" fontWeight="bold">
                {summaryStats?.totalDoneItemsSum?.toLocaleString() || 0}
              </Td>
              <Td textAlign="center" fontWeight="bold">
                {summaryStats?.totalPendingItemsSum?.toLocaleString() || 0}
              </Td>
              <Td textAlign="center" fontWeight="bold">
                {summaryStats?.uniqueTestPacks || 0}
              </Td>
              <Td textAlign="center" fontWeight="bold">
                {summaryStats?.doneTestPacks || 0}
              </Td>
              <Td textAlign="center" fontWeight="bold">
                {summaryStats?.pendingTestPacks || 0}
              </Td>
              <Td textAlign="center" fontWeight="bold">
                {summaryStats?.totalLoopsSum?.toLocaleString() || 0}
              </Td>
              <Td textAlign="center" fontWeight="bold">
                {summaryStats?.totalPendingLoopsSum?.toLocaleString() || 0}
              </Td>
              <Td textAlign="center" fontWeight="bold">
                {summaryStats?.avgProgressItemsPercent || 0}%
              </Td>
            </Tr>
          </Tbody>
        </Table>
      </Box>
      
      {performanceMetrics.processingTime && (
        <HStack mt={2} spacing={4} fontSize="xs" color="gray.600">
          <Text>Processing Time: {performanceMetrics.processingTime}ms</Text>
          <Text>Memory Usage: {performanceMetrics.memoryUsage || 'N/A'}</Text>
          <Text>Performance Gain: {performanceMetrics.performanceGain || 'N/A'}</Text>
        </HStack>
      )}
    </Box>
  );
};

export default SummaryStatsPanel;