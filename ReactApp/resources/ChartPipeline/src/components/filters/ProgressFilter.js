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

const ProgressFilter = ({ 
  data, 
  onFilterChange, 
  isVisible, 
  onClose,
  onPropagationChange,
  onBringToFront
}) => {
  const [exclusiveFilter, setExclusiveFilter] = useState(null);
  const [selectedTestPacks, setSelectedTestPacks] = useState({});
  const [propagationTarget, setPropagationTarget] = useState('nothing');
  const [searchTerm, setSearchTerm] = useState('');

  const testPackMetrics = useMemo(() => {
    if (!data || data.length === 0) return {};
    
    const metrics = {};
    data.forEach(row => {
      if (row.testPack && row.testPackProgress !== undefined) {
        metrics[row.testPack] = {
          progress: Math.round(row.testPackProgress)
        };
      }
    });
    
    return metrics;
  }, [data]);

  const sortedTestPacks = useMemo(() => {
    return Object.entries(testPackMetrics)
      .sort((a, b) => a[0].localeCompare(b[0], undefined, {numeric: true}))
      .reduce((obj, [key, value]) => {
        obj[key] = value;
        return obj;
      }, {});
  }, [testPackMetrics]);

  React.useEffect(() => {
    const testPackKeys = Object.keys(sortedTestPacks);
    if (testPackKeys.length > 0 && Object.keys(selectedTestPacks).length === 0) {
      const initialState = testPackKeys.reduce((acc, testPack) => {
        acc[testPack] = true;
        return acc;
      }, {});
      setSelectedTestPacks(initialState);
    }
  }, [sortedTestPacks]);

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
        if (!selectedTestPacks[row.testPack]) return false;
        
        if (exclusiveFilter) {
          const progress = row.testPackProgress;
          if (exclusiveFilter === 'above90') return progress > 90;
          if (exclusiveFilter === 'between70And90') return progress >= 70 && progress <= 90;
          if (exclusiveFilter === 'below70') return progress < 70;
          if (exclusiveFilter === 'done100') return progress === 100;
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
  }, [data, selectedTestPacks, exclusiveFilter, onFilterChange, onPropagationChange, propagationTarget]);

  const toggleExclusiveFilter = useCallback((filter) => {
    setExclusiveFilter(prev => prev === filter ? null : filter);
  }, []);

  const toggleTestPack = useCallback((testPack) => {
    setSelectedTestPacks(prev => ({
      ...prev,
      [testPack]: !prev[testPack]
    }));
  }, []);

  const toggleAllTestPacks = useCallback((value) => {
    const newState = Object.keys(sortedTestPacks).reduce((acc, testPack) => {
      acc[testPack] = value;
      return acc;
    }, {});
    setSelectedTestPacks(newState);
  }, [sortedTestPacks]);

  const invertTestPackSelection = useCallback(() => {
    setSelectedTestPacks(prev => {
      const invertedState = {};
      Object.keys(sortedTestPacks).forEach(testPack => {
        invertedState[testPack] = !prev[testPack];
      });
      return invertedState;
    });
  }, [sortedTestPacks]);

  const getProgressColor = useCallback((progress) => {
    if (progress === 100) return '#437057';
    if (progress > 90) return '#97B067';
    if (progress >= 70) return '#FFBF78';
    return '#E86A33';
  }, []);

  const handlePropagationChange = useCallback((value) => {
    setPropagationTarget(value);
    
    // Immediately trigger propagation when dropdown changes
    if (onPropagationChange) {
      if (value === 'nothing') {
        onPropagationChange([], 'nothing');
      } else {
        // Get current filtered data and propagate
        const currentFilteredData = data.filter(row => {
          if (!selectedTestPacks[row.testPack]) return false;
          
          if (exclusiveFilter) {
            const progress = row.testPackProgress;
            if (exclusiveFilter === 'above90') return progress > 90;
            if (exclusiveFilter === 'between70And90') return progress >= 70 && progress <= 90;
            if (exclusiveFilter === 'below70') return progress < 70;
            if (exclusiveFilter === 'done100') return progress === 100;
          }
          
          return true;
        });
        onPropagationChange(currentFilteredData, value);
      }
    }
  }, [data, selectedTestPacks, exclusiveFilter, onPropagationChange]);

  const filteredTestPacks = useMemo(() => {
    if (!searchTerm) return sortedTestPacks;
    
    const filtered = {};
    Object.entries(sortedTestPacks).forEach(([testPack, metrics]) => {
      if (testPack.toLowerCase().includes(searchTerm.toLowerCase())) {
        filtered[testPack] = metrics;
      }
    });
    return filtered;
  }, [sortedTestPacks, searchTerm]);

  const memoizedButtons = useMemo(() => 
    Object.entries(filteredTestPacks).map(([testPack, metrics]) => {
      const progress = metrics.progress;
      const isSelected = selectedTestPacks[testPack] || false;
      const isVisible = !exclusiveFilter ||
                      (exclusiveFilter === 'above90' && progress > 90) ||
                      (exclusiveFilter === 'between70And90' && progress >= 70 && progress <= 90) ||
                      (exclusiveFilter === 'below70' && progress < 70) ||
                      (exclusiveFilter === 'done100' && progress === 100);
      
      const isDisabled = exclusiveFilter && !isVisible;

      return (
        <Button
          key={testPack}
          size="sm"
          height="36px"
          variant={isSelected ? "solid" : "outline"}
          bg={isDisabled ? "gray.600" : (isSelected ? getProgressColor(progress) : "white")}
          borderColor={isDisabled ? "gray.600" : getProgressColor(progress)}
          color={isDisabled ? "gray.400" : (isSelected ? "white" : "black")}
          opacity={isVisible ? 1 : 0.5}
          onClick={isDisabled ? undefined : () => toggleTestPack(testPack)}
          cursor={isDisabled ? "not-allowed" : "pointer"}
          mb={1}
          _hover={isDisabled ? {} : { bg: isSelected ? getProgressColor(progress) : "gray.100" }}
          isDisabled={isDisabled}
        >
          <VStack spacing={0} align="center">
            <Text fontSize="xs" fontWeight="bold" noOfLines={1}>
              {testPack}
            </Text>
            <Text fontSize="10px" noOfLines={1}>
              {progress}%
            </Text>
          </VStack>
        </Button>
      );
    }), [filteredTestPacks, selectedTestPacks, exclusiveFilter, toggleTestPack, getProgressColor]
  );

  if (!isVisible) return null;

  return (
    <ResizableDraggablePanel
      title="Test Pack Progress Filter"
      initialWidth={400}
      initialHeight={600}
      initialX={100}
      initialY={100}
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

        <Box>
          <Input
            placeholder="Search test packs..."
            size="sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            bg="white"
          />
        </Box>

        <HStack spacing={4} justifyContent="center">

          <Tooltip label="Click to show only 100% done" placement="top">
            <HStack
                onClick={() => toggleExclusiveFilter('done100')}
                cursor="pointer"
                p={1}
                borderRadius="md"
                bg={exclusiveFilter === 'done100' ? "blue.50" : "transparent"}
                borderWidth="1px"
                borderColor={exclusiveFilter === 'done100' ? "blue.300" : "transparent"}
                _hover={{ bg: "gray.100" }}
            >
              <Box width="15px" height="15px" bg="#437057" borderWidth="1px" />
              <Text fontWeight={exclusiveFilter === 'done100' ? "bold" : "normal"}>Done 100%</Text>
            </HStack>
          </Tooltip>

          <Tooltip label="Click to show only above 90%" placement="top">
            <HStack
              onClick={() => toggleExclusiveFilter('above90')}
              cursor="pointer"
              p={1}
              borderRadius="md"
              bg={exclusiveFilter === 'above90' ? "blue.50" : "transparent"}
              borderWidth="1px"
              borderColor={exclusiveFilter === 'above90' ? "blue.300" : "transparent"}
              _hover={{ bg: "gray.100" }}
            >
              <Box width="15px" height="15px" bg="#97B067" borderWidth="1px" />
              <Text fontWeight={exclusiveFilter === 'above90' ? "bold" : "normal"}>Above 90%</Text>
            </HStack>
          </Tooltip>

          <Tooltip label="Click to show only 70-90%" placement="top">
            <HStack
              onClick={() => toggleExclusiveFilter('between70And90')}
              cursor="pointer"
              p={1}
              borderRadius="md"
              bg={exclusiveFilter === 'between70And90' ? "blue.50" : "transparent"}
              borderWidth="1px"
              borderColor={exclusiveFilter === 'between70And90' ? "blue.300" : "transparent"}
              _hover={{ bg: "gray.100" }}
            >
              <Box width="15px" height="15px" bg="#FFBF78" borderWidth="1px" />
              <Text fontWeight={exclusiveFilter === 'between70And90' ? "bold" : "normal"}>70-90%</Text>
            </HStack>
          </Tooltip>

          <Tooltip label="Click to show only below 70%" placement="top">
            <HStack
              onClick={() => toggleExclusiveFilter('below70')}
              cursor="pointer"
              p={1}
              borderRadius="md"
              bg={exclusiveFilter === 'below70' ? "blue.50" : "transparent"}
              borderWidth="1px"
              borderColor={exclusiveFilter === 'below70' ? "blue.300" : "transparent"}
              _hover={{ bg: "gray.100" }}
            >
              <Box width="15px" height="15px" bg="#E86A33" borderWidth="1px" />
              <Text fontWeight={exclusiveFilter === 'below70' ? "bold" : "normal"}>Below 70%</Text>
            </HStack>
          </Tooltip>
        </HStack>

        <HStack spacing={2}>
          <Button size="xs" colorScheme="blue" onClick={() => toggleAllTestPacks(true)}>Select All</Button>
          <Button size="xs" colorScheme="gray" onClick={() => toggleAllTestPacks(false)}>Clear All</Button>
          <Button size="xs" colorScheme="teal" onClick={invertTestPackSelection}>Invert</Button>
        </HStack>

        <Box>
          <Text fontSize="xs" fontWeight="semibold" mb={1}>Propagate to:</Text>
          <Select
            size="sm"
            value={propagationTarget}
            onChange={(e) => handlePropagationChange(e.target.value)}
            bg="white"
          >
            <option value="nothing">Nothing</option>
            <option value="tableA">Table A (Subsystem Overview)</option>
          </Select>
        </Box>

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

export default React.memo(ProgressFilter);