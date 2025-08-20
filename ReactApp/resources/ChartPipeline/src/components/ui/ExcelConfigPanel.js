import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Input,
  Select,
  Button,
  FormControl,
  FormLabel,
  NumberInput,
  NumberInputField,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  IconButton,
  useToast
} from '@chakra-ui/react';
import { AddIcon, DeleteIcon } from '@chakra-ui/icons';

const ExcelConfigPanel = ({ fileName, onConfigSave, onCancel }) => {
  // Default parameters from lambda_function.py
  const getDefaultParams = (sheetName) => {
    const defaults = {
      'TEST_LOOP': { skip_rows: 11, column_range: 'B:V', header_row: 0 },
      'TP': { skip_rows: 4, column_range: 'B:AS', header_row: 0 },
      'general': { skip_rows: 3, column_range: null, header_row: 0 },
      'Subsystems': { skip_rows: 0, column_range: null, header_row: 0 },
      'ISOS': { skip_rows: 1, column_range: 'A:AL', header_row: 0 },
      'Tuberia': { skip_rows: 8, column_range: 'A:BC', header_row: 0 },
      'TRAC_SIEMSA': { skip_rows: 7, column_range: 'B:AG', header_row: 0 },
      'FIELD_CONTROL': { skip_rows: 4, column_range: 'A:BJ', header_row: 0 },
      'ISO_INST': { skip_rows: 4, column_range: 'A:AJ', header_row: 0 },
      'Punch_List': { skip_rows: 5, column_range: 'B:W', header_row: 0 }
    };
    return defaults[sheetName] || { skip_rows: 0, column_range: null, header_row: 0 };
  };

  const [config, setConfig] = useState({
    sheets: [{
      sheet_name: 'TEST_LOOP',
      ...getDefaultParams('TEST_LOOP')
    }]
  });
  
  const toast = useToast();

  const addSheet = () => {
    setConfig(prev => ({
      ...prev,
      sheets: [...prev.sheets, {
        sheet_name: 'TP',
        ...getDefaultParams('TP')
      }]
    }));
  };

  const removeSheet = (index) => {
    if (config.sheets.length > 1) {
      setConfig(prev => ({
        ...prev,
        sheets: prev.sheets.filter((_, i) => i !== index)
      }));
    }
  };

  const updateSheet = (index, field, value) => {
    setConfig(prev => ({
      ...prev,
      sheets: prev.sheets.map((sheet, i) => {
        if (i === index) {
          if (field === 'sheet_name' && value) {
            // Auto-populate defaults when sheet name changes
            const defaults = getDefaultParams(value);
            return { ...sheet, [field]: value, ...defaults };
          }
          return { ...sheet, [field]: value };
        }
        return sheet;
      })
    }));
  };

  const handleSave = () => {
    // Validate configuration
    const validSheets = config.sheets.filter(sheet => 
      sheet.sheet_name || sheet.sheet_name === null
    );

    if (validSheets.length === 0) {
      toast({
        title: "Configuration Error",
        description: "At least one sheet configuration is required",
        status: "error",
        duration: 3000
      });
      return;
    }

    onConfigSave({
      ...config,
      sheets: validSheets
    });
  };

  return (
    <Box p={6} bg="white" borderRadius="lg" borderWidth="1px">
      <VStack spacing={4} align="stretch">
        <Text fontSize="lg" fontWeight="bold">
          Configure Excel Processing: {fileName}
        </Text>
        
        <Text fontSize="sm" color="gray.600">
          Specify how to read each sheet in your Excel file. Current defaults:
        </Text>
        
        <Box p={3} bg="gray.50" borderRadius="md" fontSize="xs">
          <Text fontWeight="semibold" mb={2}>Default Processing Parameters:</Text>
          <VStack align="start" spacing={1}>
            <Text>• <strong>TEST_LOOP:</strong> skiprows=11, usecols='B:V'</Text>
            <Text>• <strong>TP:</strong> skiprows=4, usecols='B:AS'</Text>
            <Text>• <strong>general:</strong> skiprows=3</Text>
            <Text>• <strong>Subsystems:</strong> No skip rows</Text>
            <Text>• <strong>ISOS:</strong> skiprows=1, usecols='A:AL'</Text>
            <Text>• <strong>Tuberia:</strong> skiprows=8, usecols='A:BC'</Text>
            <Text>• <strong>TRAC_SIEMSA:</strong> skiprows=7, usecols='B:AG'</Text>
            <Text>• <strong>FIELD_CONTROL:</strong> skiprows=4, usecols='A:BJ'</Text>
            <Text>• <strong>ISO_INST:</strong> skiprows=4, usecols='A:AJ'</Text>
            <Text>• <strong>Punch_List:</strong> skiprows=5, usecols='B:W'</Text>
          </VStack>
        </Box>

        <Accordion allowMultiple defaultIndex={[0]}>
          {config.sheets.map((sheet, index) => (
            <AccordionItem key={index}>
              <AccordionButton>
                <Box flex="1" textAlign="left">
                  <Text fontWeight="medium">
                    Sheet {index + 1}: {sheet.sheet_name || 'Default'}
                  </Text>
                </Box>
                <AccordionIcon />
              </AccordionButton>
              <AccordionPanel pb={4}>
                <VStack spacing={4} align="stretch">
                  <HStack justify="space-between">
                    <Text fontSize="md" fontWeight="medium">Sheet Configuration</Text>
                    {config.sheets.length > 1 && (
                      <IconButton
                        icon={<DeleteIcon />}
                        size="sm"
                        colorScheme="red"
                        variant="ghost"
                        onClick={() => removeSheet(index)}
                        aria-label="Remove sheet"
                      />
                    )}
                  </HStack>

                  <FormControl>
                    <FormLabel fontSize="sm">Sheet Name</FormLabel>
                    <Select
                      value={sheet.sheet_name || ''}
                      onChange={(e) => updateSheet(index, 'sheet_name', e.target.value || null)}
                      size="sm"
                    >
                      <option value="">Select sheet...</option>
                      <option value="TEST_LOOP">TEST_LOOP</option>
                      <option value="TP">TP</option>
                      <option value="general">general</option>
                      <option value="Subsystems">Subsystems</option>
                      <option value="ISOS">ISOS</option>
                      <option value="Tuberia">Tuberia</option>
                      <option value="TRAC_SIEMSA">TRAC_SIEMSA</option>
                      <option value="FIELD_CONTROL">FIELD_CONTROL</option>
                      <option value="ISO_INST">ISO_INST</option>
                      <option value="Punch_List">Punch_List</option>
                    </Select>
                    <Text fontSize="xs" color="gray.500" mt={1}>
                      Selecting a sheet auto-fills default parameters
                    </Text>
                  </FormControl>

                  <HStack spacing={4}>
                    <FormControl>
                      <FormLabel fontSize="sm">Skip Rows</FormLabel>
                      <NumberInput
                        min={0}
                        max={100}
                        value={sheet.skip_rows}
                        onChange={(value) => updateSheet(index, 'skip_rows', parseInt(value) || 0)}
                        size="sm"
                      >
                        <NumberInputField />
                      </NumberInput>
                      <Text fontSize="xs" color="gray.500" mt={1}>
                        Number of rows to skip from top
                      </Text>
                    </FormControl>

                    <FormControl>
                      <FormLabel fontSize="sm">Header Row</FormLabel>
                      <NumberInput
                        min={0}
                        max={50}
                        value={sheet.header_row}
                        onChange={(value) => updateSheet(index, 'header_row', parseInt(value) || 0)}
                        size="sm"
                      >
                        <NumberInputField />
                      </NumberInput>
                      <Text fontSize="xs" color="gray.500" mt={1}>
                        Row containing column headers
                      </Text>
                    </FormControl>
                  </HStack>

                  <FormControl>
                    <FormLabel fontSize="sm">Column Range</FormLabel>
                    <Input
                      placeholder="e.g., A:F or A1:F100"
                      value={sheet.column_range || ''}
                      onChange={(e) => updateSheet(index, 'column_range', e.target.value || null)}
                      size="sm"
                    />
                    <Text fontSize="xs" color="gray.500" mt={1}>
                      Excel range notation. Default for {sheet.sheet_name}: {getDefaultParams(sheet.sheet_name || '').column_range || 'All columns'}
                    </Text>
                  </FormControl>
                </VStack>
              </AccordionPanel>
            </AccordionItem>
          ))}
        </Accordion>

        <Button
          leftIcon={<AddIcon />}
          variant="outline"
          size="sm"
          onClick={addSheet}
        >
          Add Another Sheet
        </Button>

        <HStack spacing={3} pt={4}>
          <Button
            colorScheme="blue"
            onClick={handleSave}
            flex={1}
          >
            Process with Configuration
          </Button>
          <Button
            variant="outline"
            onClick={onCancel}
            flex={1}
          >
            Cancel
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
};

export default ExcelConfigPanel;