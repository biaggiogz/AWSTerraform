import React, { useMemo, useState, useEffect, useRef } from 'react';
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
import Chart from 'chart.js/auto';
import ChartDataLabels from 'chartjs-plugin-datalabels';

// Register the plugin
Chart.register(ChartDataLabels);

/**
 * Optimized Stacked Bar Chart showing LOOP TEST PROGRESS by SUBS_PRE
 * @param {Object} props - Component props
 * @param {Array} props.data - Dataset from CSV
 */
const LoopTestProgressChart = ({ data }) => {
  // State to track the active measure filter
  const [activeFilter, setActiveFilter] = useState(null);
  
  // State for sort field and direction
  const [sortField, setSortField] = useState('totalLoops');
  const [sortDirection, setSortDirection] = useState('desc');
  
  // Reference to chart container for layout recalculation
  const chartRef = useRef(null);
  
  // Force chart re-render when filters change
  const [chartKey, setChartKey] = useState(0);
  
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
  
  // Sort metrics based on selected field and direction
  const sortedMetrics = useMemo(() => {
    return [...filteredMetrics].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      return sortDirection === 'desc' ? bValue - aValue : aValue - bValue;
    });
  }, [filteredMetrics, sortField, sortDirection]);
  
  // Update chart when filters change
  useEffect(() => {
    setChartKey(prev => prev + 1);
    
    // Trigger resize to recalculate layout
    if (chartRef.current) {
      setTimeout(() => window.dispatchEvent(new Event('resize')), 50);
    }
  }, [sortedMetrics.length, activeFilter]);
  
  // Calculate optimal spacing based on number of bars
  const getOptimalSpacing = (count) => {
    if (count <= 3) return { barPercentage: 0.6, categoryPercentage: 0.8 };
    if (count <= 5) return { barPercentage: 0.7, categoryPercentage: 0.85 };
    if (count <= 10) return { barPercentage: 0.8, categoryPercentage: 0.9 };
    return { barPercentage: 0.85, categoryPercentage: 0.95 };
  };
  
  // Calculate optimal chart height based on number of bars
  const getChartHeight = (count) => {
    const baseHeight = 300;
    const heightPerBar = Math.max(30, Math.min(60, 200 / count));
    return Math.max(200, count * heightPerBar);
  };
  
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
    // Get optimal spacing based on number of bars
    const { barPercentage, categoryPercentage } = getOptimalSpacing(sortedMetrics.length);
    
    return {
      indexAxis: 'y', // Horizontal bar chart
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: sortedMetrics.length <= 5 ? 0 : 300
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
          enabled: true,
          mode: activeFilter ? 'nearest' : 'index',
          intersect: false
        },
        // Configure the datalabels plugin
        datalabels: {
          color: function(context) {
            // Choose text color based on background color for better contrast
            const backgroundColor = context.dataset.backgroundColor;
            // For dark backgrounds (like blue), use white text
            if (backgroundColor === '#3B4CCA') {
              return 'white';
            }
            // For light backgrounds, use dark text
            return '#333333';
          },
          font: {
            weight: 'bold',
            size: 11
          },
          formatter: function(value) {
            // Only show value if it's greater than 0
            return value > 0 ? value : '';
          },
          // Position the label in the center of the bar segment
          align: 'center',
          anchor: 'center',
          // Only display if the segment is wide enough
          display: function(context) {
            return context.dataset.data[context.dataIndex] > 0;
          }
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
          },
          grid: {
            display: true,
            drawBorder: true,
            color: 'rgba(0, 0, 0, 0.1)' // Light grid lines
          },
          beginAtZero: true
        },
        y: {
          stacked: true,
          title: {
            display: true,
            text: 'SUBS_PRE'
          },
          // Dynamic spacing based on number of bars
          categoryPercentage: sortedMetrics.length <= 3 ? 0.5 : categoryPercentage,
          barPercentage: sortedMetrics.length <= 3 ? 0.5 : barPercentage,
          offset: true, // Always enable offset to prevent bars from being cut off
          grid: {
            display: true,
            drawBorder: true,
            color: 'rgba(0, 0, 0, 0.1)' // Light grid lines
          },
          ticks: {
            padding: 5 // Add padding to the ticks
          },
          // Add extra space at the beginning and end of the axis
          afterFit: function(scaleInstance) {
            // Add extra space at the top and bottom of the scale
            scaleInstance.paddingTop = 15;
            scaleInstance.paddingBottom = 15;
          }
        }
      },
      layout: {
        padding: {
          left: 10,
          right: 10,
          top: 20,
          bottom: 20
        }
      }
    };
  }, [sortedMetrics, activeFilter]);

  // Custom legend items - memoized to prevent unnecessary re-renders
  const legendItems = useMemo(() => [
    { label: 'LOOPS NOT STARTED CONSTRUCTION', color: '#AEE6F9' },
    { label: 'LOOPS DONE', color: '#3B4CCA' },
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

  // Calculate dynamic chart height
  const chartHeight = getChartHeight(sortedMetrics.length);

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
      
      {/* Chart container with dynamic height based on number of bars */}
      <Box
        ref={chartRef}
        height={`${chartHeight}px`}
        minHeight={sortedMetrics.length <= 3 ? "200px" : "300px"}
        position="relative"
        borderWidth="1px"
        borderColor="gray.200"
        borderRadius="md"
        p={2}
      >
        <Bar
          data={chartData}
          options={options}
          key={`chart-${chartKey}`}
        />
      </Box>
    </Box>
  );
};

// Use React.memo to prevent unnecessary re-renders
export default React.memo(LoopTestProgressChart);