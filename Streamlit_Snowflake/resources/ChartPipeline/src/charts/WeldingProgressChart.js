import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Box, Heading } from '@chakra-ui/react';
import { calculateMetricsByGroup } from '../utils/dataProcessor';

/**
 * Chart A: Welding Progress by Area
 * @param {Object} props - Component props
 * @param {Array} props.data - Filtered dataset
 */
const WeldingProgressChart = ({ data }) => {
  // Calculate metrics by area
  const areaMetrics = calculateMetricsByGroup(data, 'Design Area');
  
  // Prepare chart data
  const chartData = {
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
  
  // Chart options
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      tooltip: {
        callbacks: {
          label: (context) => {
            return `Progress: ${context.raw.toFixed(2)}%`;
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

  return (
    <Box p={4} borderWidth="1px" borderRadius="lg" bg="white" height="400px">
      <Heading size="md" mb={4}>Welding Progress by Area</Heading>
      <Bar data={chartData} options={options} />
    </Box>
  );
};

export default WeldingProgressChart;