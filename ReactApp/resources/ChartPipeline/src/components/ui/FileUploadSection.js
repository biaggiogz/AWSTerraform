import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  List,
  ListItem,
  Badge,
  IconButton,
  useToast,
  Spinner,
  Progress,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription
} from '@chakra-ui/react';
import { DeleteIcon, DownloadIcon } from '@chakra-ui/icons';
import { uploadFileToS3, deleteFileFromS3, listS3Objects, uploadApprovalRequest } from '../../utils/s3Utils';
import { createProgressMonitor } from '../../utils/progressUtils';
import ProcessingResultsView from './ProcessingResultsView';

const FileUploadSection = () => {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [processingResultKey, setProcessingResultKey] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingMessage, setProcessingMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentFileId, setCurrentFileId] = useState(null);
  const [errorDetails, setErrorDetails] = useState(null);
  const progressMonitorRef = useRef(null);
  const toast = useToast();

  const handleFileUpload = useCallback(async (event) => {
    const files = Array.from(event.target.files);
    const validFiles = files.filter(file => {
      const ext = file.name.toLowerCase();
      return ext.endsWith('.csv') || ext.endsWith('.xlsx') || ext.endsWith('.xlsm');
    });

    if (validFiles.length !== files.length) {
      toast({
        title: "Invalid files detected",
        description: "Only CSV, XLSX, and XLSM files are allowed",
        status: "warning",
        duration: 3000
      });
    }

    if (validFiles.length === 0) return;

    setUploading(true);
    const successfulUploads = [];

    for (const file of validFiles) {
      try {
        const result = await uploadFileToS3(file, file.name);
        const fileData = {
          id: Date.now() + Math.random(),
          name: file.name,
          size: file.size,
          type: file.type,
          uploadDate: new Date().toLocaleString(),
          s3Key: result.key,
          s3Url: result.url
        };
        successfulUploads.push(fileData);
      } catch (error) {
        toast({
          title: "Upload failed",
          description: `Failed to upload ${file.name}: ${error.message}`,
          status: "error",
          duration: 5000
        });
      }
    }

    setUploadedFiles(prev => [...prev, ...successfulUploads]);
    setUploading(false);
    
    if (successfulUploads.length > 0) {
      toast({
        title: "Files uploaded to S3",
        description: `${successfulUploads.length} file(s) uploaded. Processing started...`,
        status: "success",
        duration: 5000
      });
      
      // Start progress tracking - use filename without extension to match Lambda
      const fileId = successfulUploads[0].name.split('.')[0];
      setCurrentFileId(fileId);
      setIsProcessing(true);
      setProcessingProgress(0);
      setProcessingMessage('Processing started...');
      
      console.log('🚀 Starting processing pipeline:', {
        files: successfulUploads.map(f => f.name),
        fileId: fileId
      });
      
      // Start progress monitoring
      startProgressMonitoring(fileId);
    }
  }, [toast]);

  const removeFile = useCallback(async (fileId) => {
    const file = uploadedFiles.find(f => f.id === fileId);
    if (!file) return;

    try {
      await deleteFileFromS3(file.name);
      setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
      toast({
        title: "File deleted",
        description: `${file.name} removed from S3`,
        status: "success",
        duration: 2000
      });
    } catch (error) {
      toast({
        title: "Delete failed",
        description: `Failed to delete ${file.name}: ${error.message}`,
        status: "error",
        duration: 3000
      });
    }
  }, [uploadedFiles, toast]);

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Progress monitoring using utility functions
  const startProgressMonitoring = useCallback((fileId) => {
    console.log('🚀 Starting progress monitoring for fileId:', fileId);
    console.log('🔧 Environment variables:', {
      S3_BUCKET: process.env.REACT_APP_S3_BUCKET,
      AWS_REGION: process.env.REACT_APP_AWS_REGION
    });
    
    const progressMonitor = createProgressMonitor(
      fileId,
      (progressData) => {
        console.log('📊 Progress update:', progressData);
        setProcessingProgress(progressData.progress);
        setProcessingMessage(progressData.message);
        setErrorDetails(progressData.error_details);
        
        if (progressData.progress >= 100) {
          setIsProcessing(false);
          setErrorDetails(null);
          toast({
            title: "Processing Complete",
            description: "File processing completed successfully!",
            status: "success",
            duration: 3000
          });
          
          // Check for results after completion
          setTimeout(() => {
            checkForProcessingResults(`${fileId}.xlsx`);
          }, 1000);
        }
        
        if (progressData.progress < 0) {
          setIsProcessing(false);
          toast({
            title: "Processing Error",
            description: progressData.message,
            status: "error",
            duration: 8000
          });
        }
      },
      (error) => {
        console.error('❌ Progress monitoring error:', error);
        console.error('Error details:', {
          message: error.message,
          stack: error.stack,
          fileId: fileId
        });
        toast({
          title: "Progress Error",
          description: `Failed to track progress: ${error.message}`,
          status: "warning",
          duration: 5000
        });
      }
    );
    
    progressMonitorRef.current = progressMonitor;
    progressMonitor.start();
  }, [toast]);
  
  // Cleanup effect
  useEffect(() => {
    return () => {
      setIsProcessing(false);
      setErrorDetails(null);
      if (progressMonitorRef.current) {
        progressMonitorRef.current.stop();
      }
    };
  }, []);

  const checkForProcessingResults = async (fileName) => {
    try {
      const fileId = fileName.split('.')[0];
      const expectedResultKey = `processing-results/${fileId}.json`;
      
      console.log('🔍 Checking for processing results:', {
        fileName,
        fileId,
        expectedKey: expectedResultKey
      });
      
      let attempts = 0;
      const maxAttempts = 60; // 10 minutes total for Python+Rust pipeline
      
      const pollForResults = async () => {
        try {
          const objects = await listS3Objects('processing-results/');
          
          // Look for specific file result first
          const specificResult = objects.find(obj => obj.Key === expectedResultKey);
          if (specificResult) {
            console.log('✅ Found specific processing result:', specificResult.Key);
            setProcessingResultKey(specificResult.Key);
            setShowResults(true);
            return;
          }
          
          // Fallback to most recent result
          if (objects.length > 0) {
            const latestResult = objects.sort((a, b) => 
              new Date(b.LastModified) - new Date(a.LastModified)
            )[0];
            
            console.log('📊 Using latest processing result:', latestResult.Key);
            setProcessingResultKey(latestResult.Key);
            setShowResults(true);
            return;
          }
          
          attempts++;
          
          // Log progress every minute
          if (attempts % 6 === 0) {
            console.log(`⏳ Still waiting for Python+Rust pipeline... (${Math.floor(attempts / 6)} minutes)`);
          }
          
          if (attempts < maxAttempts) {
            setTimeout(pollForResults, 10000); // Check every 10 seconds
          } else {
            toast({
              title: "Processing timeout",
              description: "Python preprocessing + Rust ML analysis exceeded 10 minutes",
              status: "warning",
              duration: 5000
            });
          }
        } catch (error) {
          console.error('❌ Error polling for results:', error);
        }
      };
      
      pollForResults();
    } catch (error) {
      console.error('❌ Error checking for processing results:', error);
    }
  };

  const handleApprove = async (processingResult) => {
    try {
      // Create approval request
      const approvalRequest = {
        file_id: processingResult.file_id,
        processing_result_key: processingResultKey,
        approved_by: 'user',
        timestamp: new Date().toISOString()
      };
      
      // Save approval request to trigger approval Lambda
      const approvalKey = `approval-requests/${processingResult.file_id}.json`;
      await uploadApprovalRequest(approvalKey, approvalRequest);
      
      toast({
        title: "Dataset Approved",
        description: `File ${processingResult.file_id} has been approved and moved to approvedDataset/`,
        status: "success",
        duration: 5000
      });
      
      setShowResults(false);
      setProcessingResultKey(null);
    } catch (error) {
      toast({
        title: "Approval Failed",
        description: `Failed to approve dataset: ${error.message}`,
        status: "error",
        duration: 5000
      });
    }
  };
  


  const handleCancel = (processingResult) => {
    toast({
      title: "Dataset Cancelled",
      description: `File ${processingResult.file_id} processing has been cancelled`,
      status: "warning",
      duration: 3000
    });
    setShowResults(false);
    setProcessingResultKey(null);
  };

  const getFileTypeColor = (fileName) => {
    const ext = fileName.toLowerCase();
    if (ext.endsWith('.csv')) return 'green';
    if (ext.endsWith('.xlsx')) return 'blue';
    if (ext.endsWith('.xlsm')) return 'purple';
    return 'gray';
  };

  if (showResults && processingResultKey) {
    return (
      <ProcessingResultsView
        processingResultKey={processingResultKey}
        onApprove={handleApprove}
        onCancel={handleCancel}
      />
    );
  }

  return (
    <Box p={6} bg="white" borderRadius="lg" borderWidth="1px">
      <VStack spacing={4} align="stretch">
        <Text fontSize="lg" fontWeight="bold">Upload Dataset Files</Text>
        
        {/* Processing Progress */}
        {isProcessing && (
          <Alert status={processingProgress < 0 ? "error" : "info"} borderRadius="md">
            <AlertIcon />
            <Box flex="1">
              <AlertTitle>{processingProgress < 0 ? "Processing Error" : "Processing File..."}</AlertTitle>
              <AlertDescription>
                <VStack align="stretch" spacing={2} mt={2}>
                  <Text fontSize="sm">{processingMessage}</Text>
                  {processingProgress >= 0 && (
                    <>
                      <Progress 
                        value={processingProgress} 
                        colorScheme="blue" 
                        size="lg" 
                        borderRadius="md"
                      />
                      <Text fontSize="xs" color="gray.600">
                        {processingProgress}% complete
                      </Text>
                    </>
                  )}
                  {errorDetails && (
                    <Box mt={3} p={3} bg="red.50" borderRadius="md" borderWidth="1px" borderColor="red.200">
                      <Text fontSize="sm" fontWeight="semibold" color="red.700" mb={2}>
                        Error Details:
                      </Text>
                      <Text fontSize="xs" color="red.600" mb={1}>
                        Type: {errorDetails.error_type}
                      </Text>
                      <Text fontSize="xs" color="red.600" fontFamily="mono">
                        {errorDetails.details}
                      </Text>
                      {errorDetails.columns && (
                        <Text fontSize="xs" color="red.600" mt={1}>
                          Columns: {errorDetails.columns.join(', ')}
                        </Text>
                      )}
                    </Box>
                  )}
                </VStack>
              </AlertDescription>
            </Box>
          </Alert>
        )}

        {/* Upload Area */}
        <Box
          border="2px dashed"
          borderColor={isProcessing ? "gray.200" : "gray.300"}
          borderRadius="md"
          p={8}
          textAlign="center"
          _hover={{ borderColor: isProcessing ? "gray.200" : "blue.400" }}
          opacity={isProcessing ? 0.6 : 1}
        >
          <VStack spacing={3}>
            <Text color="gray.600">
              Drag and drop files here, or click to select
            </Text>
            <Text fontSize="sm" color="gray.500">
              Supported formats: CSV, XLSX, XLSM
            </Text>
            <Button
              as="label"
              colorScheme="blue"
              cursor="pointer"
              htmlFor="file-upload"
              isLoading={uploading}
              loadingText="Uploading..."
              disabled={uploading || isProcessing}
            >
              {uploading ? <Spinner size="sm" mr={2} /> : null}
              Select Files
            </Button>
            <input
              id="file-upload"
              type="file"
              multiple
              accept=".csv,.xlsx,.xlsm"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
              disabled={isProcessing}
            />
          </VStack>
        </Box>

        {/* Uploaded Files List */}
        {uploadedFiles.length > 0 && (
          <Box>
            <Text fontSize="md" fontWeight="semibold" mb={3}>
              Uploaded Files ({uploadedFiles.length})
            </Text>
            <List spacing={2}>
              {uploadedFiles.map((file) => (
                <ListItem
                  key={file.id}
                  p={3}
                  bg="gray.50"
                  borderRadius="md"
                  borderWidth="1px"
                >
                  <HStack justify="space-between">
                    <VStack align="start" spacing={1} flex={1}>
                      <HStack>
                        <Text fontWeight="medium">{file.name}</Text>
                        <Badge colorScheme={getFileTypeColor(file.name)}>
                          {file.name.split('.').pop().toUpperCase()}
                        </Badge>
                      </HStack>
                      <HStack spacing={4}>
                        <Text fontSize="sm" color="gray.600">
                          {formatFileSize(file.size)}
                        </Text>
                        <Text fontSize="sm" color="gray.600">
                          {file.uploadDate}
                        </Text>
                        <Text fontSize="xs" color="green.600">
                          ✓ Uploaded to S3
                        </Text>
                      </HStack>
                    </VStack>
                    <HStack>
                      <IconButton
                        icon={<DownloadIcon />}
                        size="sm"
                        variant="ghost"
                        colorScheme="blue"
                        aria-label="Download file"
                        onClick={() => {
                          window.open(file.s3Url, '_blank');
                        }}
                      />
                      <IconButton
                        icon={<DeleteIcon />}
                        size="sm"
                        variant="ghost"
                        colorScheme="red"
                        aria-label="Remove file"
                        onClick={() => removeFile(file.id)}
                        disabled={isProcessing}
                      />
                    </HStack>
                  </HStack>
                </ListItem>
              ))}
            </List>
          </Box>
        )}
      </VStack>
    </Box>
  );
};

export default FileUploadSection;