import React from 'react';
import { Box, VStack, Heading, Text } from '@chakra-ui/react';

/**
 * ViewSubsystems component - Empty tab for View Subsystems
 * @param {Object} props - Component props
 * @param {Array} props.data - Filtered dataset
 */
const ViewSubsystems = ({ data = [] }) => {
  return (
    <Box p={6} width="100%" height="100vh" maxWidth="100vw" overflow="hidden">
      <VStack spacing={4} align="stretch">
        <Heading size="md">View Subsystems</Heading>
        <Text>This is the View Subsystems tab.</Text>
      </VStack>
    </Box>
  );
};

export default ViewSubsystems;