import React, { useEffect, useState, useMemo } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { 
  Box, 
  Heading, 
  HStack, 
  Text, 
  VStack, 
  Badge,
  SimpleGrid,
  Button
} from '@chakra-ui/react';
import Chart from 'chart.js/auto';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { useLazosTableSqlFilterContext } from '../components/filters/LazosTableFilter';

// Register the plugin
Chart.register(ChartDataLabels);

const SubsystemCompletionChart = () => {
  const { subsystemCompletionFilter, handleSubsystemCompletionFilter, tableData } = useLazosTableSqlFilterContext();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [completionData, setCompletionData] = useState({
    fullyCompleted: [],
    fullyPending: [],
    completedCount: 0,
    pendingCount: 0
  });

  // Calculate completion data from filtered table data
  const calculateCompletionData = useMemo(() => {
    if (!tableData || tableData.length === 0) {
      return {
        fullyCompleted: [],
        fullyPending: [],
        completedCount: 0,
        pendingCount: 0
      };
    }

    const subsystemGroups = {};
    
    // Group by subsystem and calculate completion status
    tableData.forEach(row => {
      const subsystem = row.SUBSYSTEM;
      if (!subsystem) return;
      
      if (!subsystemGroups[subsystem]) {
        subsystemGroups[subsystem] = {
          totalLoops: 0,
          completedLoops: 0
        };
      }
      
      subsystemGroups[subsystem].totalLoops++;
      
      // Check if loop is completed (OK100 = 1.0)
      const okValue = parseFloat(row.OK100) || 0;
      if (okValue === 1.0) {
        subsystemGroups[subsystem].completedLoops++;
      }
    });
    
    // Determine completion status for each subsystem
    const fullyCompleted = [];
    const fullyPending = [];
    
    Object.entries(subsystemGroups).forEach(([subsystem, data]) => {
      if (data.completedLoops === data.totalLoops && data.totalLoops > 0) {
        fullyCompleted.push({ subsystem });
      } else {
        fullyPending.push({ subsystem });
      }
    });
    
    return {
      fullyCompleted,
      fullyPending,
      completedCount: fullyCompleted.length,
      pendingCount: fullyPending.length
    };
  }, [tableData]);

  // Update completion data when table data changes
  useEffect(() => {
    setCompletionData(calculateCompletionData);
    setLoading(false);
  }, [calculateCompletionData]);

  // Prepare chart data
  const chartData = useMemo(() => ({
    labels: ['Fully Completed', 'Fully Pending'],
    datasets: [{
      data: [calculateCompletionData.completedCount, calculateCompletionData.pendingCount],
      backgroundColor: ['#1DE9B6', '#FF168B'],
      borderColor: ['#1DE9B6', '#FF168B'],
      borderWidth: 2
    }]
  }), [calculateCompletionData]);

  // Chart options
  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          font: { size: 12 }
        }
      },
      datalabels: {
        color: 'white',
        font: { weight: 'bold', size: 14 },
        formatter: (value, context) => {
          const total = context.dataset.data.reduce((a, b) => a + b, 0);
          const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
          return `${value}\n(${percentage}%)`;
        },
        textAlign: 'center'
      }
    }
  }), []);

  if (loading) return <Box><Box p={4} borderWidth="1px" borderRadius="lg" bg="white" mt={4}><Text>Loading...</Text></Box></Box>;
  if (error) return <Box><Box p={4} borderWidth="1px" borderRadius="lg" bg="white" mt={4}><Text color="red.500">Error: {error}</Text></Box></Box>;

  const totalSubsystems = calculateCompletionData.completedCount + calculateCompletionData.pendingCount;

  return (
    <Box>
      {/* Chart container - matching LoopTestProgressChart structure exactly */}
      <Box p={4} borderWidth="1px" borderRadius="lg" bg="white"  mt={4}>
        <Heading size="md" mb={2}>
          SUBSYSTEM COMPLETION STATUS
        </Heading>
        
        {/* Summary statistics - matching LoopTestProgressChart */}
        <VStack mb={4} align="flex-start">
          <Text fontSize="sm">
            <Badge colorScheme="blue" mr={2}>Total Subsystems:</Badge> {totalSubsystems}
            <Badge ml={2} colorScheme="green">Completion Rate: {totalSubsystems > 0 ? ((calculateCompletionData.completedCount / totalSubsystems) * 100).toFixed(1) : 0}%</Badge>
          </Text>
        </VStack>
        
        {/* Filter Buttons - matching GlobalMetricsDisplay position */}
        <HStack justify="center" mb={4} spacing={2}>
          <Button
            size="sm"
            colorScheme={subsystemCompletionFilter === 'DONE' ? 'green' : 'gray'}
            variant={subsystemCompletionFilter === 'DONE' ? 'solid' : 'outline'}
            onClick={() => handleSubsystemCompletionFilter('DONE')}
          >
            DONE ({calculateCompletionData.completedCount})
          </Button>
          <Button
            size="sm"
            colorScheme={subsystemCompletionFilter === 'PENDING' ? 'red' : 'gray'}
            variant={subsystemCompletionFilter === 'PENDING' ? 'solid' : 'outline'}
            onClick={() => handleSubsystemCompletionFilter('PENDING')}
          >
            PENDING ({calculateCompletionData.pendingCount})
          </Button>
          <Button
            size="sm"
            colorScheme={subsystemCompletionFilter === 'TOTAL' ? 'blue' : 'gray'}
            variant={subsystemCompletionFilter === 'TOTAL' ? 'solid' : 'outline'}
            onClick={() => handleSubsystemCompletionFilter('TOTAL')}
          >
            TOTAL ({totalSubsystems})
          </Button>
        </HStack>
        
        {/* Chart container - matching LoopTestProgressChart structure */}
        <Box position="relative">
          <Box 
            height="460px"
            border="1px solid"
            borderColor="gray.200"
            borderRadius="md"
            position="relative"
            p={4}
          >
            <Box height="100%">
              <Doughnut data={chartData} options={options} />
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default SubsystemCompletionChart;