import React, { useState, useEffect, useRef } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Box,
  Heading,
  HStack,
  Text,
  VStack,
  Flex,
  Button,
  Tooltip,
  SimpleGrid,
  Badge,
  Divider
} from '@chakra-ui/react';
import { calculateMetricsByGroup } from '../utils/dataProcessor';

/**
 * Chart C: Progress Bars with Status Icons for Test Packs
 * @param {Object} props - Component props
 * @param {Array} props.data - Filtered dataset
 */
const TestPackProgressChart = ({ data }) => {
  // State for exclusive filter (only one active at a time, or all active)
  const [exclusiveFilter, setExclusiveFilter] = useState(null);

  // State for selected test packs
  const [selectedTestPacks, setSelectedTestPacks] = useState({});
  
  // Reference for chart container
  const chartContainerRef = useRef(null);
  
  // Maximum number of visible test packs at once
  const MAX_VISIBLE_TEST_PACKS = 15;
  
  // Bar height in pixels (for calculating chart height)
  const BAR_HEIGHT = 30;

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

  // Filter test packs based on exclusive filter and selected test packs
  const filteredTestPacks = Object.entries(sortedTestPacks)
    .filter(([key, value]) => {
      // First check if the test pack is selected
      if (!selectedTestPacks[key]) return false;

      // Then apply exclusive filter if active
      if (exclusiveFilter) {
        const progress = value.avgConstructionProgress;
        if (exclusiveFilter === 'above90') return progress > 90;
        if (exclusiveFilter === 'between70And90') return progress >= 70 && progress <= 90;
        if (exclusiveFilter === 'below70') return progress < 70;
      }

      // If no exclusive filter, show all
      return true;
    })
    .reduce((obj, [key, value]) => {
      obj[key] = value;
      return obj;
    }, {});
    
  // Calculate dynamic chart height based on number of test packs
  const chartHeight = Math.max(
    500, // Minimum height
    Object.keys(filteredTestPacks).length * BAR_HEIGHT + 100 // Dynamic height based on number of bars + padding
  );

  // Prepare chart data with filtered test packs
  const chartData = {
    labels: Object.keys(filteredTestPacks),
    datasets: [
      {
        label: 'Construction Coordination Progress (%)',
        data: Object.values(filteredTestPacks).map(testPack => testPack.avgConstructionProgress),
        backgroundColor: Object.values(filteredTestPacks).map(testPack => {
          const progress = testPack.avgConstructionProgress;
          if (progress > 90) return 'rgb(0, 112, 116)'; // Green for Above 90%
          if (progress >= 70 && progress <= 90) return 'rgba(255, 206, 86, 0.6)'; // Yellow for 70-90%
          return 'rgba(255, 99, 132, 0.6)'; // Red for Below 70%
        }),
        borderColor: Object.values(filteredTestPacks).map(testPack => {
          const progress = testPack.avgConstructionProgress;
          if (progress > 90) return 'rgb(0, 112, 116)'; // Green for Above 90%
          if (progress >= 70 && progress <= 90) return 'rgba(255, 206, 86, 1)'; // Yellow for 70-90%
          return 'rgba(255, 99, 132, 1)'; // Red for Below 70%
        }),
        borderWidth: 1,
        barThickness: BAR_HEIGHT - 10, // Set fixed bar thickness
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
          },
          font: {
            size: 11 // Slightly smaller font for labels
          }
        },
        grid: {
          display: true,
          drawBorder: true,
          drawOnChartArea: true,
          drawTicks: true,
          color: 'rgba(0, 0, 0, 0.1)' // Light grid lines
        }
      }
    },
    layout: {
      padding: {
        left: 10,
        right: 10,
        top: 0,
        bottom: 10
      }
    }
  };

  // Toggle exclusive filter function
  const toggleExclusiveFilter = (filter) => {
    setExclusiveFilter(prev => prev === filter ? null : filter);
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

  // Invert test pack selection
  const invertTestPackSelection = () => {
    const invertedState = Object.keys(sortedTestPacks).reduce((acc, testPack) => {
      acc[testPack] = !selectedTestPacks[testPack];
      return acc;
    }, {});
    setSelectedTestPacks(invertedState);
  };

  // Get color based on progress
  const getProgressColor = (progress) => {
    if (progress > 90) return { bg: "rgba(75, 150, 192, 0.6)", border: "rgba(75, 150, 192, 1)" };
    if (progress >= 70) return { bg: "rgba(255, 206, 86, 0.6)", border: "rgba(255, 206, 86, 1)" };
    return { bg: "rgba(255, 99, 132, 0.6)", border: "rgba(255, 99, 132, 1)" };
  };

  // Legend for status icons with interactive filtering
  const statusLegend = (
    <HStack spacing={4} justifyContent="center">
      <Tooltip label={exclusiveFilter === 'above90' ? "Click to show all categories" : "Click to show only this category"} placement="top">
        <HStack
          onClick={() => toggleExclusiveFilter('above90')}
          cursor="pointer"
          p={1}
          borderRadius="md"
          bg={exclusiveFilter === 'above90' ? "blue.50" : "transparent"}
          borderWidth="1px"
          borderColor={exclusiveFilter === 'above90' ? "blue.300" : "transparent"}
          _hover={{ bg: "gray.100" }}
        >
          <Box width="15px" height="15px" bg="rgb(0, 112, 116)" borderColor="rgb(0, 112, 116)" borderWidth="1px" />
          <Text fontWeight={exclusiveFilter === 'above90' ? "bold" : "normal"}>Above 90%</Text>
          {exclusiveFilter === 'above90' && <Text fontSize="xs" color="blue.500" ml={1}>(active)</Text>}
        </HStack>
      </Tooltip>

      <Tooltip label={exclusiveFilter === 'between70And90' ? "Click to show all categories" : "Click to show only this category"} placement="top">
        <HStack
          onClick={() => toggleExclusiveFilter('between70And90')}
          cursor="pointer"
          p={1}
          borderRadius="md"
          bg={exclusiveFilter === 'between70And90' ? "blue.50" : "transparent"}
          borderWidth="1px"
          borderColor={exclusiveFilter === 'between70And90' ? "blue.300" : "transparent"}
          _hover={{ bg: "gray.100" }}
        >
          <Box width="15px" height="15px" bg="rgba(255, 206, 86, 0.6)" borderColor="rgba(255, 206, 86, 1)" borderWidth="1px" />
          <Text fontWeight={exclusiveFilter === 'between70And90' ? "bold" : "normal"}>70-90%</Text>
          {exclusiveFilter === 'between70And90' && <Text fontSize="xs" color="blue.500" ml={1}>(active)</Text>}
        </HStack>
      </Tooltip>

      <Tooltip label={exclusiveFilter === 'below70' ? "Click to show all categories" : "Click to show only this category"} placement="top">
        <HStack
          onClick={() => toggleExclusiveFilter('below70')}
          cursor="pointer"
          p={1}
          borderRadius="md"
          bg={exclusiveFilter === 'below70' ? "blue.50" : "transparent"}
          borderWidth="1px"
          borderColor={exclusiveFilter === 'below70' ? "blue.300" : "transparent"}
          _hover={{ bg: "gray.100" }}
        >
          <Box width="15px" height="15px" bg="rgba(255, 99, 132, 0.6)" borderColor="rgba(255, 99, 132, 1)" borderWidth="1px" />
          <Text fontWeight={exclusiveFilter === 'below70' ? "bold" : "normal"}>Below 70%</Text>
          {exclusiveFilter === 'below70' && <Text fontSize="xs" color="blue.500" ml={1}>(active)</Text>}
        </HStack>
      </Tooltip>
    </HStack>
  );

  // Redesigned Test Pack Selection Panel
  const testPackSelectionPanel = (
    <Box
      borderWidth="1px"
      borderRadius="lg"
      p={3}
      bg="white"
      height="100%"
      display="flex"
      flexDirection="column"
    >
      <Flex justify="space-between" align="center" mb={3}>
        <Heading size="sm">TOTAL TEST PACKS: {Object.keys(sortedTestPacks).length}</Heading>
      </Flex>

      <HStack spacing={2} mb={3}>
        <Button size="xs" colorScheme="blue" onClick={() => toggleAllTestPacks(true)}>Select All</Button>
        <Button size="xs" colorScheme="gray" onClick={() => toggleAllTestPacks(false)}>Clear All</Button>
        <Button size="xs" colorScheme="teal" onClick={invertTestPackSelection}>Invert</Button>
      </HStack>

      <Divider mb={3} />

      <Box
        overflowY="auto"
        flex="1"
        css={{
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            width: '10px',
            background: '#f1f1f1',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#cccccc',
            borderRadius: '24px',
          },
        }}
      >
        <SimpleGrid columns={3} spacing={2}>
          {Object.entries(sortedTestPacks).map(([testPack, metrics], index) => {
            const progress = metrics.avgConstructionProgress;
            const colors = getProgressColor(progress);
            const isSelected = selectedTestPacks[testPack] || false;
            const isVisible = !exclusiveFilter ||
                             (exclusiveFilter === 'above90' && progress > 90) ||
                             (exclusiveFilter === 'between70And90' && progress >= 70 && progress <= 90) ||
                             (exclusiveFilter === 'below70' && progress < 70);

            return (
              <Button
                key={testPack}
                size="sm"
                height="36px"
                variant={isSelected ? "solid" : "outline"}
                  colorScheme={isSelected ? "blue" : "gray"} // keep this to set the overall theme
                  bg={isSelected ? "blue.300" : undefined}   // manually override bg color for selected
                  color={isSelected ? "white" : undefined}   // text color when selected
                opacity={isVisible ? 1 : 0.5}
                onClick={() => toggleTestPack(testPack)}
                mb={1}
                position="relative"
                overflow="hidden"
//                _after={{
//                  content: '""',
//                  position: 'absolute',
//                  bottom: '0',
//                  left: '0',
//                  width: '100%',
//                  height: '3px',
//                  backgroundColor: colors.bg,
//                  borderColor: colors.border,
//                  borderWidth: '1px'
//                }}
              >
                <VStack spacing={0} align="center">
                  <Text fontSize="xs" fontWeight="bold" noOfLines={1}>
                    {testPack}
                  </Text>
                  <Text fontSize="10px" color={getProgressColor(progress)} noOfLines={1}>
                    {progress.toFixed(1)}%
                  </Text>
                </VStack>
              </Button>
            );
          })}
        </SimpleGrid>
      </Box>
    </Box>
  );

  return (
    <Flex>
      {/* Left side - Test Pack Selection Panel */}
      <Box width="220px" mr={4}>
        {testPackSelectionPanel}
      </Box>

      {/* Right side - Chart */}
      <Box flex="1" borderWidth="1px" borderRadius="lg" bg="white" display="flex" flexDirection="column">
        {/* Sticky header section */}
        <Box
          position="sticky"
          top="0"
          bg="white"
          pt={4}
          pb={2}
          zIndex="10"
          borderBottomWidth="1px"
          borderBottomColor="gray.200"
        >
          <Heading size="md" mb={2}>Test Pack Construction Progress</Heading>
          {exclusiveFilter && (
            <Text fontSize="sm" color="blue.600" mb={2} textAlign="center">
              Showing only {exclusiveFilter === 'above90' ? 'Above 90%' : exclusiveFilter === 'between70And90' ? '70-90%' : 'Below 70%'} test packs
            </Text>
          )}
          {statusLegend}
        </Box>

        {/* Scrollable chart container */}
        <Box 
          ref={chartContainerRef}
          flex="1" 
          overflowY="auto"
          overflowX="hidden"
          p={4}
          css={{
            '&::-webkit-scrollbar': {
              width: '8px',
            },
            '&::-webkit-scrollbar-track': {
              width: '10px',
              background: '#f1f1f1',
            },
            '&::-webkit-scrollbar-thumb': {
              background: '#cccccc',
              borderRadius: '24px',
            },
          }}
        >
          <Box height={`${chartHeight}px`} position="relative">
            <Bar data={chartData} options={options} />
          </Box>
        </Box>
        
        {/* Info text about scrolling */}
        {Object.keys(filteredTestPacks).length > MAX_VISIBLE_TEST_PACKS && (
          <Text fontSize="xs" color="gray.500" textAlign="center" p={2} borderTopWidth="1px">
            Showing {Object.keys(filteredTestPacks).length} test packs. Scroll to view all.
          </Text>
        )}
      </Box>
    </Flex>
  );
};

export default TestPackProgressChart;