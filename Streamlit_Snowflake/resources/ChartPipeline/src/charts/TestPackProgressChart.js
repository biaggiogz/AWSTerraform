import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import { Box, Heading, HStack, Text, Checkbox, VStack, Flex, Wrap, WrapItem, Button } from '@chakra-ui/react';
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
  
  // State for selected test packs
  const [selectedTestPacks, setSelectedTestPacks] = useState({});
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 40;

  // Calculate metrics by test pack
  const testPackMetrics = calculateMetricsByGroup(data, 'TEST PACK');
  
  // Sort test packs for better visualization
  const sortedTestPacks = Object.entries(testPackMetrics)
    .sort((a, b) => a[0].localeCompare(b[0], undefined, {numeric: true}))
    .reduce((obj, [key, value]) => {
      obj[key] = value;
      return obj;
    }, {});
    
  // Initialize selected test packs on first render
  useEffect(() => {
    const initialSelectedState = Object.keys(sortedTestPacks).reduce((acc, testPack) => {
      acc[testPack] = true;
      return acc;
    }, {});
    setSelectedTestPacks(initialSelectedState);
  }, []);
  
  // Calculate pagination values
  const testPackKeys = Object.keys(sortedTestPacks);
  const totalPages = Math.ceil(testPackKeys.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, testPackKeys.length);
  const currentTestPacks = testPackKeys.slice(startIndex, endIndex);
  
  // Filter test packs based on active filters and selected test packs
  const filteredTestPacks = Object.entries(sortedTestPacks)
    .filter(([key, value]) => {
      // First check if the test pack is selected
      if (!selectedTestPacks[key]) return false;
      
      // Then apply progress filters
      const progress = value.avgConstructionProgress;
      if (progress > 90) return activeFilters.above90;
      if (progress >= 70 && progress <= 90) return activeFilters.between70And90;
      return activeFilters.below70;
    })
    .reduce((obj, [key, value]) => {
      obj[key] = value;
      return obj;
    }, {});
    
  // Filter test packs to only show those on the current page
  const paginatedTestPacks = Object.entries(filteredTestPacks)
    .filter(([key]) => currentTestPacks.includes(key))
    .reduce((obj, [key, value]) => {
      obj[key] = value;
      return obj;
    }, {});
    
  // Prepare chart data with paginated test packs
  const chartData = {
    labels: Object.keys(paginatedTestPacks),
    datasets: [
      {
        label: 'Construction Coordination Progress (%)',
        data: Object.values(paginatedTestPacks).map(testPack => testPack.avgConstructionProgress),
        backgroundColor: Object.values(paginatedTestPacks).map(testPack => {
          const progress = testPack.avgConstructionProgress;
          if (progress > 90) return 'rgba(75, 150, 192, 0.6)'; // Green for Above 90%
          if (progress >= 70 && progress <= 90) return 'rgba(255, 206, 86, 0.6)'; // Yellow for 70-90%
          return 'rgba(255, 99, 132, 0.6)'; // Red for Below 70%
        }),
        borderColor: Object.values(paginatedTestPacks).map(testPack => {
          const progress = testPack.avgConstructionProgress;
          if (progress > 90) return 'rgba(75, 150, 192, 1)'; // Green for Above 90%
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
        display: false,
        labels: {
            color: 'black'  // Set legend label color here
        }
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
  
  // Toggle test pack selection
  const toggleTestPack = (testPack) => {
    setSelectedTestPacks(prev => ({
      ...prev,
      [testPack]: !prev[testPack]
    }));
  };
  
  // Toggle all test packs
  const toggleAllTestPacks = (value) => {
    const newState = Object.keys(sortedTestPacks).reduce((acc, testPack) => {
      acc[testPack] = value;
      return acc;
    }, {});
    setSelectedTestPacks(newState);
  };

  // Handle page navigation
  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
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
        <Box width="15px" height="15px" bg="rgba(75, 150, 192, 0.6)" borderColor="rgba(75, 150, 192, 1)" borderWidth="1px" />
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

  // Test pack selection component
  const testPackSelector = (
    <Box mt={3} mb={2} borderWidth="1px" borderRadius="md" p={2}>
      <Flex justify="space-between" mb={2}>
        <Text fontWeight="bold">Test Pack Selection</Text>
        <HStack>
          <Text as="span" fontSize="sm" cursor="pointer" color="blue.500" onClick={() => toggleAllTestPacks(true)}>Select All</Text>
          <Text as="span" fontSize="sm" mx={2}>|</Text>
          <Text as="span" fontSize="sm" cursor="pointer" color="blue.500" onClick={() => toggleAllTestPacks(false)}>Clear All</Text>
        </HStack>
      </Flex>
      <Box maxH="150px" overflowY="auto" mb={2}>
        <Wrap spacing={2}>
          {currentTestPacks.map(testPack => (
            <WrapItem key={testPack}>
              <Checkbox 
                isChecked={selectedTestPacks[testPack] || false}
                onChange={() => toggleTestPack(testPack)}
                size="sm"
              >
                {testPack}
              </Checkbox>
            </WrapItem>
          ))}
        </Wrap>
      </Box>
      {totalPages > 1 && (
        <Flex justify="space-between" align="center" mt={2}>
          <Text fontSize="sm">
            Page {currentPage} of {totalPages} ({testPackKeys.length} items)
          </Text>
          <HStack>
            <Button 
              size="xs" 
              onClick={() => goToPage(1)} 
              isDisabled={currentPage === 1}
            >
              First
            </Button>
            <Button 
              size="xs" 
              onClick={() => goToPage(currentPage - 1)} 
              isDisabled={currentPage === 1}
            >
              Prev
            </Button>
            <Button 
              size="xs" 
              onClick={() => goToPage(currentPage + 1)} 
              isDisabled={currentPage === totalPages}
            >
              Next
            </Button>
            <Button 
              size="xs" 
              onClick={() => goToPage(totalPages)} 
              isDisabled={currentPage === totalPages}
            >
              Last
            </Button>
          </HStack>
        </Flex>
      )}
    </Box>
  );

  return (
    <Box p={4} borderWidth="1px" borderRadius="lg" bg="white">
      <Heading size="md" mb={2} fontSize="16px">Test Pack Construction Progress</Heading>
      {statusLegend}
      {testPackSelector}
      <Box height={`${Math.max(320, Object.keys(paginatedTestPacks).length * 25)}px`} mt={2}>
        <Bar data={chartData} options={options} />
      </Box>
    </Box>
  );
};

export default TestPackProgressChart;