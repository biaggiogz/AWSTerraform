import React, { useMemo, useState, useCallback } from 'react';
import { Box, Text, VStack, HStack, Divider, Button } from '@chakra-ui/react';

const StatusLoopMetric = ({ data, onSubsystemFilter }) => {
  const [activeFilter, setActiveFilter] = useState(null);

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
    
    // WHERE total_loop is not null AND total_loop != ''
    const validRows = data.filter(row => 
      row.total_loop > 0 && row.subsystem !== 'AR-9000-01'
    );
    
    // Total subsystems count
    const subsystems = validRows.length;
    
    // Count by type_1
    const processSubsystems = validRows.filter(row => row.type_1 === 'PROCESS ').length;
    const noProcessSubsystems = validRows.filter(row => row.type_1 === 'NO PROCESS').length;
    
    // Done by type_1: total_loop = done_loop AND total_loop > 0
    const processDone = validRows.reduce((count, row) => {
      if (row.type_1 === 'PROCESS ' && row.total_loop > 0 && row.total_loop === row.done_loop) {
        return count + 1;
      }
      return count;
    }, 0);
    
    const noProcessDone = validRows.reduce((count, row) => {
      if (row.type_1 === 'NO PROCESS' && row.total_loop > 0 && row.total_loop === row.done_loop) {
        return count + 1;
      }
      return count;
    }, 0);
    
    // Pending by type_1: total_loop != done_loop AND total_loop > 0
    const processPending = validRows.reduce((count, row) => {
      if (row.type_1 === 'PROCESS ' && row.total_loop > 0 && row.total_loop !== row.done_loop) {
        return count + 1;
      }
      return count;
    }, 0);
    
    const noProcessPending = validRows.reduce((count, row) => {
      if (row.type_1 === 'NO PROCESS' && row.total_loop > 0 && row.total_loop !== row.done_loop) {
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
      noProcessPending,
      validRows
    };
  }, [data]);

  const handleSubsystemsClick = useCallback(() => {
    if (activeFilter === 'subsystems') {
      setActiveFilter(null);
      onSubsystemFilter && onSubsystemFilter([]);
    } else {
      const subsystems = metrics.validRows.map(row => row.subsystem);
      setActiveFilter('subsystems');
      onSubsystemFilter && onSubsystemFilter(subsystems);
    }
  }, [activeFilter, metrics.validRows, onSubsystemFilter]);

  const handleProcessClick = useCallback(() => {
    if (activeFilter === 'process') {
      setActiveFilter(null);
      onSubsystemFilter && onSubsystemFilter([]);
    } else {
      const processSubsystems = metrics.validRows
        .filter(row => row.type_1 === 'PROCESS ')
        .map(row => row.subsystem);
      setActiveFilter('process');
      onSubsystemFilter && onSubsystemFilter(processSubsystems);
    }
  }, [activeFilter, metrics.validRows, onSubsystemFilter]);

  const handleNoProcessClick = useCallback(() => {
    if (activeFilter === 'noprocess') {
      setActiveFilter(null);
      onSubsystemFilter && onSubsystemFilter([]);
    } else {
      const noProcessSubsystems = metrics.validRows
        .filter(row => row.type_1 === 'NO PROCESS')
        .map(row => row.subsystem);
      setActiveFilter('noprocess');
      onSubsystemFilter && onSubsystemFilter(noProcessSubsystems);
    }
  }, [activeFilter, metrics.validRows, onSubsystemFilter]);

  const handleProcessDoneClick = useCallback(() => {
    if (activeFilter === 'processDone') {
      setActiveFilter(null);
      onSubsystemFilter && onSubsystemFilter([]);
    } else {
      const processDoneSubsystems = metrics.validRows
        .filter(row => row.type_1 === 'PROCESS ' && row.total_loop === row.done_loop && row.total_loop > 0)
        .map(row => row.subsystem);
      setActiveFilter('processDone');
      onSubsystemFilter && onSubsystemFilter(processDoneSubsystems);
    }
  }, [activeFilter, metrics.validRows, onSubsystemFilter]);

  const handleProcessPendingClick = useCallback(() => {
    if (activeFilter === 'processPending') {
      setActiveFilter(null);
      onSubsystemFilter && onSubsystemFilter([]);
    } else {
      const processPendingSubsystems = metrics.validRows
        .filter(row => row.type_1 === 'PROCESS ' && row.done_loop < row.total_loop && row.total_loop > 0)
        .map(row => row.subsystem);
      setActiveFilter('processPending');
      onSubsystemFilter && onSubsystemFilter(processPendingSubsystems);
    }
  }, [activeFilter, metrics.validRows, onSubsystemFilter]);

  return (
    <Box
      bg="#7CA2C5"
      border="3px solid #7CA2C5"
      borderRadius="lg"
      minW="180px"
      boxShadow="md"
    >
      <VStack spacing={0} divider={<Divider borderColor="white" />}>
        <Box p={1} textAlign="center" width="100%">
          <Text fontSize="sm" fontWeight="bold" color="white">
            Loop Signal Status <br />by Subsystem
          </Text>
        </Box>
        
        <Button
          p={1}
          textAlign="center"
          width="100%"
          bg={activeFilter === 'subsystems' ? '#5A8DB5' : '#7CA2C5'}
          color="white"
          fontSize="sm"
          variant="unstyled"
          _hover={{ bg: '#5A8DB5' }}
          onClick={handleSubsystemsClick}
        >
          Subsystems: {metrics.subsystems}
        </Button>
        
        <HStack spacing={0} width="100%" divider={<Divider orientation="vertical" borderColor="white" />}>
          <Button
            p={1}
            textAlign="center"
            flex={1}
            bg={activeFilter === 'process' ? '#5A8DB5' : '#7CA2C5'}
            color="white"
            fontSize="sm"
            variant="unstyled"
            _hover={{ bg: '#5A8DB5' }}
            onClick={handleProcessClick}
          >
            Process: {metrics.processSubsystems}
          </Button>
          <Button
            p={1}
            textAlign="center"
            flex={1}
            bg={activeFilter === 'noprocess' ? '#5A8DB5' : '#7CA2C5'}
            color="white"
            fontSize="sm"
            variant="unstyled"
            _hover={{ bg: '#5A8DB5' }}
            onClick={handleNoProcessClick}
          >
            No Process: {metrics.noProcessSubsystems}
          </Button>
        </HStack>
        
        <HStack spacing={0} width="100%" divider={<Divider orientation="vertical" borderColor="white" />}>
          <Button
            p={1}
            textAlign="center"
            flex={1}
            bg={activeFilter === 'processDone' ? '#5A8DB5' : '#7CA2C5'}
            color="white"
            fontSize="sm"
            variant="unstyled"
            _hover={{ bg: '#5A8DB5' }}
            onClick={handleProcessDoneClick}
          >
            Done: {metrics.processDone}
          </Button>
          <Box p={1} textAlign="center" flex={1}>
            <Text fontSize="sm" color="white">
              Done: {metrics.noProcessDone}
            </Text>
          </Box>
        </HStack>
        
        <HStack spacing={0} width="100%" divider={<Divider orientation="vertical" borderColor="white" />}>
          <Button
            p={1}
            textAlign="center"
            flex={1}
            bg={activeFilter === 'processPending' ? '#5A8DB5' : '#7CA2C5'}
            color="white"
            fontSize="sm"
            variant="unstyled"
            _hover={{ bg: '#5A8DB5' }}
            onClick={handleProcessPendingClick}
          >
            Pending: {metrics.processPending}
          </Button>
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

export default StatusLoopMetric;