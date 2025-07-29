import React, { useMemo } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Box, Heading, Text, VStack, HStack, Badge } from '@chakra-ui/react';
import { useLazosTableSqlFilterContext } from '../components/filters/LazosTableFilter';

const SubsystemDonutChart = () => {
  const { tableData, selectedSubsystem, handleSubsystemClick } = useLazosTableSqlFilterContext();

  // Calculate subsystem completion status
  const subsystemMetrics = useMemo(() => {
    if (!tableData || tableData.length === 0) return { done: 0, pending: 0, subsystems: [] };

    const subsystemStatus = {};
    
    // Group by subsystem and check completion
    tableData.forEach(item => {
      const subsystem = item['SUBSYSTEM'];
      if (!subsystem) return;
      
      if (!subsystemStatus[subsystem]) {
        subsystemStatus[subsystem] = { total: 0, completed: 0 };
      }
      
      subsystemStatus[subsystem].total++;
      const okValue = parseFloat(item['OK100']) || 0;
      if (okValue === 1.0) {
        subsystemStatus[subsystem].completed++;
      }
    });

    // Determine done vs pending subsystems
    let done = 0;
    let pending = 0;
    const subsystems = [];

    Object.entries(subsystemStatus).forEach(([subsystem, status]) => {
      const isDone = status.completed === status.total && status.total > 0;
      subsystems.push({ name: subsystem, isDone, ...status });
      
      if (isDone) {
        done++;
      } else {
        pending++;
      }
    });

    return { done, pending, subsystems };
  }, [tableData]);

  // Chart data
  const chartData = {
    labels: ['Subsystems Done', 'Subsystems Pending'],
    datasets: [{
      data: [subsystemMetrics.done, subsystemMetrics.pending],
      backgroundColor: ['#1DE9B6', '#FF168B'],
      borderColor: ['#1DE9B6', '#FF168B'],
      borderWidth: 2,
      hoverBackgroundColor: ['#16C79A', '#E6146F']
    }]
  };

  // Chart options
  const options = {
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
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label;
            const value = context.raw;
            const total = subsystemMetrics.done + subsystemMetrics.pending;
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    },
    cutout: '60%',
    onClick: (event, elements) => {
      if (elements.length > 0) {
        const index = elements[0].index;
        // Show subsystems list for clicked segment
        const isDoneSegment = index === 0;
        const relevantSubsystems = subsystemMetrics.subsystems.filter(s => s.isDone === isDoneSegment);
        console.log(isDoneSegment ? 'Done Subsystems:' : 'Pending Subsystems:', relevantSubsystems);
      }
    }
  };

  const total = subsystemMetrics.done + subsystemMetrics.pending;

  return (
    <Box p={4} borderWidth="1px" borderRadius="lg" bg="white">
      <VStack spacing={4}>
        <Heading size="md">Subsystem Completion Status</Heading>
        
        <HStack spacing={4}>
          <Badge colorScheme="green">Done: {subsystemMetrics.done}</Badge>
          <Badge colorScheme="red">Pending: {subsystemMetrics.pending}</Badge>
          <Badge colorScheme="blue">Total: {total}</Badge>
        </HStack>

        {selectedSubsystem && (
          <Badge colorScheme="orange" fontSize="sm">
            Filtered by: {selectedSubsystem}
          </Badge>
        )}

        <Box height="300px" width="100%">
          <Doughnut data={chartData} options={options} />
        </Box>

        {/* Center text showing completion percentage */}
        <Box position="absolute" top="50%" left="50%" transform="translate(-50%, -50%)" textAlign="center">
          <Text fontSize="2xl" fontWeight="bold" color="green.500">
            {total > 0 ? ((subsystemMetrics.done / total) * 100).toFixed(1) : 0}%
          </Text>
          <Text fontSize="sm" color="gray.600">Complete</Text>
        </Box>
      </VStack>
    </Box>
  );
};

export default React.memo(SubsystemDonutChart);