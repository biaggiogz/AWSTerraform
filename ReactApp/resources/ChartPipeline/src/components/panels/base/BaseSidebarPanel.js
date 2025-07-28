import React, { useMemo } from 'react';
import { Box, VStack, Text, HStack, SimpleGrid } from '@chakra-ui/react';

/**
 * Generic base component for sidebar panels that display subsystem progress data
 * @param {Object} props - Component props
 * @param {Array} props.data - Dataset to process
 * @param {string} props.title - Panel title
 * @param {Array} props.metrics - Array of metric configurations
 * @param {Function} props.dataProcessor - Function to process data into subsystem groups
 * @param {Function} props.metricCalculator - Function to calculate metrics for each subsystem
 * @param {React.Component} props.itemComponent - Component to render each item
 * @param {Object} props.itemComponentProps - Additional props for item component
 * @param {number} props.gridColumns - Number of grid columns (default: 3)
 */
const BaseSidebarPanel = ({ 
  data, 
  title,
  metrics = [],
  dataProcessor,
  metricCalculator,
  itemComponent: ItemComponent,
  itemComponentProps = {},
  gridColumns = 3
}) => {
  // Process data using provided processor function
  const processedData = useMemo(() => {
    if (!data || data.length === 0 || !dataProcessor) {
      return {};
    }
    return dataProcessor(data);
  }, [data, dataProcessor]);

  // Calculate metrics using provided calculator function
  const calculatedMetrics = useMemo(() => {
    if (!processedData || Object.keys(processedData).length === 0 || !metricCalculator) {
      return {};
    }
    
    const results = {};
    metrics.forEach(metric => {
      results[metric.key] = metricCalculator(processedData, metric);
    });
    return results;
  }, [processedData, metrics, metricCalculator]);

  // Metric block component
  const MetricBlock = ({ title, metricData }) => {
    if (!metricData || metricData.length === 0) {
      return (
        <Box mb={4} p={3} bg="gray.50" borderRadius="md">
          <Text fontSize="sm" fontWeight="bold" mb={2} textAlign="center" color="gray.700">
            {title}
          </Text>
          <Text fontSize="xs" color="gray.500" textAlign="center">
            No data available
          </Text>
        </Box>
      );
    }

    return (
      <Box mb={2} p={1} bg="gray.50" borderRadius="md">
        <Text fontSize="sm" fontWeight="bold" mb={3} textAlign="center" color="gray.700">
          {title}
        </Text>
        <SimpleGrid columns={gridColumns} spacing={1}>
          {metricData.map((item, index) => (
            <ItemComponent
              key={index}
              {...item}
              {...itemComponentProps}
            />
          ))}
        </SimpleGrid>
      </Box>
    );
  };

  return (
    <>
      <Text fontSize="md" fontWeight="bold" mb={2} textAlign="center" color="gray.700">
        {title}
      </Text>
      <VStack spacing={0} align="stretch">
        {metrics.map((metric) => (
          <MetricBlock 
            key={metric.key}
            title={metric.title} 
            metricData={calculatedMetrics[metric.key] || []} 
          />
        ))}
      </VStack>
    </>
  );
};

export default React.memo(BaseSidebarPanel);