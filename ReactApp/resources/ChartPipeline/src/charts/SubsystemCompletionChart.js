import React, { useMemo, useState } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { 
  Box, 
  Heading, 
  HStack, 
  Text, 
  VStack, 
  Badge
} from '@chakra-ui/react';
import Chart from 'chart.js/auto';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { useLazosTableSqlFilterContext } from '../components/filters/LazosTableFilter';

// Register the plugin
Chart.register(ChartDataLabels);

/**
 * Subsystem Completion Chart showing DONE vs PENDING subsystems
 * @param {Object} props - Component props
 * @param {Array} props.data - Filtered dataset from table
 */
const SubsystemCompletionChart = ({ data }) => {
  const { handleSubsystemClick } = useLazosTableSqlFilterContext();
  const [completionFilter, setCompletionFilter] = useState(null);
  // Calculate subsystem completion metrics
  const completionMetrics = useMemo(() => {
    if (!data || data.length === 0) return { done: 0, pending: 0, doneSubsystems: [], pendingSubsystems: [] };
    
    const subsystemStats = {};
    
    // Calculate stats for each subsystem
    data.forEach(item => {
      const subsystem = item['SUBSYSTEM'];
      if (!subsystem) return;
      
      if (!subsystemStats[subsystem]) {
        subsystemStats[subsystem] = {
          totalLoops: 0,
          loopSignalDone: 0
        };
      }
      
      subsystemStats[subsystem].totalLoops++;
      
      const okValue = item['OK100'];
      const okPercent = parseFloat(okValue) || 0;
      
      if (okPercent === 1.0) {
        subsystemStats[subsystem].loopSignalDone++;
      }
    });
    
    // Categorize subsystems
    const doneSubsystems = [];
    const pendingSubsystems = [];
    
    Object.entries(subsystemStats).forEach(([subsystem, stats]) => {
      if (stats.totalLoops === stats.loopSignalDone) {
        doneSubsystems.push(subsystem);
      } else {
        pendingSubsystems.push(subsystem);
      }
    });
    
    return {
      done: doneSubsystems.length,
      pending: pendingSubsystems.length,
      doneSubsystems,
      pendingSubsystems
    };
  }, [data]);
  
  // Chart data
  const chartData = {
    labels: ['DONE SUBSYSTEMS', 'PENDING SUBSYSTEMS'],
    datasets: [{
      data: [completionMetrics.done, completionMetrics.pending],
      backgroundColor: ['#22C55E', '#F97316'],
      borderColor: ['#16A34A', '#EA580C'],
      borderWidth: 2
    }]
  };
  
  // Chart options
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    onClick: (event, elements) => {
      if (elements.length > 0) {
        const index = elements[0].index;
        if (index === 0 && completionMetrics.doneSubsystems.length > 0) {
          handleSubsystemClick(completionMetrics.doneSubsystems[0]);
          setCompletionFilter('DONE');
        } else if (index === 1 && completionMetrics.pendingSubsystems.length > 0) {
          handleSubsystemClick(completionMetrics.pendingSubsystems[0]);
          setCompletionFilter('PENDING');
        }
      }
    },
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          font: {
            size: 12
          }
        },
        onClick: (event, legendItem) => {
          const index = legendItem.index;
          if (index === 0 && completionMetrics.doneSubsystems.length > 0) {
            handleSubsystemClick(completionMetrics.doneSubsystems[0]);
            setCompletionFilter('DONE');
          } else if (index === 1 && completionMetrics.pendingSubsystems.length > 0) {
            handleSubsystemClick(completionMetrics.pendingSubsystems[0]);
            setCompletionFilter('PENDING');
          }
        }
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label;
            const value = context.raw;
            const total = completionMetrics.done + completionMetrics.pending;
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      },
      datalabels: {
        color: 'white',
        font: {
          weight: 'bold',
          size: 14
        },
        formatter: (value, context) => {
          const total = completionMetrics.done + completionMetrics.pending;
          const percentage = total > 0 ? ((value / total) * 100).toFixed(0) : 0;
          return value > 0 ? `${value}\n(${percentage}%)` : '';
        }
      }
    }
  };
  
  const total = completionMetrics.done + completionMetrics.pending;
  
  return (
    <Box p={4} borderWidth="1px" borderRadius="lg" bg="white" mt={4}>
      <Heading size="md" mb={2}>SUBSYSTEM COMPLETION STATUS</Heading>
      
      {/* Global metrics */}
      <HStack mb={4} justify="center" spacing={6}>
        <VStack>
          <Badge 
            colorScheme={completionFilter === 'DONE' ? 'green' : 'gray'} 
            fontSize="md" 
            px={3} 
            py={1}
            cursor="pointer"
            onClick={() => {
              if (completionMetrics.doneSubsystems.length > 0) {
                handleSubsystemClick(completionMetrics.doneSubsystems[0]);
                setCompletionFilter('DONE');
              }
            }}
          >
            DONE: {completionMetrics.done}
          </Badge>
          <Text fontSize="xs" color="gray.600">
            Total = Loop Signal Done
          </Text>
        </VStack>
        <VStack>
          <Badge 
            colorScheme={completionFilter === 'PENDING' ? 'orange' : 'gray'} 
            fontSize="md" 
            px={3} 
            py={1}
            cursor="pointer"
            onClick={() => {
              if (completionMetrics.pendingSubsystems.length > 0) {
                handleSubsystemClick(completionMetrics.pendingSubsystems[0]);
                setCompletionFilter('PENDING');
              }
            }}
          >
            PENDING: {completionMetrics.pending}
          </Badge>
          <Text fontSize="xs" color="gray.600">
            Loop Signal Done &lt; Total
          </Text>
        </VStack>
        <VStack>
          <Badge colorScheme="blue" fontSize="md" px={3} py={1}>
            TOTAL: {total}
          </Badge>
          <Text fontSize="xs" color="gray.600">
            Subsystems
          </Text>
        </VStack>
      </HStack>
      
      {/* Chart */}
      <Box height="300px">
        <Doughnut data={chartData} options={options} />
      </Box>
    </Box>
  );
};

export default React.memo(SubsystemCompletionChart);