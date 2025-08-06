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
        dossierCompleted: 0,
        testLoopSignalDone: 0,
        loopSignalPending: 0
      };
    }
    
    let totalLoopSignal = 0;
    let loopSignalDone = 0;
    let dossierCompleted = 0;
    let testLoopSignalDone = 0;
    let loopSignalPending = 0;
    let sumOK100 = 0;

    
    // Single pass through the entire dataset (unfiltered)
    data.forEach(item => {
      // Count every loop (TOTAL LOOP Signal)
      totalLoopSignal++;
      
      // Process OK value - using the correct field name
      const okValue = item['OK100'];
      const okPercent = parseFloat(okValue) || 0;
      
      // Sum OK100 values for advance progress
      sumOK100 += okPercent;
      
      // LOOP (Signal) DONE: OK100 = 1.0 (100%)
      if (okPercent === 1.0) {
        loopSignalDone++;
      }
      
      // LOOP (Signal) PENDING: OK100 < 1.0 (less than 100%)
      if (okPercent < 1.0) {
        loopSignalPending++;
      }
      
      // DOSSIER COMPLETED: non-null DOSSIER
      if (item['DOSSIER'] && item['DOSSIER'].toString().trim() !== '') {
        dossierCompleted++;
      }
      
      // TEST LOOP (Signal) DONE: non-null TEST_LOOP
      if (item['TEST_LOOP'] && item['TEST_LOOP'].toString().trim() !== '') {
        testLoopSignalDone++;
      }
    });
    
    return {
      totalLoopSignal,
      testLoopSignalDone,
      loopSignalDone,
      loopSignalPending,
      dossierCompleted,
      sumOK100
    };
  }, [data]);
  
  // Responsive layout - stack on smaller screens
  const direction = useBreakpointValue({ base: 'column', md: 'row' });
  const spacing = useBreakpointValue({ base: 0.5, md: 1.5 });
  
  // Metric items with colors matching the chart legend
  const metricItems = [
    {
      label: 'TOTAL LOOP (signals)',
      value: globalMetrics.totalLoopSignal,
      color: '#213448',
      bgColor: 'rgba(33, 52, 72, 1)',
      sortField: 'totalLoops'
    },
    {
      label: 'TEST LOOP DONE (signals)',
      value: globalMetrics.testLoopSignalDone,
      color: '#00809D',
      bgColor: 'rgba(0, 128, 157, 1)',
      sortField: 'testLoopSignalDone'
    },
    {
      label: 'DOSSIER COMPLETED',
      value: globalMetrics.dossierCompleted,
      color: '#57564F',
      bgColor: 'rgba(87, 86, 79, 1)',
      sortField: 'dossierCompleted'
    },
      //
    {
      label: 'LOOP (signals) CONSTRUCTION DONE',
      value: globalMetrics.loopSignalDone,
      color:  '#386641',
      bgColor: 'rgba(56, 102, 65, 1)',
      sortField: 'loopSignalDone'
    },
    {
      label: 'LOOP (Signals) PENDING',
      value: globalMetrics.loopSignalPending,
      color: '#F97A00',
      bgColor: 'rgba(249, 122, 0, 1)',
      sortField: 'loopsSignalPending'
    },


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
          <VStack 
            key={index} 
            spacing={1} 
            align="center" 
            minW="140px"
            opacity={progressFilter && progressFilter !== metric.label ? 0.3 : 1}
            transition="opacity 0.2s"
          >
            {/* Metric Button with Sort Button */}
            <HStack spacing={1}>
              <Button
                size="sm"
                variant={progressFilter === metric.label ? "solid" : "outline"}
                borderColor={metric.color}
                color="white"
                bg={progressFilter === metric.label ? metric.color : metric.bgColor}
                _hover={{
                  bg: metric.color,
                  color: "white"
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
      
      {/* Progress Bar Metrics */}
      <VStack spacing={3} mt={4} align="stretch">
        <Text fontSize="xs" color="gray.600" textAlign="center">
          📈 Progress Metrics
        </Text>
        
        {/* Loop Progress (Precom) */}
        <HStack spacing={3} align="center">
          <Text fontSize="sm" minW="200px" fontWeight="medium">
            Loop Progress (Precom):
          </Text>
          <Box flex={1} bg="gray.500" borderRadius="md" h="20px" border="1px solid black" position="relative">
            <Box
              bg="green.500"
              h="100%"
              borderRadius="md"
              w={`${globalMetrics.totalLoopSignal > 0 ? (globalMetrics.loopSignalDone / globalMetrics.totalLoopSignal) * 100 : 0}%`}
              border="1px solid black"
            />
            <Text
              position="absolute"
              top="50%"
              left="50%"
              transform="translate(-50%, -50%)"
              fontSize="xs"
              fontWeight="semibold"
              color="white"
              textShadow="1px 1px 1px rgba(0,0,0,0.8)"
            >
              {globalMetrics.totalLoopSignal > 0 ? ((globalMetrics.loopSignalDone / globalMetrics.totalLoopSignal) * 100).toFixed(1) : 0}%
            </Text>
          </Box>
        </HStack>
        
        {/* Loop Advance Progress (CNS) */}
        <HStack spacing={3} align="center">
          <Text fontSize="sm" minW="200px" fontWeight="medium">
            Loop Advance Progress (CNS):
          </Text>
          <Box flex={1} bg="gray.500" borderRadius="md" h="20px" border="1px solid black" position="relative">
            <Box
              bg="green.500"
              h="100%"
              borderRadius="md"
              w={`${globalMetrics.totalLoopSignal > 0 ? (globalMetrics.sumOK100 / globalMetrics.totalLoopSignal) * 100 : 0}%`}
              border="1px solid black"
            />
            <Text
              position="absolute"
              top="50%"
              left="50%"
              transform="translate(-50%, -50%)"
              fontSize="xs"
              fontWeight="semibold"
              color="white"
              textShadow="1px 1px 1px rgba(0,0,0,0.8)"
            >
              {globalMetrics.totalLoopSignal > 0 ? ((globalMetrics.sumOK100 / globalMetrics.totalLoopSignal) * 100).toFixed(1) : 0}%
            </Text>
          </Box>
        </HStack>
        
        {/* Loop Checked Progress */}
        <HStack spacing={3} align="center">
          <Text fontSize="sm" minW="200px" fontWeight="medium">
            Loop Checked Progress:
          </Text>
          <Box flex={1} bg="gray.500" borderRadius="md" h="20px" border="1px solid black" position="relative">
            <Box
              bg="green.500"
              h="100%"
              borderRadius="md"
              w={`${globalMetrics.totalLoopSignal > 0 ? (globalMetrics.testLoopSignalDone / globalMetrics.totalLoopSignal) * 100 : 0}%`}
              border="1px solid black"
            />
            <Text
              position="absolute"
              top="50%"
              left="50%"
              transform="translate(-50%, -50%)"
              fontSize="xs"
              fontWeight="semibold"
              color="white"
              textShadow="1px 1px 1px rgba(0,0,0,0.8)"
            >
              {globalMetrics.totalLoopSignal > 0 ? ((globalMetrics.testLoopSignalDone / globalMetrics.totalLoopSignal) * 100).toFixed(1) : 0}%
            </Text>
          </Box>
        </HStack>
      </VStack>
    </VStack>
  );
};

export default React.memo(GlobalMetricsDisplay);