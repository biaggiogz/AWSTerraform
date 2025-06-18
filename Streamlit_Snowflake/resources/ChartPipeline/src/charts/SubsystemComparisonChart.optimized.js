import React, { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import { Box, Heading } from '@chakra-ui/react';
import { calculateMetricsByGroup } from '../utils/dataProcessor.optimized';

/**
 * Optimized Side-by-Side Bar Chart comparing support installation and welding progress
 * @param {Object} props - Component props
 * @param {Array} props.data - Filtered dataset
 */
const SubsystemComparisonChart = ({ data }) => {
  // Calculate metrics by subsystem with memoization
  const subsystemMetrics = useMemo(() => {
    return calculateMetricsByGroup(data, 'SUBSYSTEM');
  }, [data]);
  
  // Prepare chart data with memoization
  const chartData = useMemo(() => {
    return {
      labels: Object.keys(subsystemMetrics),
      datasets: [
        {
          label: 'Support Installation Progress (%)',
          data: Object.values(subsystemMetrics).map(subsystem => subsystem.supportInstallationProgress),
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1,
        },
        {
          label: 'Welding Progress (%)',
          data: Object.values(subsystemMetrics).map(subsystem => subsystem.avgRatioDoneDiainch),
          backgroundColor: 'rgba(153, 102, 255, 0.6)',
          borderColor: 'rgba(153, 102, 255, 1)',
          borderWidth: 1,
        }
      ]
    };
  }, [subsystemMetrics]);
  
  // Chart options with memoization
  const options = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 500 // Reduced animation time for better performance
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: (context) => {
              const label = context.dataset.label || '';
              return `${label}: ${context.raw.toFixed(2)}%`;
            }
          }
        },
        legend: {
          position: 'top',
        },
        title: {
          display: false,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          title: {
            display: true,
            text: 'Progress (%)'
          }
        },
        x: {
          title: {
            display: true,
            text: 'Subsystem'
          },
          ticks: {
            maxTicksLimit: 15 // Limit the number of ticks for better performance
          }
        }
      }
    };
  }, []);

  return (
    <Box p={4} borderWidth="1px" borderRadius="lg" bg="white" height="400px">
      <Heading size="md" mb={4}>Support Installation vs Welding Progress by Subsystem</Heading>
      <Bar data={chartData} options={options} />
    </Box>
  );
};

// Use React.memo to prevent unnecessary re-renders
export default React.memo(SubsystemComparisonChart);