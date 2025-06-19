import { Profiler } from 'react';
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
 * @param {Function} props.onProgressFilter - Function to handle progress filtering
 * @param {string} props.progressFilter - Current progress filter
 */
const LoopTestProgressChart = ({ data, onProgressFilter, progressFilter }) => {
  // State to track the active measure filter - sync with external progressFilter
  const [activeFilter, setActiveFilter] = useState(progressFilter);
  
  // State for sort field and direction
  const [sortField, setSortField] = useState('totalLoops');
  const [sortDirection, setSortDirection] = useState('desc');
  
  // Reference to chart container for layout recalculation
  const chartRef = useRef(null);
  
  // Force chart re-render when filters change
  const [chartKey, setChartKey] = useState(0);
  
  // Sync activeFilter with external progressFilter
  useEffect(() => {
    setActiveFilter(progressFilter);
  }, [progressFilter]);
  
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
          loopSignalDone: 0,
          dossierCompleted: 0,
          loopsSignalPending: 0
        };
      }
      
      // Count this loop (TOTAL LOOP Signal)
      groupedData[subsPre].totalLoops++;
      
      // Process OK value once
      const okValue = item['OK=100%']?.toString().replace('%', '').trim();
      const okPercent = parseFloat(okValue);
      
      // Check metrics in a single pass
      // LOOP (Signal) DONE: OK=100%
      if (okPercent === 100) {
        groupedData[subsPre].loopSignalDone++;
      }
      
      // DOSSIER COMPLETED: non-null DOSSIER
      if (item['DOSSIER']) {
        groupedData[subsPre].dossierCompleted++;
      }
      
      // LOOP (Signal) PENDING: OK<100%
      if (okPercent < 100) {
        groupedData[subsPre].loopsSignalPending++;
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
        case 'TOTAL LOOP (Signal)':
          return item.totalLoops > 0;
        case 'LOOP (Signal) PENDING':
          return item.loopsSignalPending > 0;
        case 'LOOP (Signal) DONE':
          return item.loopSignalDone > 0;
        case 'DOSSIER COMPLETED':
          return item.dossierCompleted > 0;
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
  
  // Prepare chart data with memoization and dynamic reordering based on sort field
  const chartData = useMemo(() => {
    // Define all datasets with their mapping to sort fields
    const datasetDefinitions = [
      {
        label: 'TOTAL LOOP (Signal)',
        data: sortedMetrics.map(item => item.totalLoops),
        backgroundColor: '#FFB4A2',
        borderColor: '#E5989B',
        borderWidth: 1,
        sortField: 'totalLoops'
      },
      {
        label: 'LOOP (Signal) DONE',
        data: sortedMetrics.map(item => item.loopSignalDone),
        backgroundColor: '#3B4CCA',
        borderColor: '#2A3BB9',
        borderWidth: 1,
        sortField: 'loopSignalDone'
      },
      {
        label: 'LOOP (Signal) PENDING',
        data: sortedMetrics.map(item => item.loopsSignalPending),
        backgroundColor: '#AEE6F9',
        borderColor: '#99D5E8',
        borderWidth: 1,
        sortField: 'loopsSignalPending'
      },
      {
        label: 'DOSSIER COMPLETED',
        data: sortedMetrics.map(item => item.dossierCompleted),
        backgroundColor: '#D7A0C3',
        borderColor: '#C68FB2',
        borderWidth: 1,
        sortField: 'dossierCompleted'
      }
    ];
    
    // Reorder datasets so the sorted metric appears first (leftmost)
    const reorderedDatasets = [...datasetDefinitions];
    const sortedDatasetIndex = reorderedDatasets.findIndex(dataset => dataset.sortField === sortField);
    
    if (sortedDatasetIndex > 0) {
      // Move the sorted dataset to the front
      const sortedDataset = reorderedDatasets.splice(sortedDatasetIndex, 1)[0];
      reorderedDatasets.unshift(sortedDataset);
    }
    
    // Remove sortField property before passing to chart
    const allDatasets = reorderedDatasets.map(({ sortField, ...dataset }) => dataset);
    
    // If there's an active filter, only show that dataset
    const datasets = activeFilter 
      ? allDatasets.filter(dataset => dataset.label === activeFilter)
      : allDatasets;
    
    return {
      labels: sortedMetrics.map(item => item.subsPre),
      datasets
    };
  }, [sortedMetrics, activeFilter, sortField]);
  
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
                return `${activeFilter}: ${filteredValue} / TOTAL LOOP (Signal): ${total}`;
              }
              
              return `TOTAL LOOP (Signal): ${total}`;
            }
          },
          enabled: false,
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
            text: 'TOTAL LOOPS'
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
            text: 'SUBSYSTEM'
          },
          // Dynamic spacing based on number of bars
          barPercentage,
          categoryPercentage
        }
      }
    };
  }, [sortedMetrics, activeFilter]);

  // Custom legend items - dynamically ordered based on sort field
  const legendItems = useMemo(() => {
    const items = [
      { label: 'TOTAL LOOP (Signal)', color: '#FFB4A2', sortField: 'totalLoops'},
      { label: 'LOOP (Signal) DONE', color: '#3B4CCA', sortField: 'loopSignalDone' },
      { label: 'LOOP (Signal) PENDING', color: '#AEE6F9', sortField: 'loopsSignalPending' },
      { label: 'DOSSIER COMPLETED', color: '#D7A0C3', sortField: 'dossierCompleted' }
    ];
    
    // Reorder legend to match chart segment order
    const reorderedItems = [...items];
    const sortedItemIndex = reorderedItems.findIndex(item => item.sortField === sortField);
    
    if (sortedItemIndex > 0) {
      const sortedItem = reorderedItems.splice(sortedItemIndex, 1)[0];
      reorderedItems.unshift(sortedItem);
    }
    
    return reorderedItems.map(({ sortField, ...item }) => item);
  }, [sortField]);
  
  // Handle legend item click with debounce to prevent rapid state changes
  const handleLegendItemClick = (label) => {
    if (activeFilter === label) {
      // If clicking the active filter, remove it
      setActiveFilter(null);
      // Also clear the table filter
      if (onProgressFilter && (label === 'LOOP (Signal) DONE' || label === 'LOOP (Signal) PENDING' || label === 'DOSSIER COMPLETED')) {
        onProgressFilter(null);
      }
    } else {
      // Otherwise, set the new filter
      setActiveFilter(label);
      // Apply table filter for relevant metrics
      if (onProgressFilter && (label === 'LOOP (Signal) DONE' || label === 'LOOP (Signal) PENDING' || label === 'DOSSIER COMPLETED')) {
        onProgressFilter(label);
      }
    }
  };

  // Calculate summary statistics once
  const totalSubsystems = sortedMetrics.length;
  const totalLoops = useMemo(() => 
    sortedMetrics.reduce((sum, item) => sum + item.totalLoops, 0), 
  [sortedMetrics]);

  // Calculate optimal chart height based on data size
  const chartHeight = useMemo(() => 
    getChartHeight(sortedMetrics.length),
  [sortedMetrics.length]);

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
      </VStack>
      
      {/* Interactive legend - optimized with fewer re-renders */}
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
      
      {/* Sort controls - optimized with fewer re-renders */}
      <Flex wrap="wrap" mb={4} justifyContent="center">
        <Text fontSize="sm" fontWeight="bold" mr={2} alignSelf="center">Sort by:</Text>
        <HStack spacing={2} flexWrap="wrap" justifyContent="center">
          {useMemo(() => [
            { id: 'totalLoops', label: 'TOTAL LOOP' },
            { id: 'loopSignalDone', label: 'LOOP DONE' },
            { id: 'loopsSignalPending', label: 'LOOP PENDING' },
            { id: 'dossierCompleted', label: 'DOSSIER COMPLETED' }
          ].map((sortOption) => (
            <Button
              key={sortOption.id}
              size="xs"
              variant={sortField === sortOption.id ? "solid" : "outline"}
              colorScheme={sortField === sortOption.id ? "blue" : "gray"}
              onClick={() => {
                if (sortField === sortOption.id) {
                  // Toggle direction if clicking the same field
                  setSortDirection(sortDirection === 'desc' ? 'asc' : 'desc');
                } else {
                  // Set new field and default to descending
                  setSortField(sortOption.id);
                  setSortDirection('desc');
                }
              }}
              mb={2}
            >
              {sortOption.label} {sortField === sortOption.id && (sortDirection === 'desc' ? '↓' : '↑')}
            </Button>
          )), [sortField, sortDirection])}
        </HStack>
      </Flex>
      
      {/* Chart container with dynamic height based on data size */}
      <Box 
        ref={chartRef}
        height={`${chartHeight}px`} 
        maxHeight="600px"
        overflowY={sortedMetrics.length > 15 ? "auto" : "visible"}
      >
        <Box 
          key={chartKey} 
          height="100%" 
          minHeight={`${Math.max(200, sortedMetrics.length * 30)}px`}
        >
          <Bar data={chartData} options={options} />
        </Box>
      </Box>
    </Box>
  );
};

// Use React.memo to prevent unnecessary re-renders
export default React.memo(LoopTestProgressChart);