import React, { useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { Box, Heading, HStack, Text } from '@chakra-ui/react';
import { calculateMetricsByGroup } from '../utils/dataProcessor';

/**
 * Chart C: Progress Bars with Status Icons for Test Packs
 * @param {Object} props - Component props
 * @param {Array} props.data - Filtered dataset
 */
const TestPackProgressChart = ({ data }) => {
  // State for active filters
  const [activeFilters, setActiveFilters] = useState({
    above90: true,
    between70And90: true,
    below70: true
  });

  // Calculate metrics by test pack
  const testPackMetrics = calculateMetricsByGroup(data, 'TEST PACK');
  
  // Sort test packs for better visualization
  const sortedTestPacks = Object.entries(testPackMetrics)
    .sort((a, b) => a[0].localeCompare(b[0], undefined, {numeric: true}))
    .reduce((obj, [key, value]) => {
      obj[key] = value;
      return obj;
    }, {});
  
  // Filter test packs based on active filters
  const filteredTestPacks = Object.entries(sortedTestPacks)
    .filter(([_, value]) => {
      const progress = value.avgConstructionProgress;
      if (progress > 90) return activeFilters.above90;
      if (progress >= 70 && progress <= 90) return activeFilters.between70And90;
      return activeFilters.below70;
    })
    .reduce((obj, [key, value]) => {
      obj[key] = value;
      return obj;
    }, {});
    
  // Prepare chart data
  const chartData = {
    labels: Object.keys(filteredTestPacks),
    datasets: [
      {
        label: 'Construction Coordination Progress (%)',
        data: Object.values(filteredTestPacks).map(testPack => testPack.avgConstructionProgress),
        backgroundColor: Object.values(filteredTestPacks).map(testPack => {
          const progress = testPack.avgConstructionProgress;
          if (progress > 90) return 'rgba(75, 192, 192, 0.6)'; // Green for Above 90%
          if (progress >= 70 && progress <= 90) return 'rgba(255, 206, 86, 0.6)'; // Yellow for 70-90%
          return 'rgba(255, 40, 132, 0.6)'; // Red for Below 70%
        }),
        borderColor: Object.values(filteredTestPacks).map(testPack => {
          const progress = testPack.avgConstructionProgress;
          if (progress > 90) return 'rgba(75, 192, 192, 1)'; // Green for Above 90%
          if (progress >= 70 && progress <= 90) return 'rgba(255, 206, 86, 1)'; // Yellow for 70-90%
          return 'rgba(255, 99, 132, 1)'; // Red for Below 70%
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
            let status = '';
            if (progress > 90) status = '(Good)';
            else if (progress >= 70 && progress <= 90) status = '(Warning)';
            else status = '(Critical)';
            return `Progress: ${progress.toFixed(2)}% ${status}`;
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
        },
        ticks: {
          autoSkip: false, // Prevent automatic skipping of labels
          callback: function(value) {
            // Ensure all labels are displayed by returning the original value
            return this.getLabelForValue(value);
          }
        }
      }
    }
  };

  // Toggle filter function
  const toggleFilter = (filter) => {
    setActiveFilters(prev => ({
      ...prev,
      [filter]: !prev[filter]
    }));
  };

  // Legend for status icons with interactive filtering
  const statusLegend = (
    <HStack spacing={4} mt={2} justifyContent="center">
      <HStack 
        onClick={() => toggleFilter('above90')} 
        cursor="pointer" 
        opacity={activeFilters.above90 ? 1 : 0.5}
        p={1}
        borderRadius="md"
        _hover={{ bg: "gray.100" }}
      >
        <Box width="15px" height="15px" bg="rgba(75, 192, 192, 0.6)" borderColor="rgba(75, 192, 192, 1)" borderWidth="1px" />
        <Text>Above 90%</Text>
      </HStack>
      <HStack 
        onClick={() => toggleFilter('between70And90')} 
        cursor="pointer" 
        opacity={activeFilters.between70And90 ? 1 : 0.5}
        p={1}
        borderRadius="md"
        _hover={{ bg: "gray.100" }}
      >
        <Box width="15px" height="15px" bg="rgba(255, 206, 86, 0.6)" borderColor="rgba(255, 206, 86, 1)" borderWidth="1px" />
        <Text>70-90%</Text>
      </HStack>
      <HStack 
        onClick={() => toggleFilter('below70')} 
        cursor="pointer" 
        opacity={activeFilters.below70 ? 1 : 0.5}
        p={1}
        borderRadius="md"
        _hover={{ bg: "gray.100" }}
      >
        <Box width="15px" height="15px" bg="rgba(255, 99, 132, 0.6)" borderColor="rgba(255, 99, 132, 1)" borderWidth="1px" />
        <Text>Below 70%</Text>
      </HStack>
    </HStack>
  );

  return (
    <Box p={4} borderWidth="1px" borderRadius="lg" bg="white" height={`${Math.max(400, Object.keys(filteredTestPacks).length * 25)}px`}>
      <Heading size="md" mb={2}>Test Pack Construction Progress</Heading>
      {statusLegend}
      <Box height={`${Math.max(320, Object.keys(filteredTestPacks).length * 25)}px`} mt={2}>
        <Bar data={chartData} options={options} />
      </Box>
    </Box>
  );
};

export default TestPackProgressChart;