import React, { useMemo } from 'react';
import { Box, Text, VStack, HStack, Divider } from '@chakra-ui/react';

const CompletedInsulMetric = ({ data }) => {
  const metrics = useMemo(() => {
    if (!data || data.length === 0) return {
      subsystems: 0,
      processSubsystems: 0,
      noProcessSubsystems: 0,
      processDone: 0,
      noProcessDone: 0,
      processPending: 0,
      noProcessPending: 0
    };
    
    // WHERE total_insulation is not null AND total_insulation != ''
    const validRows = data.filter(row => 
      row.total_insulation > 0 && row.subsystem !== 'AR-9000-01'
    );
    
    // Total subsystems count
    const subsystems = validRows.length;
    
    // Count by type_1
    const processSubsystems = validRows.filter(row => row.type_1 === 'PROCESS ').length;
    const noProcessSubsystems = validRows.filter(row => row.type_1 === 'NO PROCESS').length;
    
    // Done by type_1: total_insulation = done_insulation AND total_insulation > 0
    const processDone = validRows.reduce((count, row) => {
      if (row.type_1 === 'PROCESS ' && row.total_insulation > 0 && row.total_insulation === row.done_insulation) {
        return count + 1;
      }
      return count;
    }, 0);
    
    const noProcessDone = validRows.reduce((count, row) => {
      if (row.type_1 === 'NO PROCESS' && row.total_insulation > 0 && row.total_insulation === row.done_insulation) {
        return count + 1;
      }
      return count;
    }, 0);
    
    // Pending by type_1: total_insulation != done_insulation AND total_insulation > 0
    const processPending = validRows.reduce((count, row) => {
      if (row.type_1 === 'PROCESS ' && row.total_insulation > 0 && row.total_insulation !== row.done_insulation) {
        return count + 1;
      }
      return count;
    }, 0);
    
    const noProcessPending = validRows.reduce((count, row) => {
      if (row.type_1 === 'NO PROCESS' && row.total_insulation > 0 && row.total_insulation !== row.done_insulation) {
        return count + 1;
      }
      return count;
    }, 0);
    
    return {
      subsystems,
      processSubsystems,
      noProcessSubsystems,
      processDone,
      noProcessDone,
      processPending,
      noProcessPending
    };
  }, [data]);

  return (
      <Box
          bg="#ab9f81"
          border="3px solid #ab9f81"
          borderRadius="lg"
          minW="180px"
          boxShadow="md"
      >
        <VStack spacing={0} divider={<Divider borderColor="white" />}>
          <Box p={1} textAlign="center" width="100%">
            <Text fontSize="sm" fontWeight="bold" color="white">
              Insulation Status<br />by Subsystem
            </Text>
          </Box>
          
          <Box p={1} textAlign="center" width="100%">
            <Text fontSize="sm" color="white">
              Subsystems: {metrics.subsystems}
            </Text>
          </Box>
          
          <HStack spacing={0} width="100%" divider={<Divider orientation="vertical" borderColor="white" />}>
            <Box p={1} textAlign="center" flex={1}>
              <Text fontSize="sm" color="white">
                Process: {metrics.processSubsystems}
              </Text>
            </Box>
            <Box p={1} textAlign="center" flex={1}>
              <Text fontSize="sm" color="white">
                No Process: {metrics.noProcessSubsystems}
              </Text>
            </Box>
          </HStack>
          
          <HStack spacing={0} width="100%" divider={<Divider orientation="vertical" borderColor="white" />}>
            <Box p={1} textAlign="center" flex={1}>
              <Text fontSize="sm" color="white">
                Done: {metrics.processDone}
              </Text>
            </Box>
            <Box p={1} textAlign="center" flex={1}>
              <Text fontSize="sm" color="white">
                Done: {metrics.noProcessDone}
              </Text>
            </Box>
          </HStack>
          
          <HStack spacing={0} width="100%" divider={<Divider orientation="vertical" borderColor="white" />}>
            <Box p={1} textAlign="center" flex={1}>
              <Text fontSize="sm" color="white">
                Pending: {metrics.processPending}
              </Text>
            </Box>
            <Box p={1} textAlign="center" flex={1}>
              <Text fontSize="sm" color="white">
                Pending: {metrics.noProcessPending}
              </Text>
            </Box>
          </HStack>
        </VStack>
      </Box>
  );
};

export default CompletedInsulMetric;