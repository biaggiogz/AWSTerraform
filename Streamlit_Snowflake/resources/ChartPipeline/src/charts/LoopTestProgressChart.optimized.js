import React, { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import { 
  Box, 
  Heading, 
  HStack, 
  Text, 
  VStack, 
  Flex, 
  Badge
} from '@chakra-ui/react';

/**
 * Optimized Stacked Bar Chart showing LOOP TEST PROGRESS by SUBS_PRE
 * @param {Object} props - Component props
 * @param {Array} props.data - Dataset from CSV
 */
const LoopTestProgressChart = ({ data }) => {
  // Calculate metrics with optimized processing
  const metrics = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    // Pre-process data for faster lookups
    const groupedData = {};
    
    // Single pass through data for all metrics
    data.forEach(item => {
      const subsPre = item['SUBS_PRE'];
      if (!subsPre) return;
      
      if (!groupedData[subsPre]) {
        groupedData[subsPre] = {
          totalLoops: 0,
          loopsConstructionDone: 0,
          dossierCompleted: 0,
          loopsDone: 0,
          loopsNotStartedConstruction: 0
        };
      }
      
      // Count this loop
      groupedData[subsPre].totalLoops++;
      
      // Process OK value once
      const okValue = item['OK=100%']?.toString().replace('%', '').trim();
      const okPercent = parseFloat(okValue);
      
      // Check metrics in a single pass
      if (okPercent === 100) {
        groupedData[subsPre].loopsConstructionDone++;
      }
      
      if (item['DOSSIER']) {
        groupedData[subsPre].dossierCompleted++;
      }
      
      if (item['TEST LOOP']) {
        groupedData[subsPre].loopsDone++;
      }
      
      if (okPercent === 0) {
        groupedData[subsPre].loopsNotStartedConstruction++;
      }
    });
    
    // Convert to array format for chart and sort by total loops
    return Object.entries(groupedData)
      .map(([subsPre, values]) => ({
        subsPre,
        ...values
      }))
      .sort((a, b) => b.totalLoops - a.totalLoops);
  }, [data]);
  
  // Prepare chart data with memoization
  const chartData = useMemo(() => {
    return {
      labels: metrics.map(item => item.subsPre),
      datasets: [
        {
          label: 'LOOPS NOT STARTED CONSTRUCTION',
          data: metrics.map(item => item.loopsNotStartedConstruction),
          backgroundColor: '#AEE6F9', // Light Blue
          borderColor: '#99D5E8',
          borderWidth: 1,
        },
        {
          label: 'LOOPS DONE',
          data: metrics.map(item => item.loopsDone),
          backgroundColor: '#3B4CCA', // Blue
          borderColor: '#2A3BB9',
          borderWidth: 1,
        },
        {
          label: 'DOSSIER COMPLETED',
          data: metrics.map(item => item.dossierCompleted),
          backgroundColor: '#D7A0C3', // Pink
          borderColor: '#C68FB2',
          borderWidth: 1,
        },
        {
          label: 'LOOPS CONSTRUCTION DONE',
          data: metrics.map(item => item.loopsConstructionDone),
          backgroundColor: '#E7D1B0', // Beige
          borderColor: '#D6C09F',
          borderWidth: 1,
        }
      ]
    };
  }, [metrics]);
  
  // Chart options with memoization
  const options = useMemo(() => {
    return {
      indexAxis: 'y', // Horizontal bar chart
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 500 // Reduced animation time for better performance
      },
      plugins: {
        legend: {
          display: false, // We'll create a custom legend
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const label = context.dataset.label || '';
              const value = context.raw || 0;
              return `${label}: ${value}`;
            },
            footer: (tooltipItems) => {
              const index = tooltipItems[0].dataIndex;
              const subsPre = metrics[index].subsPre;
              const total = metrics[index].totalLoops;
              return `TOTAL LOOPS: ${total}`;
            }
          },
          enabled: true,
          mode: 'index',
          intersect: false
        }
      },
      scales: {
        x: {
          stacked: true,
          title: {
            display: true,
            text: 'Number of Loops'
          },
          ticks: {
            maxTicksLimit: 10 // Limit the number of ticks for better performance
          }
        },
        y: {
          stacked: true,
          title: {
            display: true,
            text: 'SUBS_PRE'
          }
        }
      }
    };
  }, [metrics]);

  // Custom legend items - memoized to prevent unnecessary re-renders
  const legendItems = useMemo(() => [
    { label: 'LOOPS NOT STARTED CONSTRUCTION', color: '#AEE6F9' },
    { label: 'LOOPS DONE', color: '#3B4CCA' },
    { label: 'DOSSIER COMPLETED', color: '#D7A0C3' },
    { label: 'LOOPS CONSTRUCTION DONE', color: '#E7D1B0' }
  ], []);

  // Calculate summary statistics once
  const totalSubsystems = metrics.length;
  const totalLoops = useMemo(() => 
    metrics.reduce((sum, item) => sum + item.totalLoops, 0), 
  [metrics]);

  return (
    <Box p={4} borderWidth="1px" borderRadius="lg" bg="white">
      <Heading size="md" mb={4}>LOOP TEST PROGRESS</Heading>
      
      {/* Custom legend */}
      <Flex wrap="wrap" mb={4} justifyContent="center">
        {legendItems.map((item, index) => (
          <HStack key={index} mx={2} mb={2}>
            <Box w="16px" h="16px" bg={item.color} borderRadius="sm" />
            <Text fontSize="sm">{item.label}</Text>
          </HStack>
        ))}
      </Flex>
      
      {/* Chart container with fixed height and scrollable if needed */}
      <Box height="500px" overflowY={metrics.length > 15 ? "auto" : "visible"}>
        <Box minHeight={`${Math.max(400, metrics.length * 30)}px`}>
          <Bar data={chartData} options={options} />
        </Box>
      </Box>
      
      {/* Summary statistics */}
      <VStack mt={4} align="flex-start">
        <Text fontSize="sm">
          <Badge colorScheme="blue" mr={2}>Total Subsystems:</Badge> {totalSubsystems}
        </Text>
        <Text fontSize="sm">
          <Badge colorScheme="blue" mr={2}>Total Loops:</Badge> {totalLoops}
        </Text>
      </VStack>
    </Box>
  );
};

// Use React.memo to prevent unnecessary re-renders
export default React.memo(LoopTestProgressChart);