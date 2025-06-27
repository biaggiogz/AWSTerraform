import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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
  
  // Force chart re-render when filters change
  const [chartKey, setChartKey] = useState(0);
  
  // Maximum number of visible test packs at once
  const MAX_VISIBLE_TEST_PACKS = 15;
  
  // Bar height in pixels (for calculating chart height)
  const BAR_HEIGHT = 30;

  // Calculate metrics by test pack with memoization
  const testPackMetrics = useMemo(() => {
    if (!data || data.length === 0) return {};
    
    // Group data by test pack (handle pipe-separated IDs), calculate average CONSTRUC COORD PROGRESS per test pack
    const testPackGroups = {};
    data.forEach(row => {
        if (row['TEST PACK'] && row['CONSTRUC COORD PROGRESS'] > 0) {
            // Split pipe-separated test packs (e.g., "1245|382" becomes ["1245", "382"])
            const testPacks = row['TEST PACK'].split('|');

            testPacks.forEach(testPackId => {
                const trimmedId = testPackId.trim();
                if (trimmedId) {
                    if (!testPackGroups[trimmedId]) {
                        testPackGroups[trimmedId] = { total: 0, count: 0 };
                    }
                    // Add CONSTRUC COORD PROGRESS value to this test pack group
                    testPackGroups[trimmedId].total += row['CONSTRUC COORD PROGRESS'];
                    testPackGroups[trimmedId].count++;
                }
            });
        }
    });

    // Calculate final averages for each test pack
    const testPackAverages = {};
    Object.keys(testPackGroups).forEach(testPackId => {
        const group = testPackGroups[testPackId];
        testPackAverages[testPackId] = {
            avgConstructionProgress: Math.round(group.total / group.count)
        };
    });
    
    return testPackAverages;
  }, [data]);

  // Sort test packs for better visualization with memoization
  const sortedTestPacks = useMemo(() => {
    return Object.entries(testPackMetrics)
      .sort((a, b) => a[0].localeCompare(b[0], undefined, {numeric: true}))
      .reduce((obj, [key, value]) => {
        obj[key] = value;
        return obj;
      }, {});
  }, [testPackMetrics]);

  // Initialize selected test packs on first render
  useEffect(() => {
    const testPackKeys = Object.keys(sortedTestPacks);
    if (testPackKeys.length > 0 && Object.keys(selectedTestPacks).length === 0) {
      const initialSelectedState = testPackKeys.reduce((acc, testPack) => {
        acc[testPack] = true;
        return acc;
      }, {});
      setSelectedTestPacks(initialSelectedState);
    }
  }, [sortedTestPacks]);

  // Filter test packs based on exclusive filter and selected test packs with memoization
  const filteredTestPacks = useMemo(() => {
    return Object.entries(sortedTestPacks)
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
  }, [sortedTestPacks, selectedTestPacks, exclusiveFilter]);
    
  // Calculate dynamic chart height based on number of test packs
  const chartHeight = useMemo(() => {
    const filteredCount = Object.keys(filteredTestPacks).length;
    return Math.max(
      500, // Minimum height
      filteredCount * BAR_HEIGHT + 100 // Dynamic height based on number of bars + padding
    );
  }, [filteredTestPacks]);

  // Update chart when filters change
  useEffect(() => {
    setChartKey(prev => prev + 1);
    
    // Trigger resize to recalculate layout
    if (chartContainerRef.current) {
      setTimeout(() => window.dispatchEvent(new Event('resize')), 50);
    }
  }, [Object.keys(filteredTestPacks).length]);

  // Prepare chart data with filtered test packs
  const chartData = useMemo(() => {
    const filteredKeys = Object.keys(filteredTestPacks);
    const filteredValues = Object.values(filteredTestPacks);
    
    return {
      labels: filteredKeys,
      datasets: [
        {
          label: 'Construction Coordination Progress (%)',
          data: filteredValues.map(testPack => testPack.avgConstructionProgress),
          backgroundColor: filteredValues.map(testPack => {
            const progress = testPack.avgConstructionProgress;
            if (progress > 90) return 'rgb(0, 112, 116)'; // Green for Above 90%
            if (progress >= 70 && progress <= 90) return 'rgba(255, 206, 86, 0.6)'; // Yellow for 70-90%
            return 'rgba(255, 99, 132, 0.6)'; // Red for Below 70%
          }),
          borderColor: filteredValues.map(testPack => {
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
  }, [filteredTestPacks]);

  // Chart options with memoization
  const options = useMemo(() => {
    const filteredCount = Object.keys(filteredTestPacks).length;
    
    return {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y', // Horizontal bar chart
      animation: {
        duration: filteredCount <= 5 ? 0 : 300 // Disable animation for small datasets
      },
      plugins: {
        tooltip: {
          enabled: false, // Disable tooltips for better performance
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
          },
          grid: {
            display: true,
            color: 'rgba(0, 0, 0, 0.1)' // Light grid lines
          }
        },
        y: {
          title: {
            display: true,
            text: 'Test Pack'
          },
          ticks: {
            autoSkip: false, // Never skip labels to show all test pack IDs
            maxTicksLimit: false, // Remove tick limit to show all labels
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
  }, [filteredTestPacks]);

  // Toggle exclusive filter function with useCallback
  const toggleExclusiveFilter = useCallback((filter) => {
    setExclusiveFilter(prev => prev === filter ? null : filter);
  }, []);

  // Toggle test pack selection with useCallback
  const toggleTestPack = useCallback((testPack) => {
    setSelectedTestPacks(prev => ({
      ...prev,
      [testPack]: !prev[testPack]
    }));
  }, []);

  // Toggle all test packs with useCallback
  const toggleAllTestPacks = useCallback((value) => {
    const newState = Object.keys(sortedTestPacks).reduce((acc, testPack) => {
      acc[testPack] = value;
      return acc;
    }, {});
    setSelectedTestPacks(newState);
  }, [sortedTestPacks]);

  // Invert test pack selection with useCallback
  const invertTestPackSelection = useCallback(() => {
    setSelectedTestPacks(prev => {
      const invertedState = {};
      Object.keys(sortedTestPacks).forEach(testPack => {
        invertedState[testPack] = !prev[testPack];
      });
      return invertedState;
    });
  }, [sortedTestPacks]);

  // Get color based on progress with memoization
  const getProgressColor = useCallback((progress) => {
    if (progress > 90) return { bg: "rgba(75, 150, 192, 0.6)", border: "rgba(75, 150, 192, 1)" };
    if (progress >= 70) return { bg: "rgba(255, 206, 86, 0.6)", border: "rgba(255, 206, 86, 1)" };
    return { bg: "rgba(255, 99, 132, 0.6)", border: "rgba(255, 99, 132, 1)" };
  }, []);

  // Legend for status icons with interactive filtering - memoized
  const statusLegend = useMemo(() => (
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
  ), [exclusiveFilter, toggleExclusiveFilter]);

  // Memoized test pack buttons to prevent unnecessary re-renders
  const testPackButtons = useMemo(() => {
    // Create chunks of test packs to process in batches
    const testPackEntries = Object.entries(sortedTestPacks);
    const chunkSize = 20;
    const chunks = [];
    
    for (let i = 0; i < testPackEntries.length; i += chunkSize) {
      chunks.push(testPackEntries.slice(i, i + chunkSize));
    }
    
    return chunks.map((chunk, chunkIndex) => (
      <React.Fragment key={`chunk-${chunkIndex}`}>
        {chunk.map(([testPack, metrics]) => {
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
              colorScheme={isSelected ? "blue" : "gray"}
              bg={isSelected ? "blue.300" : undefined}
              color={isSelected ? "white" : undefined}
              opacity={isVisible ? 1 : 0.5}
              onClick={() => toggleTestPack(testPack)}
              mb={1}
              position="relative"
              overflow="hidden"
            >
              <VStack spacing={0} align="center">
                <Text fontSize="xs" fontWeight="bold" noOfLines={1}>
                  {testPack}
                </Text>
                <Text fontSize="10px" color={isSelected ? "white" : undefined} noOfLines={1}>
                  {progress.toFixed(1)}%
                </Text>
              </VStack>
            </Button>
          );
        })}
      </React.Fragment>
    ));
  }, [sortedTestPacks, selectedTestPacks, exclusiveFilter, getProgressColor, toggleTestPack]);

  // Redesigned Test Pack Selection Panel - memoized
  const testPackSelectionPanel = useMemo(() => (
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
          {testPackButtons}
        </SimpleGrid>
      </Box>
    </Box>
  ), [sortedTestPacks, testPackButtons, toggleAllTestPacks, invertTestPackSelection]);

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
          <Box 
            key={chartKey}
            height={`${chartHeight}px`} 
            position="relative"
          >
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

// Use React.memo to prevent unnecessary re-renders
export default React.memo(TestPackProgressChart);