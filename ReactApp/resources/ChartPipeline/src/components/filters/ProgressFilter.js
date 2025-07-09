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

const ProgressFilter = ({ 
  data, 
  onFilterChange, 
  isVisible, 
  onClose 
}) => {
  const [exclusiveFilter, setExclusiveFilter] = useState(null);
  const [selectedTestPacks, setSelectedTestPacks] = useState({});

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
    }, 100);
    
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [data, selectedTestPacks, exclusiveFilter, onFilterChange]);

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

  const memoizedButtons = useMemo(() => 
    Object.entries(sortedTestPacks).map(([testPack, metrics]) => {
      const progress = metrics.progress;
      const isSelected = selectedTestPacks[testPack] || false;
      const isVisible = !exclusiveFilter ||
                      (exclusiveFilter === 'above90' && progress > 90) ||
                      (exclusiveFilter === 'between70And90' && progress >= 70 && progress <= 90) ||
                      (exclusiveFilter === 'below70' && progress < 70) ||
                      (exclusiveFilter === 'done100' && progress === 100);

      return (
        <Button
          key={testPack}
          size="sm"
          height="36px"
          variant={isSelected ? "solid" : "outline"}
          bg={isSelected ? getProgressColor(progress) : "white"}
          borderColor={getProgressColor(progress)}
          color={isSelected ? "white" : "black"}
          opacity={isVisible ? 1 : 0.5}
          onClick={() => toggleTestPack(testPack)}
          mb={1}
          _hover={{ bg: isSelected ? getProgressColor(progress) : "gray.100" }}
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
    }), [sortedTestPacks, selectedTestPacks, exclusiveFilter, toggleTestPack, getProgressColor]
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
    >
      <VStack spacing={3} align="stretch" p={3} height="100%">
        <HStack justify="space-between" align="center">
          <Heading size="sm">TEST PACKS: {Object.keys(sortedTestPacks).length}</Heading>
          <IconButton
            icon={<MdClose />}
            size="sm"
            variant="ghost"
            onClick={onClose}
            aria-label="Close filter"
          />
        </HStack>

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