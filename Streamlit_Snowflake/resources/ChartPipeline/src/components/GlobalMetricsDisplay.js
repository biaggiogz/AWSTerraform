import React, { useMemo } from 'react';
import { 
  Box, 
  Text, 
  Tooltip,
  Flex,
  useBreakpointValue
} from '@chakra-ui/react';

/**
 * GlobalMetricsDisplay component shows unfiltered global metrics
 * @param {Object} props - Component props
 * @param {Array} props.data - Raw unfiltered dataset from CSV
 */
const GlobalMetricsDisplay = ({ data }) => {
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
      color: '#FFB4A2',
      bgColor: 'rgba(255, 180, 162, 0.1)'
    },
    {
      label: 'LOOP (Signal) DONE',
      value: globalMetrics.loopSignalDone,
      color: '#3B4CCA',
      bgColor: 'rgba(59, 76, 202, 0.1)'
    },
    {
      label: 'LOOP (Signal) PENDING',
      value: globalMetrics.loopSignalPending,
      color: '#AEE6F9',
      bgColor: 'rgba(174, 230, 249, 0.1)'
    },
    {
      label: 'DOSSIER COMPLETED',
      value: globalMetrics.dossierCompleted,
      color: '#D7A0C3',
      bgColor: 'rgba(215, 160, 195, 0.1)'
    }
  ];
  
  return (
      <Flex direction="row" align="flex-start" gap={4} mb={4}>
        <Tooltip
            label="Global Total - These values represent the entire dataset and are not affected by any filters"
            placement="top"
            hasArrow
        >
          <Text fontSize="xs" color="gray.600" cursor="help" whiteSpace="nowrap">
            📊 Global Metrics
          </Text>
        </Tooltip>
      
      <Flex 
        direction={direction} 
        spacing={spacing} 
        wrap="wrap" 
        gap={spacing}
        justify="flex-start"
        align="flex-start"
      >
        {metricItems.map((metric, index) => (
          <Box
            key={index}
            bg={metric.bgColor}
            border="1px solid"
            borderColor={metric.color}
            borderRadius="md"
            px={1}
            py={1}
            minW="140px"
            textAlign="left"
          >
            {/*<Text fontSize="xs" color="gray.600" fontWeight="medium">*/}
            {/*  {metric.label}*/}
            {/*</Text>*/}
            {/*<Text */}
            {/*  fontSize="lg" */}
            {/*  fontWeight="bold" */}
            {/*  color={metric.color}*/}
            {/*  mt={1}*/}
            {/*>*/}
            {/*  {metric.value.toLocaleString()}*/}
            {/*</Text>*/}
            <Text fontSize="10px" color="gray.600" fontWeight="medium">
              {metric.label} : <Text as="span" fontWeight="bold" color={metric.color}>{metric.value.toLocaleString()}</Text>
            </Text>
          </Box>
        ))}
      </Flex>
      </Flex>
  );
};

export default React.memo(GlobalMetricsDisplay);