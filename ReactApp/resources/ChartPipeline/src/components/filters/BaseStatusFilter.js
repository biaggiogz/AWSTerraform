import React, { useMemo } from 'react';
import {
  Box,
  HStack,
  Text,
  VStack,
  Button,
  Tooltip,
  SimpleGrid,
  Divider,
  IconButton,
  Input
} from '@chakra-ui/react';
import { MdClose } from 'react-icons/md';
import ResizableDraggablePanel from '../ui/ResizableDraggablePanel';
import { useBaseStatusFilter } from './hooks/useBaseStatusFilter';

const BaseStatusFilter = ({ 
  data, 
  onFilterChange, 
  isVisible, 
  onClose,
  onPropagationChange,
  onBringToFront,
  title,
  dataFields,
  initialX = 1675,
  initialY = 450,
  statusLabels = {
    done: 'Done',
    pending: 'Pending',
    notapply: 'Not Apply'
  },
  tooltipLabels = {
    done: 'Click to show only done items',
    pending: 'Click to show only pending items',
    notapply: 'Click to show only not applicable items'
  }
}) => {
  const {
    exclusiveFilter,
    selectedSubsystems,
    searchTerm,
    setSearchTerm,
    filteredSubsystems,
    toggleExclusiveFilter,
    toggleSubsystem,
    toggleAllSubsystems,
    invertSubsystemSelection,
    getStatusColor
  } = useBaseStatusFilter({
    data,
    onFilterChange,
    onPropagationChange,
    dataFields,
    isVisible
  });

  const memoizedButtons = useMemo(() => 
    Object.entries(filteredSubsystems).map(([subsystem, metrics]) => {
      const status = metrics.status;
      const isSelected = selectedSubsystems[subsystem] || false;
      const isVisible = !exclusiveFilter ||
                      (exclusiveFilter === 'done' && status === 'Done') ||
                      (exclusiveFilter === 'pending' && status === 'Pending') ||
                      (exclusiveFilter === 'notapply' && status === 'Not Apply');

      return (
        <Button
          key={subsystem}
          size="sm"
          height="36px"
          variant={isSelected ? "solid" : "outline"}
          bg={isSelected ? getStatusColor(status) : "white"}
          borderColor={getStatusColor(status)}
          color={isSelected ? "white" : "black"}
          opacity={isVisible ? 1 : 0.5}
          onClick={() => toggleSubsystem(subsystem)}
          mb={1}
          _hover={{ bg: isSelected ? getStatusColor(status) : "gray.100" }}
        >
          <VStack spacing={0} align="center">
            <Text fontSize="xs" fontWeight="bold" noOfLines={1}>
              {subsystem}
            </Text>
          </VStack>
        </Button>
      );
    }), [filteredSubsystems, selectedSubsystems, exclusiveFilter, toggleSubsystem, getStatusColor]
  );
  
  if (!isVisible) return null;

  return (
    <ResizableDraggablePanel
      title={title}
      initialWidth={400}
      initialHeight={600}
      initialX={initialX}
      initialY={initialY}
      minWidth={350}
      minHeight={400}
      onBringToFront={onBringToFront}
    >
      <VStack spacing={2} align="stretch" p={3} height="100%">
        <HStack justify="flex-end" align="center">
          <IconButton
            icon={<MdClose />}
            size="sm"
            variant="ghost"
            onClick={onClose}
            aria-label="Close filter"
          />
        </HStack>

        <HStack spacing={4} justifyContent="center">
          <Tooltip label={tooltipLabels.done} placement="top">
            <HStack
              onClick={() => toggleExclusiveFilter('done')}
              cursor="pointer"
              p={1}
              borderRadius="md"
              bg={exclusiveFilter === 'done' ? "blue.50" : "transparent"}
              borderWidth="1px"
              borderColor={exclusiveFilter === 'done' ? "blue.300" : "transparent"}
              _hover={{ bg: "gray.100" }}
            >
              <Box width="15px" height="15px" bg="#06923E" borderWidth="1px" />
              <Text fontWeight={exclusiveFilter === 'done' ? "bold" : "normal"}>{statusLabels.done}</Text>
            </HStack>
          </Tooltip>

          <Tooltip label={tooltipLabels.pending} placement="top">
            <HStack
              onClick={() => toggleExclusiveFilter('pending')}
              cursor="pointer"
              p={1}
              borderRadius="md"
              bg={exclusiveFilter === 'pending' ? "blue.50" : "transparent"}
              borderWidth="1px"
              borderColor={exclusiveFilter === 'pending' ? "blue.300" : "transparent"}
              _hover={{ bg: "gray.100" }}
            >
              <Box width="15px" height="15px" bg="#E85C0D" borderWidth="1px" />
              <Text fontWeight={exclusiveFilter === 'pending' ? "bold" : "normal"}>{statusLabels.pending}</Text>
            </HStack>
          </Tooltip>

          <Tooltip label={tooltipLabels.notapply} placement="top">
            <HStack
              onClick={() => toggleExclusiveFilter('notapply')}
              cursor="pointer"
              p={1}
              borderRadius="md"
              bg={exclusiveFilter === 'notapply' ? "blue.50" : "transparent"}
              borderWidth="1px"
              borderColor={exclusiveFilter === 'notapply' ? "blue.300" : "transparent"}
              _hover={{ bg: "gray.100" }}
            >
              <Box width="15px" height="15px" bg="#212121" borderWidth="1px" />
              <Text fontWeight={exclusiveFilter === 'notapply' ? "bold" : "normal"} color="black">{statusLabels.notapply}</Text>
            </HStack>
          </Tooltip>
        </HStack>

        <HStack spacing={2}>
          <Button size="xs" colorScheme="blue" onClick={() => toggleAllSubsystems(true)}>Select All</Button>
          <Button size="xs" colorScheme="gray" onClick={() => toggleAllSubsystems(false)}>Clear All</Button>
          <Button size="xs" colorScheme="teal" onClick={invertSubsystemSelection}>Invert</Button>
        </HStack>

        <VStack spacing={2} align="stretch">
          <Box>
            <Text fontSize="xs" fontWeight="semibold" mb={1}>Search subsystems:</Text>
            <Input
              size="sm"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              bg="white"
            />
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

export default React.memo(BaseStatusFilter);