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
  AlertIcon
} from '@chakra-ui/react';
import ProfileDataPanel from './ProfileDataPanel';
import SchemaDataPanel from './SchemaDataPanel';
import ErrorDataPanel from './ErrorDataPanel';
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
      // Load processing result JSON created by Rust Lambda
      const resultData = await downloadFileFromS3(processingResultKey);
      const result = JSON.parse(resultData);
      
      console.log('📊 Processing Result Loaded:', {
        fileId: result.file_id,
        profileData: result.profile_data,
        schemaVersion: result.schema_version,
        fieldErrors: Object.keys(result.field_errors).length,
        mlConfidence: result.ml_confidence_score
      });
      
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
              <HStack spacing={4} align="stretch" minH="500px">
                {/* Profile Data Panel - Shows Python preprocessing results */}
                <Box flex={1}>
                  <ProfileDataPanel profileData={processingResult.profile_data} />
                </Box>

                {/* Schema Data Panel - Shows inferred column types */}
                <Box flex={1}>
                  <SchemaDataPanel schemaVersion={processingResult.schema_version} />
                </Box>

                {/* Error Data Panel - Shows ML-detected business logic errors */}
                <Box flex={1}>
                  <ErrorDataPanel fieldErrors={processingResult.field_errors} />
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