import React, { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import { Box, Heading } from '@chakra-ui/react';
import { calculateMetricsByGroup } from '../utils/dataProcessor';

/**
 * Chart A: Welding Progress by Area with optimized rendering
 * @param {Object} props - Component props
 * @param {Array} props.data - Filtered dataset
 */
const WeldingProgressChart = ({ data }) => {
  // Calculate metrics by area with memoization
  const areaMetrics = useMemo(() => {
    return calculateMetricsByGroup(data, 'Design Area');
  }, [data]);
  
  // Prepare chart data with memoization
  const chartData = useMemo(() => {
    return {
      labels: Object.keys(areaMetrics),
      datasets: [
        {
          label: 'Welding Progress (%)',
          data: Object.values(areaMetrics).map(area => area.avgRatioDoneDiainch),
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1,
        }
      ]
    };
  }, [areaMetrics]);
  
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
              return `Progress: ${context.raw.toFixed(2)}%`;
            }
          },
          enabled: true,
          mode: 'index',
          intersect: false
        },
        legend: {
          position: 'top',
          labels: {
            boxWidth: 10,
            usePointStyle: true
          }
        },
        title: {
          display: false,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          ticks: {
            maxTicksLimit: 5 // Limit the number of ticks for better performance
          },
          title: {
            display: true,
            text: 'Average Welding Progress (%)'
          }
        },
        x: {
          title: {
            display: true,
            text: 'Design Area'
          }
        }
      }
    };
  }, []);

  return (
    <Box p={4} borderWidth="1px" borderRadius="lg" bg="white" height="400px">
      <Heading size="md" mb={4}>Welding Progress by Area</Heading>
      <Bar data={chartData} options={options} />
    </Box>
  );
};

export default React.memo(WeldingProgressChart);