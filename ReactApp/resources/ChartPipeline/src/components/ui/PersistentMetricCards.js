import React, { useState, useEffect, useCallback } from 'react';
import { Box, Text, HStack, VStack, IconButton, Badge } from '@chakra-ui/react';
import { DeleteIcon, ChevronUpIcon, ChevronDownIcon, RepeatIcon } from '@chakra-ui/icons';
import { usePersistentSQLState } from '../../hooks/usePersistentSQLState';
import useDynamicCalculations from '../../hooks/useDynamicCalculations';

// SolidJS Migration Support
let SolidInReact, PersistentMetricCardsSolid;
try {
  const bridge = require('../../solid/bridge/ReactSolidBridge.js');
  SolidInReact = bridge.SolidInReact;
  PersistentMetricCardsSolid = require('../../solid/components/PersistentMetricCards.solid.jsx').default;
} catch (error) {
  console.warn('SolidJS components not available:', error.message);
}

const PersistentMetricCard = ({ card, onRemove, lastUpdated }) => (
  <Box
    bg="white"
    border="1px solid"
    borderColor="blue.200"
    borderRadius="md"
    p={3}
    minW="200px"
    position="relative"
  >
    <VStack spacing={2} align="stretch">
      <HStack justify="space-between" align="center">
        <Text fontSize="xs" fontWeight="bold" color="blue.600" textTransform="uppercase">
          {card.title}
        </Text>
        <HStack spacing={1}>
          <Badge colorScheme="blue" size="sm">SAVED</Badge>
          {lastUpdated && card.timestamp && (
            <Badge colorScheme="green" size="sm" title={`Last updated: ${new Date(card.timestamp).toLocaleTimeString()}`}>
              LIVE
            </Badge>
          )}
          <IconButton
            icon={<DeleteIcon />}
            size="xs"
            colorScheme="red"
            variant="ghost"
            onClick={() => onRemove(card.id)}
            aria-label="Remove card"
          />
        </HStack>
      </HStack>
      <Box textAlign="center">
        <Text fontSize="2xl" fontWeight="bold" color="blue.600">
          {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
        </Text>
      </Box>
      <Text fontSize="xs" color="gray.500" noOfLines={2} title={card.query}>
        Query: {card.query}
      </Text>
    </VStack>
  </Box>
);

const PersistentMetricCards = ({ tabName = 'summarySubsystems', controlData, detailsData, filteredControlData, filteredDetailsData, filters }) => {
  // Feature flag for SolidJS migration
  const USE_SOLIDJS = process.env.REACT_APP_USE_SOLIDJS === 'true' || 
                     localStorage.getItem('use-solidjs') === 'true';
  
  const { sqlState, removeMetricCard, getStateAge, updateQuery } = usePersistentSQLState(tabName);
  const [isVisible, setIsVisible] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const stateAge = getStateAge();
  
  // Get dynamic calculations hook to refresh metrics
  const { executeSQLQuery } = useDynamicCalculations(
    controlData, 
    detailsData,
    filteredControlData,
    filteredDetailsData,
    filters
  );
  
  // Add effect to refresh metrics when data changes
  // Define refreshMetrics with useCallback to avoid dependency issues
  const refreshMetrics = useCallback(async () => {
    if (!sqlState.query) return;
    
    setIsRefreshing(true);
    try {
      // Execute the saved query to get fresh results
      const result = await executeSQLQuery(sqlState.query);
      
      // Update the values and timestamp on all cards to indicate they've been refreshed
      if (sqlState.metricCards && sqlState.metricCards.length > 0) {
        // Extract values from the result
        const resultValues = {};
        if (result && result.length > 0) {
          result.forEach(row => {
            Object.entries(row).forEach(([key, value]) => {
              resultValues[key] = value;
            });
          });
        }
        
        // Update cards with new values
        const updatedCards = sqlState.metricCards.map(card => {
          // Try to find a matching result for this card
          const newValue = resultValues[card.key] !== undefined ? 
            resultValues[card.key] : 
            (resultValues[card.key + '_Global'] !== undefined ? 
              resultValues[card.key + '_Global'] : 
              (resultValues[card.key + '_Local'] !== undefined ? 
                resultValues[card.key + '_Local'] : 
                card.value));
          
          return {
            ...card,
            value: newValue !== undefined ? newValue : card.value,
            timestamp: Date.now() // Update timestamp to show it's been refreshed
          };
        });
        
        // Update persistent state with refreshed cards
        updateQuery(sqlState.query, updatedCards);
      }
    } catch (error) {
      console.error('Failed to refresh metrics:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [sqlState.query, sqlState.metricCards, executeSQLQuery, updateQuery]);
  
  useEffect(() => {
    // Only refresh if we have saved queries and data is available
    if (sqlState.query && (controlData?.length > 0 || detailsData?.length > 0)) {
      refreshMetrics();
    }
  }, [sqlState.query, controlData, detailsData, filteredControlData, filteredDetailsData, refreshMetrics]);
  
  // Also refresh when filters change
  useEffect(() => {
    if (sqlState.query && filters && (controlData?.length > 0 || detailsData?.length > 0)) {
      refreshMetrics();
    }
  }, [filters, sqlState.query, controlData, detailsData, refreshMetrics]);
  

  
  // SolidJS version (5-8x faster)
  if (USE_SOLIDJS && SolidInReact && PersistentMetricCardsSolid) {
    return (
      <SolidInReact
        component={PersistentMetricCardsSolid}
        props={{
          tabName,
          sqlState: {
            metricCards: sqlState.metricCards,
            result: sqlState.result,
            stateAge
          },
          onRemoveCard: removeMetricCard,
          onRefresh: refreshMetrics,
          isRefreshing
        }}
        className="solidjs-persistent-metrics"
      />
    );
  }

  // React version (fallback)
  // Show persistent metric cards from saved queries
  if (!sqlState.metricCards.length && (!sqlState.result || !Array.isArray(sqlState.result))) {
    return null;
  }

  const cardsToShow = sqlState.metricCards.length > 0 ? sqlState.metricCards : (sqlState.result || []);

  return (
    <Box p={1} bg="blue.50" borderRadius="md">
      <HStack justify="space-between" mb={1}>
        <Text fontSize="sm" fontWeight="bold" color="blue.700">
          SAVED SQL METRICS ({cardsToShow.length})
        </Text>
        <HStack spacing={2}>
          {stateAge !== null && (
            <Badge colorScheme="blue" fontSize="xs">
              Saved {stateAge}m ago
            </Badge>
          )}
          <IconButton
            icon={<RepeatIcon />}
            size="xs"
            variant="ghost"
            colorScheme="green"
            isLoading={isRefreshing}
            onClick={refreshMetrics}
            aria-label="Refresh metrics"
            title="Refresh metrics with current data"
          />
          <IconButton
            icon={isVisible ? <ChevronUpIcon /> : <ChevronDownIcon />}
            size="xs"
            variant="ghost"
            colorScheme="blue"
            onClick={() => setIsVisible(!isVisible)}
            aria-label={isVisible ? "Hide metrics" : "Show metrics"}
          />
        </HStack>
      </HStack>
      {isVisible && (
        <HStack spacing={4} wrap="wrap">
          {cardsToShow.map(card => (
            <PersistentMetricCard
              key={card.id}
              card={card}
              onRemove={removeMetricCard}
              lastUpdated={card.timestamp && Date.now() - card.timestamp < 60000} // Show as updated if less than 1 minute old
            />
          ))}
        </HStack>
      )}
    </Box>
  );
};

export default PersistentMetricCards;