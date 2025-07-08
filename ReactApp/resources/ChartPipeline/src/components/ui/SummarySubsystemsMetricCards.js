import React, { useState, useEffect, useCallback } from 'react';
import { Box, Text, HStack, VStack, Switch, Badge, Spinner } from '@chakra-ui/react';

const MetricCard = ({ title, value, isLocal, onToggle, loading, frozen = false }) => (
  <Box
    bg="white"
    border="1px solid"
    borderColor="gray.200"
    borderRadius="md"
    p={3}
    minW="200px"
    position="relative"
  >
    <VStack spacing={2} align="stretch">
      <HStack justify="space-between" align="center">
        <Text fontSize="xs" fontWeight="bold" color="gray.600" textTransform="uppercase">
          {title}
        </Text>
        <HStack spacing={1}>
          {frozen && <Badge colorScheme="blue" size="sm">FROZEN</Badge>}
          <Switch
            size="sm"
            isChecked={isLocal}
            onChange={onToggle}
            colorScheme="blue"
            isDisabled={frozen}
          />
          <Text fontSize="xs" color="gray.500">
            {isLocal ? 'Local' : 'Global'}
          </Text>
        </HStack>
      </HStack>
      <Box textAlign="center">
        {loading ? (
          <Spinner size="sm" />
        ) : (
          <Text fontSize="2xl" fontWeight="bold" color="blue.600">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </Text>
        )}
      </Box>
    </VStack>
  </Box>
);

