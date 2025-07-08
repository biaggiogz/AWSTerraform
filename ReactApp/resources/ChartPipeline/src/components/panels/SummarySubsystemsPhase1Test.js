import React, { useEffect, useState } from 'react';
import { Box, Text, Badge, VStack, HStack } from '@chakra-ui/react';
import useSummarySubsystemsSQL from '../../hooks/useSummarySubsystemsSQL';

// Mock data for testing Phase 1
const mockTableAData = [
  {
    serialNumber: '001',
    subsystem: 'SYS-A',
    fluid: 'Water',
    totalItems: 100,
    doneItems: 75,
    pendingItems: 25,
    description: 'Test System A',
    numTestPacks: 3,
    totalLoops: 50,
    doneLoops: 40,
    pendingLoops: 10
  },
  {
    serialNumber: '002',
    subsystem: 'SYS-B',
    fluid: 'Oil',
    totalItems: 80,
    doneItems: 60,
    pendingItems: 20,
    description: 'Test System B',
    numTestPacks: 2,
    totalLoops: 30,
    doneLoops: 25,
    pendingLoops: 5
  }
];

const mockTableBData = [
  {
    subsystem: 'SYS-A',
    testPack: 'TP-001',
    testPackProgress: 85.5,
    traceados: 'TR-A1',
    priority: 'High',
    hito: 'H1',
    teigaReinstatement: 'Yes',
    teigaInsulation: 'No',
    siemsa: 'Active',
    technip: 'Pending'
  },
  {
    subsystem: 'SYS-B',
    testPack: 'TP-002',
    testPackProgress: 92.3,
    traceados: 'TR-B1',
    priority: 'Medium',
    hito: 'H2',
    teigaReinstatement: 'No',
    teigaInsulation: 'Yes',
    siemsa: 'Complete',
    technip: 'Active'
  }
];

const SummarySubsystemsPhase1Test = () => {
  const {
    calculations,
    loading,
    executeSQLQuery,
    availableTables,
    tablesReady
  } = useSummarySubsystemsSQL(mockTableAData, mockTableBData);

  const [testResults, setTestResults] = useState({});

  useEffect(() => {
    if (tablesReady) {
      runPhase1Tests();
    }
  }, [tablesReady]);

  const runPhase1Tests = async () => {
    const tests = [
      {
        name: 'Table Registration',
        test: () => availableTables.includes('subsystem_overview') && availableTables.includes('test_pack_details')
      },
      {
        name: 'Basic Query',
        test: async () => {
          const result = await executeSQLQuery('SELECT COUNT(*) as count FROM subsystem_overview');
          return result && result.length > 0 && result[0].count === 2;
        }
      },
      {
        name: 'Join Query',
        test: async () => {
          const result = await executeSQLQuery(`
            SELECT a.subsystem, a.totalItems, b.testPackProgress 
            FROM subsystem_overview a 
            LEFT JOIN test_pack_details b ON a.subsystem = b.subsystem
          `);
          return result && result.length > 0;
        }
      }
    ];

    const results = {};
    for (const test of tests) {
      try {
        const passed = typeof test.test === 'function' ? await test.test() : test.test;
        results[test.name] = { passed, error: null };
      } catch (error) {
        results[test.name] = { passed: false, error: error.message };
      }
    }
    setTestResults(results);
  };

  return (
    <Box p={4} border="1px solid" borderColor="gray.200" borderRadius="md" bg="white">
      <VStack spacing={4} align="stretch">
        <Text fontSize="lg" fontWeight="bold">Phase 1 Infrastructure Test</Text>
        
        <HStack>
          <Text fontSize="sm">Tables Ready:</Text>
          <Badge colorScheme={tablesReady ? 'green' : 'red'}>
            {tablesReady ? 'Yes' : 'No'}
          </Badge>
        </HStack>

        <Box>
          <Text fontSize="sm" fontWeight="semibold" mb={2}>Available Tables:</Text>
          <HStack wrap="wrap" spacing={2}>
            {availableTables.map(table => (
              <Badge key={table} variant="outline" colorScheme="blue">
                {table}
              </Badge>
            ))}
          </HStack>
        </Box>

        <Box>
          <Text fontSize="sm" fontWeight="semibold" mb={2}>Test Results:</Text>
          <VStack spacing={2} align="stretch">
            {Object.entries(testResults).map(([testName, result]) => (
              <HStack key={testName} justify="space-between">
                <Text fontSize="sm">{testName}</Text>
                <Badge colorScheme={result.passed ? 'green' : 'red'}>
                  {result.passed ? 'PASS' : 'FAIL'}
                </Badge>
              </HStack>
            ))}
          </VStack>
        </Box>

        {calculations.length > 0 && (
          <Box>
            <Text fontSize="sm" fontWeight="semibold" mb={2}>Last Query Result:</Text>
            <Box
              maxH="150px"
              overflowY="auto"
              border="1px solid"
              borderColor="gray.200"
              borderRadius="md"
              p={2}
              bg="gray.50"
            >
              <pre style={{ fontSize: '11px', whiteSpace: 'pre-wrap' }}>
                {JSON.stringify(calculations, null, 2)}
              </pre>
            </Box>
          </Box>
        )}
      </VStack>
    </Box>
  );
};

export default SummarySubsystemsPhase1Test;