import React, { useMemo } from 'react';
import { 
  Box, 
  Text, 
  Tooltip,
  Flex,
  VStack,
  HStack,
  Button,
  useBreakpointValue
} from '@chakra-ui/react';

/**
 * GlobalMetricsDisplay component shows unfiltered global metrics
 * @param {Object} props - Component props
 * @param {Array} props.data - Raw unfiltered dataset from CSV
 * @param {Function} props.onProgressFilter - Function to handle progress filtering
 * @param {string} props.progressFilter - Current progress filter
 * @param {string} props.sortField - Current sort field
 * @param {string} props.sortDirection - Current sort direction
 * @param {Function} props.onSortChange - Function to handle sort changes
 */
const GlobalMetricsDisplay = ({ data, onProgressFilter, progressFilter, sortField, sortDirection, onSortChange }) => {
  // Calculate global metrics using the raw unfiltered data
  const globalMetrics = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        totalLoopSignal: 0,
        loopSignalDone: 0,
        loopSignalPending: 0,
        dossierCompleted: 0
      };
    }
    
    let totalLoopSignal = 0;
    let loopSignalDone = 0;
    let loopSignalPending = 0;
    let dossierCompleted = 0;
    
    // Single pass through the entire dataset (unfiltered)
    data.forEach(item => {
      // Count every loop (TOTAL LOOP Signal)
      totalLoopSignal++;
      
      // Process OK value
      const okValue = item['OK=100%']?.toString().replace('%', '').trim();
      const okPercent = parseFloat(okValue) || 0;
      
      // LOOP (Signal) DONE: OK=100%
      if (okPercent === 100) {
        loopSignalDone++;
      }
      
      // LOOP (Signal) PENDING: OK<100%
      if (okPercent < 100) {
        loopSignalPending++;
      }
      
      // DOSSIER COMPLETED: non-null DOSSIER
      if (item['DOSSIER'] && item['DOSSIER'].toString().trim() !== '') {
        dossierCompleted++;
      }
    });
    
    return {
      totalLoopSignal,
      loopSignalDone,
      loopSignalPending,
      dossierCompleted
    };
  }, [data]);
  
  // Responsive layout - stack on smaller screens
  const direction = useBreakpointValue({ base: 'column', md: 'row' });
  const spacing = useBreakpointValue({ base: 0.5, md: 1.5 });
  
  // Metric items with colors matching the chart legend
  const metricItems = [
    {
      label: 'TOTAL LOOP (Signal)',
      value: globalMetrics.totalLoopSignal,
      color: '#C4E1E6',
      bgColor: 'rgba(196, 225, 230, 1)',
      sortField: 'totalLoops'
    },
    {
      label: 'LOOP (Signal) DONE',
      value: globalMetrics.loopSignalDone,
      color: '#1DE9B6',
      bgColor: 'rgba(29, 233, 182, 1)',
      sortField: 'loopSignalDone'
    },
    {
      label: 'LOOP (Signal) PENDING',
      value: globalMetrics.loopSignalPending,
      color: '#FF168B',
      bgColor: 'rgba(255, 22, 139, 1)',
      sortField: 'loopsSignalPending'
    },
    {
      label: 'DOSSIER COMPLETED',
      value: globalMetrics.dossierCompleted,
      color: '#D7A0C3',
      bgColor: 'rgba(215, 160, 195, 0.1)',
      sortField: 'dossierCompleted'
    }
  ];
  
  // Handle metric button click for filtering
  const handleMetricClick = (metricLabel) => {
    if (onProgressFilter) {
      // Toggle filter: if same metric is clicked, clear filter; otherwise set new filter
      const newFilter = progressFilter === metricLabel ? null : metricLabel;
      onProgressFilter(newFilter);
    }
  };
  
  // Handle sort button click
  const handleSortClick = (metricSortField) => {
    if (onSortChange) {
      if (sortField === metricSortField) {
        // Toggle direction if clicking the same field
        onSortChange(metricSortField, sortDirection === 'desc' ? 'asc' : 'desc');
      } else {
        // Set new field and default to descending
        onSortChange(metricSortField, 'desc');
      }
    }
  };
  
  return (
    <VStack spacing={2} mb={4} align="stretch">
      <Tooltip
        label="Global Total - These values represent the entire dataset and are not affected by any filters"
        placement="top"
        hasArrow
      >
        <Text fontSize="xs" color="gray.600" cursor="help" textAlign="center">
          📊 Global Metrics
        </Text>
      </Tooltip>
      
      <Flex 
        direction="row" 
        wrap="wrap" 
        gap={4}
        justify="center"
        align="flex-start"
      >
        {metricItems.map((metric, index) => (
          <VStack key={index} spacing={1} align="center" minW="140px">
            {/* Metric Button with Sort Button */}
            <HStack spacing={1}>
              <Button
                size="sm"
                variant={progressFilter === metric.label ? "solid" : "outline"}
                borderColor={metric.color}
                color={progressFilter === metric.label ? "white" : "black"}
                bg={progressFilter === metric.label ? metric.color : metric.bgColor}
                _hover={{
                  bg: metric.color,
                  color: "black"
                }}
                fontSize="xs"
                fontWeight="medium"
                px={2}
                py={1}
                height="auto"
                whiteSpace="normal"
                textAlign="center"
                minH="32px"
                onClick={() => handleMetricClick(metric.label)}
                cursor="pointer"
              >
                {metric.label}
              </Button>
              
              {/* Sort Button */}
              <Button
                size="xs"
                variant={sortField === metric.sortField ? "solid" : "outline"}
                colorScheme={sortField === metric.sortField ? "blue" : "gray"}
                onClick={() => handleSortClick(metric.sortField)}
                minW="24px"
                h="24px"
                p={0}
              >
                {sortField === metric.sortField && (sortDirection === 'desc' ? '↓' : '↑')}
                {sortField !== metric.sortField && '↓'}
              </Button>
            </HStack>
            
            {/* Global Metric Value */}
            <Text 
              fontSize="lg" 
              fontWeight="bold" 
              color={metric.color}
              textAlign="center"
            >
              {metric.value.toLocaleString()}
            </Text>
          </VStack>
        ))}
      </Flex>
      
      {/* Show All Metrics button when a filter is active */}
      {progressFilter && (
        <Flex justify="center" mt={2}>
          <Button
            size="sm"
            colorScheme="green"
            variant="outline"
            onClick={() => handleMetricClick(progressFilter)}
          >
            Show All Metrics
          </Button>
        </Flex>
      )}
    </VStack>
  );
};

export default React.memo(GlobalMetricsDisplay);