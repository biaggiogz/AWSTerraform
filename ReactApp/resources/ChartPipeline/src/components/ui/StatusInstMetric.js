import React, { useMemo, useState, useCallback } from 'react';
import { Box, Text, VStack, HStack, Divider, Button } from '@chakra-ui/react';

const CompletedInstMetric = ({ data, onSubsystemFilter }) => {
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
    
    // WHERE total_inst is not null AND total_inst != ''
    const validRows = data.filter(row => 
      row.total_inst > 0 && row.subsystem !== 'AR-9000-01'
    );
    
    // Total subsystems count
    const subsystems = validRows.length;
    
    // Count by type_1
    const processSubsystems = validRows.filter(row => row.type_1 === 'PROCESS ').length;
    const noProcessSubsystems = validRows.filter(row => row.type_1 === 'NO PROCESS').length;
    
    // Done by type_1: total_inst = done_inst AND total_inst > 0
    const processDone = validRows.reduce((count, row) => {
      if (row.type_1 === 'PROCESS ' && row.total_inst > 0 && row.total_inst === row.done_inst) {
        return count + 1;
      }
      return count;
    }, 0);
    
    const noProcessDone = validRows.reduce((count, row) => {
      if (row.type_1 === 'NO PROCESS' && row.total_inst > 0 && row.total_inst === row.done_inst) {
        return count + 1;
      }
      return count;
    }, 0);
    
    // Pending by type_1: total_inst != done_inst AND total_inst > 0
    const processPending = validRows.reduce((count, row) => {
      if (row.type_1 === 'PROCESS ' && row.total_inst > 0 && row.total_inst !== row.done_inst) {
        return count + 1;
      }
      return count;
    }, 0);
    
    const noProcessPending = validRows.reduce((count, row) => {
      if (row.type_1 === 'NO PROCESS' && row.total_inst > 0 && row.total_inst !== row.done_inst) {
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
        .filter(row => row.type_1 === 'PROCESS ' && row.total_inst === row.done_inst && row.total_inst > 0)
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
        .filter(row => row.type_1 === 'PROCESS ' && row.done_inst < row.total_inst && row.total_inst > 0)
        .map(row => row.subsystem);
      setActiveFilter('processPending');
      onSubsystemFilter && onSubsystemFilter(processPendingSubsystems);
    }
  }, [activeFilter, metrics.validRows, onSubsystemFilter]);

  const handleNoProcessDoneClick = useCallback(() => {
    if (activeFilter === 'noProcessDone') {
      setActiveFilter(null);
      onSubsystemFilter && onSubsystemFilter([]);
    } else {
      const noProcessDoneSubsystems = metrics.validRows
        .filter(row => row.type_1 === 'NO PROCESS' && row.total_inst === row.done_inst && row.total_inst > 0)
        .map(row => row.subsystem);
      setActiveFilter('noProcessDone');
      onSubsystemFilter && onSubsystemFilter(noProcessDoneSubsystems);
    }
  }, [activeFilter, metrics.validRows, onSubsystemFilter]);

  const handleNoProcessPendingClick = useCallback(() => {
    if (activeFilter === 'noProcessPending') {
      setActiveFilter(null);
      onSubsystemFilter && onSubsystemFilter([]);
    } else {
      const noProcessPendingSubsystems = metrics.validRows
        .filter(row => row.type_1 === 'NO PROCESS' && row.done_inst < row.total_inst && row.total_inst > 0)
        .map(row => row.subsystem);
      setActiveFilter('noProcessPending');
      onSubsystemFilter && onSubsystemFilter(noProcessPendingSubsystems);
    }
  }, [activeFilter, metrics.validRows, onSubsystemFilter]);

  return (
      <Box
          bg="#A888B5"
          border="3px solid #A888B5"
          borderRadius="lg"
          minW="220px"
          boxShadow="md"
      >
        <VStack spacing={0} divider={<Divider borderColor="white" />}>
          <Box p={1} textAlign="center" width="100%">
            <Text fontSize="sm" fontWeight="bold" color="white">
              Instruments Status<br />by Subsystem
            </Text>
          </Box>
          
          <Button
            p={1}
            textAlign="center"
            width="100%"
            bg={activeFilter === 'subsystems' ? '#113F67' : '#A888B5'}
            color="white"
            fontSize="sm"
            variant="unstyled"
            _hover={{ bg: '#9A7AA5' }}
            onClick={handleSubsystemsClick}
          >
            Subsystems: {metrics.subsystems}
          </Button>
          
          <HStack spacing={0} width="100%" divider={<Divider orientation="vertical" borderColor="white" />}>
            <Button
              p={1}
              textAlign="center"
              flex={1}
              bg={activeFilter === 'process' ? '#113F67' : '#A888B5'}
              color="white"
              fontSize="sm"
              variant="unstyled"
              _hover={{ bg: '#9A7AA5' }}
              onClick={handleProcessClick}
            >
              Process: {metrics.processSubsystems}
            </Button>
            <Button
              p={1}
              textAlign="center"
              flex={1}
              bg={activeFilter === 'noprocess' ? '#113F67' : '#A888B5'}
              color="white"
              fontSize="sm"
              variant="unstyled"
              _hover={{ bg: '#9A7AA5' }}
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
              bg={activeFilter === 'processDone' ? '#113F67' : '#A888B5'}
              color="white"
              fontSize="sm"
              variant="unstyled"
              _hover={{ bg: '#9A7AA5' }}
              onClick={handleProcessDoneClick}
            >
              Done: {metrics.processDone}
            </Button>
            <Button
              p={1}
              textAlign="center"
              flex={1}
              bg={activeFilter === 'noProcessDone' ? '#113F67' : '#A888B5'}
              color="white"
              fontSize="sm"
              variant="unstyled"
              _hover={{ bg: '#9A7AA5' }}
              onClick={handleNoProcessDoneClick}
            >
              Done: {metrics.noProcessDone}
            </Button>
          </HStack>
          
          <HStack spacing={0} width="100%" divider={<Divider orientation="vertical" borderColor="white" />}>
            <Button
              p={1}
              textAlign="center"
              flex={1}
              bg={activeFilter === 'processPending' ? '#113F67' : '#A888B5'}
              color="white"
              fontSize="sm"
              variant="unstyled"
              _hover={{ bg: '#9A7AA5' }}
              onClick={handleProcessPendingClick}
            >
              Pending: {metrics.processPending}
            </Button>
            <Button
              p={1}
              textAlign="center"
              flex={1}
              bg={activeFilter === 'noProcessPending' ? '#113F67' : '#A888B5'}
              color="white"
              fontSize="sm"
              variant="unstyled"
              _hover={{ bg: '#9A7AA5' }}
              onClick={handleNoProcessPendingClick}
            >
              Pending: {metrics.noProcessPending}
            </Button>
          </HStack>
        </VStack>
      </Box>
  );
};

export default CompletedInstMetric;