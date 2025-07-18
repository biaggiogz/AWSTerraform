import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  Box,
  HStack,
  Text,
  VStack,
  Button,
  SimpleGrid,
  Divider,
  IconButton,
  Select,
  Input
} from '@chakra-ui/react';
import { MdClose } from 'react-icons/md';
import ResizableDraggablePanel from '../ui/ResizableDraggablePanel';

const HitoFilter = ({ 
  data, 
  onFilterChange, 
  isVisible, 
  onClose,
  onPropagationChange,
  onBringToFront
}) => {
  const [selectedHitos, setSelectedHitos] = useState({});
  const [propagationTarget, setPropagationTarget] = useState('nothing');
  const [searchTerm, setSearchTerm] = useState('');

  const hitoValues = useMemo(() => {
    if (!data || data.length === 0) return {};
    
    const values = {};
    data.forEach(row => {
      if (row.hito) {
        values[row.hito] = true;
      }
    });
    
    return values;
  }, [data]);

  const sortedHitos = useMemo(() => {
    return Object.keys(hitoValues)
      .sort((a, b) => a.localeCompare(b))
      .reduce((obj, key) => {
        obj[key] = true;
        return obj;
      }, {});
  }, [hitoValues]);

  React.useEffect(() => {
    const hitoKeys = Object.keys(sortedHitos);
    if (hitoKeys.length > 0 && Object.keys(selectedHitos).length === 0) {
      const initialState = hitoKeys.reduce((acc, hito) => {
        acc[hito] = true;
        return acc;
      }, {});
      setSelectedHitos(initialState);
    }
  }, [sortedHitos]);

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
        if (!row.hito || !selectedHitos[row.hito]) return false;
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
  }, [data, selectedHitos, onFilterChange, onPropagationChange, propagationTarget]);

  const toggleHito = useCallback((hito) => {
    setSelectedHitos(prev => ({
      ...prev,
      [hito]: !prev[hito]
    }));
  }, []);

  const toggleAllHitos = useCallback((value) => {
    const newState = Object.keys(sortedHitos).reduce((acc, hito) => {
      acc[hito] = value;
      return acc;
    }, {});
    setSelectedHitos(newState);
  }, [sortedHitos]);

  const invertHitoSelection = useCallback(() => {
    setSelectedHitos(prev => {
      const invertedState = {};
      Object.keys(sortedHitos).forEach(hito => {
        invertedState[hito] = !prev[hito];
      });
      return invertedState;
    });
  }, [sortedHitos]);

  const handlePropagationChange = useCallback((value) => {
    setPropagationTarget(value);
    
    // Immediately trigger propagation when dropdown changes
    if (onPropagationChange) {
      if (value === 'nothing') {
        onPropagationChange([], 'nothing');
      } else {
        // Get current filtered data and propagate
        const currentFilteredData = data.filter(row => {
          if (!row.hito || !selectedHitos[row.hito]) return false;
          return true;
        });
        onPropagationChange(currentFilteredData, value);
      }
    }
  }, [data, selectedHitos, onPropagationChange]);

  const getHitoColor = useCallback((hito) => {
    // Generate a consistent color based on the hito string
    const hash = hito.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    
    const h = Math.abs(hash) % 360;
    const s = 60 + (Math.abs(hash) % 30); // 60-90%
    const l = 35 + (Math.abs(hash) % 15); // 35-50%
    
    return `hsl(${h}, ${s}%, ${l}%)`;
  }, []);

  const filteredHitos = useMemo(() => {
    if (!searchTerm) return sortedHitos;
    
    const filtered = {};
    Object.keys(sortedHitos).forEach((hito) => {
      if (hito.toLowerCase().includes(searchTerm.toLowerCase())) {
        filtered[hito] = true;
      }
    });
    return filtered;
  }, [sortedHitos, searchTerm]);

  const memoizedButtons = useMemo(() => 
    Object.keys(filteredHitos).map((hito) => {
      const isSelected = selectedHitos[hito] || false;
      const color = getHitoColor(hito);

      return (
        <Button
          key={hito}
          size="sm"
          height="36px"
          variant={isSelected ? "solid" : "outline"}
          bg={isSelected ? color : "white"}
          borderColor={color}
          color={isSelected ? "white" : "black"}
          onClick={() => toggleHito(hito)}
          mb={1}
          _hover={{ bg: isSelected ? color : "gray.100" }}
        >
          <VStack spacing={0} align="center">
            <Text fontSize="xs" fontWeight="bold" noOfLines={1}>
              {hito}
            </Text>
          </VStack>
        </Button>
      );
    }), [filteredHitos, selectedHitos, toggleHito, getHitoColor]
  );

  if (!isVisible) return null;

  return (
    <ResizableDraggablePanel
      title="Hito Filter"
      initialWidth={400}
      initialHeight={600}
      initialX={250}
      initialY={250}
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

        <HStack spacing={2}>
          <Button size="xs" colorScheme="blue" onClick={() => toggleAllHitos(true)}>Select All</Button>
          <Button size="xs" colorScheme="gray" onClick={() => toggleAllHitos(false)}>Clear All</Button>
          <Button size="xs" colorScheme="teal" onClick={invertHitoSelection}>Invert</Button>
        </HStack>

        <VStack spacing={2} align="stretch">
          <Box>
            <Text fontSize="xs" fontWeight="semibold" mb={1}>Search hitos:</Text>
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
              <option value="tableA">Table A (Subsystem Overview)</option>
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

export default React.memo(HitoFilter);