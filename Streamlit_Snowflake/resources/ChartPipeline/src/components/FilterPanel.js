import React, { useState, useEffect } from 'react';
import { 
  Box, 
  FormControl, 
  FormLabel, 
  Select, 
  Stack,
  Heading,
  Button,
  HStack,
  Text
} from '@chakra-ui/react';
import { RepeatIcon } from '@chakra-ui/icons';

const FilterPanel = ({ 
  areas, 
  subsystems,
  filters, 
  onFilterChange,
  data
}) => {
  // Create a mapping of areas to their subsystems
  const [areaToSubsystems, setAreaToSubsystems] = useState({});
  // Create a mapping of subsystems to their areas
  const [subsystemToAreas, setSubsystemToAreas] = useState({});
  
  // Process data to create mappings
  useEffect(() => {
    if (!data || data.length === 0) return;
    
    const areaMap = {};
    const subsystemMap = {};
    
    data.forEach(item => {
      const area = item['Design Area'];
      const subsystem = item['SUBSYSTEM'];
      
      if (area && subsystem) {
        // Map area to subsystems
        if (!areaMap[area]) {
          areaMap[area] = new Set();
        }
        areaMap[area].add(subsystem);
        
        // Map subsystem to areas
        if (!subsystemMap[subsystem]) {
          subsystemMap[subsystem] = new Set();
        }
        subsystemMap[subsystem].add(area);
      }
    });
    
    // Convert Sets to Arrays
    const processedAreaMap = {};
    Object.keys(areaMap).forEach(area => {
      processedAreaMap[area] = Array.from(areaMap[area]);
    });
    
    const processedSubsystemMap = {};
    Object.keys(subsystemMap).forEach(subsystem => {
      processedSubsystemMap[subsystem] = Array.from(subsystemMap[subsystem]);
    });
    
    setAreaToSubsystems(processedAreaMap);
    setSubsystemToAreas(processedSubsystemMap);
  }, [data]);
  
  // Reset all filters
  const resetFilters = () => {
    onFilterChange('area', '');
    onFilterChange('subsystem', '');
  };
  
  // Determine which subsystems should be enabled based on selected area
  const getSubsystemState = (subsystem) => {
    if (!filters.area) {
      // No area filter, all subsystems enabled with default styling
      return { isDisabled: false, bg: "gray.100" };
    }
    
    // Check if this subsystem belongs to the selected area
    const belongsToSelectedArea = areaToSubsystems[filters.area]?.includes(subsystem);
    
    if (belongsToSelectedArea) {
      // Subsystem belongs to selected area - enabled and highlighted
      return { 
        isDisabled: false, 
        bg: subsystem === filters.subsystem ? "green.300" : "green.100"
      };
    } else {
      // Subsystem doesn't belong to selected area - disabled and grayed out
      return { isDisabled: true, bg: "gray.100", color: "gray.400", cursor: "not-allowed" };
    }
  };
  
  // Determine which areas should be enabled based on selected subsystem
  const getAreaState = (area) => {
    if (!filters.subsystem) {
      // No subsystem filter, all areas enabled with default styling
      return { isDisabled: false, bg: "gray.100" };
    }
    
    // Check if this area contains the selected subsystem
    const containsSelectedSubsystem = subsystemToAreas[filters.subsystem]?.includes(area);
    
    if (containsSelectedSubsystem) {
      // Area contains selected subsystem - enabled and highlighted
      return { 
        isDisabled: false, 
        bg: area === filters.area ? "green.300" : "green.100"
      };
    } else {
      // Area doesn't contain selected subsystem - disabled and grayed out
      return { isDisabled: true, bg: "gray.100", color: "gray.400", cursor: "not-allowed" };
    }
  };

  return (
    <Box 
      p={4} 
      borderWidth="1px" 
      borderRadius="lg" 
      width="100%"
      bg="white"
      boxShadow="sm"
      position="sticky"
      top="0"
      zIndex="10"
    >
      <HStack justify="space-between" mb={4}>
        <Heading size="md">Filters</Heading>
        <Button 
          size="sm" 
          leftIcon={<RepeatIcon />} 
          colorScheme="blue" 
          variant="outline"
          onClick={resetFilters}
        >
          Reset
        </Button>
      </HStack>
      
      <Stack spacing={4}>
        <FormControl>
          <FormLabel>Design Area</FormLabel>
          <Select 
            value={filters.area || ''} 
            onChange={(e) => onFilterChange('area', e.target.value)}
            placeholder="All Areas"
            bg={filters.area ? "green.300" : "gray.100"}
          >
            {areas.map(area => {
              const state = getAreaState(area);
              return (
                <option 
                  key={area} 
                  value={area} 
                  disabled={state.isDisabled}
                  style={{
                    backgroundColor: state.bg,
                    color: state.color,
                    cursor: state.cursor
                  }}
                >
                  {area}
                </option>
              );
            })}
          </Select>
          {filters.area && (
            <Text fontSize="xs" color="green.600" mt={1}>
              Showing {areaToSubsystems[filters.area]?.length || 0} related subsystems
            </Text>
          )}
        </FormControl>

        <FormControl>
          <FormLabel>Subsystem</FormLabel>
          <Select 
            value={filters.subsystem || ''} 
            onChange={(e) => onFilterChange('subsystem', e.target.value)}
            placeholder="All Subsystems"
            bg={filters.subsystem ? "green.300" : "gray.100"}
          >
            {subsystems.map(subsystem => {
              const state = getSubsystemState(subsystem);
              return (
                <option 
                  key={subsystem} 
                  value={subsystem}
                  disabled={state.isDisabled}
                  style={{
                    backgroundColor: state.bg,
                    color: state.color,
                    cursor: state.cursor
                  }}
                >
                  {subsystem}
                </option>
              );
            })}
          </Select>
          {filters.subsystem && (
            <Text fontSize="xs" color="green.600" mt={1}>
              Showing {subsystemToAreas[filters.subsystem]?.length || 0} related areas
            </Text>
          )}
        </FormControl>
      </Stack>
    </Box>
  );
};

export default FilterPanel;