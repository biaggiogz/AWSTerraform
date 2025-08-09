import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Input,
  Button,
  FormControl,
  FormLabel,
  NumberInput,
  NumberInputField,
  IconButton,
  Alert,
  AlertIcon
} from '@chakra-ui/react';
import { AddIcon, DeleteIcon } from '@chakra-ui/icons';

const FileParametersConfig = ({ onParametersSet, isProcessing }) => {
  const [sheets, setSheets] = useState([
    { sheetName: '', columnRange: '', skipRows: 0 }
  ]);

  const addSheet = () => {
    setSheets([...sheets, { sheetName: '', columnRange: '', skipRows: 0 }]);
  };

  const removeSheet = (index) => {
    if (sheets.length > 1) {
      setSheets(sheets.filter((_, i) => i !== index));
    }
  };

  const updateSheet = (index, field, value) => {
    const updated = [...sheets];
    updated[index][field] = value;
    setSheets(updated);
  };

  const handleSetParameters = () => {
    const validSheets = sheets.filter(s => s.sheetName && s.columnRange);
    if (validSheets.length === 0) {
      return;
    }
    onParametersSet(validSheets);
  };

  const isValid = sheets.some(s => s.sheetName && s.columnRange);

  return (
    <Box p={4} bg="gray.50" borderRadius="md" borderWidth="1px">
      <VStack spacing={4} align="stretch">
        <Text fontSize="md" fontWeight="semibold">
          Configure Sheet Parameters
        </Text>
        
        <Alert status="info" size="sm">
          <AlertIcon />
          Specify sheet names, column ranges (e.g., A:E), and rows to skip for validation
        </Alert>

        {sheets.map((sheet, index) => (
          <Box key={index} p={3} bg="white" borderRadius="md" borderWidth="1px">
            <HStack spacing={3} align="end">
              <FormControl flex={2}>
                <FormLabel fontSize="sm">Sheet Name</FormLabel>
                <Input
                  size="sm"
                  placeholder="Sheet1"
                  value={sheet.sheetName}
                  onChange={(e) => updateSheet(index, 'sheetName', e.target.value)}
                  disabled={isProcessing}
                />
              </FormControl>
              
              <FormControl flex={2}>
                <FormLabel fontSize="sm">Column Range</FormLabel>
                <Input
                  size="sm"
                  placeholder="A:E"
                  value={sheet.columnRange}
                  onChange={(e) => updateSheet(index, 'columnRange', e.target.value)}
                  disabled={isProcessing}
                />
              </FormControl>
              
              <FormControl flex={1}>
                <FormLabel fontSize="sm">Skip Rows</FormLabel>
                <NumberInput
                  size="sm"
                  min={0}
                  value={sheet.skipRows}
                  onChange={(value) => updateSheet(index, 'skipRows', parseInt(value) || 0)}
                  isDisabled={isProcessing}
                >
                  <NumberInputField />
                </NumberInput>
              </FormControl>
              
              <IconButton
                size="sm"
                icon={<DeleteIcon />}
                colorScheme="red"
                variant="ghost"
                onClick={() => removeSheet(index)}
                isDisabled={sheets.length === 1 || isProcessing}
              />
            </HStack>
          </Box>
        ))}

        <HStack justify="space-between">
          <Button
            size="sm"
            leftIcon={<AddIcon />}
            variant="outline"
            onClick={addSheet}
            disabled={isProcessing}
          >
            Add Sheet
          </Button>
          
          <Button
            size="sm"
            colorScheme="blue"
            onClick={handleSetParameters}
            disabled={!isValid || isProcessing}
          >
            Set Parameters
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
};

export default FileParametersConfig;