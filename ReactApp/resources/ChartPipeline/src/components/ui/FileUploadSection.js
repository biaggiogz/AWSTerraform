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
  useToast
} from '@chakra-ui/react';
import { DeleteIcon, DownloadIcon } from '@chakra-ui/icons';

const FileUploadSection = () => {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const toast = useToast();

  const handleFileUpload = useCallback((event) => {
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

    const newFiles = validFiles.map(file => ({
      id: Date.now() + Math.random(),
      name: file.name,
      size: file.size,
      type: file.type,
      uploadDate: new Date().toLocaleString(),
      file: file
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);
    
    if (newFiles.length > 0) {
      toast({
        title: "Files uploaded",
        description: `${newFiles.length} file(s) uploaded successfully`,
        status: "success",
        duration: 2000
      });
    }
  }, [toast]);

  const removeFile = useCallback((fileId) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
  }, []);

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileTypeColor = (fileName) => {
    const ext = fileName.toLowerCase();
    if (ext.endsWith('.csv')) return 'green';
    if (ext.endsWith('.xlsx')) return 'blue';
    if (ext.endsWith('.xlsm')) return 'purple';
    return 'gray';
  };

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
            >
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
                          const url = URL.createObjectURL(file.file);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = file.name;
                          a.click();
                          URL.revokeObjectURL(url);
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