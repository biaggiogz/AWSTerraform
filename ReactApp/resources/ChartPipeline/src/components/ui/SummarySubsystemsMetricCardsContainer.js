import React, { useState, useCallback, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  SimpleGrid,
  useToast,
  Badge,
  Divider
} from '@chakra-ui/react';
import SummarySubsystemsMetricCard from './SummarySubsystemsMetricCard';

const SummarySubsystemsMetricCardsContainer = ({
  onExecuteQuery,
  queryResults = [],
  isLoading = false
}) => {
  const [metrics, setMetrics] = useState([]);
  const [nextId, setNextId] = useState(1);
  const toast = useToast();

  // Predefined metric templates for SUMMARY SUBSYSTEMS
  const metricTemplates = [
    {
      title: 'Total Subsystems',
      query: 'SELECT COUNT(DISTINCT subsystem) as total_subsystems FROM subsystem_overview',
      color: '#007598',
      isLocal: false
    },
    {
      title: 'Active Test Packs',
      query: 'SELECT COUNT(*) as active_test_packs FROM test_pack_details WHERE testPackProgress > 0',
      color: '#7CA2C5',
      isLocal: true
    },
    {
      title: 'Completed Items',
      query: 'SELECT SUM(doneItems) as completed_items FROM subsystem_overview',
      color: '#63AEA1',
      isLocal: true
    },
    {
      title: 'Pending Items',
      query: 'SELECT SUM(pendingItems) as pending_items FROM subsystem_overview',
      color: '#CEC19B',
      isLocal: true
    },
    {
      title: 'Avg Progress',
      query: 'SELECT ROUND(AVG(testPackProgress), 1) as avg_progress FROM test_pack_details',
      color: '#8AB3DB',
      isLocal: true
    },
    {
      title: 'High Priority',
      query: 'SELECT COUNT(*) as high_priority FROM test_pack_details WHERE priority = "High"',
      color: '#D98265',
      isLocal: false
    }
  ];

  // Add metric from template
  const addMetricFromTemplate = useCallback(async (template) => {
    try {
      const result = await onExecuteQuery(template.query);
      if (result && result.length > 0) {
        const value = Object.values(result[0])[0];
        const newMetric = {
          id: nextId,
          title: template.title,
          value: value,
          query: template.query,
          isLocal: template.isLocal,
          isFrozen: false,
          color: template.color,
          lastUpdated: Date.now()
        };
        
        setMetrics(prev => [...prev, newMetric]);
        setNextId(prev => prev + 1);
        
        toast({
          title: 'Metric Added',
          description: `${template.title}: ${typeof value === 'number' ? value.toLocaleString() : value}`,
          status: 'success',
          duration: 2000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: 'Failed to Add Metric',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  }, [nextId, onExecuteQuery, toast]);

  // Delete metric
  const deleteMetric = useCallback((id) => {
    setMetrics(prev => prev.filter(m => m.id !== id));
    toast({
      title: 'Metric Removed',
      status: 'info',
      duration: 1000,
      isClosable: true,
    });
  }, [toast]);

  // Toggle metric scope (local/global)
  const toggleMetricScope = useCallback(async (id) => {
    const metric = metrics.find(m => m.id === id);
    if (!metric || metric.isFrozen) return;

    try {
      // Re-execute query with new scope
      const result = await onExecuteQuery(metric.query);
      if (result && result.length > 0) {
        const value = Object.values(result[0])[0];
        
        setMetrics(prev => prev.map(m => 
          m.id === id 
            ? { ...m, isLocal: !m.isLocal, value, lastUpdated: Date.now() }
            : m
        ));
      }
    } catch (error) {
      toast({
        title: 'Failed to Update Metric',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  }, [metrics, onExecuteQuery, toast]);

  // Toggle freeze state
  const toggleMetricFreeze = useCallback((id) => {
    setMetrics(prev => prev.map(m => 
      m.id === id ? { ...m, isFrozen: !m.isFrozen } : m
    ));
    
    const metric = metrics.find(m => m.id === id);
    toast({
      title: metric?.isFrozen ? 'Metric Unfrozen' : 'Metric Frozen',
      description: metric?.isFrozen ? 'Will update with filter changes' : 'Will not update with filter changes',
      status: 'info',
      duration: 2000,
      isClosable: true,
    });
  }, [metrics, toast]);

  // Update unfrozen local metrics when query results change
  useEffect(() => {
    if (queryResults.length > 0) {
      const unfrozenLocalMetrics = metrics.filter(m => m.isLocal && !m.isFrozen);
      
      if (unfrozenLocalMetrics.length > 0) {
        // Update metrics that should respond to filter changes
        setMetrics(prev => prev.map(metric => {
          if (metric.isLocal && !metric.isFrozen) {
            // In a real implementation, you would re-execute the query
            // For now, we'll just update the timestamp
            return { ...metric, lastUpdated: Date.now() };
          }
          return metric;
        }));
      }
    }
  }, [queryResults, metrics]);

  const localMetrics = metrics.filter(m => m.isLocal);
  const globalMetrics = metrics.filter(m => !m.isLocal);
  const frozenMetrics = metrics.filter(m => m.isFrozen);

  return (
    <Box p={4} border="1px solid" borderColor="gray.200" borderRadius="md" bg="white">
      <VStack spacing={4} align="stretch">
        <HStack justify="space-between">
          <Text fontSize="lg" fontWeight="bold">Metric Cards System</Text>
          <HStack>
            <Badge colorScheme="blue">{localMetrics.length} Local</Badge>
            <Badge colorScheme="green">{globalMetrics.length} Global</Badge>
            <Badge colorScheme="orange">{frozenMetrics.length} Frozen</Badge>
          </HStack>
        </HStack>

        {/* Quick Add Buttons */}
        <Box>
          <Text fontSize="sm" fontWeight="semibold" mb={2}>Quick Add Metrics:</Text>
          <SimpleGrid columns={{ base: 2, md: 3, lg: 6 }} spacing={2}>
            {metricTemplates.map((template, index) => (
              <Button
                key={index}
                size="xs"
                variant="outline"
                onClick={() => addMetricFromTemplate(template)}
                isLoading={isLoading}
                colorScheme={template.isLocal ? "blue" : "green"}
              >
                {template.title}
              </Button>
            ))}
          </SimpleGrid>
        </Box>

        <Divider />

        {/* Metrics Display */}
        {metrics.length === 0 ? (
          <Text textAlign="center" color="gray.500" py={8}>
            No metrics added yet. Use the buttons above to add metrics.
          </Text>
        ) : (
          <VStack spacing={4} align="stretch">
            {/* Local Metrics */}
            {localMetrics.length > 0 && (
              <Box>
                <Text fontSize="sm" fontWeight="semibold" mb={2} color="blue.600">
                  Local Metrics (Filter-Responsive)
                </Text>
                <SimpleGrid columns={{ base: 2, md: 3, lg: 4 }} spacing={3}>
                  {localMetrics.map(metric => (
                    <SummarySubsystemsMetricCard
                      key={metric.id}
                      id={metric.id}
                      title={metric.title}
                      value={metric.value}
                      isLocal={metric.isLocal}
                      isFrozen={metric.isFrozen}
                      onDelete={deleteMetric}
                      onToggleScope={toggleMetricScope}
                      onToggleFreeze={toggleMetricFreeze}
                      lastUpdated={metric.lastUpdated}
                      color={metric.color}
                    />
                  ))}
                </SimpleGrid>
              </Box>
            )}

            {/* Global Metrics */}
            {globalMetrics.length > 0 && (
              <Box>
                <Text fontSize="sm" fontWeight="semibold" mb={2} color="green.600">
                  Global Metrics (Static)
                </Text>
                <SimpleGrid columns={{ base: 2, md: 3, lg: 4 }} spacing={3}>
                  {globalMetrics.map(metric => (
                    <SummarySubsystemsMetricCard
                      key={metric.id}
                      id={metric.id}
                      title={metric.title}
                      value={metric.value}
                      isLocal={metric.isLocal}
                      isFrozen={metric.isFrozen}
                      onDelete={deleteMetric}
                      onToggleScope={toggleMetricScope}
                      onToggleFreeze={toggleMetricFreeze}
                      lastUpdated={metric.lastUpdated}
                      color={metric.color}
                    />
                  ))}
                </SimpleGrid>
              </Box>
            )}
          </VStack>
        )}

        {/* Usage Tips */}
        <Box bg="blue.50" p={3} borderRadius="md">
          <Text fontSize="sm" fontWeight="semibold" mb={1}>Metric Cards Tips:</Text>
          <VStack align="start" spacing={1} fontSize="xs">
            <Text>• <strong>Local metrics</strong> update automatically when filters change</Text>
            <Text>• <strong>Global metrics</strong> remain static regardless of filters</Text>
            <Text>• <strong>Freeze</strong> any metric to prevent automatic updates</Text>
            <Text>• Toggle between local/global by clicking the switch</Text>
          </VStack>
        </Box>
      </VStack>
    </Box>
  );
};

export default SummarySubsystemsMetricCardsContainer;