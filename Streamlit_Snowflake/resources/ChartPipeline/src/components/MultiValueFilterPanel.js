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

/**
 * Multi-value filter panel component
 * 
 * @param {Object} props - Component props
 * @param {Array} props.areas - Available area options
 * @param {Array} props.subsystems - Available subsystem options
 * @param {Object} props.multiFilters - Current multi-value filter selections
 * @param {Function} props.onFilterChange - Handler for filter changes
 * @param {Object} props.filterMappings - Mappings for filter fields
 * @param {string} props.progressFilter - Current progress filter
 * @param {Function} props.onResetAll - Handler for resetting all filters
 * @param {Object} props.metadata - Filter metadata (counts, etc.)
 * @param {Object} props.relationshipMaps - Maps of relationships between filter fields
 */
const MultiValueFilterPanel = ({
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
  // Get the appropriate labels for the filter fields based on the current mappings
  const getAreaLabel = () => {
    if (filterMappings && filterMappings.area) {
      if (filterMappings.area === 'Area') return 'Area';
      if (filterMappings.area === 'TEST PACK') return 'Test Pack';
      return 'Design Area';
    }
    return 'Design Area';
  };
  
  const getSubsystemLabel = () => {
    if (filterMappings && filterMappings.subsystem) {
      return filterMappings.subsystem === 'SUBS_PRE' ? 'Subsystem' : 'Subsystem';
    }
    return 'Subsystem';
  };

  // Get the current values for each filter
  const areaValues = useMemo(() => {
    const areaField = filterMappings?.area || 'Area';
    return multiFilters[areaField] || [];
  }, [multiFilters, filterMappings]);

  const subsystemValues = useMemo(() => {
    const subsystemField = filterMappings?.subsystem || 'SUBSYSTEM';
    return multiFilters[subsystemField] || [];
  }, [multiFilters, filterMappings]);

  // Create options for the select components
  const areaOptions = useMemo(() => {
    return areas.map(area => {
      // Check if this area is related to any selected subsystems
      let isDisabled = false;
      if (subsystemValues.length > 0 && relationshipMaps) {
        const mapKey = `${filterMappings.subsystem}To${filterMappings.area}`;
        const relatedAreas = new Set();
        
        // Collect all areas related to any selected subsystem
        subsystemValues.forEach(subsystem => {
          if (relationshipMaps[mapKey] && relationshipMaps[mapKey][subsystem]) {
            relationshipMaps[mapKey][subsystem].forEach(relatedArea => {
              relatedAreas.add(relatedArea);
            });
          }
        });
        
        // Disable if not related to any selected subsystem
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
      // Check if this subsystem is related to any selected areas
      let isDisabled = false;
      if (areaValues.length > 0 && relationshipMaps) {
        const mapKey = `${filterMappings.area}To${filterMappings.subsystem}`;
        const relatedSubsystems = new Set();
        
        // Collect all subsystems related to any selected area
        areaValues.forEach(area => {
          if (relationshipMaps[mapKey] && relationshipMaps[mapKey][area]) {
            relationshipMaps[mapKey][area].forEach(relatedSubsystem => {
              relatedSubsystems.add(relatedSubsystem);
            });
          }
        });
        
        // Disable if not related to any selected area
        isDisabled = !relatedSubsystems.has(subsystem);
      }
      
      return {
        label: subsystem,
        value: subsystem,
        isDisabled,
      };
    });
  }, [subsystems, areaValues, relationshipMaps, filterMappings]);

  // Custom styles for the select components
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

      {/* Filter metadata */}
      {metadata && (
        <Box mb={4} p={3} bg="blue.50" borderRadius="md" border="1px solid" borderColor="blue.200">
          <Stack spacing={1}>
            <Text fontSize="sm" fontWeight="medium" color="blue.700">
              Showing {metadata.filteredCount} of {metadata.totalCount} items
            </Text>
            {progressFilter && (
              <Badge colorScheme="orange">Filter: {progressFilter}</Badge>
            )}
          </Stack>
        </Box>
      )}

      <Stack spacing={4}>
        {/* Area filter */}
        <FormControl>
          <FormLabel>{getAreaLabel()}</FormLabel>
          <Select
            isMulti
            name="area"
            placeholder={filterMappings && filterMappings.area === 'TEST PACK' ? "Select Test Packs" : "Select Areas"}
            value={areaValues.map(value => ({ label: value, value }))}
            onChange={(options) => {
              const values = options ? options.map(option => option.value) : [];
              onFilterChange('area', values);
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

        {/* Subsystem filter */}
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

export default MultiValueFilterPanel;