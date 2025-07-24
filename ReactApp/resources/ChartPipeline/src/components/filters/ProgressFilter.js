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
  const [isInitialized, setIsInitialized] = useState(false);

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

  // Initialize with empty selection when filter opens
  React.useEffect(() => {
    const testPackKeys = Object.keys(sortedTestPacks);
    if (testPackKeys.length > 0 && !isInitialized) {
      const initialState = testPackKeys.reduce((acc, testPack) => {
        acc[testPack] = false;
        return acc;
      }, {});
      setSelectedTestPacks(initialState);
      setIsInitialized(true);

      if (!window.progressFilterState) window.progressFilterState = {};
      window.progressFilterState.filteredData = [];

      console.log('ProgressFilter initialized with empty selection');
    }
  }, [sortedTestPacks, isInitialized]);

  // Extract filtering logic to avoid duplication
  const getFilteredData = useCallback(() => {
    if (!data || data.length === 0) return [];
    
    const selectedTPs = Object.keys(selectedTestPacks).filter(tp => selectedTestPacks[tp]);
    if (selectedTPs.length === 0) return [];

    return data.filter(row => {
      const testPackId = row.testPack || row.tp_id;
      if (!selectedTestPacks[testPackId]) return false;

      if (exclusiveFilter) {
        const progress = row.testPackProgress || (row.progress_tp * 100);
        if (exclusiveFilter === 'range90to99') return progress >= 90 && progress < 100;
        if (exclusiveFilter === "below90") return progress < 90;
        if (exclusiveFilter === 'done100') return progress === 100;
      }

      return true;
    });
  }, [data, selectedTestPacks, exclusiveFilter]);

  const debounceRef = useRef(null);

  React.useEffect(() => {
    if (!isInitialized) return;

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      const filteredData = getFilteredData();
      
      onFilterChange(filteredData);

      if (!window.progressFilterState) window.progressFilterState = {};
      window.progressFilterState.filteredData = filteredData;

      if (onPropagationChange && propagationTarget !== 'nothing') {
        onPropagationChange(filteredData, propagationTarget);
      }
    }, 100);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [getFilteredData, onFilterChange, onPropagationChange, propagationTarget, isInitialized]);

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
    if (progress >= 90 && progress < 100) return '#97B067';
    return '#E86A33';
  }, []);

  const handlePropagationChange = useCallback((value) => {
    setPropagationTarget(value);

    if (!onPropagationChange || !isInitialized) return;

    const currentFilteredData = getFilteredData();

    if (!window.progressFilterState) window.progressFilterState = {};
    window.progressFilterState.filteredData = currentFilteredData;

    onPropagationChange(currentFilteredData, value);
  }, [getFilteredData, onPropagationChange, isInitialized]);

  const searchTermLower = useMemo(() => searchTerm.toLowerCase(), [searchTerm]);
  
  const filteredTestPacks = useMemo(() => {
    if (!searchTerm) return sortedTestPacks;

    return Object.fromEntries(
      Object.entries(sortedTestPacks).filter(([testPack]) => 
        testPack.toLowerCase().includes(searchTermLower)
      )
    );
  }, [sortedTestPacks, searchTermLower]);

  const memoizedButtons = useMemo(() => {
    const entries = Object.entries(filteredTestPacks);
    if (entries.length === 0) return [];
    
    return entries.map(([testPack, metrics]) => {
      const progress = metrics.progress;
      const isSelected = selectedTestPacks[testPack] === true;
      const isVisible = !exclusiveFilter ||
          (exclusiveFilter === 'range90to99' && progress >= 90 && progress < 100) ||
          (exclusiveFilter === 'below90' && progress < 90) ||
          (exclusiveFilter === 'done100' && progress === 100);

      const isDisabled = exclusiveFilter && !isVisible;
      const progressColor = getProgressColor(progress);

      return (
          <Button
              key={testPack}
              size="sm"
              height="36px"
              variant={isSelected ? "solid" : "outline"}
              bg={isDisabled ? "gray.600" : (isSelected ? progressColor : "white")}
              borderColor={isDisabled ? "gray.600" : progressColor}
              color={isDisabled ? "gray.400" : (isSelected ? "white" : "black")}
              opacity={isVisible ? 1 : 0.5}
              onClick={isDisabled ? undefined : () => toggleTestPack(testPack)}
              cursor={isDisabled ? "not-allowed" : "pointer"}
              mb={1}
              _hover={isDisabled ? {} : { bg: isSelected ? progressColor : "gray.100" }}
              isDisabled={isDisabled}
          >
            <VStack spacing={0} align="center">
              <Text fontSize="10px" noOfLines={1}>
                {testPack}
              </Text>
              <Text fontSize="10px" noOfLines={1}>
                {progress}%
              </Text>
            </VStack>
          </Button>
      );
    });
  }, [filteredTestPacks, selectedTestPacks, exclusiveFilter, toggleTestPack, getProgressColor]);

  // Reset internal state when filter becomes invisible
  React.useEffect(() => {
    if (!isVisible) {
      setExclusiveFilter(null);
      setPropagationTarget('nothing');
      setIsInitialized(false);

      if (window.progressFilterState) {
        window.progressFilterState.filteredData = [];
      }
    }
  }, [isVisible]);

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

            <Tooltip label="Click to show only above 90% and below 100%" placement="top">
              <HStack
                  onClick={() => toggleExclusiveFilter('range90to99')}
                  cursor="pointer"
                  p={1}
                  borderRadius="md"
                  bg={exclusiveFilter === 'range90to99' ? "blue.50" : "transparent"}
                  borderWidth="1px"
                  borderColor={exclusiveFilter === 'range90to99' ? "blue.300" : "transparent"}
                  _hover={{ bg: "gray.100" }}
              >
                <Box width="15px" height="15px" bg="#97B067" borderWidth="1px" />
                <Text fontWeight={exclusiveFilter === 'range90to99' ? "bold" : "normal"}>From 90% to 99%</Text>
              </HStack>
            </Tooltip>

            <Tooltip label="Click to show only below 90%" placement="top">
              <HStack
                  onClick={() => toggleExclusiveFilter('below90')}
                  cursor="pointer"
                  p={1}
                  borderRadius="md"
                  bg={exclusiveFilter === 'below90' ? "blue.50" : "transparent"}
                  borderWidth="1px"
                  borderColor={exclusiveFilter === 'below90' ? "blue.300" : "transparent"}
                  _hover={{ bg: "gray.100" }}
              >
                <Box width="15px" height="15px" bg="#E86A33" borderWidth="1px" />
                <Text fontWeight={exclusiveFilter === 'below90' ? "bold" : "normal"}>Below 90%</Text>
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
              <option value="both">Both Tables</option>
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

export default React.memo(ProgressFilter, (prevProps, nextProps) => {
  return (
    prevProps.data === nextProps.data &&
    prevProps.isVisible === nextProps.isVisible &&
    prevProps.onFilterChange === nextProps.onFilterChange &&
    prevProps.onPropagationChange === nextProps.onPropagationChange
  );
});