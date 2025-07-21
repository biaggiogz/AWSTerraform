import React from 'react';
import {
  HStack,
  Badge,
  Button,
  Text,
  Box,
} from '@chakra-ui/react';
import { useInstrumentsTableFilterContext } from './InstrumentsTableFilter.optimized';

/**
 * Component to display active filters and provide a way to clear them
 */
const FilterStatusBar = () => {
  const {
    selectedIsometric,
    selectedTestPack,
    selectedSubsystem,
    clearAllFilters
  } = useInstrumentsTableFilterContext();
  
  // If no filters are active, don't render anything
  if (!selectedIsometric && !selectedTestPack && !selectedSubsystem) {
    return null;
  }
  
  return (
    <Box mb={4} p={3} borderWidth="2px" borderRadius="md" bg="blue.50" boxShadow="sm">
      <HStack spacing={4} justify="space-between">
        <HStack spacing={3}>
          <Text fontWeight="bold" fontSize="md">Active Filters:</Text>
          {selectedIsometric && (
            <Badge colorScheme="purple" fontSize="md" px={3} py={1} boxShadow="sm">
              ISOMETRIC: {selectedIsometric}
            </Badge>
          )}
          {selectedSubsystem && (
            <Badge colorScheme="orange" fontSize="md" px={3} py={1} boxShadow="sm">
              SUBSYSTEM: {selectedSubsystem}
            </Badge>
          )}
          {selectedTestPack && (
            <Badge colorScheme="green" fontSize="md" px={3} py={1} boxShadow="sm">
              TEST PACK: {selectedTestPack}
            </Badge>
          )}
        </HStack>
        <Button 
          size="sm" 
          colorScheme="red" 
          variant="solid" 
          onClick={clearAllFilters}
        >
          Clear All Filters
        </Button>
      </HStack>
    </Box>
  );
};

export default FilterStatusBar;