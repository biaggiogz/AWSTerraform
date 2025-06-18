import React, { useMemo, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { 
  Box, 
  Heading, 
  HStack, 
  Text, 
  VStack, 
  Flex, 
  Badge,
  Button
} from '@chakra-ui/react';

/**
 * Optimized Stacked Bar Chart showing LOOP TEST PROGRESS by SUBS_PRE
 * @param {Object} props - Component props
 * @param {Array} props.data - Dataset from CSV
 */
const LoopTestProgressChart = ({ data }) => {
  // State to track the active measure filter
  const [activeFilter, setActiveFilter] = useState(null);
  
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
    
    // Convert to array format for chart
    return Object.entries(groupedData)
      .map(([subsPre, values]) => ({
        subsPre,
        ...values
      }));
  }, [data]);
  
  // Filter metrics based on active filter
  const filteredMetrics = useMemo(() => {
    if (!activeFilter) return metrics;
    
    return metrics.filter(item => {
      switch (activeFilter) {
        case 'LOOPS NOT STARTED CONSTRUCTION':
          return item.loopsNotStartedConstruction > 0;
        case 'LOOPS DONE':
          return item.loopsDone > 0;
        case 'DOSSIER COMPLETED':
          return item.dossierCompleted > 0;
        case 'LOOPS CONSTRUCTION DONE':
          return item.loopsConstructionDone > 0;
        default:
          return true;
      }
    });
  }, [metrics, activeFilter]);
  
  // Sort metrics by total loops (descending)
  const sortedMetrics = useMemo(() => {
    return [...filteredMetrics].sort((a, b) => b.totalLoops - a.totalLoops);
  }, [filteredMetrics]);
  
  // Prepare chart data with memoization
  const chartData = useMemo(() => {
    // Define all datasets
    const allDatasets = [
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
        backgroundColor: '#FFB4A2', // Blue
        borderColor: '#E5989B',
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
    ];
    
    // If there's an active filter, only show that dataset
    const datasets = activeFilter 
      ? allDatasets.filter(dataset => dataset.label === activeFilter)
      : allDatasets;
    
    return {
      labels: sortedMetrics.map(item => item.subsPre),
      datasets
    };
  }, [sortedMetrics, activeFilter]);
  
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
              const subsPre = sortedMetrics[index].subsPre;
              const total = sortedMetrics[index].totalLoops;
              
              // If there's an active filter, show both the filtered value and total
              if (activeFilter) {
                const filteredValue = tooltipItems[0].raw;
                return `${activeFilter}: ${filteredValue} / TOTAL LOOPS: ${total}`;
              }
              
              return `TOTAL LOOPS: ${total}`;
            }
          },
          enabled: false,
          mode: activeFilter ? 'nearest' : 'index',
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
  }, [sortedMetrics, activeFilter]);

  // Custom legend items - memoized to prevent unnecessary re-renders
  const legendItems = useMemo(() => [
    { label: 'LOOPS NOT STARTED CONSTRUCTION', color: '#AEE6F9' },
    { label: 'LOOPS DONE', color: '#FFB4A2' },
    { label: 'DOSSIER COMPLETED', color: '#D7A0C3' },
    { label: 'LOOPS CONSTRUCTION DONE', color: '#E7D1B0' }
  ], []);
  
  // Handle legend item click
  const handleLegendItemClick = (label) => {
    if (activeFilter === label) {
      // If clicking the active filter, remove it
      setActiveFilter(null);
    } else {
      // Otherwise, set the new filter
      setActiveFilter(label);
    }
  };

  // Calculate summary statistics once
  const totalSubsystems = sortedMetrics.length;
  const totalLoops = useMemo(() => 
    sortedMetrics.reduce((sum, item) => sum + item.totalLoops, 0), 
  [sortedMetrics]);

  return (
    <Box p={4} borderWidth="1px" borderRadius="lg" bg="white">
      <Heading size="md" mb={2}>LOOP TEST PROGRESS</Heading>
      
      {/* Summary statistics */}
      <VStack mb={4} align="flex-start">
        <Text fontSize="sm">
          <Badge colorScheme="blue" mr={2}>Total Subsystems:</Badge> {totalSubsystems}
          {activeFilter && (
            <Badge ml={2} colorScheme="green">Filtered by: {activeFilter}</Badge>
          )}
        </Text>
        <Text fontSize="sm">
          <Badge colorScheme="blue" mr={2}>Total Loops:</Badge> {totalLoops}
        </Text>
      </VStack>
      
      {/* Interactive legend */}
      <Flex wrap="wrap" mb={4} justifyContent="center">
        {legendItems.map((item, index) => (
          <Button
            key={index}
            size="sm"
            mx={1}
            mb={2}
            variant={activeFilter === item.label ? "solid" : "outline"}
            colorScheme={activeFilter === item.label ? "blue" : "gray"}
            leftIcon={<Box w="12px" h="12px" bg={item.color} borderRadius="sm" />}
            onClick={() => handleLegendItemClick(item.label)}
            aria-pressed={activeFilter === item.label}
            role="checkbox"
          >
            {item.label}
          </Button>
        ))}
      </Flex>
      
      {/* Chart container with fixed height and scrollable if needed */}
      <Box height="500px" overflowY={sortedMetrics.length > 15 ? "auto" : "visible"}>
        <Box minHeight={`${Math.max(400, sortedMetrics.length * 30)}px`}>
          <Bar data={chartData} options={options} />
        </Box>
      </Box>
    </Box>
  );
};

// Use React.memo to prevent unnecessary re-renders
export default React.memo(LoopTestProgressChart);