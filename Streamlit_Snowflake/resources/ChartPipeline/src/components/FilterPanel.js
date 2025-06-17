import React, { useState } from 'react';
import { 
  Box, 
  FormControl, 
  FormLabel, 
  Select, 
  Stack,
  Heading,
  Checkbox,
  VStack,
  Button,
  Input,
  InputGroup,
  InputLeftElement,
  HStack
} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';

const FilterPanel = ({ 
  areas, 
  subsystems,
  filters, 
  onFilterChange 
}) => {
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
      <Heading size="md" mb={4}>Filters</Heading>
      <Stack spacing={4}>
        <FormControl>
          <FormLabel>Design Area</FormLabel>
          <Select 
            value={filters.area || ''} 
            onChange={(e) => onFilterChange('area', e.target.value)}
            placeholder="All Areas"
          >
            {areas.map(area => (
              <option key={area} value={area}>{area}</option>
            ))}
          </Select>
        </FormControl>

        <FormControl>
          <FormLabel>Subsystem</FormLabel>
          <Select 
            value={filters.subsystem || ''} 
            onChange={(e) => onFilterChange('subsystem', e.target.value)}
            placeholder="All Subsystems"
          >
            {subsystems.map(subsystem => (
              <option key={subsystem} value={subsystem}>{subsystem}</option>
            ))}
          </Select>
        </FormControl>


      </Stack>
    </Box>
  );
};

export default FilterPanel;