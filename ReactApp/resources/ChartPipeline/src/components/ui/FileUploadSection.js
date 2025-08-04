import React, { useState, useCallback } from 'react';
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
  Spinner
} from '@chakra-ui/react';
import { DeleteIcon, DownloadIcon } from '@chakra-ui/icons';
import { uploadFileToS3, deleteFileFromS3, listS3Objects, uploadApprovalRequest } from '../../utils/s3Utils';
import ProcessingResultsView from './ProcessingResultsView';

const FileUploadSection = () => {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [processingResultKey, setProcessingResultKey] = useState(null);
  const [showResults, setShowResults] = useState(false);
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
        description: `${successfulUploads.length} file(s) uploaded. Python preprocessing + Rust ML analysis starting...`,
        status: "success",
        duration: 5000
      });
      
      console.log('🚀 Starting processing pipeline:', {
        files: successfulUploads.map(f => f.name),
        pipeline: 'Python preprocessing → Rust ML analysis'
      });
      
      // Check for processing results after a delay (Python+Rust takes longer)
      setTimeout(() => {
        checkForProcessingResults(successfulUploads[0].name);
      }, 20000); // Wait 20 seconds for full pipeline
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
        
        {/* Upload Area */}
        <Box
          border="2px dashed"
          borderColor="gray.300"
          borderRadius="md"
          p={8}
          textAlign="center"
          _hover={{ borderColor: "blue.400" }}
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
              disabled={uploading}
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