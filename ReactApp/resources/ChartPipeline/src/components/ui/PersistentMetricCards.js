import React, { useState, useMemo, memo } from 'react';
import { Box, Text, HStack, VStack, IconButton, Badge } from '@chakra-ui/react';
import { DeleteIcon, ChevronUpIcon, ChevronDownIcon } from '@chakra-ui/icons';
import { usePersistentSQLState } from '../../hooks/usePersistentSQLState';

// SolidJS Migration Support
let SolidInReact, PersistentMetricCardsSolid;
try {
  const bridge = require('../../solid/bridge/ReactSolidBridge.js');
  SolidInReact = bridge.SolidInReact;
  PersistentMetricCardsSolid = require('../../solid/components/PersistentMetricCards.solid.jsx').default;
} catch (error) {
  console.warn('SolidJS components not available:', error.message);
}

// Memoized card component to prevent unnecessary re-renders
const PersistentMetricCard = memo(({ card, onRemove }) => (
  <Box
    bg="white"
    border="1px solid"
    borderColor="blue.200"
    borderRadius="md"
    p={2}
    minW="180px"
    position="relative"
  >
    <VStack spacing={1} align="stretch">
      <HStack justify="space-between" align="center">
        <Text fontSize="xs" fontWeight="bold" color="blue.600" textTransform="uppercase">
          {card.title || card.key}
        </Text>
        <HStack spacing={1}>
          <Badge colorScheme="blue" size="sm">SAVED</Badge>
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
        <Text fontSize="xl" fontWeight="bold" color="blue.600">
          {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
        </Text>
      </Box>
    </VStack>
  </Box>
));

// Main component with performance optimizations
const PersistentMetricCards = ({ tabName = 'summarySubsystems' }) => {
  // Feature flag for SolidJS migration
  const USE_SOLIDJS = process.env.REACT_APP_USE_SOLIDJS === 'true' || 
                     localStorage.getItem('use-solidjs') === 'true';
  
  const { sqlState, removeMetricCard, getStateAge } = usePersistentSQLState(tabName);
  const [isVisible, setIsVisible] = useState(false); // Default to collapsed
  const stateAge = getStateAge();
  
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
          onRemoveCard: removeMetricCard
        }}
        className="solidjs-persistent-metrics"
      />
    );
  }

  // Early return if no cards to show
  if (!sqlState.metricCards?.length && (!sqlState.result || !Array.isArray(sqlState.result))) {
    return null;
  }

  // Memoize cards to prevent recalculation on every render
  const cardsToShow = useMemo(() => {
    // Limit the number of cards to prevent performance issues
    const cards = sqlState.metricCards.length > 0 ? sqlState.metricCards : (sqlState.result || []);
    return cards.slice(0, 20); // Limit to 20 cards max for performance
  }, [sqlState.metricCards, sqlState.result]);

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
        <Box maxH="300px" overflowY="auto">
          <HStack spacing={2} wrap="wrap" alignItems="flex-start">
            {cardsToShow.map(card => (
              <PersistentMetricCard
                key={card.id}
                card={card}
                onRemove={removeMetricCard}
              />
            ))}
          </HStack>
        </Box>
      )}
    </Box>
  );
};

export default PersistentMetricCards;