import React, { useState, useCallback } from 'react';
import { Box, VStack, HStack, Button, Textarea, Text, Alert, AlertIcon, Code } from '@chakra-ui/react';
import { useSummarySubsystemsData } from '../../hooks/useSummarySubsystemsData';

const SummarySubsystemsSQLInterface = ({ filteredData }) => {
  const { executeMetricQuery } = useSummarySubsystemsData(filteredData);
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const predefinedQueries = [
    {
      name: 'Subsystem Progress Summary',
      query: `SELECT 
        subsystem,
        totalItems,
        doneItems,
        ROUND((doneItems * 100.0 / totalItems), 2) as progress_percent
      FROM SummarySubsystemsTableA 
      WHERE totalItems > 0
      ORDER BY progress_percent DESC`
    },
    {
      name: 'Test Pack Completion Status',
      query: `SELECT 
        subsystem,
        COUNT(*) as total_test_packs,
        AVG(testPackProgress) as avg_progress
      FROM SummarySubsystemsTableB 
      GROUP BY subsystem
      ORDER BY avg_progress DESC`
    },
    {
      name: 'Top 5 Subsystems by Items',
      query: `SELECT 
        subsystem,
        totalItems,
        doneItems,
        pendingItems
      FROM SummarySubsystemsTableA 
      ORDER BY totalItems DESC 
      LIMIT 5`
    }
  ];

  const executeQuery = useCallback(async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await executeMetricQuery(query);
      setResult(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [query, executeMetricQuery]);

  const loadPredefinedQuery = useCallback((predefinedQuery) => {
    setQuery(predefinedQuery);
    setResult(null);
    setError(null);
  }, []);

  return (
    <Box p={4} bg="white" border="1px solid" borderColor="gray.200" borderRadius="md">
      <VStack spacing={4} align="stretch">
        <Text fontSize="lg" fontWeight="bold">SQL Query Interface</Text>
        
        {/* Predefined Queries */}
        <Box>
          <Text fontSize="sm" fontWeight="semibold" mb={2}>Quick Queries:</Text>
          <HStack spacing={2} wrap="wrap">
            {predefinedQueries.map((pq, index) => (
              <Button
                key={index}
                size="sm"
                variant="outline"
                onClick={() => loadPredefinedQuery(pq.query)}
              >
                {pq.name}
              </Button>
            ))}
          </HStack>
        </Box>

        {/* Query Input */}
        <Box>
          <Text fontSize="sm" fontWeight="semibold" mb={2}>SQL Query:</Text>
          <Textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter your SQL query here..."
            rows={6}
            fontFamily="monospace"
            fontSize="sm"
          />
        </Box>

        {/* Execute Button */}
        <Button
          colorScheme="blue"
          onClick={executeQuery}
          isLoading={loading}
          loadingText="Executing..."
          isDisabled={!query.trim()}
        >
          Execute Query
        </Button>

        {/* Error Display */}
        {error && (
          <Alert status="error">
            <AlertIcon />
            <Text fontSize="sm">{error}</Text>
          </Alert>
        )}

        {/* Results Display */}
        {result && (
          <Box>
            <Text fontSize="sm" fontWeight="semibold" mb={2}>Results:</Text>
            <Box
              bg="gray.50"
              p={3}
              borderRadius="md"
              maxH="300px"
              overflowY="auto"
            >
              <Code display="block" whiteSpace="pre-wrap" fontSize="xs">
                {JSON.stringify(result, null, 2)}
              </Code>
            </Box>
          </Box>
        )}

        {/* Available Tables Info */}
        <Box fontSize="xs" color="gray.600">
          <Text fontWeight="semibold">Available Tables:</Text>
          <Text>• SummarySubsystemsTableA: subsystem, totalItems, doneItems, pendingItems, etc.</Text>
          <Text>• SummarySubsystemsTableB: subsystem, testPack, testPackProgress, etc.</Text>
        </Box>
      </VStack>
    </Box>
  );
};

export default SummarySubsystemsSQLInterface;