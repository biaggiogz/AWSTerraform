import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Alert,
  AlertIcon,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Icon,
  Tooltip
} from '@chakra-ui/react';
import { WarningIcon, CheckCircleIcon, InfoIcon } from '@chakra-ui/icons';

const ErrorDataPanel = ({ fieldErrors, mlEnhanced = false }) => {
  const totalErrors = Object.values(fieldErrors).reduce((sum, errors) => sum + errors.length, 0);
  const fieldsWithErrors = Object.keys(fieldErrors).length;

  if (totalErrors === 0) {
    return (
      <Box p={4} bg="gray.50" borderRadius="md" h="full">
        <VStack spacing={4} align="stretch">
          <Text fontSize="lg" fontWeight="bold" textAlign="center">
            ERRORS DATA
          </Text>
          
          <Alert status="success" borderRadius="md">
            <AlertIcon />
            <VStack align="start" spacing={1}>
              <Text fontSize="sm" fontWeight="semibold">
                No Data Errors Found {mlEnhanced && '🤖'}
              </Text>
              <Text fontSize="xs">
                All fields passed {mlEnhanced ? 'AI-enhanced' : 'standard'} validation checks
              </Text>
            </VStack>
          </Alert>

          <Box p={3} bg="green.50" borderRadius="md" textAlign="center">
            <Icon as={CheckCircleIcon} color="green.500" boxSize={8} mb={2} />
            <Text fontSize="sm" color="green.700" fontWeight="medium">
              Data Quality: Excellent
            </Text>
            <Text fontSize="xs" color="green.600">
              Ready for processing
            </Text>
          </Box>
        </VStack>
      </Box>
    );
  }

  const getErrorTypeColor = (errorType) => {
    switch (errorType) {
      case 'TYPE_MISMATCH': return 'red';
      case 'INVALID_FORMAT': return 'orange';
      case 'MISSING_VALUE': return 'yellow';
      default: return 'gray';
    }
  };

  const getErrorTypeIcon = (errorType) => {
    switch (errorType) {
      case 'TYPE_MISMATCH': return WarningIcon;
      case 'INVALID_FORMAT': return InfoIcon;
      default: return WarningIcon;
    }
  };

  return (
    <Box p={4} bg="gray.50" borderRadius="md" h="full" overflowY="auto">
      <VStack spacing={4} align="stretch">
        <Text fontSize="lg" fontWeight="bold" textAlign="center">
          ERRORS DATA
        </Text>

        {/* Error Summary */}
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          <VStack align="start" spacing={1}>
            <Text fontSize="sm" fontWeight="semibold">
              {totalErrors} Error{totalErrors !== 1 ? 's' : ''} Found {mlEnhanced && '🤖'}
            </Text>
            <Text fontSize="xs">
              {fieldsWithErrors} field{fieldsWithErrors !== 1 ? 's' : ''} affected by {mlEnhanced ? 'AI-enhanced' : 'standard'} validation
            </Text>
          </VStack>
        </Alert>

        {/* Error Statistics */}
        <Box p={3} bg="white" borderRadius="md" borderWidth="1px">
          <Text fontSize="sm" fontWeight="semibold" mb={2}>Error Summary</Text>
          <HStack spacing={4} justify="space-around">
            <VStack spacing={1}>
              <Text fontSize="lg" fontWeight="bold" color="red.500">
                {totalErrors}
              </Text>
              <Text fontSize="xs" color="gray.600">Total Errors</Text>
            </VStack>
            <VStack spacing={1}>
              <Text fontSize="lg" fontWeight="bold" color="orange.500">
                {fieldsWithErrors}
              </Text>
              <Text fontSize="xs" color="gray.600">Fields Affected</Text>
            </VStack>
          </HStack>
        </Box>

        {/* Errors by Field */}
        <Box>
          <Text fontSize="md" fontWeight="semibold" mb={3}>Errors by Field</Text>
          <Accordion allowMultiple size="sm">
            {Object.entries(fieldErrors).map(([fieldName, errors]) => (
              <AccordionItem key={fieldName}>
                <AccordionButton py={2}>
                  <Box flex="1" textAlign="left">
                    <HStack justify="space-between">
                      <Text fontSize="sm" fontWeight="medium">{fieldName}</Text>
                      <Badge colorScheme="red" variant="solid">
                        {errors.length} error{errors.length !== 1 ? 's' : ''}
                      </Badge>
                    </HStack>
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
                <AccordionPanel pb={4}>
                  <VStack spacing={3} align="stretch">
                    {errors.map((error, index) => (
                      <Box 
                        key={index}
                        p={3}
                        bg="red.50"
                        borderRadius="md"
                        borderLeft="4px solid"
                        borderColor="red.400"
                      >
                        <VStack spacing={2} align="stretch">
                          {/* Error Header */}
                          <HStack justify="space-between">
                            <HStack spacing={2}>
                              <Icon 
                                as={getErrorTypeIcon(error.error_type)}
                                color={`${getErrorTypeColor(error.error_type)}.500`}
                                boxSize={4}
                              />
                              <Badge 
                                colorScheme={getErrorTypeColor(error.error_type)}
                                variant="solid"
                                fontSize="xs"
                              >
                                {error.error_type}
                              </Badge>
                            </HStack>
                            <Text fontSize="xs" color="gray.500">
                              Row {error.row_index + 1}
                            </Text>
                          </HStack>

                          {/* Error Description */}
                          <Text fontSize="sm" color="red.700">
                            {error.description}
                          </Text>

                          {/* Error Value */}
                          <Box>
                            <Text fontSize="xs" color="gray.600" mb={1}>
                              Problematic Value:
                            </Text>
                            <Badge variant="outline" colorScheme="red" fontSize="xs">
                              {error.value.length > 50 
                                ? `${error.value.substring(0, 50)}...` 
                                : error.value
                              }
                            </Badge>
                          </Box>

                          {/* Suggested Fix */}
                          {error.suggested_fix && (
                            <Box>
                              <Text fontSize="xs" color="blue.600" fontWeight="semibold" mb={1}>
                                {mlEnhanced ? '🤖 AI Suggested Fix:' : 'Suggested Fix:'}
                              </Text>
                              <Text fontSize="xs" color="blue.700">
                                {error.suggested_fix}
                              </Text>
                            </Box>
                          )}
                        </VStack>
                      </Box>
                    ))}
                  </VStack>
                </AccordionPanel>
              </AccordionItem>
            ))}
          </Accordion>
        </Box>

        {/* Action Required Notice */}
        <Box p={3} bg="yellow.50" borderRadius="md" borderLeft="4px solid" borderColor="yellow.400">
          <HStack spacing={2}>
            <Icon as={WarningIcon} color="yellow.500" />
            <VStack align="start" spacing={1}>
              <Text fontSize="sm" fontWeight="semibold" color="yellow.700">
                Action Required
              </Text>
              <Text fontSize="xs" color="yellow.600">
                Please fix the data errors before approving the dataset for processing.
              </Text>
            </VStack>
          </HStack>
        </Box>
      </VStack>
    </Box>
  );
};

export default ErrorDataPanel;