import React from 'react';
import {
  HStack,
  Badge,
  Button,
  Text,
  Box,
} from '@chakra-ui/react';
import { useInstrumentsTableFilterContext } from './InstrumentsTableFilter';

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
    <Box mb={4} p={2} borderWidth="1px" borderRadius="md" bg="blue.50">
      <HStack spacing={4} justify="space-between">
        <HStack spacing={2}>
          <Text fontWeight="bold" fontSize="sm">Active Filters:</Text>
          {selectedIsometric && (
            <Badge colorScheme="purple" fontSize="sm" px={3} py={1}>
              ISOMETRIC: {selectedIsometric}
            </Badge>
          )}
          {selectedSubsystem && (
            <Badge colorScheme="orange" fontSize="sm" px={3} py={1}>
              SUBSYSTEM: {selectedSubsystem}
            </Badge>
          )}
          {selectedTestPack && (
            <Badge colorScheme="green" fontSize="sm" px={3} py={1}>
              TEST PACK: {selectedTestPack}
            </Badge>
          )}
        </HStack>
        <Button 
          size="xs" 
          colorScheme="red" 
          variant="outline" 
          onClick={clearAllFilters}
        >
          Clear All Filters
        </Button>
      </HStack>
    </Box>
  );
};

export default FilterStatusBar;