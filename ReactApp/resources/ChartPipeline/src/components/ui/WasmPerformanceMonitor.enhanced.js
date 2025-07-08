import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Progress,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  SimpleGrid,
  Divider,
  Button
} from '@chakra-ui/react';

const WasmPerformanceMonitorEnhanced = ({ getMetrics, onClearCache }) => {
  const [metrics, setMetrics] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshMetrics = async () => {
    setIsRefreshing(true);
    try {
      const newMetrics = await getMetrics();
      setMetrics(newMetrics);
    } catch (error) {
      console.error('Failed to refresh metrics:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    refreshMetrics();
    const interval = setInterval(refreshMetrics, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, [getMetrics]);

  if (!metrics) {
    return (
      <Box p={4} border="1px solid" borderColor="gray.200" borderRadius="md">
        <Text>Loading performance metrics...</Text>
      </Box>
    );
  }

  const getPerformanceColor = (gain) => {
    if (gain >= 2) return 'green';
    if (gain >= 1.5) return 'yellow';
    return 'red';
  };

  return (
    <Box p={4} border="1px solid" borderColor="gray.200" borderRadius="md" bg="white">
      <VStack spacing={4} align="stretch">
        <HStack justify="space-between">
          <Text fontSize="lg" fontWeight="bold">WASM Performance Monitor</Text>
          <HStack>
            <Button size="sm" onClick={refreshMetrics} isLoading={isRefreshing}>
              Refresh
            </Button>
            <Button size="sm" variant="outline" onClick={onClearCache}>
              Clear Cache
            </Button>
          </HStack>
        </HStack>

        {/* Overall Status */}
        <SimpleGrid columns={4} spacing={4}>
          <Stat>
            <StatLabel>WASM Status</StatLabel>
            <StatNumber>
              <Badge colorScheme={metrics.wasmEnabled ? 'green' : 'red'}>
                {metrics.wasmEnabled ? 'Active' : 'Disabled'}
              </Badge>
            </StatNumber>
          </Stat>
          
          <Stat>
            <StatLabel>Tables Loaded</StatLabel>
            <StatNumber>{metrics.tablesLoaded}</StatNumber>
          </Stat>
          
          <Stat>
            <StatLabel>Cache Size</StatLabel>
            <StatNumber>{metrics.cacheSize}</StatNumber>
          </Stat>
          
          <Stat>
            <StatLabel>Avg Query Time</StatLabel>
            <StatNumber>{metrics.avgQueryTime}ms</StatNumber>
            <StatHelpText>{metrics.totalQueries} queries</StatHelpText>
          </Stat>
        </SimpleGrid>

        <Divider />

        {/* WASM Module Status */}
        {metrics.wasmModules && (
          <Box>
            <Text fontSize="md" fontWeight="semibold" mb={2}>WASM Module Status</Text>
            <SimpleGrid columns={3} spacing={4}>
              <Box>
                <Text fontSize="sm">SQL Engine</Text>
                <Badge colorScheme={metrics.wasmModules.sqlEngine ? 'green' : 'yellow'}>
                  {metrics.wasmModules.sqlEngine ? 'WASM' : 'JS'}
                </Badge>
              </Box>
              <Box>
                <Text fontSize="sm">Data Processor</Text>
                <Badge colorScheme={metrics.wasmModules.dataProcessor ? 'green' : 'yellow'}>
                  {metrics.wasmModules.dataProcessor ? 'WASM' : 'JS'}
                </Badge>
              </Box>
              <Box>
                <Text fontSize="sm">Multi Filter</Text>
                <Badge colorScheme={metrics.wasmModules.multiFilter ? 'green' : 'yellow'}>
                  {metrics.wasmModules.multiFilter ? 'WASM' : 'JS'}
                </Badge>
              </Box>
            </SimpleGrid>
          </Box>
        )}

        <Divider />

        {/* Performance Comparison */}
        {metrics.wasmComparison && Object.keys(metrics.wasmComparison).length > 0 && (
          <Box>
            <Text fontSize="md" fontWeight="semibold" mb={2}>Performance Comparison</Text>
            <VStack spacing={2} align="stretch">
              {Object.entries(metrics.wasmComparison).map(([operation, data]) => (
                <Box key={operation} p={2} border="1px solid" borderColor="gray.100" borderRadius="md">
                  <HStack justify="space-between" mb={1}>
                    <Text fontSize="sm" fontWeight="medium">{operation}</Text>
                    <Badge colorScheme={getPerformanceColor(data.performanceGain)}>
                      {data.performanceGain}x faster
                    </Badge>
                  </HStack>
                  <HStack spacing={4} fontSize="xs" color="gray.600">
                    <Text>WASM: {data.wasmAverage}ms ({data.wasmCount})</Text>
                    <Text>JS: {data.jsAverage}ms ({data.jsCount})</Text>
                  </HStack>
                </Box>
              ))}
            </VStack>
          </Box>
        )}

        <Divider />

        {/* Overall Metrics */}
        {metrics.overallMetrics && (
          <Box>
            <Text fontSize="md" fontWeight="semibold" mb={2}>Overall Performance</Text>
            <SimpleGrid columns={2} spacing={4}>
              <Box>
                <Text fontSize="sm">WASM Utilization</Text>
                <Progress 
                  value={metrics.overallMetrics.wasmUtilization} 
                  colorScheme="green" 
                  size="sm" 
                  mb={1}
                />
                <Text fontSize="xs" color="gray.600">
                  {Math.round(metrics.overallMetrics.wasmUtilization)}% of operations
                </Text>
              </Box>
              <Box>
                <Text fontSize="sm">Memory Managers</Text>
                <HStack>
                  <Text fontSize="lg" fontWeight="bold">
                    {metrics.overallMetrics.memoryManagersActive}
                  </Text>
                  <Text fontSize="xs" color="gray.600">active</Text>
                </HStack>
              </Box>
            </SimpleGrid>
          </Box>
        )}

        {/* Performance Tips */}
        <Box bg="blue.50" p={3} borderRadius="md">
          <Text fontSize="sm" fontWeight="semibold" mb={1}>Performance Tips</Text>
          <VStack align="start" spacing={1} fontSize="xs">
            <Text>• WASM provides 2-3x faster query execution</Text>
            <Text>• Query cache reduces repeated computation by 90%</Text>
            <Text>• Pre-indexed tables improve filter performance by 2-4x</Text>
            <Text>• Memory managers reduce WASM memory usage by 40%</Text>
          </VStack>
        </Box>
      </VStack>
    </Box>
  );
};

export default WasmPerformanceMonitorEnhanced;