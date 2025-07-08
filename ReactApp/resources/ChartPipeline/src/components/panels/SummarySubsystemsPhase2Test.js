import React, { useEffect, useState } from 'react';
import { Box, Text, Badge, VStack, HStack, Button, Progress, SimpleGrid } from '@chakra-ui/react';
import useSummarySubsystemsSQL from '../../hooks/useSummarySubsystemsSQL';

// Mock data for testing Phase 2 WASM performance
const mockTableAData = Array.from({ length: 1000 }, (_, i) => ({
  serialNumber: `${String(i + 1).padStart(3, '0')}`,
  subsystem: `SYS-${String.fromCharCode(65 + (i % 26))}${Math.floor(i / 26)}`,
  fluid: ['Water', 'Oil', 'Gas', 'Steam'][i % 4],
  totalItems: Math.floor(Math.random() * 200) + 50,
  doneItems: Math.floor(Math.random() * 150) + 25,
  pendingItems: Math.floor(Math.random() * 50) + 10,
  description: `Test System ${i + 1}`,
  numTestPacks: Math.floor(Math.random() * 5) + 1,
  totalLoops: Math.floor(Math.random() * 100) + 20,
  doneLoops: Math.floor(Math.random() * 80) + 10,
  pendingLoops: Math.floor(Math.random() * 20) + 5
}));

const mockTableBData = Array.from({ length: 2000 }, (_, i) => ({
  subsystem: `SYS-${String.fromCharCode(65 + (i % 26))}${Math.floor(i / 26)}`,
  testPack: `TP-${String(i + 1).padStart(4, '0')}`,
  testPackProgress: Math.random() * 100,
  traceados: `TR-${String.fromCharCode(65 + (i % 10))}${i % 100}`,
  priority: ['High', 'Medium', 'Low'][i % 3],
  hito: `H${(i % 5) + 1}`,
  teigaReinstatement: Math.random() > 0.5 ? 'Yes' : 'No',
  teigaInsulation: Math.random() > 0.5 ? 'Yes' : 'No',
  siemsa: ['Active', 'Complete', 'Pending'][i % 3],
  technip: ['Active', 'Complete', 'Pending'][i % 3]
}));

