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
  Badge,
} from '@chakra-ui/react';
import { RepeatIcon } from '@chakra-ui/icons';
import Select from 'react-select';

const FilterPanel = ({
  areas,
  subsystems,
  multiFilters,
  onFilterChange,
  filterMappings,
  progressFilter,
  onResetAll,
  metadata,
  relationshipMaps,
}) => {
  const getAreaLabel = () => {
    if (filterMappings && filterMappings.area) {
      if (filterMappings.area === 'Area') return 'Area';
      if (filterMappings.area === 'TEST PACK') return 'Test Pack';
      return 'Design Area';
    }
    if (filterMappings && filterMappings.isometric) {
      return 'Isometric';
    }
    return 'Design Area';
  };
  
  const getSubsystemLabel = () => {
    if (filterMappings && filterMappings.subsystem) {
      return filterMappings.subsystem === 'SUBS_PRE' ? 'Subsystem' : 'Subsystem';
    }
    return 'Subsystem';
  };

  const areaValues = useMemo(() => {
    const areaField = filterMappings?.area || filterMappings?.isometric || 'Area';
    return multiFilters[areaField] || [];
  }, [multiFilters, filterMappings]);

  const subsystemValues = useMemo(() => {
    const subsystemField = filterMappings?.subsystem || 'SUBSYSTEM';
    return multiFilters[subsystemField] || [];
  }, [multiFilters, filterMappings]);

  const areaOptions = useMemo(() => {
    return areas.map(area => {
      let isDisabled = false;
      if (subsystemValues.length > 0 && relationshipMaps) {
        const mapKey = `${filterMappings.subsystem}To${filterMappings.area}`;
        const relatedAreas = new Set();
        
        subsystemValues.forEach(subsystem => {
          if (relationshipMaps[mapKey] && relationshipMaps[mapKey][subsystem]) {
            relationshipMaps[mapKey][subsystem].forEach(relatedArea => {
              relatedAreas.add(relatedArea);
            });
          }
        });
        
        isDisabled = !relatedAreas.has(area);
      }
      
      return {
        label: area,
        value: area,
        isDisabled,
      };
    });
  }, [areas, subsystemValues, relationshipMaps, filterMappings]);

  const subsystemOptions = useMemo(() => {
    return subsystems.map(subsystem => {
      let isDisabled = false;
      if (areaValues.length > 0 && relationshipMaps) {
        const mapKey = `${filterMappings.area}To${filterMappings.subsystem}`;
        const relatedSubsystems = new Set();
        
        areaValues.forEach(area => {
          if (relationshipMaps[mapKey] && relationshipMaps[mapKey][area]) {
            relationshipMaps[mapKey][area].forEach(relatedSubsystem => {
              relatedSubsystems.add(relatedSubsystem);
            });
          }
        });
        
        isDisabled = !relatedSubsystems.has(subsystem);
      }
      
      return {
        label: subsystem,
        value: subsystem,
        isDisabled,
      };
    });
  }, [subsystems, areaValues, relationshipMaps, filterMappings]);

  const customStyles = {
    multiValue: (provided) => ({
      ...provided,
      backgroundColor: '#68D391',
    }),
    multiValueLabel: (provided) => ({
      ...provided,
      color: '#1A202C',
    }),
    multiValueRemove: (provided) => ({
      ...provided,
      color: '#1A202C',
      ':hover': {
        backgroundColor: '#38A169',
        color: 'white',
      },
    }),
    control: (provided) => ({
      ...provided,
      backgroundColor: '#EDF2F7',
      borderColor: '#CBD5E0',
      boxShadow: 'none',
      ':hover': {
        borderColor: '#319795',
      },
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected
        ? '#68D391'
        : state.isFocused
        ? '#C6F6D5'
        : undefined,
      color: state.isDisabled ? '#A0AEC0' : '#1A202C',
      cursor: state.isDisabled ? 'not-allowed' : 'default',
    }),
    menuPortal: (provided) => ({
      ...provided,
      zIndex: 9999
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
      zIndex="100"
    >
      <HStack justify="space-between" mb={4}>
        <Heading size="md">Filters</Heading>
        <Button
          size="sm"
          leftIcon={<RepeatIcon />}
          colorScheme="blue"
          variant="outline"
          onClick={onResetAll}
        >
          Reset
        </Button>
      </HStack>



      <Stack spacing={4}>
        <FormControl>
          <FormLabel>{getAreaLabel()}</FormLabel>
          <Select
            isMulti
            name="area"
            placeholder={filterMappings && filterMappings.area === 'TEST PACK' ? "Select Test Packs" : filterMappings && filterMappings.isometric ? "Select Isometrics" : "Select Areas"}
            value={areaValues.map(value => ({ label: value, value }))}
            onChange={(options) => {
              const values = options ? options.map(option => option.value) : [];
              const filterKey = filterMappings?.area ? 'area' : 'isometric';
              onFilterChange(filterKey, values);
            }}
            options={areaOptions}
            styles={customStyles}
            isSearchable
            closeMenuOnSelect={false}
            menuPortalTarget={document.body}
          />
          {areaValues.length > 0 && (
            <Text fontSize="xs" color="green.600" mt={1}>
              Selected {areaValues.length} {getAreaLabel().toLowerCase()}
              {areaValues.length !== 1 ? 's' : ''}
            </Text>
          )}
        </FormControl>

        <FormControl>
          <FormLabel>{getSubsystemLabel()}</FormLabel>
          <Select
            isMulti
            name="subsystem"
            placeholder="Select Subsystems"
            value={subsystemValues.map(value => ({ label: value, value }))}
            onChange={(options) => {
              const values = options ? options.map(option => option.value) : [];
              onFilterChange('subsystem', values);
            }}
            options={subsystemOptions}
            styles={customStyles}
            isSearchable
            closeMenuOnSelect={false}
            menuPortalTarget={document.body}
          />
          {subsystemValues.length > 0 && (
            <Text fontSize="xs" color="green.600" mt={1}>
              Selected {subsystemValues.length} subsystem
              {subsystemValues.length !== 1 ? 's' : ''}
            </Text>
          )}
        </FormControl>
      </Stack>
    </Box>
  );
};

export default FilterPanel;