import React, { useState, useMemo, useCallback, useRef } from 'react';
import { extractMatchingSubsystems } from '../../utils/filterUtils';
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
      // Handle different data structures
      if (row.testPack && row.testPackProgress !== undefined) {
        // Original format
        metrics[row.testPack] = {
          progress: Math.round(row.testPackProgress)
        };
      } else if (row.list_includes_tp_id && row.list_id_tp_total_progress) {
        // Handle ssm.csv format with pipe-separated lists
        let tpIds = [];
        if (typeof row.list_includes_tp_id === 'string') {
          tpIds = row.list_includes_tp_id.includes('|') 
            ? row.list_includes_tp_id.split('|') 
            : [row.list_includes_tp_id];
        } else if (Array.isArray(row.list_includes_tp_id)) {
          tpIds = row.list_includes_tp_id.map(id => String(id));
        } else if (row.list_includes_tp_id !== undefined && row.list_includes_tp_id !== null) {
          tpIds = [String(row.list_includes_tp_id)];
        }
        
        let progressValues = [];
        if (typeof row.list_id_tp_total_progress === 'string') {
          progressValues = row.list_id_tp_total_progress.includes('|') 
            ? row.list_id_tp_total_progress.split('|').map(p => parseFloat(p) || 0)
            : [parseFloat(row.list_id_tp_total_progress) || 0];
        } else if (Array.isArray(row.list_id_tp_total_progress)) {
          progressValues = row.list_id_tp_total_progress.map(p => parseFloat(p) || 0);
        } else if (row.list_id_tp_total_progress !== undefined && row.list_id_tp_total_progress !== null) {
          progressValues = [parseFloat(row.list_id_tp_total_progress) || 0];
        }
        
        // Create metrics for each TP ID
        tpIds.forEach((tpId, idx) => {
          if (!tpId) return; // Skip empty IDs
          const progress = idx < progressValues.length ? progressValues[idx] : 0;
          metrics[tpId] = {
            progress: Math.round(progress * 100) // Convert from decimal to percentage
          };
        });
      }
    });
    
    console.log('Extracted test pack metrics:', Object.keys(metrics).length);
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
      
      // Initialize with no user selection when first loading test packs
      if (!window.progressFilterState) window.progressFilterState = {};
      window.progressFilterState.hasUserSelection = false;
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
        // Clear global state for TableA
        if (window.progressFilterState) {
          window.progressFilterState.filteredData = [];
          window.progressFilterState.hasUserSelection = false;
        }
        return;
      }
      
      // Check if user has made any specific selections
      const hasUserSelection = exclusiveFilter !== null || 
        Object.values(selectedTestPacks).some(selected => !selected);
      
      const filteredData = data.filter(row => {
        // Handle different data structures
        if (row.testPack && row.testPackProgress !== undefined) {
          // Original format
          if (!selectedTestPacks[row.testPack]) return false;
          
          if (exclusiveFilter) {
            const progress = row.testPackProgress;
            if (exclusiveFilter === 'range90to99') return progress >= 90 && progress < 100;
            if (exclusiveFilter === "below90") return progress < 90;
            if (exclusiveFilter === 'done100') return progress === 100;
          }
          
          return true;
        } else if (row.list_includes_tp_id) {
          // ssm.csv format
          let tpIds = [];
          if (typeof row.list_includes_tp_id === 'string') {
            tpIds = row.list_includes_tp_id.includes('|') 
              ? row.list_includes_tp_id.split('|') 
              : [row.list_includes_tp_id];
          } else if (Array.isArray(row.list_includes_tp_id)) {
            tpIds = row.list_includes_tp_id.map(id => String(id));
          } else if (row.list_includes_tp_id !== undefined && row.list_includes_tp_id !== null) {
            tpIds = [String(row.list_includes_tp_id)];
          }
          
          // Check if any TP ID is selected
          const anySelected = tpIds.some(tpId => selectedTestPacks[tpId]);
          if (!anySelected) return false;
          
          // Apply exclusive filter if needed
          if (exclusiveFilter) {
            let progressValues = [];
            if (typeof row.list_id_tp_total_progress === 'string') {
              progressValues = row.list_id_tp_total_progress.includes('|') 
                ? row.list_id_tp_total_progress.split('|').map(p => parseFloat(p) || 0)
                : [parseFloat(row.list_id_tp_total_progress) || 0];
            } else if (Array.isArray(row.list_id_tp_total_progress)) {
              progressValues = row.list_id_tp_total_progress.map(p => parseFloat(p) || 0);
            } else if (row.list_id_tp_total_progress !== undefined && row.list_id_tp_total_progress !== null) {
              progressValues = [parseFloat(row.list_id_tp_total_progress) || 0];
            }
              
            const matchesFilter = tpIds.some((tpId, idx) => {
              if (!selectedTestPacks[tpId]) return false;
              const progress = idx < progressValues.length ? progressValues[idx] * 100 : 0;
              if (exclusiveFilter === 'range90to99') return progress >= 90 && progress < 100;
              if (exclusiveFilter === "below90") return progress < 90;
              if (exclusiveFilter === 'done100') return progress === 100;
              return false;
            });
            
            return matchesFilter;
          }
          
          return true;
        }
        
        return false;
      });
      
      // Store filtered data in global state
      if (!window.progressFilterState) window.progressFilterState = {};
      
      // Get selected test pack IDs
      const selectedTPIds = Object.entries(selectedTestPacks)
        .filter(([tp, isSelected]) => isSelected)
        .map(([tp]) => tp);
      
      window.progressFilterState.selectedTPs = selectedTPIds;
      window.progressFilterState.hasUserSelection = hasUserSelection;
      
      // Extract subsystems that contain the selected test packs
      const matchingSubsystems = new Set();
      if (propagationTarget === 'tableA' || propagationTarget === 'both') {
        // Use the utility function to extract matching subsystems
        const activeTPIds = selectedTPIds.filter(tpId => selectedTestPacks[tpId]);
        const extractedSubsystems = extractMatchingSubsystems(data, activeTPIds);
        extractedSubsystems.forEach(subsystem => matchingSubsystems.add(subsystem));
      }
      
      // Filter data based on matching subsystems
      let subsystemFilteredData = [];
      if (matchingSubsystems.size > 0) {
        subsystemFilteredData = data.filter(row => 
          matchingSubsystems.has(row.subsystem)
        );
        console.log('Progress filter matched', matchingSubsystems.size, 'subsystems');
      } else {
        subsystemFilteredData = hasUserSelection ? [] : data;
      }
      
      // Only update filteredData in global state if propagation is set to tableA or both
      if (propagationTarget === 'tableA' || propagationTarget === 'both') {
        window.progressFilterState.filteredData = subsystemFilteredData;
        window.progressFilterState.matchingSubsystems = Array.from(matchingSubsystems);
        console.log('Progress filter updated with', subsystemFilteredData.length, 'items', 
                   '(propagating to ' + propagationTarget + ')');
        console.log('Matching subsystems:', matchingSubsystems.size);
      } else {
        window.progressFilterState.filteredData = [];
        window.progressFilterState.matchingSubsystems = [];
        console.log('Progress filter updated but not propagating to tables');
      }
      
      // Call onFilterChange with the filtered data
      // This will trigger the SQL query re-execution in DynamicCalculationPanel
      onFilterChange(filteredData);
      
      // Handle propagation based on selected target
      if (onPropagationChange) {
        onPropagationChange(subsystemFilteredData, propagationTarget);
      }
    }, 100);
    
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [data, selectedTestPacks, exclusiveFilter, onFilterChange, onPropagationChange, propagationTarget]);

  const toggleExclusiveFilter = useCallback((filter) => {
    setExclusiveFilter(prev => {
      const newValue = prev === filter ? null : filter;
      // Ensure we update the global state to indicate user selection
      if (!window.progressFilterState) window.progressFilterState = {};
      window.progressFilterState.hasUserSelection = newValue !== null || 
        Object.values(selectedTestPacks).some(selected => !selected);
      return newValue;
    });
  }, [selectedTestPacks]);

  const toggleTestPack = useCallback((testPack) => {
    setSelectedTestPacks(prev => {
      const newState = {
        ...prev,
        [testPack]: !prev[testPack]
      };
      
      // Update global state to indicate user selection
      if (!window.progressFilterState) window.progressFilterState = {};
      window.progressFilterState.hasUserSelection = exclusiveFilter !== null || 
        Object.values(newState).some(selected => !selected);
      
      return newState;
    });
  }, [exclusiveFilter]);

  const toggleAllTestPacks = useCallback((value) => {
    const newState = Object.keys(sortedTestPacks).reduce((acc, testPack) => {
      acc[testPack] = value;
      return acc;
    }, {});
    
    // Only mark as user selection if not selecting all (deselecting some is a user selection)
    const isUserSelection = !value || exclusiveFilter !== null;
    
    // Update global state
    if (!window.progressFilterState) window.progressFilterState = {};
    window.progressFilterState.hasUserSelection = isUserSelection;
    
    setSelectedTestPacks(newState);
  }, [sortedTestPacks, exclusiveFilter]);

  const invertTestPackSelection = useCallback(() => {
    setSelectedTestPacks(prev => {
      const invertedState = {};
      Object.keys(sortedTestPacks).forEach(testPack => {
        invertedState[testPack] = !prev[testPack];
      });
      
      // Inverting is always a user selection
      if (!window.progressFilterState) window.progressFilterState = {};
      window.progressFilterState.hasUserSelection = true;
      
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
    
    // Immediately trigger propagation when dropdown changes
    if (onPropagationChange) {
      if (value === 'nothing') {
        // Only clear global state for TableA, don't affect TableB
        if (window.progressFilterState) {
          window.progressFilterState.filteredData = [];
          window.progressFilterState.matchingSubsystems = [];
          window.progressFilterState.hasUserSelection = false;
        }
        onPropagationChange([], 'nothing');
      } else if (value === 'tableA' || value === 'both') {
        // Get selected test pack IDs
        const selectedTPIds = Object.entries(selectedTestPacks)
          .filter(([tp, isSelected]) => isSelected)
          .map(([tp]) => tp);
        
        // Extract subsystems that contain the selected test packs
        const activeTPIds = selectedTPIds.filter(tpId => selectedTestPacks[tpId]);
        const matchingSubsystems = extractMatchingSubsystems(data, activeTPIds);
        
        // Filter data based on matching subsystems
        let subsystemFilteredData = [];
        if (matchingSubsystems.size > 0) {
          subsystemFilteredData = data.filter(row => 
            matchingSubsystems.has(row.subsystem)
          );
          console.log('Progress filter matched', matchingSubsystems.size, 'subsystems');
        } else {
          // If no specific selection, use all data
          const hasUserSelection = exclusiveFilter !== null || 
            Object.values(selectedTestPacks).some(selected => !selected);
          subsystemFilteredData = hasUserSelection ? [] : data;
        }
        
        // Update global state
        if (!window.progressFilterState) window.progressFilterState = {};
        window.progressFilterState.filteredData = subsystemFilteredData;
        window.progressFilterState.matchingSubsystems = Array.from(matchingSubsystems);
        window.progressFilterState.hasUserSelection = true;
        window.progressFilterState.selectedTPs = selectedTPIds;
        
        console.log('Propagation changed to', value, 'with', matchingSubsystems.size, 'matching subsystems');
        
        // Propagate to appropriate tables
        onPropagationChange(subsystemFilteredData, value);
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
                      (exclusiveFilter === 'range90to99' && progress >= 90 && progress < 100) ||
                      (exclusiveFilter === 'below90' && progress < 90) ||
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

  // Reset internal state when filter becomes invisible
  React.useEffect(() => {
    // Initialize global state if needed
    if (!window.progressFilterState) {
      window.progressFilterState = { 
        filteredData: [], 
        hasUserSelection: false,
        selectedTPs: [],
        matchingSubsystems: []
      };
    }
    
    if (!isVisible) {
      // No need to reset selectedTestPacks as they should persist
      // But we should reset the exclusive filter and propagation
      setExclusiveFilter(null);
      setPropagationTarget('nothing');
      
      // Clear global state
      window.progressFilterState.filteredData = [];
      window.progressFilterState.hasUserSelection = false;
      window.progressFilterState.selectedTPs = [];
      window.progressFilterState.matchingSubsystems = [];
    } else {
      // When filter becomes visible, explicitly set hasUserSelection to false
      // This ensures no filtering happens by default when opening
      window.progressFilterState.hasUserSelection = false;
      
      // Initialize selectedTPs based on current selection
      window.progressFilterState.selectedTPs = Object.entries(selectedTestPacks)
        .filter(([tp, isSelected]) => isSelected)
        .map(([tp]) => tp);
      
      // Reset matching subsystems
      window.progressFilterState.matchingSubsystems = [];
    }
  }, [isVisible, selectedTestPacks]);
  
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

export default React.memo(ProgressFilter);