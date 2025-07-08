import React, { useState, useEffect } from 'react';
import { Box, VStack, HStack, Heading, Spinner, Text } from '@chakra-ui/react';
import SummarySubsystemsContainer from './SummarySubsystemsContainer';
import { useSummarySubsystemsData } from '../../hooks/useSummarySubsystemsData';
import WasmPerformanceMonitor from '../ui/WasmPerformanceMonitor';

const SummarySubsystems = ({ data: filteredData = [] }) => {
  const [performanceMetrics, setPerformanceMetrics] = useState({});
  
  const {
    tableAData,
    tableBData,
    loading,
    error,
    summaryStats
  } = useSummarySubsystemsData(filteredData);

  const handlePerformanceUpdate = (metrics) => {
    setPerformanceMetrics(metrics);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="300px">
        <Spinner size="xl" />
        <Text ml={4}>Loading optimized subsystems data...</Text>
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
    <Box p={6} width="100%" maxWidth="100vw" overflow="hidden">
      <VStack spacing={4} align="stretch">


        <SummarySubsystemsContainer
          tableAData={tableAData}
          tableBData={tableBData}
          summaryStats={summaryStats}
          performanceMetrics={performanceMetrics}
        />
      </VStack>
    </Box>
  );
};

export default SummarySubsystems;