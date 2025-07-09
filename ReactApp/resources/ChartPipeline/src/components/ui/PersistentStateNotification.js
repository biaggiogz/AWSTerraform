import React, { useState, useEffect } from 'react';
import { Box, Text, IconButton, HStack, Badge } from '@chakra-ui/react';
import { CloseIcon, InfoIcon } from '@chakra-ui/icons';
import { usePersistentSQLState } from '../../hooks/usePersistentSQLState';

const PersistentStateNotification = () => {
  const { sqlState, getStateAge } = usePersistentSQLState();
  const [isVisible, setIsVisible] = useState(false);
  const [hasShownNotification, setHasShownNotification] = useState(false);

  useEffect(() => {
    // Show notification if there's saved state and user hasn't seen it yet
    const hasSeenNotification = localStorage.getItem('hasSeenPersistentStateNotification');
    
    if (sqlState.query && !hasSeenNotification && !hasShownNotification) {
      setIsVisible(true);
      setHasShownNotification(true);
    }
  }, [sqlState.query, hasShownNotification]);

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem('hasSeenPersistentStateNotification', 'true');
  };

  if (!isVisible) return null;

  const stateAge = getStateAge();

  return (
    <Box
      position="fixed"
      top="20px"
      right="20px"
      bg="blue.100"
      border="1px solid"
      borderColor="blue.300"
      borderRadius="md"
      p={3}
      maxW="300px"
      zIndex={9999}
      boxShadow="lg"
    >
      <HStack justify="space-between" align="flex-start" mb={2}>
        <HStack spacing={2}>
          <InfoIcon color="blue.500" />
          <Text fontSize="sm" fontWeight="bold" color="blue.700">
            Configuration Restored
          </Text>
        </HStack>
        <IconButton
          icon={<CloseIcon />}
          size="xs"
          variant="ghost"
          onClick={handleClose}
          aria-label="Close notification"
        />
      </HStack>
      <Text fontSize="xs" color="blue.600" mb={2}>
        Your SQL queries and metric cards have been restored from your last session.
      </Text>
      {stateAge !== null && (
        <Badge colorScheme="blue" fontSize="xs">
          Last saved {stateAge} minutes ago
        </Badge>
      )}
    </Box>
  );
};

export default PersistentStateNotification;