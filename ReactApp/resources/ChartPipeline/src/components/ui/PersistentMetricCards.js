import React, { useState } from 'react';
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

const PersistentMetricCard = ({ card, onRemove }) => (
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

const PersistentMetricCards = ({ tabName = 'summarySubsystems' }) => {
  // Feature flag for SolidJS migration
  const USE_SOLIDJS = process.env.REACT_APP_USE_SOLIDJS === 'true' || 
                     localStorage.getItem('use-solidjs') === 'true';
  
  const { sqlState, removeMetricCard, getStateAge } = usePersistentSQLState(tabName);
  const [isVisible, setIsVisible] = useState(true);
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
            />
          ))}
        </HStack>
      )}
    </Box>
  );
};

export default PersistentMetricCards;