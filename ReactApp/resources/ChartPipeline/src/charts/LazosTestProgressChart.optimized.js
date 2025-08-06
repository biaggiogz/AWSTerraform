import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
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
import GlobalMetricsDisplay from '../components/ui/GlobalMetricsDisplay';
import useMultiValueFilter from '../hooks/useMultiValueFilter';
import { useLazosTableSqlFilterContext } from '../components/filters/LazosTableFilter';

// Register the plugin
Chart.register(ChartDataLabels);

/**
 * Optimized Stacked Bar Chart showing LOOP TEST PROGRESS by SUBS_PRE
 * @param {Object} props - Component props
 * @param {Array} props.data - Dataset from CSV (filtered)
 * @param {Array} props.rawData - Raw unfiltered dataset for global metrics
 * @param {Function} props.onProgressFilter - Function to handle progress filtering
 * @param {string} props.progressFilter - Current progress filter
 * @param {Object} props.filterMappings - Mappings for filter fields
 */
const LoopTestProgressChart = ({ 
  data, 
  rawData, 
  onProgressFilter, 
  progressFilter,
  filterMappings = { area: 'area_tlp', subsystem: 'subsystem' }
}) => {
  // Get filter context from LazosTableSql
  const {
    selectedSubsystem,
    selectedArea,
    handleSubsystemClick,
    handleAreaClick,
    tableData
  } = useLazosTableSqlFilterContext();
  
  // Use table data from context as primary source
  const filteredData = tableData || [];
  
  // State for sort field and direction
  const [sortField, setSortField] = useState('totalLoops');
  const [sortDirection, setSortDirection] = useState('desc');
  
  // Reference to chart container for layout recalculation
  const chartRef = useRef(null);
  
  // Force chart re-render when filters change
  const [chartKey, setChartKey] = useState(0);
  
  // State for resizable height
  const [chartContainerHeight, setChartContainerHeight] = useState(400);
  const [isResizing, setIsResizing] = useState(false);
  const [startY, setStartY] = useState(0);
  const [startHeight, setStartHeight] = useState(400);
  
  // Handle progress filter changes
  const handleProgressFilter = (filterType) => {
    if (onProgressFilter) {
      onProgressFilter(filterType);
    }
  };
  
  // Handle sort changes from GlobalMetricsDisplay
  const handleSortChange = useCallback((field, direction) => {
    setSortField(field);
    setSortDirection(direction);
  }, []);

  // Resize handlers
  const handleMouseDown = useCallback((e) => {
    setIsResizing(true);
    setStartY(e.clientY);
    setStartHeight(chartContainerHeight);
    e.preventDefault();
  }, [chartContainerHeight]);

  const handleMouseMove = useCallback((e) => {
    if (!isResizing) return;
    const deltaY = e.clientY - startY;
    const newHeight = Math.max(200, Math.min(800, startHeight + deltaY));
    setChartContainerHeight(newHeight);
  }, [isResizing, startY, startHeight]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  // Add global mouse event listeners
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);
  
  // Calculate metrics with optimized processing
  const metrics = useMemo(() => {
    if (!filteredData || filteredData.length === 0) return [];
    
    // Pre-process data for faster lookups
    const groupedData = {};
    
    // Single pass through data for all metrics
    filteredData.forEach(item => {
      const subsystem = item['SUBSYSTEM'];
      if (!subsystem) return;
      
      if (!groupedData[subsystem]) {
        groupedData[subsystem] = {
          totalLoops: 0,
          loopSignalDone: 0,
          dossierCompleted: 0,
          testLoopSignalDone: 0,
          loopsSignalPending: 0
        };
      }
      
      // Count this loop (TOTAL LOOP Signal)
      groupedData[subsystem].totalLoops++;
      
      // Process OK value - use the correct field name from the table
      const okValue = item['OK100'];
      const okPercent = parseFloat(okValue) || 0;
      
      // Check metrics in a single pass
      // LOOP (Signal) DONE: OK100 = 1.0 (100%)
      if (okPercent === 1.0) {
        groupedData[subsystem].loopSignalDone++;
      }
      
      // DOSSIER COMPLETED: non-null DOSSIER
      if (item['DOSSIER']) {
        groupedData[subsystem].dossierCompleted++;
      }
      
      // TEST LOOP (Signal) DONE: non-null TEST_LOOP
      if (item['TEST_LOOP'] && item['TEST_LOOP'].toString().trim() !== '') {
        groupedData[subsystem].testLoopSignalDone++;
      }
      
      // LOOP (Signal) PENDING: OK100 < 1.0 (less than 100%)
      if (okPercent < 1.0) {
        groupedData[subsystem].loopsSignalPending++;
      }
    });
    
    // Convert to array format for chart
    return Object.entries(groupedData)
      .map(([subsystem, values]) => ({
        subsystem,
        ...values
      }));
  }, [filteredData]);
  
  // Create complete sorted metrics for chart data (unaffected by filtering)
  const sortedCompleteMetrics = useMemo(() => {
    return [...metrics].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      return sortDirection === 'desc' ? bValue - aValue : aValue - bValue;
    });
  }, [metrics, sortField, sortDirection]);
  
  // Update chart when filters change
  useEffect(() => {
    setChartKey(prev => prev + 1);
    
    // Trigger resize to recalculate layout
    if (chartRef.current) {
      setTimeout(() => window.dispatchEvent(new Event('resize')), 50);
    }
  }, [sortedCompleteMetrics.length]);
  
  // Calculate optimal spacing based on number of bars
  const getOptimalSpacing = (count) => {
    if (count <= 3) return { barPercentage: 0.6, categoryPercentage: 0.8 };
    if (count <= 5) return { barPercentage: 0.7, categoryPercentage: 0.85 };
    if (count <= 10) return { barPercentage: 0.8, categoryPercentage: 0.9 };
    return { barPercentage: 0.85, categoryPercentage: 0.95 };
  };
  
  // Calculate optimal chart height based on number of bars
  const getChartHeight = (count) => {
    const heightPerBar = Math.max(30, Math.min(60, 200 / count));
    return Math.max(200, count * heightPerBar);
  };
  
  // Prepare chart data with memoization and dynamic reordering based on sort field
  const chartData = useMemo(() => {
    // Define all datasets using complete metrics (not filtered) for consistent chart display
    const datasetDefinitions = [
      {
        label: 'TOTAL LOOP (signals)',
        data: sortedCompleteMetrics.map(item => item.totalLoops),
        backgroundColor: progressFilter && progressFilter !== 'TOTAL LOOP (signals)' ? 'rgba(33, 52, 72, 1)' : '#213448',
        borderColor: progressFilter && progressFilter !== 'TOTAL LOOP (signals)' ? 'rgba(33, 52, 72, 1)' : '#213448',
        borderWidth: 1,
        sortField: 'totalLoops',
        hidden: progressFilter && progressFilter !== 'TOTAL LOOP (signals)'
      },
      {
        label: 'TEST LOOP DONE (signals)',
        data: sortedCompleteMetrics.map(item => item.testLoopSignalDone),
        backgroundColor: progressFilter && progressFilter !== 'TEST LOOP DONE (signals)' ? 'rgba(0, 128, 157, 1)' : '#00809D',
        borderColor: progressFilter && progressFilter !== 'TEST LOOP DONE (signals)' ? 'rgba(0, 128, 157, 1)' : '#00809D',
        borderWidth: 1,
        sortField: 'testLoopSignalDone',
        hidden: progressFilter && progressFilter !== 'TEST LOOP DONE (signals)'
      },
      {
        label: 'LOOP (signals) CONSTRUCTION DONE',
        data: sortedCompleteMetrics.map(item => item.loopSignalDone),
        backgroundColor: progressFilter && progressFilter !== 'LOOP (signals) CONSTRUCTION DONE' ? 'rgba(56, 102, 65, 1)' : '#386641',
        borderColor: progressFilter && progressFilter !== 'LOOP (signals) CONSTRUCTION DONE' ? 'rgba(56, 102, 65, 1)' : '#386641',
        borderWidth: 1,
        sortField: 'loopSignalDone',
        hidden: progressFilter && progressFilter !== 'LOOP (signals) CONSTRUCTION DONE'
      },
      {
        label: 'LOOP (Signals) PENDING',
        data: sortedCompleteMetrics.map(item => item.loopsSignalPending),
        backgroundColor: progressFilter && progressFilter !== 'LOOP (Signals) PENDING' ? 'rgba(249, 122, 0, 1)' : '#F97A00',
        borderColor: progressFilter && progressFilter !== 'LOOP (Signals) PENDING' ? 'rgba(249, 122, 0, 1)' : '#F97A00',
        borderWidth: 1,
        sortField: 'loopsSignalPending',
        hidden: progressFilter && progressFilter !== 'LOOP (Signals) PENDING'
      },
      {
        label: 'DOSSIER COMPLETED',
        data: sortedCompleteMetrics.map(item => item.dossierCompleted),
        backgroundColor: progressFilter && progressFilter !== 'DOSSIER COMPLETED' ? 'rgba(185, 212, 170, 1)' : '#57564F',
        borderColor: progressFilter && progressFilter !== 'DOSSIER COMPLETED' ? 'rgba(185, 212, 170, 1)' : '#57564F',
        borderWidth: 1,
        sortField: 'dossierCompleted',
        hidden: progressFilter && progressFilter !== 'DOSSIER COMPLETED'
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
    
    return {
      labels: sortedCompleteMetrics.map(item => item.subsystem),
      datasets: allDatasets
    };
  }, [sortedCompleteMetrics, sortField, progressFilter]);
  
  // Chart options with memoization
  const options = useMemo(() => {
    // Get optimal spacing based on number of bars
    const { barPercentage, categoryPercentage } = getOptimalSpacing(sortedCompleteMetrics.length);
    
    return {
      indexAxis: 'y', // Horizontal bar chart
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: sortedCompleteMetrics.length <= 5 ? 0 : 300
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
              const total = sortedCompleteMetrics[index].totalLoops;
              return `TOTAL LOOP (Signal): ${total}`;
            }
          },
          enabled: false,
          mode: 'index',
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
      },
      onClick: (event, elements) => {
        if (elements.length > 0) {
          const index = elements[0].index;
          const clickedSubsystem = sortedCompleteMetrics[index]?.subsystem;
          if (clickedSubsystem && handleSubsystemClick) {
            handleSubsystemClick(clickedSubsystem);
          }
        }
      }
    };
  }, [sortedCompleteMetrics]);

  // Calculate summary statistics once
  const totalSubsystems = sortedCompleteMetrics.length;

  // Calculate optimal chart height based on data size
  const chartHeight = useMemo(() => 
    getChartHeight(sortedCompleteMetrics.length),
  [sortedCompleteMetrics.length]);

  return (
    <Box>
      {/* Chart container */}
      <Box p={4} borderWidth="1px" borderRadius="lg" bg="white" mt={4}>
        <Heading size="md" mb={2}>LOOP TEST PROGRESS</Heading>
        
        {/* Summary statistics */}
        <VStack mb={4} align="flex-start">
          <Text fontSize="sm">
            <Badge colorScheme="blue" mr={2}>Total Subsystems:</Badge> {totalSubsystems}
            {!progressFilter && (
              <Badge ml={2} colorScheme="green">Showing: All Metrics</Badge>
            )}
            {progressFilter && (
              <Badge ml={2} colorScheme="orange">Isolated: {progressFilter}</Badge>
            )}
          </Text>
        </VStack>
        
        {/* Global Metrics Display - always shows unfiltered data */}
        <GlobalMetricsDisplay 
          data={filteredData} 
          onProgressFilter={handleProgressFilter}
          progressFilter={progressFilter}
          sortField={sortField}
          sortDirection={sortDirection}
          onSortChange={handleSortChange}
        />
        
        {/* Resizable Chart container */}
        <Box position="relative">
          <Box 
            ref={chartRef}
            height={`${chartContainerHeight}px`}
            overflowY="auto"
            border="1px solid"
            borderColor="gray.200"
            borderRadius="md"
            position="relative"
          >
            <Box 
              key={chartKey} 
              height={`${Math.max(chartContainerHeight, chartHeight)}px`}
              minHeight={`${Math.max(200, sortedCompleteMetrics.length * 30)}px`}
            >
              <Bar data={chartData} options={options} />
            </Box>
          </Box>
          
          {/* Custom resize handle */}
          <Box
            position="absolute"
            bottom="-5px"
            left="50%"
            transform="translateX(-50%)"
            width="40px"
            height="10px"
            bg="gray.300"
            borderRadius="md"
            cursor="ns-resize"
            onMouseDown={handleMouseDown}
            _hover={{ bg: "gray.400" }}
            _active={{ bg: "gray.500" }}
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <Box
              width="20px"
              height="2px"
              bg="gray.600"
              borderRadius="sm"
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

// Use React.memo to prevent unnecessary re-renders
export default React.memo(LoopTestProgressChart);