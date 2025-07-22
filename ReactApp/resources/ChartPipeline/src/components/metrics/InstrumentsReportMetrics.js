import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Badge,
  Spinner,
  Grid,
  GridItem,
  Flex,
  Heading,
  Divider,
  useColorModeValue
} from '@chakra-ui/react';
import useInstrumentsReportCalculations from '../../hooks/useInstrumentsReportCalculations';
import * as instrumentsReportQueries from '../../utils/instrumentsReportQueries';

/**
 * Component to display metrics for the INSTRUMENTS REPORT tab
 */
const InstrumentsReportMetrics = ({ 
  controlData, 
  detailsData, 
  filteredControlData, 
  filteredDetailsData, 
  filters 
}) => {
  const [metrics, setMetrics] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { 
    executeSQLQuery,
    loading: queryLoading
  } = useInstrumentsReportCalculations(
    controlData, 
    detailsData,
    filteredControlData,
    filteredDetailsData,
    filters
  );

  // Colors for different metric types
  const bgColors = {
    totalIsos: 'blue.600',
    totalTagInst: 'blue.500',
    totalInst: 'teal.500',
    totalDone: 'green.500',
    totalInstalledTeigaTmi: 'orange.500',
    totalInstalledSiemsa: 'purple.500'
  };

  // Load all metrics on component mount or when data/filters change
  useEffect(() => {
    const loadAllMetrics = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Execute the combined query for all metrics
        const results = await executeSQLQuery(instrumentsReportQueries.getAllMetricsQuery());
        
        // Process results into a structured object
        const processedMetrics = {};
        
        results.forEach(result => {
          // Extract the metric name and scope
          const metricKey = Object.keys(result)[0];
          if (!metricKey) return;
          
          const value = result[metricKey];
          const isGlobal = metricKey.endsWith('_Global');
          const isLocal = metricKey.endsWith('_Local');
          const baseMetricName = metricKey.replace(/_Global$|_Local$/, '');
          
          // Initialize the metric object if it doesn't exist
          if (!processedMetrics[baseMetricName]) {
            processedMetrics[baseMetricName] = { global: null, local: null };
          }
          
          // Set the appropriate scope value
          if (isGlobal) {
            processedMetrics[baseMetricName].global = value;
          } else if (isLocal) {
            processedMetrics[baseMetricName].local = value;
          }
        });
        
        setMetrics(processedMetrics);
      } catch (err) {
        console.error('Error loading metrics:', err);
        setError('Failed to load metrics');
      } finally {
        setLoading(false);
      }
    };
    
    loadAllMetrics();
  }, [executeSQLQuery, controlData, detailsData, filteredControlData, filteredDetailsData, filters]);

  // Get background color for a metric card
  const getMetricBgColor = (metricName) => {
    if (metricName.includes('TOTAL ISOS')) return bgColors.totalIsos;
    if (metricName.includes('TOTAL TAG INST')) return bgColors.totalTagInst;
    if (metricName.includes('TOTAL INST') && !metricName.includes('INSTALLED')) return bgColors.totalInst;
    if (metricName.includes('TOTAL DONE')) return bgColors.totalDone;
    if (metricName.includes('TEIGA-TMI')) return bgColors.totalInstalledTeigaTmi;
    if (metricName.includes('SIEMSA')) return bgColors.totalInstalledSiemsa;
    return 'gray.500'; // default
  };

  // Render a metric card
  const renderMetricCard = (title, value, scope) => {
    const bgColor = getMetricBgColor(title);
    const textColor = 'white';
    
    return (
      <Box
        bg={bgColor}
        color={textColor}
        borderRadius="md"
        p={3}
        textAlign="center"
        boxShadow="md"
        height="100%"
        display="flex"
        flexDirection="column"
        justifyContent="center"
      >
        <Text fontSize="2xl" fontWeight="bold">
          {typeof value === 'number' ? value.toLocaleString() : value || '0'}
        </Text>
        <Text fontSize="sm" mt={1}>
          {title}
        </Text>
        <Badge alignSelf="center" mt={2} colorScheme={scope === 'global' ? 'blue' : 'purple'}>
          {scope === 'global' ? 'GLOBAL' : 'LOCAL'}
        </Badge>
      </Box>
    );
  };

  if (loading || queryLoading) {
    return (
      <Box p={4} textAlign="center">
        <Spinner size="xl" />
        <Text mt={2}>Loading metrics...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={4} bg="red.50" borderRadius="md">
        <Heading size="md" color="red.500">Error</Heading>
        <Text mt={2}>{error}</Text>
        <Button mt={4} colorScheme="red" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box p={4}>
      <Heading size="md" mb={4}>INSTRUMENTS REPORT Metrics</Heading>
      
      <Grid templateColumns="repeat(3, 1fr)" gap={4}>
        {/* Isometrics */}
        {metrics['TOTAL ISOS'] && (
          <>
            <GridItem>
              {renderMetricCard('TOTAL ISOS', metrics['TOTAL ISOS'].global, 'global')}
            </GridItem>
            <GridItem>
              {renderMetricCard('TOTAL ISOS', metrics['TOTAL ISOS'].local, 'local')}
            </GridItem>
            <GridItem></GridItem>
          </>
        )}
        
        {/* Tag Instruments */}
        {metrics['TOTAL TAG INST'] && (
          <>
            <GridItem>
              {renderMetricCard('TOTAL TAG INST', metrics['TOTAL TAG INST'].global, 'global')}
            </GridItem>
            <GridItem>
              {renderMetricCard('TOTAL TAG INST', metrics['TOTAL TAG INST'].local, 'local')}
            </GridItem>
            <GridItem></GridItem>
          </>
        )}
        
        {/* Total Instruments */}
        {metrics['TOTAL INST'] && (
          <>
            <GridItem>
              {renderMetricCard('TOTAL INST', metrics['TOTAL INST'].global, 'global')}
            </GridItem>
            <GridItem>
              {renderMetricCard('TOTAL INST', metrics['TOTAL INST'].local, 'local')}
            </GridItem>
            <GridItem></GridItem>
          </>
        )}
        
        {/* Total Done */}
        {metrics['TOTAL DONE'] && (
          <>
            <GridItem>
              {renderMetricCard('TOTAL DONE', metrics['TOTAL DONE'].global, 'global')}
            </GridItem>
            <GridItem>
              {renderMetricCard('TOTAL DONE', metrics['TOTAL DONE'].local, 'local')}
            </GridItem>
            <GridItem></GridItem>
          </>
        )}
        
        {/* Total Installed TEIGA-TMI */}
        {metrics['TOTAL INSTALLED TEIGA-TMI'] && (
          <>
            <GridItem>
              {renderMetricCard('TOTAL INSTALLED TEIGA-TMI', metrics['TOTAL INSTALLED TEIGA-TMI'].global, 'global')}
            </GridItem>
            <GridItem>
              {renderMetricCard('TOTAL INSTALLED TEIGA-TMI', metrics['TOTAL INSTALLED TEIGA-TMI'].local, 'local')}
            </GridItem>
            <GridItem></GridItem>
          </>
        )}
        
        {/* Total Installed SIEMSA */}
        {metrics['TOTAL INSTALLED SIEMSA'] && (
          <>
            <GridItem>
              {renderMetricCard('TOTAL INSTALLED SIEMSA', metrics['TOTAL INSTALLED SIEMSA'].global, 'global')}
            </GridItem>
            <GridItem>
              {renderMetricCard('TOTAL INSTALLED SIEMSA', metrics['TOTAL INSTALLED SIEMSA'].local, 'local')}
            </GridItem>
            <GridItem></GridItem>
          </>
        )}
      </Grid>
      
      <Divider my={6} />
      
      <Button 
        colorScheme="blue" 
        onClick={() => window.location.reload()}
        isLoading={loading || queryLoading}
      >
        Refresh Metrics
      </Button>
    </Box>
  );
};

export default InstrumentsReportMetrics;