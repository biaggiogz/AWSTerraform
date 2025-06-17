import React, { useMemo } from 'react';
import {
  Box,
  FormControl,
  FormLabel,
  Stack,
  Heading,
  Button,
  HStack,
  Text,
} from '@chakra-ui/react';
import { RepeatIcon } from '@chakra-ui/icons';
import Select from 'react-select';

const FilterPanel = ({
  areas,
  subsystems,
  filters,
  onFilterChange,
  data,
}) => {
  // Process data to create mappings using memoization
  const { areaToSubsystems, subsystemToAreas } = useMemo(() => {
    if (!data || data.length === 0) {
      return { areaToSubsystems: {}, subsystemToAreas: {} };
    }

    const areaMap = {};
    const subsystemMap = {};

    // Single pass through data to build both maps
    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      const area = item['Design Area'];
      const subsystem = item['SUBSYSTEM'];

      if (area && subsystem) {
        if (!areaMap[area]) areaMap[area] = new Set();
        areaMap[area].add(subsystem);

        if (!subsystemMap[subsystem]) subsystemMap[subsystem] = new Set();
        subsystemMap[subsystem].add(area);
      }
    }

    // Convert Sets to Arrays
    const processedAreaMap = {};
    Object.keys(areaMap).forEach(area => {
      processedAreaMap[area] = Array.from(areaMap[area]);
    });

    const processedSubsystemMap = {};
    Object.keys(subsystemMap).forEach(subsystem => {
      processedSubsystemMap[subsystem] = Array.from(subsystemMap[subsystem]);
    });

    return {
      areaToSubsystems: processedAreaMap,
      subsystemToAreas: processedSubsystemMap
    };
  }, [data]);

  const resetFilters = () => {
    onFilterChange('area', '');
    onFilterChange('subsystem', '');
  };

  // Memoize options to prevent unnecessary recalculations
  const areaOptions = useMemo(() => {
    return areas.map(area => ({
      label: area,
      value: area,
      isDisabled:
        filters.subsystem &&
        !subsystemToAreas[filters.subsystem]?.includes(area),
      isHighlighted:
        filters.subsystem &&
        subsystemToAreas[filters.subsystem]?.includes(area),
    }));
  }, [areas, filters.subsystem, subsystemToAreas]);

  const subsystemOptions = useMemo(() => {
    return subsystems.map(subsystem => ({
      label: subsystem,
      value: subsystem,
      isDisabled:
        filters.area &&
        !areaToSubsystems[filters.area]?.includes(subsystem),
      isHighlighted:
        filters.area &&
        areaToSubsystems[filters.area]?.includes(subsystem),
    }));
  }, [subsystems, filters.area, areaToSubsystems]);

  const customStyles = {
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected
        ? '#68D391' // green.300
        : state.data.isHighlighted
        ? '#C6F6D5' // green.100
        : undefined,
      color: state.isDisabled ? '#A0AEC0' : '#1A202C', // gray.600 or default
      cursor: state.isDisabled ? 'not-allowed' : 'default',
    }),
    control: (provided, state) => ({
      ...provided,
      backgroundColor:
        state.selectProps.name === 'area'
          ? filters.area
            ? '#68D391'
            : filters.subsystem
            ? '#C6F6D5'
            : '#EDF2F7'
          : filters.subsystem
          ? '#68D391'
          : filters.area
          ? '#C6F6D5'
          : '#EDF2F7',
      borderColor: state.isFocused ? '#319795' : '#CBD5E0',
      boxShadow: state.isFocused ? '0 0 0 1px #319795' : undefined,
    }),
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
            name="area"
            placeholder="All Areas"
            value={
              filters.area
                ? { label: filters.area, value: filters.area }
                : null
            }
            onChange={(option) =>
              onFilterChange('area', option ? option.value : '')
            }
            options={areaOptions}
            isClearable
            styles={customStyles}
            isSearchable
            menuPortalTarget={document.body}
          />
          {filters.area && (
            <Text fontSize="xs" color="green.600" mt={1}>
              Showing {areaToSubsystems[filters.area]?.length || 0} related
              subsystems
            </Text>
          )}
        </FormControl>

        <FormControl>
          <FormLabel>Subsystem</FormLabel>
          <Select
            name="subsystem"
            placeholder="All Subsystems"
            value={
              filters.subsystem
                ? { label: filters.subsystem, value: filters.subsystem }
                : null
            }
            onChange={(option) =>
              onFilterChange('subsystem', option ? option.value : '')
            }
            options={subsystemOptions}
            isClearable
            styles={customStyles}
            isSearchable
            menuPortalTarget={document.body}
          />
          {filters.subsystem && (
            <Text fontSize="xs" color="green.600" mt={1}>
              Showing {subsystemToAreas[filters.subsystem]?.length || 0}{' '}
              related areas
            </Text>
          )}
        </FormControl>
      </Stack>
    </Box>
  );
};

export default FilterPanel;