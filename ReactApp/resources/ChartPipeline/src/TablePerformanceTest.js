import React from 'react';
import { Box, Heading, Text } from '@chakra-ui/react';
import DetailsInstrumentsTableOptimized from './components/tables/DetailsInstrumentsTable.optimized';

/**
 * Test component to verify table performance
 */
const TablePerformanceTest = () => {
  return (
    <Box p={5}>
      <Heading mb={4}>Table Performance Test</Heading>
      <Text mb={4}>
        This page tests the performance of the optimized table component with large datasets.
        The table below should handle 22 columns and 2000 rows with good performance.
      </Text>
      
      <DetailsInstrumentsTableOptimized />
    </Box>
  );
};

export default TablePerformanceTest;