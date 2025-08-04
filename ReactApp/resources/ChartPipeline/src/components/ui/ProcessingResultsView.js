import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  useToast,
  Spinner,
  Alert,
  AlertIcon,
  Badge,
  Progress
} from '@chakra-ui/react';
import ProfileDataPanel from './ProfileDataPanel';
import SchemaDataPanel from './SchemaDataPanel';
import ErrorDataPanel from './ErrorDataPanel';
import MLEnhancementPanel from './MLEnhancementPanel';
import { downloadFileFromS3 } from '../../utils/s3Utils';

const ProcessingResultsView = ({ processingResultKey, onApprove, onCancel }) => {
  const [processingResult, setProcessingResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const toast = useToast();

  useEffect(() => {
    if (processingResultKey) {
      loadProcessingResult();
    }
  }, [processingResultKey]);

  const loadProcessingResult = async () => {
    try {
      setLoading(true);
      const resultData = await downloadFileFromS3(processingResultKey);
      const result = JSON.parse(resultData);
      setProcessingResult(result);
      setError(null);
    } catch (err) {
      setError(`Failed to load processing results: ${err.message}`);
      toast({
        title: "Error loading results",
        description: err.message,
        status: "error",
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = () => {
    if (onApprove && processingResult) {
      onApprove(processingResult);
    }
  };

  const handleCancel = () => {
    if (onCancel && processingResult) {
      onCancel(processingResult);
    }
  };

  if (loading) {
    return (
      <Box p={6} textAlign="center">
        <Spinner size="lg" />
        <Text mt={4}>Loading processing results...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert status="error">
        <AlertIcon />
        {error}
      </Alert>
    );
  }

  if (!processingResult) {
    return (
      <Box p={6} textAlign="center">
        <Text color="gray.500">No processing results to display</Text>
      </Box>
    );
  }

  const hasErrors = Object.keys(processingResult.field_errors).length > 0;

  return (
    <Box p={6} bg="white" borderRadius="lg" borderWidth="1px">
      <VStack spacing={6} align="stretch">
        {/* Header with Tabs */}
        <Tabs variant="enclosed" colorScheme="blue">
          <HStack justify="space-between" mb={4}>
            <TabList>
              <Tab>UPLOAD FILES</Tab>
              <Tab>TEST LOOP</Tab>
            </TabList>
          </HStack>
          
          <TabPanels>
            <TabPanel p={0}>
              {/* Main Content Area */}
              <VStack spacing={4} align="stretch">
                {/* ML Confidence Score */}
                <Box p={3} bg="blue.50" borderRadius="md" borderLeft="4px solid" borderColor="blue.400">
                  <HStack justify="space-between" align="center">
                    <VStack align="start" spacing={1}>
                      <Text fontSize="sm" fontWeight="semibold" color="blue.700">
                        ML Enhancement Confidence
                      </Text>
                      <Text fontSize="xs" color="blue.600">
                        AI-powered validation and anomaly detection
                      </Text>
                    </VStack>
                    <VStack align="end" spacing={1}>
                      <Badge 
                        colorScheme={processingResult.ml_confidence_score > 0.8 ? 'green' : processingResult.ml_confidence_score > 0.5 ? 'yellow' : 'red'}
                        variant="solid"
                      >
                        {(processingResult.ml_confidence_score * 100).toFixed(1)}%
                      </Badge>
                      <Progress 
                        value={processingResult.ml_confidence_score * 100} 
                        size="sm" 
                        width="100px"
                        colorScheme={processingResult.ml_confidence_score > 0.8 ? 'green' : processingResult.ml_confidence_score > 0.5 ? 'yellow' : 'red'}
                      />
                    </VStack>
                  </HStack>
                </Box>

                <HStack spacing={4} align="stretch" minH="500px">
                  {/* Profile Data Panel */}
                  <Box flex={1}>
                    <ProfileDataPanel profileData={processingResult.profile_data} />
                  </Box>

                  {/* Schema Data Panel */}
                  <Box flex={1}>
                    <SchemaDataPanel schemaVersion={processingResult.schema_version} />
                  </Box>

                  {/* Error Data Panel */}
                  <Box flex={1}>
                    <ErrorDataPanel 
                      fieldErrors={processingResult.field_errors} 
                      mlEnhanced={processingResult.ml_confidence_score > 0}
                    />
                  </Box>

                  {/* ML Enhancement Panel */}
                  <Box flex={1}>
                    <MLEnhancementPanel 
                      anomalyResults={processingResult.anomaly_results || []}
                      validationResults={processingResult.validation_results || []}
                      nullPredictions={processingResult.null_predictions || []}
                      mlConfidence={processingResult.ml_confidence_score || 0}
                    />
                  </Box>

                  {/* Action Buttons */}
                  <VStack spacing={3} minW="120px">
                    <Button
                      colorScheme="green"
                      size="lg"
                      width="full"
                      onClick={handleApprove}
                      isDisabled={hasErrors}
                    >
                      APPROVE
                    </Button>
                    <Button
                      colorScheme="red"
                      variant="outline"
                      size="lg"
                      width="full"
                      onClick={handleCancel}
                    >
                      CANCEL
                    </Button>
                    
                    {hasErrors && (
                      <Text fontSize="xs" color="red.500" textAlign="center">
                        Fix errors before approving
                      </Text>
                    )}
                  </VStack>
                </HStack>
              </VStack>
            </TabPanel>
            
            <TabPanel p={0}>
              <Box p={4} bg="gray.50" borderRadius="md">
                <Text>Test Loop configuration and settings will be displayed here.</Text>
              </Box>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>
    </Box>
  );
};

export default ProcessingResultsView;