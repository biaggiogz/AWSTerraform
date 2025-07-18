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
  IconButton,
  Select,
  Input
} from '@chakra-ui/react';
import { MdClose } from 'react-icons/md';
import ResizableDraggablePanel from '../ui/ResizableDraggablePanel';

const ItemsStatusFilter = ({ 
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
      
      // Handle propagation based on selected target
      if (onPropagationChange && propagationTarget !== 'nothing') {
        onPropagationChange(filteredData, propagationTarget);
      }
    }, 100);
    
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [data, selectedSubsystems, exclusiveFilter, onFilterChange, onPropagationChange, propagationTarget]);

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
    
    // Immediately trigger propagation when dropdown changes
    if (onPropagationChange) {
      if (value === 'nothing') {
        onPropagationChange([], 'nothing');
      } else {
        // Get current filtered data and propagate
        const currentFilteredData = data.filter(row => {
          if (!selectedSubsystems[row.subsystem]) return false;
          
          if (exclusiveFilter) {
            const isDone = (row.totalItems === row.doneItems) && (row.totalItems > 0);
            const status = isDone ? 'Done' : 'Pending';
            if (exclusiveFilter === 'done') return status === 'Done';
            if (exclusiveFilter === 'pending') return status === 'Pending';
          }
          
          return true;
        });
        onPropagationChange(currentFilteredData, value);
      }
    }
  }, [data, selectedSubsystems, exclusiveFilter, onPropagationChange]);

  const getStatusColor = useCallback((status) => {
    if (status === 'Done') return '#2F5249';
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
      title="Items Status Filter"
      initialWidth={400}
      initialHeight={600}
      initialX={150}
      initialY={150}
      minWidth={350}
      minHeight={400}
      onBringToFront={onBringToFront}
    >
      <VStack spacing={3} align="stretch" p={3} height="100%">
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
          <Tooltip label="Click to show only done items" placement="top">
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

          <Tooltip label="Click to show only pending items" placement="top">
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
          
          <Box>
            <Text fontSize="xs" fontWeight="semibold" mb={1}>Propagate to:</Text>
            <Select
              size="sm"
              value={propagationTarget}
              onChange={(e) => handlePropagationChange(e.target.value)}
              bg="white"
            >
              <option value="nothing">Nothing</option>
              <option value="tableB">Table B (Test Pack Details)</option>
            </Select>
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

export default React.memo(ItemsStatusFilter);