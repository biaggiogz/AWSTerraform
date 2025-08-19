import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Spinner,
  useToast
} from '@chakra-ui/react';
import { CheckIcon, WarningIcon, CloseIcon } from '@chakra-ui/icons';
import { getValidationResults } from '../../utils/s3Utils';

const ValidationResultsView = ({ fileId, onRetry, onProceed }) => {
  const [validationResults, setValidationResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    const fetchValidationResults = async () => {
      try {
        setLoading(true);
        const results = await getValidationResults(fileId);
        
        if (results) {
          setValidationResults(results);
        } else {
          // Poll for results if not available yet
          setTimeout(fetchValidationResults, 2000);
        }
      } catch (error) {
        toast({
          title: "Error loading validation results",
          description: error.message,
          status: "error",
          duration: 5000
        });
      } finally {
        setLoading(false);
      }
    };

    fetchValidationResults();
  }, [fileId, toast]);

  if (loading) {
    return (
      <Box p={6} textAlign="center">
        <Spinner size="lg" />
        <Text mt={4}>Loading validation results...</Text>
      </Box>
    );
  }

  if (!validationResults) {
    return (
      <Alert status="warning">
        <AlertIcon />
        <AlertTitle>Validation results not found</AlertTitle>
        <AlertDescription>
          Unable to load validation results for this file.
        </AlertDescription>
      </Alert>
    );
  }

  const { file_valid, errors, warnings, sheet_validations } = validationResults;

  return (
    <Box p={6} bg="white" borderRadius="lg" borderWidth="1px">
      <VStack spacing={4} align="stretch">
        <Text fontSize="lg" fontWeight="bold">File Validation Results</Text>

        {/* Overall Status */}
        <Alert status={file_valid ? "success" : "error"} borderRadius="md">
          <AlertIcon />
          <Box flex="1">
            <AlertTitle>
              {file_valid ? "Validation Passed" : "Validation Failed"}
            </AlertTitle>
            <AlertDescription>
              {file_valid 
                ? "All sheet configurations are valid. You can proceed with processing."
                : "Some issues were found with your file structure. Please review the details below."
              }
            </AlertDescription>
          </Box>
        </Alert>

        {/* Errors */}
        {errors && errors.length > 0 && (
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            <Box flex="1">
              <AlertTitle>Errors Found:</AlertTitle>
              <AlertDescription>
                <VStack align="start" spacing={1} mt={2}>
                  {errors.map((error, index) => (
                    <Text key={index} fontSize="sm">• {error}</Text>
                  ))}
                </VStack>
              </AlertDescription>
            </Box>
          </Alert>
        )}

        {/* Warnings */}
        {warnings && warnings.length > 0 && (
          <Alert status="warning" borderRadius="md">
            <AlertIcon />
            <Box flex="1">
              <AlertTitle>Warnings:</AlertTitle>
              <AlertDescription>
                <VStack align="start" spacing={1} mt={2}>
                  {warnings.map((warning, index) => (
                    <Text key={index} fontSize="sm">• {warning}</Text>
                  ))}
                </VStack>
              </AlertDescription>
            </Box>
          </Alert>
        )}

        {/* Sheet Details */}
        {sheet_validations && Object.keys(sheet_validations).length > 0 && (
          <Box>
            <Text fontSize="md" fontWeight="semibold" mb={3}>Sheet Validation Details</Text>
            <Accordion allowMultiple>
              {Object.entries(sheet_validations).map(([sheetName, validation]) => (
                <AccordionItem key={sheetName}>
                  <AccordionButton>
                    <Box flex="1" textAlign="left">
                      <HStack>
                        <Text fontWeight="medium">{sheetName}</Text>
                        <Badge colorScheme={validation.valid ? "green" : "red"}>
                          {validation.valid ? "Valid" : "Invalid"}
                        </Badge>
                        {validation.valid ? (
                          <CheckIcon color="green.500" boxSize={4} />
                        ) : (
                          <CloseIcon color="red.500" boxSize={4} />
                        )}
                      </HStack>
                    </Box>
                    <AccordionIcon />
                  </AccordionButton>
                  <AccordionPanel pb={4}>
                    <VStack align="stretch" spacing={3}>
                      {/* Sheet Stats */}
                      <Table size="sm" variant="simple">
                        <Tbody>
                          <Tr>
                            <Td fontWeight="medium">Rows Found:</Td>
                            <Td>{validation.actual_rows || 0}</Td>
                          </Tr>
                          <Tr>
                            <Td fontWeight="medium">Columns Found:</Td>
                            <Td>{validation.actual_columns || 0}</Td>
                          </Tr>
                        </Tbody>
                      </Table>

                      {/* Sheet Errors */}
                      {validation.errors && validation.errors.length > 0 && (
                        <Box>
                          <Text fontSize="sm" fontWeight="medium" color="red.600" mb={2}>
                            Errors:
                          </Text>
                          <VStack align="start" spacing={1}>
                            {validation.errors.map((error, index) => (
                              <Text key={index} fontSize="sm" color="red.600">
                                • {error}
                              </Text>
                            ))}
                          </VStack>
                        </Box>
                      )}

                      {/* Sheet Warnings */}
                      {validation.warnings && validation.warnings.length > 0 && (
                        <Box>
                          <Text fontSize="sm" fontWeight="medium" color="orange.600" mb={2}>
                            Warnings:
                          </Text>
                          <VStack align="start" spacing={1}>
                            {validation.warnings.map((warning, index) => (
                              <Text key={index} fontSize="sm" color="orange.600">
                                • {warning}
                              </Text>
                            ))}
                          </VStack>
                        </Box>
                      )}
                    </VStack>
                  </AccordionPanel>
                </AccordionItem>
              ))}
            </Accordion>
          </Box>
        )}

        {/* Action Buttons */}
        <HStack spacing={4} justify="center" pt={4}>
          <Button
            colorScheme="gray"
            onClick={onRetry}
            leftIcon={<WarningIcon />}
          >
            Fix Parameters & Retry
          </Button>
          
          {file_valid && (
            <Button
              colorScheme="green"
              onClick={onProceed}
              leftIcon={<CheckIcon />}
            >
              Proceed with Processing
            </Button>
          )}
        </HStack>
      </VStack>
    </Box>
  );
};

export default ValidationResultsView;