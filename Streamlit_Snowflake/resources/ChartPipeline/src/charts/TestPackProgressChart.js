import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Box, Heading, HStack, Text } from '@chakra-ui/react';
import { calculateMetricsByGroup, getStatusIcon } from '../utils/dataProcessor';

/**
 * Chart C: Progress Bars with Status Icons for Test Packs
 * @param {Object} props - Component props
 * @param {Array} props.data - Filtered dataset
 */
const TestPackProgressChart = ({ data }) => {
  // Calculate metrics by test pack
  const testPackMetrics = calculateMetricsByGroup(data, 'TEST PACK');
  
  // Prepare chart data
  const chartData = {
    labels: Object.keys(testPackMetrics),
    datasets: [
      {
        label: 'Construction Coordination Progress (%)',
        data: Object.values(testPackMetrics).map(testPack => testPack.avgConstructionProgress),
        backgroundColor: Object.values(testPackMetrics).map(testPack => {
          const progress = testPack.avgConstructionProgress;
          if (progress >= 90) return 'rgba(75, 192, 192, 0.6)'; // Green
          if (progress >= 70) return 'rgba(255, 206, 86, 0.6)'; // Yellow
          return 'rgba(255, 99, 132, 0.6)'; // Red
        }),
        borderColor: Object.values(testPackMetrics).map(testPack => {
          const progress = testPack.avgConstructionProgress;
          if (progress >= 90) return 'rgba(75, 192, 192, 1)'; // Green
          if (progress >= 70) return 'rgba(255, 206, 86, 1)'; // Yellow
          return 'rgba(255, 99, 132, 1)'; // Red
        }),
        borderWidth: 1,
      }
    ]
  };
  
  // Chart options
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y', // Horizontal bar chart
    plugins: {
      tooltip: {
        callbacks: {
          label: (context) => {
            const progress = context.raw;
            const icon = getStatusIcon(progress);
            return `Progress: ${progress.toFixed(2)}% ${icon}`;
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
      x: {
        beginAtZero: true,
        max: 100,
        title: {
          display: true,
          text: 'Construction Coordination Progress (%)'
        }
      },
      y: {
        title: {
          display: true,
          text: 'Test Pack'
        }
      }
    }
  };

  // Legend for status icons
  const statusLegend = (
    <HStack spacing={4} mt={2} justifyContent="center">
      <HStack>
        <Text fontSize="xl">✅</Text>
        <Text>Above 90%</Text>
      </HStack>
      <HStack>
        <Text fontSize="xl">⚠️</Text>
        <Text>70-90%</Text>
      </HStack>
      <HStack>
        <Text fontSize="xl">❌</Text>
        <Text>Below 70%</Text>
      </HStack>
    </HStack>
  );

  return (
    <Box p={4} borderWidth="1px" borderRadius="lg" bg="white" height="400px">
      <Heading size="md" mb={2}>Test Pack Construction Progress</Heading>
      {statusLegend}
      <Box height="320px" mt={2}>
        <Bar data={chartData} options={options} />
      </Box>
    </Box>
  );
};

export default TestPackProgressChart;