const SummarySubsystemsMetricCards = ({ 
  tableAData, 
  tableBData, 
  filteredTableAData, 
  filteredTableBData, 
  executeMetricQuery,
  selectedSubsystem 
}) => {
  const [metrics, setMetrics] = useState({});
  const [localMetrics, setLocalMetrics] = useState({});
  const [metricStates, setMetricStates] = useState({
    totalSubsystems: { isLocal: false, frozen: false },
    totalTestPacks: { isLocal: false, frozen: false },
    totalItems: { isLocal: false, frozen: false },
    completedItems: { isLocal: false, frozen: false },
    avgProgress: { isLocal: false, frozen: false }
  });
  const [loading, setLoading] = useState(false);

  // Calculate global metrics (frozen)
  const calculateGlobalMetrics = useCallback(async () => {
    if (!executeMetricQuery) return;

    try {
      const queries = [
        "SELECT COUNT(DISTINCT subsystem) AS totalSubsystems FROM SummarySubsystemsTableA",
        "SELECT COUNT(DISTINCT testPack) AS totalTestPacks FROM SummarySubsystemsTableB", 
        "SELECT SUM(totalItems) AS totalItems FROM SummarySubsystemsTableA",
        "SELECT SUM(doneItems) AS completedItems FROM SummarySubsystemsTableA",
        "SELECT AVG(CASE WHEN totalItems > 0 THEN (doneItems * 100.0 / totalItems) ELSE 0 END) AS avgProgress FROM SummarySubsystemsTableA"
      ];

      const results = await Promise.all(queries.map(q => executeMetricQuery(q)));
      
      setMetrics({
        totalSubsystems: results[0]?.[0]?.totalSubsystems || 0,
        totalTestPacks: results[1]?.[0]?.totalTestPacks || 0,
        totalItems: results[2]?.[0]?.totalItems || 0,
        completedItems: results[3]?.[0]?.completedItems || 0,
        avgProgress: Math.round(results[4]?.[0]?.avgProgress || 0)
      });
    } catch (error) {
      console.error('Global metrics calculation failed:', error);
    }
  }, [executeMetricQuery]);

  // Calculate local metrics (filter-responsive)
  const calculateLocalMetrics = useCallback(async () => {
    if (!selectedSubsystem || !executeMetricQuery) {
      setLocalMetrics({});
      return;
    }

    try {
      const queries = [
        `SELECT COUNT(DISTINCT subsystem) AS totalSubsystems FROM SummarySubsystemsTableA WHERE subsystem = '${selectedSubsystem}'`,
        `SELECT COUNT(DISTINCT testPack) AS totalTestPacks FROM SummarySubsystemsTableB WHERE subsystem = '${selectedSubsystem}'`,
        `SELECT SUM(totalItems) AS totalItems FROM SummarySubsystemsTableA WHERE subsystem = '${selectedSubsystem}'`,
        `SELECT SUM(doneItems) AS completedItems FROM SummarySubsystemsTableA WHERE subsystem = '${selectedSubsystem}'`,
        `SELECT AVG(CASE WHEN totalItems > 0 THEN (doneItems * 100.0 / totalItems) ELSE 0 END) AS avgProgress FROM SummarySubsystemsTableA WHERE subsystem = '${selectedSubsystem}'`
      ];

      const results = await Promise.all(queries.map(q => executeMetricQuery(q)));
      
      setLocalMetrics({
        totalSubsystems: results[0]?.[0]?.totalSubsystems || 0,
        totalTestPacks: results[1]?.[0]?.totalTestPacks || 0,
        totalItems: results[2]?.[0]?.totalItems || 0,
        completedItems: results[3]?.[0]?.completedItems || 0,
        avgProgress: Math.round(results[4]?.[0]?.avgProgress || 0)
      });
    } catch (error) {
      console.error('Local metrics calculation failed:', error);
    }
  }, [selectedSubsystem, executeMetricQuery]);

  // Initialize global metrics
  useEffect(() => {
    if (tableAData?.length > 0 && tableBData?.length > 0) {
      calculateGlobalMetrics();
    }
  }, [tableAData, tableBData, calculateGlobalMetrics]);

  // Update local metrics when filter changes
  useEffect(() => {
    calculateLocalMetrics();
  }, [selectedSubsystem, calculateLocalMetrics]);

  // Toggle metric between local/global
  const toggleMetric = useCallback((metricKey) => {
    setMetricStates(prev => ({
      ...prev,
      [metricKey]: {
        ...prev[metricKey],
        isLocal: !prev[metricKey].isLocal
      }
    }));
  }, []);

  // Get display value for metric
  const getMetricValue = useCallback((metricKey) => {
    const state = metricStates[metricKey];
    if (state.isLocal && localMetrics[metricKey] !== undefined) {
      return localMetrics[metricKey];
    }
    return metrics[metricKey] || 0;
  }, [metrics, localMetrics, metricStates]);

  return (
    <Box p={4} bg="gray.50" borderRadius="md">
      <Text fontSize="sm" fontWeight="bold" mb={3} color="gray.700">
        SUMMARY SUBSYSTEMS METRICS
      </Text>
      <HStack spacing={4} wrap="wrap">
        <MetricCard
          title="Total Subsystems"
          value={getMetricValue('totalSubsystems')}
          isLocal={metricStates.totalSubsystems.isLocal}
          onToggle={() => toggleMetric('totalSubsystems')}
          loading={loading}
          frozen={metricStates.totalSubsystems.frozen}
        />
        <MetricCard
          title="Total Test Packs"
          value={getMetricValue('totalTestPacks')}
          isLocal={metricStates.totalTestPacks.isLocal}
          onToggle={() => toggleMetric('totalTestPacks')}
          loading={loading}
          frozen={metricStates.totalTestPacks.frozen}
        />
        <MetricCard
          title="Total Items"
          value={getMetricValue('totalItems')}
          isLocal={metricStates.totalItems.isLocal}
          onToggle={() => toggleMetric('totalItems')}
          loading={loading}
          frozen={metricStates.totalItems.frozen}
        />
        <MetricCard
          title="Completed Items"
          value={getMetricValue('completedItems')}
          isLocal={metricStates.completedItems.isLocal}
          onToggle={() => toggleMetric('completedItems')}
          loading={loading}
          frozen={metricStates.completedItems.frozen}
        />
        <MetricCard
          title="Avg Progress %"
          value={`${getMetricValue('avgProgress')}%`}
          isLocal={metricStates.avgProgress.isLocal}
          onToggle={() => toggleMetric('avgProgress')}
          loading={loading}
          frozen={metricStates.avgProgress.frozen}
        />
      </HStack>
    </Box>
  );
};

export default SummarySubsystemsMetricCards;