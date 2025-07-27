import React, { useState, useMemo, useCallback } from 'react';
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
  IconButton,
  Select,
  Input
} from '@chakra-ui/react';
import { MdClose } from 'react-icons/md';
import ResizableDraggablePanel from '../ui/ResizableDraggablePanel';
import { useFilterDebounce } from './hooks/useFilterDebounce';

const TracingStatusFilter = ({ 
  data, 
  onFilterChange, 
  isVisible, 
  onClose,
  onPropagationChange,
  onBringToFront
}) => {
  const [exclusiveFilter, setExclusiveFilter] = useState(null);
  const [selectedSubsystems, setSelectedSubsystems] = useState({});
  const [propagationTarget, setPropagationTarget] = useState('nothing');
  const [searchTerm, setSearchTerm] = useState('');

  const subsystemMetrics = useMemo(() => {
    if (!data || data.length === 0) return {};
    
    const metrics = {};
    data.forEach(row => {
      if (row.subsystem) {
        // Check if total_tracing is empty, null, or undefined
        const totalTracing = row.total_tracing;
        const doneTracing = row.done_tracing;
        
        if (totalTracing === null || totalTracing === undefined || totalTracing === '' || totalTracing === 0) {
          metrics[row.subsystem] = {
            status: 'Not Apply',
            totalTracings: totalTracing,
            doneTracings: doneTracing
          };
        } else {
          const isDone = (totalTracing === doneTracing) && (totalTracing > 0);
          metrics[row.subsystem] = {
            status: isDone ? 'Done' : 'Pending',
            totalTracings: totalTracing,
            doneTracings: doneTracing
          };
        }
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

  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return [];
    return data.filter(row => {
      if (!selectedSubsystems[row.subsystem]) return false;
      if (exclusiveFilter) {
        const totalTracing = row.total_tracing;
        let status;
        
        if (totalTracing === null || totalTracing === undefined || totalTracing === '' || totalTracing === 0) {
          status = 'Not Apply';
        } else {
          const isDone = (totalTracing === row.done_tracing) && (totalTracing > 0);
          status = isDone ? 'Done' : 'Pending';
        }
        
        if (exclusiveFilter === 'done') return status === 'Done';
        if (exclusiveFilter === 'pending') return status === 'Pending';
        if (exclusiveFilter === 'notapply') return status === 'Not Apply';
      }
      return true;
    });
  }, [data, selectedSubsystems, exclusiveFilter]);

  const debouncedFilterChange = useFilterDebounce(useCallback((filteredData) => {
    onFilterChange(filteredData);
    if (onPropagationChange && propagationTarget !== 'nothing') {
      onPropagationChange(filteredData, propagationTarget);
    }
  }, [onFilterChange, onPropagationChange, propagationTarget]));

  React.useEffect(() => {
    debouncedFilterChange(filteredData);
  }, [filteredData, debouncedFilterChange]);

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

  const handlePropagationChange = useCallback((value) => {
    setPropagationTarget(value);
    if (onPropagationChange) {
      onPropagationChange(value === 'nothing' ? [] : filteredData, value);
    }
  }, [onPropagationChange, filteredData]);

  const getStatusColor = useCallback((status) => {
    if (status === 'Done') return '#06923E';
    if (status === 'Not Apply') return '#212121';
    return '#E85C0D';
  }, []);

  const filteredSubsystems = useMemo(() => {
    if (!searchTerm) return sortedSubsystems;
    
    const filtered = {};
    Object.entries(sortedSubsystems).forEach(([subsystem, metrics]) => {
      if (subsystem.toLowerCase().includes(searchTerm.toLowerCase())) {
        filtered[subsystem] = metrics;
      }
    });
    return filtered;
  }, [sortedSubsystems, searchTerm]);

  const memoizedButtons = useMemo(() => 
    Object.entries(filteredSubsystems).map(([subsystem, metrics]) => {
      const status = metrics.status;
      const isSelected = selectedSubsystems[subsystem] || false;
      const isVisible = !exclusiveFilter ||
                      (exclusiveFilter === 'done' && status === 'Done') ||
                      (exclusiveFilter === 'pending' && status === 'Pending') ||
                      (exclusiveFilter === 'notapply' && status === 'Not Apply');

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
    }), [filteredSubsystems, selectedSubsystems, exclusiveFilter, toggleSubsystem, getStatusColor]
  );

  // Reset internal state when filter becomes invisible
  React.useEffect(() => {
    if (!isVisible) {
      // No need to reset selectedSubsystems as they should persist
      // But we should reset the exclusive filter and propagation
      setExclusiveFilter(null);
      setPropagationTarget('nothing');
    }
  }, [isVisible]);
  
  if (!isVisible) return null;

  return (
    <ResizableDraggablePanel
      title="Tracing Status Filter"
      initialWidth={400}
      initialHeight={600}
      initialX={1675}
      initialY={450}
      minWidth={350}
      minHeight={400}
      onBringToFront={onBringToFront}
    >
      <VStack spacing={2} align="stretch" p={3} height="100%">
        <HStack justify="flex-end" align="center">
          <IconButton
            icon={<MdClose />}
            size="sm"
            variant="ghost"
            onClick={onClose}
            aria-label="Close filter"
          />
        </HStack>

        <HStack spacing={4} justifyContent="center">
          <Tooltip label="Click to show only done tracing" placement="top">
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
              <Box width="15px" height="15px" bg="#06923E" borderWidth="1px" />
              <Text fontWeight={exclusiveFilter === 'done' ? "bold" : "normal"}>Done</Text>
            </HStack>
          </Tooltip>

          <Tooltip label="Click to show only pending tracing" placement="top">
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

          <Tooltip label="Click to show only not applicable tracing" placement="top">
            <HStack
              onClick={() => toggleExclusiveFilter('notapply')}
              cursor="pointer"
              p={1}
              borderRadius="md"
              bg={exclusiveFilter === 'notapply' ? "blue.50" : "transparent"}
              borderWidth="1px"
              borderColor={exclusiveFilter === 'notapply' ? "blue.300" : "transparent"}
              _hover={{ bg: "gray.100" }}
            >
              <Box width="15px" height="15px" bg="#212121" borderWidth="1px" />
              <Text fontWeight={exclusiveFilter === 'notapply' ? "bold" : "normal"} color="black">Not Apply</Text>
            </HStack>
          </Tooltip>
        </HStack>

        <HStack spacing={2}>
          <Button size="xs" colorScheme="blue" onClick={() => toggleAllSubsystems(true)}>Select All</Button>
          <Button size="xs" colorScheme="gray" onClick={() => toggleAllSubsystems(false)}>Clear All</Button>
          <Button size="xs" colorScheme="teal" onClick={invertSubsystemSelection}>Invert</Button>
        </HStack>

        <VStack spacing={2} align="stretch">
          <Box>
            <Text fontSize="xs" fontWeight="semibold" mb={1}>Search subsystems:</Text>
            <Input
              size="sm"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              bg="white"
            />
          </Box>
        </VStack>

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

export default React.memo(TracingStatusFilter);