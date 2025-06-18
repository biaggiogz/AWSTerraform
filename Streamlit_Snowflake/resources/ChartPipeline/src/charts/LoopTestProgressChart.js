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
 * Stacked Bar Chart showing LOOP TEST PROGRESS by SUBS_PRE
 * @param {Object} props - Component props
 * @param {Array} props.data - Dataset from CSV
 */
const LoopTestProgressChart = ({ data }) => {
  // Calculate metrics based on the requirements
  const metrics = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    // Group data by SUBS_PRE
    const groupedData = data.reduce((acc, item) => {
      const subsPre = item['SUBS_PRE'];
      if (!subsPre) return acc;
      
      if (!acc[subsPre]) {
        acc[subsPre] = {
          totalLoops: 0,
          loopsConstructionDone: 0,
          dossierCompleted: 0,
          loopsDone: 0,
          loopsNotStartedConstruction: 0
        };
      }
      
      // Count this loop
      acc[subsPre].totalLoops++;
      
      // Check if construction is done (OK=100%)
      const okValue = item['OK=100%']?.toString().replace('%', '').trim();
      if (parseFloat(okValue) === 100) {
        acc[subsPre].loopsConstructionDone++;
      }
      
      // Check if dossier is completed
      if (item['DOSSIER']) {
        acc[subsPre].dossierCompleted++;
      }
      
      // Check if loop test is done
      if (item['TEST LOOP']) {
        acc[subsPre].loopsDone++;
      }
      
      // Check if construction is not started (OK=0%)
      if (parseFloat(okValue) === 0) {
        acc[subsPre].loopsNotStartedConstruction++;
      }
      
      return acc;
    }, {});
    
    // Convert to array format for chart
    return Object.entries(groupedData).map(([subsPre, values]) => ({
      subsPre,
      ...values
    }));
  }, [data]);
  
  // Sort metrics by total loops (descending)
  const sortedMetrics = useMemo(() => {
    return [...metrics].sort((a, b) => b.totalLoops - a.totalLoops);
  }, [metrics]);
  
  // Prepare chart data
  const chartData = useMemo(() => {
    return {
      labels: sortedMetrics.map(item => item.subsPre),
      datasets: [
        {
          label: 'LOOPS NOT STARTED CONSTRUCTION',
          data: sortedMetrics.map(item => item.loopsNotStartedConstruction),
          backgroundColor: '#AEE6F9', // Light Blue
          borderColor: '#99D5E8',
          borderWidth: 1,
        },
        {
          label: 'LOOPS DONE',
          data: sortedMetrics.map(item => item.loopsDone),
          backgroundColor: '#3B4CCA', // Blue
          borderColor: '#2A3BB9',
          borderWidth: 1,
        },
        {
          label: 'DOSSIER COMPLETED',
          data: sortedMetrics.map(item => item.dossierCompleted),
          backgroundColor: '#D7A0C3', // Pink
          borderColor: '#C68FB2',
          borderWidth: 1,
        },
        {
          label: 'LOOPS CONSTRUCTION DONE',
          data: sortedMetrics.map(item => item.loopsConstructionDone),
          backgroundColor: '#E7D1B0', // Beige
          borderColor: '#D6C09F',
          borderWidth: 1,
        }
      ]
    };
  }, [sortedMetrics]);
  
  // Chart options
  const options = useMemo(() => {
    return {
      indexAxis: 'y', // Horizontal bar chart
      responsive: true,
      maintainAspectRatio: false,
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
              const subsPre = sortedMetrics[index].subsPre;
              const total = sortedMetrics[index].totalLoops;
              return `TOTAL LOOPS: ${total}`;
            }
          }
        }
      },
      scales: {
        x: {
          stacked: true,
          title: {
            display: true,
            text: 'TOTAL LOOPS'
          }
        },
        y: {
          stacked: true,
          title: {
            display: true,
            text: 'SUBSYSTEM'
          }
        }
      }
    };
  }, [sortedMetrics]);

  // Custom legend items
  const legendItems = [
    { label: 'LOOPS NOT STARTED CONSTRUCTION', color: '#AEE6F9' },
    { label: 'LOOPS DONE', color: '#3B4CCA' },
    { label: 'DOSSIER COMPLETED', color: '#D7A0C3' },
    { label: 'LOOPS CONSTRUCTION DONE', color: '#E7D1B0' }
  ];

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
      <Box height="500px" overflowY={sortedMetrics.length > 15 ? "auto" : "visible"}>
        <Box minHeight={`${Math.max(400, sortedMetrics.length * 30)}px`}>
          <Bar data={chartData} options={options} />
        </Box>
      </Box>
      
      {/* Summary statistics */}
      <VStack mt={4} align="flex-start">
        <Text fontSize="sm">
          <Badge colorScheme="blue" mr={2}>Total Subsystems:</Badge> {sortedMetrics.length}
        </Text>
        <Text fontSize="sm">
          <Badge colorScheme="blue" mr={2}>Total Loops:</Badge> {sortedMetrics.reduce((sum, item) => sum + item.totalLoops, 0)}
        </Text>
      </VStack>
    </Box>
  );
};

export default React.memo(LoopTestProgressChart);