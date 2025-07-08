import React, { useCallback, useState } from 'react';
import {
  Box,
  Text,
  VStack,
  HStack,
  Input,
  Button,
  Progress,
  Alert,
  AlertIcon,
  Badge,
  useToast
} from '@chakra-ui/react';
import { MdCloudUpload, MdInsertDriveFile } from 'react-icons/md';

const CSVUploadDropzone = ({ onUpload, isUploading = false }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [tableName, setTableName] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const toast = useToast();

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(async (e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const csvFiles = files.filter(file => 
      file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv')
    );
    
    if (csvFiles.length === 0) {
      toast({
        title: 'Invalid File Type',
        description: 'Please upload CSV files only',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (csvFiles.length > 1) {
      toast({
        title: 'Multiple Files',
        description: 'Please upload one CSV file at a time',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    await handleFileUpload(csvFiles[0]);
  }, [toast]);

  const handleFileSelect = useCallback(async (e) => {
    const file = e.target.files[0];
    if (file) {
      await handleFileUpload(file);
    }
  }, []);

  const handleFileUpload = useCallback(async (file) => {
    if (!tableName.trim()) {
      toast({
        title: 'Table Name Required',
        description: 'Please enter a table name for the CSV file',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setUploadProgress(0);
      
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      const success = await onUpload(file, tableName);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      if (success) {
        toast({
          title: 'Upload Successful',
          description: `Table "${tableName}" created with ${file.name}`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        setTableName('');
      }
      
      setTimeout(() => setUploadProgress(0), 1000);
    } catch (error) {
      setUploadProgress(0);
      toast({
        title: 'Upload Failed',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  }, [tableName, onUpload, toast]);

  const generateTableName = useCallback((fileName) => {
    const baseName = fileName.replace(/\.csv$/i, '').toLowerCase();
    const cleanName = baseName.replace(/[^a-z0-9_]/g, '_');
    setTableName(cleanName);
  }, []);

  return (
    <Box>
      {/* Table Name Input */}
      <VStack spacing={3} mb={4}>
        <Input
          placeholder="Enter table name (e.g., my_data_table)"
          value={tableName}
          onChange={(e) => setTableName(e.target.value)}
          size="sm"
        />
      </VStack>

      {/* Drop Zone */}
      <Box
        border="2px dashed"
        borderColor={isDragOver ? "blue.400" : "gray.300"}
        borderRadius="md"
        p={6}
        textAlign="center"
        bg={isDragOver ? "blue.50" : "gray.50"}
        cursor="pointer"
        transition="all 0.2s"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        _hover={{ borderColor: "blue.400", bg: "blue.50" }}
      >
        <VStack spacing={3}>
          <MdCloudUpload size={40} color={isDragOver ? "#3182CE" : "#A0AEC0"} />
          
          <VStack spacing={1}>
            <Text fontWeight="semibold" color={isDragOver ? "blue.600" : "gray.600"}>
              Drop CSV file here or click to browse
            </Text>
            <Text fontSize="sm" color="gray.500">
              Supports CSV files up to 10MB
            </Text>
          </VStack>

          <input
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
            id="csv-upload"
          />
          
          <Button
            as="label"
            htmlFor="csv-upload"
            size="sm"
            colorScheme="blue"
            variant="outline"
            cursor="pointer"
            isDisabled={isUploading}
          >
            Browse Files
          </Button>
        </VStack>
      </Box>

      {/* Upload Progress */}
      {uploadProgress > 0 && (
        <Box mt={3}>
          <HStack justify="space-between" mb={1}>
            <Text fontSize="sm">Uploading...</Text>
            <Text fontSize="sm">{uploadProgress}%</Text>
          </HStack>
          <Progress value={uploadProgress} colorScheme="blue" size="sm" />
        </Box>
      )}

      {/* Upload Tips */}
      <Alert status="info" mt={3} size="sm">
        <AlertIcon />
        <VStack align="start" spacing={1} fontSize="xs">
          <Text>• CSV files are processed with WASM for 3-5x faster performance</Text>
          <Text>• Table names should contain only letters, numbers, and underscores</Text>
          <Text>• Uploaded tables are automatically indexed for optimal query performance</Text>
        </VStack>
      </Alert>
    </Box>
  );
};

export default CSVUploadDropzone;