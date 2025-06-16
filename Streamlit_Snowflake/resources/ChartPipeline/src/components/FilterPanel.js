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
  testPacks, 
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

        <FormControl>
          <FormLabel>Test Pack</FormLabel>
          <Select 
            value={filters.testPack || ''} 
            onChange={(e) => onFilterChange('testPack', e.target.value)}
            placeholder="All Test Packs"
          >
            {[...testPacks].sort((a, b) => {
              // Sort numerically if possible, otherwise alphabetically
              const numA = parseInt(a);
              const numB = parseInt(b);
              if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
              return String(a).localeCompare(String(b), undefined, {numeric: true});
            }).map(testPack => (
              <option key={testPack} value={testPack}>{testPack}</option>
            ))}
          </Select>
        </FormControl>
      </Stack>
    </Box>
  );
};

export default FilterPanel;