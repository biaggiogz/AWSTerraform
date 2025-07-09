import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  Box,
  Heading,
  HStack,
  Text,
  VStack,
  Button,
  Tooltip,
  SimpleGrid,
  Divider,
  IconButton
} from '@chakra-ui/react';
import { MdClose } from 'react-icons/md';
import ResizableDraggablePanel from '../ui/ResizableDraggablePanel';

const SubsystemStatusFilter = ({ 
  data, 
  onFilterChange, 
  isVisible, 
  onClose 
}) => {
  const [exclusiveFilter, setExclusiveFilter] = useState(null);
  const [selectedSubsystems, setSelectedSubsystems] = useState({});

  const subsystemMetrics = useMemo(() => {
    if (!data || data.length === 0) return {};
    
    const metrics = {};
    data.forEach(row => {
      if (row.subsystem && row.totalItems !== undefined && row.doneItems !== undefined) {
        const isDone = (row.totalItems === row.doneItems) && (row.totalItems > 0);
        metrics[row.subsystem] = {
          status: isDone ? 'Done' : 'Pending',
          totalItems: row.totalItems,
          doneItems: row.doneItems
        };
      }
    });
    
    return metrics;
  }, [data]);

  const sortedSubsystems = useMemo(() => {
    return Object.entries(subsystemMetrics)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .reduce((obj, [key, value]) => {
        obj[key] = value;
        return obj;
      }, {});
  }, [subsystemMetrics]);

  React.useEffect(() => {
    const subsystemKeys = Object.keys(sortedSubsystems);
    if (subsystemKeys.length > 0 && Object.keys(selectedSubsystems).length === 0) {
      const initialState = subsystemKeys.reduce((acc, subsystem) => {
        acc[subsystem] = true;
        return acc;
      }, {});
      setSelectedSubsystems(initialState);
    }
  }, [sortedSubsystems]);

  const debounceRef = useRef(null);
  
  React.useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      if (!data || data.length === 0) {
        onFilterChange([]);
        return;
      }
      
      const filteredData = data.filter(row => {
        if (!selectedSubsystems[row.subsystem]) return false;
        
        if (exclusiveFilter) {
          const isDone = (row.totalItems === row.doneItems) && (row.totalItems > 0);
          const status = isDone ? 'Done' : 'Pending';
          if (exclusiveFilter === 'done') return status === 'Done';
          if (exclusiveFilter === 'pending') return status === 'Pending';
        }
        
        return true;
      });
      
      onFilterChange(filteredData);
    }, 100);
    
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [data, selectedSubsystems, exclusiveFilter, onFilterChange]);

  const toggleExclusiveFilter = useCallback((filter) => {
    setExclusiveFilter(prev => prev === filter ? null : filter);
  }, []);

  const toggleSubsystem = useCallback((subsystem) => {
    setSelectedSubsystems(prev => ({
      ...prev,
      [subsystem]: !prev[subsystem]
    }));
  }, []);

  const toggleAllSubsystems = useCallback((value) => {
    const newState = Object.keys(sortedSubsystems).reduce((acc, subsystem) => {
      acc[subsystem] = value;
      return acc;
    }, {});
    setSelectedSubsystems(newState);
  }, [sortedSubsystems]);

  const invertSubsystemSelection = useCallback(() => {
    setSelectedSubsystems(prev => {
      const invertedState = {};
      Object.keys(sortedSubsystems).forEach(subsystem => {
        invertedState[subsystem] = !prev[subsystem];
      });
      return invertedState;
    });
  }, [sortedSubsystems]);

  const getStatusColor = useCallback((status) => {
    if (status === 'Done') return '#2F5249';
    return '#E85C0D';
  }, []);

  const memoizedButtons = useMemo(() => 
    Object.entries(sortedSubsystems).map(([subsystem, metrics]) => {
      const status = metrics.status;
      const isSelected = selectedSubsystems[subsystem] || false;
      const isVisible = !exclusiveFilter ||
                      (exclusiveFilter === 'done' && status === 'Done') ||
                      (exclusiveFilter === 'pending' && status === 'Pending');

      return (
        <Button
          key={subsystem}
          size="sm"
          height="36px"
          variant={isSelected ? "solid" : "outline"}
          bg={isSelected ? getStatusColor(status) : "white"}
          borderColor={getStatusColor(status)}
          color={isSelected ? "white" : "black"}
          opacity={isVisible ? 1 : 0.5}
          onClick={() => toggleSubsystem(subsystem)}
          mb={1}
          _hover={{ bg: isSelected ? getStatusColor(status) : "gray.100" }}
        >
          <VStack spacing={0} align="center">
            <Text fontSize="xs" fontWeight="bold" noOfLines={1}>
              {subsystem}
            </Text>
          </VStack>
        </Button>
      );
    }), [sortedSubsystems, selectedSubsystems, exclusiveFilter, toggleSubsystem, getStatusColor]
  );

  if (!isVisible) return null;

  return (
    <ResizableDraggablePanel
      title="Subsystem Status Filter"
      initialWidth={400}
      initialHeight={600}
      initialX={150}
      initialY={150}
      minWidth={350}
      minHeight={400}
    >
      <VStack spacing={3} align="stretch" p={3} height="100%">
        <HStack justify="space-between" align="center">
          <Heading size="sm">SUBSYSTEMS: {Object.keys(sortedSubsystems).length}</Heading>
          <IconButton
            icon={<MdClose />}
            size="sm"
            variant="ghost"
            onClick={onClose}
            aria-label="Close filter"
          />
        </HStack>

        <HStack spacing={4} justifyContent="center">
          <Tooltip label="Click to show only done subsystems" placement="top">
            <HStack
              onClick={() => toggleExclusiveFilter('done')}
              cursor="pointer"
              p={1}
              borderRadius="md"
              bg={exclusiveFilter === 'done' ? "blue.50" : "transparent"}
              borderWidth="1px"
              borderColor={exclusiveFilter === 'done' ? "blue.300" : "transparent"}
              _hover={{ bg: "gray.100" }}
            >
              <Box width="15px" height="15px" bg="#2F5249" borderWidth="1px" />
              <Text fontWeight={exclusiveFilter === 'done' ? "bold" : "normal"}>Done</Text>
            </HStack>
          </Tooltip>

          <Tooltip label="Click to show only pending subsystems" placement="top">
            <HStack
              onClick={() => toggleExclusiveFilter('pending')}
              cursor="pointer"
              p={1}
              borderRadius="md"
              bg={exclusiveFilter === 'pending' ? "blue.50" : "transparent"}
              borderWidth="1px"
              borderColor={exclusiveFilter === 'pending' ? "blue.300" : "transparent"}
              _hover={{ bg: "gray.100" }}
            >
              <Box width="15px" height="15px" bg="#E85C0D" borderWidth="1px" />
              <Text fontWeight={exclusiveFilter === 'pending' ? "bold" : "normal"}>Pending</Text>
            </HStack>
          </Tooltip>
        </HStack>

        <HStack spacing={2}>
          <Button size="xs" colorScheme="blue" onClick={() => toggleAllSubsystems(true)}>Select All</Button>
          <Button size="xs" colorScheme="gray" onClick={() => toggleAllSubsystems(false)}>Clear All</Button>
          <Button size="xs" colorScheme="teal" onClick={invertSubsystemSelection}>Invert</Button>
        </HStack>

        <Divider />

        <Box overflowY="auto" flex="1">
          <SimpleGrid columns={3} spacing={2}>
            {memoizedButtons}
          </SimpleGrid>
        </Box>
      </VStack>
    </ResizableDraggablePanel>
  );
};

export default React.memo(SubsystemStatusFilter);