const SummarySubsystemsPhase2Test = () => {
  const {
    calculations,
    loading,
    executeSQLQuery,
    tablesReady,
    getComprehensiveMetrics,
    clearCache
  } = useSummarySubsystemsSQL(mockTableAData, mockTableBData);

  const [testResults, setTestResults] = useState({});
  const [performanceMetrics, setPerformanceMetrics] = useState(null);
  const [isRunningTests, setIsRunningTests] = useState(false);

  const performanceTests = [
    {
      name: 'Simple Aggregation',
      query: 'SELECT COUNT(*) as total_subsystems FROM subsystem_overview',
      expectedImprovement: '2-3x faster'
    },
    {
      name: 'Complex GROUP BY',
      query: 'SELECT fluid, SUM(totalItems) as total, AVG(doneItems) as avg_done FROM subsystem_overview GROUP BY fluid ORDER BY total DESC',
      expectedImprovement: '3-4x faster'
    },
    {
      name: 'JOIN with Aggregation',
      query: 'SELECT a.subsystem, a.totalItems, COUNT(b.testPack) as test_count FROM subsystem_overview a LEFT JOIN test_pack_details b ON a.subsystem = b.subsystem GROUP BY a.subsystem, a.totalItems LIMIT 20',
      expectedImprovement: '2-5x faster'
    },
    {
      name: 'Multi-Query Performance',
      query: 'SELECT COUNT(DISTINCT subsystem) as unique_subsystems FROM subsystem_overview; SELECT AVG(testPackProgress) as avg_progress FROM test_pack_details',
      expectedImprovement: 'Cache benefits'
    },
    {
      name: 'Large Dataset Filter',
      query: 'SELECT subsystem, COUNT(*) as count FROM test_pack_details WHERE testPackProgress > 50 GROUP BY subsystem HAVING COUNT(*) > 5',
      expectedImprovement: '4-6x faster'
    }
  ];

  const runPerformanceTests = async () => {
    setIsRunningTests(true);
    const results = {};
    
    for (const test of performanceTests) {
      try {
        const startTime = performance.now();
        await executeSQLQuery(test.query);
        const endTime = performance.now();
        
        results[test.name] = {
          passed: true,
          executionTime: Math.round((endTime - startTime) * 100) / 100,
          expectedImprovement: test.expectedImprovement,
          error: null
        };
      } catch (error) {
        results[test.name] = {
          passed: false,
          executionTime: 0,
          expectedImprovement: test.expectedImprovement,
          error: error.message
        };
      }
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    setTestResults(results);
    
    // Get comprehensive metrics after tests
    try {
      const metrics = await getComprehensiveMetrics();
      setPerformanceMetrics(metrics);
    } catch (error) {
      console.error('Failed to get performance metrics:', error);
    }
    
    setIsRunningTests(false);
  };

  useEffect(() => {
    if (tablesReady) {
      runPerformanceTests();
    }
  }, [tablesReady]);

  const getExecutionTimeColor = (time) => {
    if (time < 10) return 'green';
    if (time < 50) return 'yellow';
    return 'red';
  };

  return (
    <Box p={4} border="1px solid" borderColor="gray.200" borderRadius="md" bg="white">
      <VStack spacing={4} align="stretch">
        <HStack justify="space-between">
          <Text fontSize="lg" fontWeight="bold">Phase 2 WASM Performance Test</Text>
          <HStack>
            <Badge colorScheme={tablesReady ? 'green' : 'yellow'}>
              {tablesReady ? 'Ready' : 'Loading'}
            </Badge>
            <Button size="sm" onClick={runPerformanceTests} isLoading={isRunningTests}>
              Run Tests
            </Button>
            <Button size="sm" variant="outline" onClick={clearCache}>
              Clear Cache
            </Button>
          </HStack>
        </HStack>

        {/* Test Dataset Info */}
        <SimpleGrid columns={2} spacing={4}>
          <Box p={3} border="1px solid" borderColor="blue.200" borderRadius="md" bg="blue.50">
            <Text fontSize="sm" fontWeight="semibold">TableA (Subsystem Overview)</Text>
            <Text fontSize="xs">{mockTableAData.length} rows - Testing aggregations</Text>
          </Box>
          <Box p={3} border="1px solid" borderColor="green.200" borderRadius="md" bg="green.50">
            <Text fontSize="sm" fontWeight="semibold">TableB (Test Pack Details)</Text>
            <Text fontSize="xs">{mockTableBData.length} rows - Testing JOINs & filters</Text>
          </Box>
        </SimpleGrid>

        {/* Performance Test Results */}
        {Object.keys(testResults).length > 0 && (
          <Box>
            <Text fontSize="md" fontWeight="semibold" mb={2}>Performance Test Results</Text>
            <VStack spacing={2} align="stretch">
              {Object.entries(testResults).map(([testName, result]) => (
                <Box key={testName} p={3} border="1px solid" borderColor="gray.200" borderRadius="md">
                  <HStack justify="space-between" mb={1}>
                    <Text fontSize="sm" fontWeight="medium">{testName}</Text>
                    <HStack>
                      <Badge colorScheme={getExecutionTimeColor(result.executionTime)}>
                        {result.executionTime}ms
                      </Badge>
                      <Badge colorScheme={result.passed ? 'green' : 'red'}>
                        {result.passed ? 'PASS' : 'FAIL'}
                      </Badge>
                    </HStack>
                  </HStack>
                  <Text fontSize="xs" color="gray.600">
                    Expected: {result.expectedImprovement}
                  </Text>
                  {result.error && (
                    <Text fontSize="xs" color="red.500">Error: {result.error}</Text>
                  )}
                </Box>
              ))}
            </VStack>
          </Box>
        )}

        {/* Performance Metrics Summary */}
        {performanceMetrics && (
          <Box>
            <Text fontSize="md" fontWeight="semibold" mb={2}>WASM Performance Summary</Text>
            <SimpleGrid columns={3} spacing={4}>
              <Box p={3} border="1px solid" borderColor="gray.200" borderRadius="md">
                <Text fontSize="sm" fontWeight="semibold">WASM Status</Text>
                <Badge colorScheme={performanceMetrics.wasmEnabled ? 'green' : 'red'}>
                  {performanceMetrics.wasmEnabled ? 'Active' : 'Disabled'}
                </Badge>
                <Text fontSize="xs" color="gray.600" mt={1}>
                  Engine: {performanceMetrics.sqlEngine}
                </Text>
              </Box>
              
              <Box p={3} border="1px solid" borderColor="gray.200" borderRadius="md">
                <Text fontSize="sm" fontWeight="semibold">Query Performance</Text>
                <Text fontSize="lg" fontWeight="bold">{performanceMetrics.avgQueryTime}ms</Text>
                <Text fontSize="xs" color="gray.600">
                  Avg over {performanceMetrics.totalQueries} queries
                </Text>
              </Box>
              
              <Box p={3} border="1px solid" borderColor="gray.200" borderRadius="md">
                <Text fontSize="sm" fontWeight="semibold">Cache Efficiency</Text>
                <Text fontSize="lg" fontWeight="bold">{performanceMetrics.cacheSize}</Text>
                <Text fontSize="xs" color="gray.600">
                  Cached queries
                </Text>
              </Box>
            </SimpleGrid>
          </Box>
        )}

        {/* WASM Module Status */}
        {performanceMetrics?.wasmModules && (
          <Box>
            <Text fontSize="md" fontWeight="semibold" mb={2}>WASM Module Status</Text>
            <HStack spacing={4}>
              <Badge colorScheme={performanceMetrics.wasmModules.sqlEngine ? 'green' : 'yellow'}>
                SQL Engine: {performanceMetrics.wasmModules.sqlEngine ? 'WASM' : 'JS'}
              </Badge>
              <Badge colorScheme={performanceMetrics.wasmModules.dataProcessor ? 'green' : 'yellow'}>
                Data Processor: {performanceMetrics.wasmModules.dataProcessor ? 'WASM' : 'JS'}
              </Badge>
              <Badge colorScheme={performanceMetrics.wasmModules.multiFilter ? 'green' : 'yellow'}>
                Multi Filter: {performanceMetrics.wasmModules.multiFilter ? 'WASM' : 'JS'}
              </Badge>
            </HStack>
          </Box>
        )}

        {/* Expected Performance Gains */}
        <Box bg="green.50" p={3} borderRadius="md">
          <Text fontSize="sm" fontWeight="semibold" mb={1}>Expected Phase 2 Performance Gains</Text>
          <VStack align="start" spacing={1} fontSize="xs">
            <Text>✓ Query Execution: 2-3x faster with WASM SQL engine</Text>
            <Text>✓ CSV Processing: 3-5x faster with WASM data processor</Text>
            <Text>✓ Filter Operations: 2-4x faster with optimized indices</Text>
            <Text>✓ Memory Usage: 40% reduction through WASM memory management</Text>
            <Text>✓ Query Caching: 90% reduction in repeated computation</Text>
          </VStack>
        </Box>
      </VStack>
    </Box>
  );
};

export default SummarySubsystemsPhase2Test;