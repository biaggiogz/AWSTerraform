import React from 'react';
import { Box, VStack, HStack, Heading, Spinner, Text } from '@chakra-ui/react';

/**
 * Generic panel wrapper that handles common panel patterns
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Panel content
 * @param {boolean} props.loading - Loading state
 * @param {string} props.error - Error message
 * @param {string} props.title - Panel title
 * @param {React.ReactNode} props.headerActions - Additional header content
 * @param {Object} props.containerProps - Props for container Box
 * @param {boolean} props.isZoomed - Zoom state for responsive sizing
 */
const BasePanelWrapper = ({ 
  children, 
  loading = false, 
  error = null, 
  title = null,
  headerActions = null,
  containerProps = {},
  isZoomed = false,
  ...restProps 
}) => {
  const defaultContainerProps = {
    p: 6,
    width: "100%",
    height: "100vh",
    maxWidth: isZoomed ? "146.67vw" : "150vw",
    overflow: "hidden",
    ...containerProps
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="300px">
        <Spinner size="xl" />
        <Text ml={4}>Loading...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={6} textAlign="center" color="red.500">
        <Heading size="md">Error Loading Data</Heading>
        <Text mt={2}>{error}</Text>
      </Box>
    );
  }

  return (
    <Box {...defaultContainerProps} {...restProps}>
      {title && (
        <HStack justify="space-between" align="center" mb={4}>
          <Heading size="lg">{title}</Heading>
          {headerActions}
        </HStack>
      )}
      <VStack spacing={4} align="stretch">
        {children}
      </VStack>
    </Box>
  );
};

export default BasePanelWrapper;