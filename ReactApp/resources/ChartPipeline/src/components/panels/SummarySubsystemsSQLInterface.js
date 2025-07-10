import React, { useState, useCallback, useEffect } from 'react';
import { Box, VStack, HStack, Button, Textarea, Text, Alert, AlertIcon, Code, IconButton } from '@chakra-ui/react';
import { AddIcon, DeleteIcon } from '@chakra-ui/icons';
import { useSummarySubsystemsData } from '../../hooks/useSummarySubsystemsData';
import { usePersistentSQLState } from '../../hooks/usePersistentSQLState';
import SQLIntellisense from '../ui/SQLIntellisense';

const SummarySubsystemsSQLInterface = ({ filteredData, onMetricCardAdd }) => {
  const { executeMetricQuery } = useSummarySubsystemsData(filteredData);
  const { sqlState, updateQuery, addMetricCard, clearState } = usePersistentSQLState('summarySubsystems');
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Restore state on mount
  useEffect(() => {
    if (sqlState.query) {
      setQuery(sqlState.query);
    }
    if (sqlState.result) {
      setResult(sqlState.result);
    }
  }, [sqlState]);

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
      updateQuery(query, result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [query, executeMetricQuery, updateQuery]);

  const loadPredefinedQuery = useCallback((predefinedQuery) => {
    setQuery(predefinedQuery);
    setResult(null);
    setError(null);
  }, []);

  const createMetricCard = useCallback(() => {
    if (!result || !result.length) return;
    
    const firstResult = result[0];
    const keys = Object.keys(firstResult);
    const valueKey = keys.find(k => typeof firstResult[k] === 'number') || keys[0];
    
    const title = valueKey.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    const value = firstResult[valueKey];
    
    addMetricCard(title, value, query);
    if (onMetricCardAdd) {
      onMetricCardAdd({ title, value, query });
    }
  }, [result, query, addMetricCard, onMetricCardAdd]);

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
          <SQLIntellisense
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter your SQL query here... (Type to see suggestions)"
            rows={6}
          />
        </Box>

        {/* Execute Button */}
        <HStack>
          <Button
            colorScheme="blue"
            onClick={executeQuery}
            isLoading={loading}
            loadingText="Executing..."
            isDisabled={!query.trim()}
            flex={1}
          >
            Execute Query
          </Button>
          {result && (
            <IconButton
              icon={<AddIcon />}
              colorScheme="green"
              onClick={createMetricCard}
              aria-label="Create Metric Card"
              title="Create metric card from result"
            />
          )}
          <IconButton
            icon={<DeleteIcon />}
            colorScheme="red"
            variant="outline"
            onClick={clearState}
            aria-label="Clear All"
            title="Clear saved queries and results"
          />
        </HStack>

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

        {/* Saved Metric Cards */}
        {sqlState.metricCards.length > 0 && (
          <Box>
            <Text fontSize="sm" fontWeight="semibold" mb={2}>Saved Metric Cards ({sqlState.metricCards.length}):</Text>
            <VStack spacing={1} align="stretch">
              {sqlState.metricCards.map(card => (
                <Box key={card.id} fontSize="xs" color="gray.600" p={2} bg="gray.50" borderRadius="sm">
                  <Text fontWeight="semibold">{card.title}: {card.value}</Text>
                </Box>
              ))}
            </VStack>
          </Box>
        )}

        {/* Available Tables Info */}
        <Box fontSize="xs" color="gray.600">
          <Text fontWeight="semibold">Available Tables & Fields:</Text>
          <Text>• <Text as="span" fontWeight="bold">SummarySubsystemsTableA</Text>: serialNumber, fluid, subsystem, totalItems, doneItems, pendingItems, description, numTestPacks, totalLoops, doneLoops, pendingLoops</Text>
          <Text>• <Text as="span" fontWeight="bold">SummarySubsystemsTableB</Text>: subsystem, testPack, testPackProgress, traceados, priority, hito, teigaReinstatement, teigaInsulation, siemsa, technip</Text>
          <Text mt={1} fontSize="xs" color="blue.600">💡 Start typing field names or SQL keywords to see intellisense suggestions</Text>
        </Box>
      </VStack>
    </Box>
  );
};

export default SummarySubsystemsSQLInterface;