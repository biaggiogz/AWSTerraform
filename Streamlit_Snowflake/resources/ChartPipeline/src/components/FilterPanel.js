import React, { useState, useEffect } from 'react';
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
  const [areaToSubsystems, setAreaToSubsystems] = useState({});
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
        if (!areaMap[area]) areaMap[area] = new Set();
        areaMap[area].add(subsystem);

        if (!subsystemMap[subsystem]) subsystemMap[subsystem] = new Set();
        subsystemMap[subsystem].add(area);
      }
    });

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

  const resetFilters = () => {
    onFilterChange('area', '');
    onFilterChange('subsystem', '');
  };

  const getAreaOptions = () => {
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
  };

  const getSubsystemOptions = () => {
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
  };

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
            options={getAreaOptions()}
            isClearable
            styles={customStyles}
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
            options={getSubsystemOptions()}
            isClearable
            styles={customStyles}
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
