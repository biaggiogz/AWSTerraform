import React, { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Box, Heading, HStack, Text, VStack } from '@chakra-ui/react';

// Register the datalabels plugin
Chart.register(ChartDataLabels);

/**
 * ISOLATION PROGRESS CONTROL Chart - Two-Category Vertical Stacked Bar Chart
 * @param {Object} props - Component props
 * @param {Array} props.data - Raw dataset from aislamientos.csv
 */
const IsolationProgressChart = ({ data }) => {
  // Calculate isolation progress metrics with memoization
  const isolationMetrics = useMemo(() => {
    if (!data || data.length === 0) return {};
    
    const categories = {
      'Spacer Advance': 'Avance Distanciadores',
      'Insulation Advance': 'Avance Aislamiento', 
      'Advance Sheet Metal': 'Avance Chapa',
      'Advance Boxes': 'Avance Cajas',
      'Advance to Finish': 'Avance Rematar'
    };
    
    const results = {};
    
    Object.entries(categories).forEach(([displayName, columnName]) => {
      let completed = 0;
      let total = data.length; // Count all records
      
      data.forEach(item => {
        const value = item[columnName];
        // Check if value exists and is 1 (completed)
        if (value && (parseFloat(value) === 1 || value === '1')) {
          completed++;
        }
      });
      
      const completedPercentage = total > 0 ? (completed / total) * 100 : 0;
      const incompletePercentage = 100 - completedPercentage;
      
      results[displayName] = {
        completed: completedPercentage,
        incomplete: incompletePercentage,
        total: total,
        completedCount: completed
      };
    });
    
    return results;
  }, [data]);
  
  // Prepare chart data for vertical stacked bars
  const chartData = useMemo(() => {
    const categories = Object.keys(isolationMetrics);
    const completedData = categories.map(cat => isolationMetrics[cat]?.completed || 0);
    const incompleteData = categories.map(cat => isolationMetrics[cat]?.incomplete || 0);
    
    return {
      labels: categories,
      datasets: [
        {
          label: 'Complete',
          data: completedData,
          backgroundColor: '#1DE9B6', // Green
          borderColor: '#000',
          borderWidth: 2,
          stack: 'stack1'
        },
        {
          label: 'Incomplete', 
          data: incompleteData,
          backgroundColor: '#FF168B', // Magenta
          borderColor: '#000',
          borderWidth: 2,
          stack: 'stack1'
        }
      ]
    };
  }, [isolationMetrics]);
  
  // Chart options with data labels
  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 300
    },
    plugins: {
      datalabels: {
        display: true,
        color: '#000',
        font: {
          weight: 'bold',
          size: 12
        },
        formatter: (value, context) => {
          // Show percentage if it's greater than 8% to avoid clutter on small segments
          return value > 8 ? `${Math.round(value)}%` : '';
        },
        anchor: 'center',
        align: 'center'
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const category = context.label;
            const dataset = context.dataset.label;
            const value = context.raw.toFixed(1);
            const metrics = isolationMetrics[category];
            return [
              `${dataset}: ${value}%`,
              `Total items: ${metrics?.total || 0}`,
              `Completed: ${metrics?.completedCount || 0}`
            ];
          }
        }
      },
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
            weight: 'bold'
          }
        }
      },
      title: {
        display: false
      }
    },
    scales: {
      x: {
        stacked: true,
        title: {
          display: true,
          text: 'Isolation Categories',
          font: {
            size: 14,
            weight: 'bold'
          }
        },
        ticks: {
          font: {
            size: 11
          },
          maxRotation: 45
        },
        grid: {
          display: false
        }
      },
      y: {
        stacked: true,
        beginAtZero: true,
        max: 100,
        title: {
          display: true,
          text: 'Progress (%)',
          font: {
            size: 14,
            weight: 'bold'
          }
        },
        ticks: {
          callback: (value) => `${value}%`,
          font: {
            size: 11
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index'
    }
  }), [isolationMetrics]);
  
  // Calculate overall statistics
  const overallStats = useMemo(() => {
    const categories = Object.keys(isolationMetrics);
    if (categories.length === 0) return { avgCompleted: 0, totalItems: 0 };
    
    const totalCompleted = categories.reduce((sum, cat) => sum + (isolationMetrics[cat]?.completed || 0), 0);
    const avgCompleted = categories.length > 0 ? totalCompleted / categories.length : 0;
    const totalItems = data?.length || 0;
    
    return { avgCompleted, totalItems };
  }, [isolationMetrics, data]);

  return (
    <VStack spacing={4} align="stretch">
      {/* Header with overall metrics */}
      <Box p={4} borderWidth="1px" borderRadius="lg" bg="gray.50">
        <Heading size="md" mb={3} textAlign="center">
          ISOLATION PROGRESS CONTROL
        </Heading>
        <HStack justify="center" spacing={8}>
          <Box textAlign="center">
            <Text fontSize="sm" color="gray.600">Average Completion</Text>
            <Text fontSize="2xl" fontWeight="bold" color="green.600">
              {overallStats.avgCompleted.toFixed(1)}%
            </Text>
          </Box>
          <Box textAlign="center">
            <Text fontSize="sm" color="gray.600">Total Items</Text>
            <Text fontSize="2xl" fontWeight="bold" color="gray.700">
              {overallStats.totalItems}
            </Text>
          </Box>
        </HStack>
      </Box>
      
      {/* Vertical Stacked Bar Chart */}
      <Box p={4} borderWidth="1px" borderRadius="lg" bg="white" height="500px">
        <Bar data={chartData} options={options} />
      </Box>
      
      {/* Legend explanation */}
      <Box p={3} borderWidth="1px" borderRadius="md" bg="blue.50">
        <HStack justify="center" spacing={6}>
          <HStack>
            <Box width="15px" height="15px" bg="#1DE9B6" borderColor="#000" borderWidth="1px" />
            <Text fontSize="sm" fontWeight="medium">Complete</Text>
          </HStack>
          <HStack>
            <Box width="15px" height="15px" bg="#FF168B" borderColor="#000" borderWidth="1px" />
            <Text fontSize="sm" fontWeight="medium">Incomplete</Text>
          </HStack>
        </HStack>
      </Box>
    </VStack>
  );
};

export default React.memo(IsolationProgressChart);