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
import SubsystemCompletionChart from './SubsystemCompletionChart';
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
    tableData,
    setTableData
  } = useLazosTableSqlFilterContext();
  
  // Update table data in context when data changes
  React.useEffect(() => {
    if (data && data.length > 0 && setTableData) {
      setTableData(data);
    }
  }, [data, setTableData]);
  
  // Use table data from context as primary source, but filter it based on current selections
  const filteredData = useMemo(() => {
    if (!tableData || tableData.length === 0) return data || [];
    
    // Apply subsystem filter if one is selected
    if (selectedSubsystem) {
      return tableData.filter(row => row['SUBSYSTEM'] === selectedSubsystem);
    }
    
    return tableData;
  }, [tableData, selectedSubsystem, data]);
  
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
  
  // Chart click handler to filter table by subsystem
  const handleChartClick = useCallback((event, elements) => {
    if (elements.length > 0) {
      const elementIndex = elements[0].index;
      const subsystem = sortedCompleteMetrics[elementIndex]?.subsystem;
      if (subsystem && handleSubsystemClick) {
        handleSubsystemClick(subsystem);
      }
    }
  }, [sortedCompleteMetrics, handleSubsystemClick]);

  // Prepare chart data with memoization and dynamic reordering based on sort field
  const chartData = useMemo(() => {
    // Define all datasets using complete metrics (not filtered) for consistent chart display
    const datasetDefinitions = [
      {
        label: 'TOTAL LOOP (Signal)',
        data: sortedCompleteMetrics.map(item => item.totalLoops),
        backgroundColor: progressFilter && progressFilter !== 'TOTAL LOOP (Signal)' ? 'rgba(196, 225, 230, 1)' : '#C4E1E6',
        borderColor: progressFilter && progressFilter !== 'TOTAL LOOP (Signal)' ? 'rgba(196, 225, 230, 1)' : '#C4E1E6',
        borderWidth: 1,
        sortField: 'totalLoops',
        hidden: progressFilter && progressFilter !== 'TOTAL LOOP (Signal)'
      },
      {
        label: 'LOOP (Signal) DONE',
        data: sortedCompleteMetrics.map(item => item.loopSignalDone),
        backgroundColor: progressFilter && progressFilter !== 'LOOP (Signal) DONE' ? 'rgba(29, 233, 182, 1)' : '#1DE9B6',
        borderColor: progressFilter && progressFilter !== 'LOOP (Signal) DONE' ? 'rgba(29, 233, 182, 1)' : '#1DE9B6',
        borderWidth: 1,
        sortField: 'loopSignalDone',
        hidden: progressFilter && progressFilter !== 'LOOP (Signal) DONE'
      },
      {
        label: 'LOOP (Signal) PENDING',
        data: sortedCompleteMetrics.map(item => item.loopsSignalPending),
        backgroundColor: progressFilter && progressFilter !== 'LOOP (Signal) PENDING' ? 'rgba(255, 22, 139, 1)' : '#FF168B',
        borderColor: progressFilter && progressFilter !== 'LOOP (Signal) PENDING' ? 'rgba(255, 22, 139, 1)' : '#FF168B',
        borderWidth: 1,
        sortField: 'loopsSignalPending',
        hidden: progressFilter && progressFilter !== 'LOOP (Signal) PENDING'
      },
      {
        label: 'DOSSIER COMPLETED',
        data: sortedCompleteMetrics.map(item => item.dossierCompleted),
        backgroundColor: progressFilter && progressFilter !== 'DOSSIER COMPLETED' ? 'rgba(185, 212, 170, 1)' : '#B9D4AA',
        borderColor: progressFilter && progressFilter !== 'DOSSIER COMPLETED' ? 'rgba(185, 212, 170, 1)' : '#B9D4AA',
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
    
    return {
      labels: sortedCompleteMetrics.map(item => item.subsystem),
      datasets: reorderedDatasets
    };
  }, [sortedCompleteMetrics, progressFilter, sortField]);

  // Chart options with click handler
  const chartOptions = useMemo(() => ({
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    onClick: handleChartClick,
    plugins: {
      legend: {
        display: false
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
        mode: 'index',
        intersect: false
      },
      datalabels: {
        display: (context) => {
          const value = context.dataset.data[context.dataIndex];
          return value > 0;
        },
        anchor: 'center',
        align: 'center',
        color: 'white',
        font: { weight: 'bold', size: 10 },
        formatter: (value) => value > 0 ? value : ''
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
          maxTicksLimit: 10
        },
        grid: {
          display: true,
          drawBorder: true,
          color: 'rgba(0, 0, 0, 0.1)'
        },
        beginAtZero: true
      },
      y: {
        stacked: true,
        title: {
          display: true,
          text: 'SUBSYSTEM'
        },
        ...getOptimalSpacing(sortedCompleteMetrics.length)
      }
    }
  }), [handleChartClick, sortedCompleteMetrics, getOptimalSpacing]);

  // Calculate summary statistics once
  const totalSubsystems = sortedCompleteMetrics.length;

  // Calculate optimal chart height based on data size
  const chartHeight = useMemo(() => 
    getChartHeight(sortedCompleteMetrics.length),
  [sortedCompleteMetrics.length]);

  return (
    <Box>
      {/* Charts container */}
      <HStack spacing={4} align="flex-start">
        {/* Main chart container */}
        <Box flex={2} p={4} borderWidth="1px" borderRadius="lg" bg="white" mt={4}>
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
              <Bar 
                key={chartKey}
                ref={chartRef}
                data={chartData} 
                options={chartOptions}
                height={chartContainerHeight}
              />
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
        
        {/* Subsystem Completion Chart */}
        <Box flex={1}>
          <SubsystemCompletionChart data={filteredData} />
        </Box>
      </HStack>
    </Box>
  );
};

// Use React.memo to prevent unnecessary re-renders
export default React.memo(LoopTestProgressChart);