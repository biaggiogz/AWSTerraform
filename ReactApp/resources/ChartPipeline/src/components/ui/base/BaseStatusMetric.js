import React, { useMemo, useState, useCallback } from 'react';
import { Box, Text, VStack, HStack, Divider, Button } from '@chakra-ui/react';

/**
 * Base component for status metric cards with shared logic
 * @param {Object} props - Component props
 * @param {Array} props.data - Dataset to analyze
 * @param {string} props.title - Metric card title
 * @param {Object} props.dataFields - Field mappings { total: 'field_name', done: 'field_name' }
 * @param {Object} props.colors - Color scheme { bg: '#color', hover: '#color', selected: '#color' }
 * @param {Function} props.onSubsystemFilter - Filter callback function
 * @param {string} props.minWidth - Minimum width (default: '220px')
 * @param {boolean} props.showProcessTypes - Whether to show Process/No Process breakdown (default: true)
 */
const BaseStatusMetric = ({ 
  data, 
  title,
  dataFields,
  colors,
  onSubsystemFilter,
  minWidth = '220px',
  showProcessTypes = true
}) => {
  const [activeFilter, setActiveFilter] = useState(null);

  const metrics = useMemo(() => {
    if (!data || data.length === 0) return {
      subsystems: 0,
      processSubsystems: 0,
      noProcessSubsystems: 0,
      processDone: 0,
      noProcessDone: 0,
      processPending: 0,
      noProcessPending: 0,
      validRows: []
    };
    
    // Filter valid rows based on data fields
    const validRows = data.filter(row => 
      row[dataFields.total] > 0 && row.subsystem !== 'AR-9000-01'
    );
    
    const subsystems = validRows.length;
    
    // Count by type_1 if showProcessTypes is enabled
    const processSubsystems = showProcessTypes ? 
      validRows.filter(row => row.type_1 === 'PROCESS ').length : 0;
    const noProcessSubsystems = showProcessTypes ? 
      validRows.filter(row => row.type_1 === 'NO PROCESS').length : 0;
    
    // Done by type_1
    const processDone = showProcessTypes ? validRows.reduce((count, row) => {
      if (row.type_1 === 'PROCESS ' && row[dataFields.total] > 0 && 
          row[dataFields.total] === row[dataFields.done]) {
        return count + 1;
      }
      return count;
    }, 0) : 0;
    
    const noProcessDone = showProcessTypes ? validRows.reduce((count, row) => {
      if (row.type_1 === 'NO PROCESS' && row[dataFields.total] > 0 && 
          row[dataFields.total] === row[dataFields.done]) {
        return count + 1;
      }
      return count;
    }, 0) : 0;
    
    // Pending by type_1
    const processPending = showProcessTypes ? validRows.reduce((count, row) => {
      if (row.type_1 === 'PROCESS ' && row[dataFields.total] > 0 && 
          row[dataFields.total] !== row[dataFields.done]) {
        return count + 1;
      }
      return count;
    }, 0) : 0;
    
    const noProcessPending = showProcessTypes ? validRows.reduce((count, row) => {
      if (row.type_1 === 'NO PROCESS' && row[dataFields.total] > 0 && 
          row[dataFields.total] !== row[dataFields.done]) {
        return count + 1;
      }
      return count;
    }, 0) : 0;
    
    return {
      subsystems,
      processSubsystems,
      noProcessSubsystems,
      processDone,
      noProcessDone,
      processPending,
      noProcessPending,
      validRows
    };
  }, [data, dataFields, showProcessTypes]);

  const createFilterHandler = useCallback((filterType, filterLogic) => {
    return () => {
      if (activeFilter === filterType) {
        setActiveFilter(null);
        onSubsystemFilter && onSubsystemFilter([]);
      } else {
        const filteredSubsystems = metrics.validRows
          .filter(filterLogic)
          .map(row => row.subsystem);
        setActiveFilter(filterType);
        onSubsystemFilter && onSubsystemFilter(filteredSubsystems);
      }
    };
  }, [activeFilter, metrics.validRows, onSubsystemFilter]);

  // Filter handlers
  const handleSubsystemsClick = createFilterHandler('subsystems', () => true);
  
  const handleProcessClick = createFilterHandler('process', 
    row => row.type_1 === 'PROCESS ');
  
  const handleNoProcessClick = createFilterHandler('noprocess', 
    row => row.type_1 === 'NO PROCESS');
  
  const handleProcessDoneClick = createFilterHandler('processDone', 
    row => row.type_1 === 'PROCESS ' && row[dataFields.total] === row[dataFields.done] && row[dataFields.total] > 0);
  
  const handleProcessPendingClick = createFilterHandler('processPending', 
    row => row.type_1 === 'PROCESS ' && row[dataFields.done] < row[dataFields.total] && row[dataFields.total] > 0);
  
  const handleNoProcessDoneClick = createFilterHandler('noProcessDone', 
    row => row.type_1 === 'NO PROCESS' && row[dataFields.total] === row[dataFields.done] && row[dataFields.total] > 0);
  
  const handleNoProcessPendingClick = createFilterHandler('noProcessPending', 
    row => row.type_1 === 'NO PROCESS' && row[dataFields.done] < row[dataFields.total] && row[dataFields.total] > 0);

  const getButtonStyle = (filterType) => ({
    bg: activeFilter === filterType ? (colors.selected || '#113F67') : colors.bg,
    color: 'white',
    fontSize: 'sm',
    variant: 'unstyled',
    _hover: { bg: colors.hover }
  });

  return (
    <Box
      bg={colors.bg}
      border={`3px solid ${colors.bg}`}
      borderRadius="lg"
      minW={minWidth}
      boxShadow="md"
    >
      <VStack spacing={0} divider={<Divider borderColor="white" />}>
        <Box p={1} textAlign="center" width="100%">
          <Text fontSize="sm" fontWeight="bold" color="white">
            {title}
          </Text>
        </Box>
        
        <Button
          p={1}
          textAlign="center"
          width="100%"
          {...getButtonStyle('subsystems')}
          onClick={handleSubsystemsClick}
        >
          Subsystems: {metrics.subsystems}
        </Button>
        
        {showProcessTypes && (
          <>
            <HStack spacing={0} width="100%" divider={<Divider orientation="vertical" borderColor="white" />}>
              <Button
                p={1}
                textAlign="center"
                flex={1}
                {...getButtonStyle('process')}
                onClick={handleProcessClick}
              >
                Process: {metrics.processSubsystems}
              </Button>
              <Button
                p={1}
                textAlign="center"
                flex={1}
                {...getButtonStyle('noprocess')}
                onClick={handleNoProcessClick}
              >
                No Process: {metrics.noProcessSubsystems}
              </Button>
            </HStack>
            
            <HStack spacing={0} width="100%" divider={<Divider orientation="vertical" borderColor="white" />}>
              <Button
                p={1}
                textAlign="center"
                flex={1}
                {...getButtonStyle('processDone')}
                onClick={handleProcessDoneClick}
              >
                Done: {metrics.processDone}
              </Button>
              <Button
                p={1}
                textAlign="center"
                flex={1}
                {...getButtonStyle('noProcessDone')}
                onClick={handleNoProcessDoneClick}
              >
                Done: {metrics.noProcessDone}
              </Button>
            </HStack>
            
            <HStack spacing={0} width="100%" divider={<Divider orientation="vertical" borderColor="white" />}>
              <Button
                p={1}
                textAlign="center"
                flex={1}
                {...getButtonStyle('processPending')}
                onClick={handleProcessPendingClick}
              >
                Pending: {metrics.processPending}
              </Button>
              <Button
                p={1}
                textAlign="center"
                flex={1}
                {...getButtonStyle('noProcessPending')}
                onClick={handleNoProcessPendingClick}
              >
                Pending: {metrics.noProcessPending}
              </Button>
            </HStack>
          </>
        )}
      </VStack>
    </Box>
  );
};

export default BaseStatusMetric;