import React, { useState, useEffect } from 'react';
import { Box, Text, CloseButton, HStack, Badge } from '@chakra-ui/react';
import { usePersistentSQLState } from '../../hooks/usePersistentSQLState';

const InstrumentsReportStateNotification = () => {
  const [isVisible, setIsVisible] = useState(false);
  const { sqlState, getStateAge } = usePersistentSQLState('instrumentsReport');
  const stateAge = getStateAge();
  
  // Show notification only if there's saved state and it's older than 5 minutes
  useEffect(() => {
    if (stateAge && stateAge > 5) {
      setIsVisible(true);
    }
  }, [stateAge]);
  
  if (!isVisible || !stateAge) {
    return null;
  }
  
  return (
    <Box 
      bg="blue.50" 
      p={2} 
      borderRadius="md" 
      mb={2}
      position="relative"
    >
      <HStack spacing={2}>
        <Badge colorScheme="blue">INSTRUMENTS REPORT</Badge>
        <Text fontSize="sm">
          You have saved SQL queries and metric cards from {stateAge} minutes ago.
        </Text>
      </HStack>
      <CloseButton 
        size="sm" 
        position="absolute" 
        right={2} 
        top={2}
        onClick={() => setIsVisible(false)}
      />
    </Box>
  );
};

export default InstrumentsReportStateNotification;