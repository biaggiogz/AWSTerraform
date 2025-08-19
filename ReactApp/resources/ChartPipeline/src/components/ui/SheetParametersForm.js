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
  IconButton,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  useToast
} from '@chakra-ui/react';
import { AddIcon, DeleteIcon } from '@chakra-ui/icons';

const DEFAULT_SHEETS = [
  { name: 'TEST_LOOP', skip_rows: 11, column_range: 'B:V' },
  { name: 'TP', skip_rows: 4, column_range: 'B:AS' },
  { name: 'general', skip_rows: 3, column_range: '' },
  { name: 'Subsystems', skip_rows: 0, column_range: '' },
  { name: 'ISOS', skip_rows: 1, column_range: 'A:AL' },
  { name: 'Tuberia', skip_rows: 8, column_range: 'A:BC' },
  { name: 'TRAC_SIEMSA', skip_rows: 7, column_range: 'B:AG' },
  { name: 'FIELD_CONTROL', skip_rows: 4, column_range: 'A:BJ' },
  { name: 'ISO_INST', skip_rows: 4, column_range: 'A:AJ' },
  { name: 'Punch_List', skip_rows: 5, column_range: 'B:W' }
];

const SheetParametersForm = ({ onParametersChange, onReset }) => {
  const [sheets, setSheets] = useState(DEFAULT_SHEETS);
  const toast = useToast();

  const handleSheetChange = (index, field, value) => {
    const updatedSheets = [...sheets];
    updatedSheets[index] = { ...updatedSheets[index], [field]: value };
    setSheets(updatedSheets);
    onParametersChange(updatedSheets);
  };

  const addSheet = () => {
    const newSheet = { name: '', skip_rows: 0, column_range: '' };
    const updatedSheets = [...sheets, newSheet];
    setSheets(updatedSheets);
    onParametersChange(updatedSheets);
  };

  const removeSheet = (index) => {
    if (sheets.length <= 1) {
      toast({
        title: "Cannot remove",
        description: "At least one sheet configuration is required",
        status: "warning",
        duration: 3000
      });
      return;
    }
    const updatedSheets = sheets.filter((_, i) => i !== index);
    setSheets(updatedSheets);
    onParametersChange(updatedSheets);
  };

  const resetToDefaults = () => {
    setSheets(DEFAULT_SHEETS);
    onParametersChange(DEFAULT_SHEETS);
    if (onReset) onReset();
    toast({
      title: "Reset to defaults",
      description: "Sheet parameters restored to default values",
      status: "info",
      duration: 2000
    });
  };

  return (
    <Box p={4} bg="gray.50" borderRadius="md" borderWidth="1px">
      <VStack spacing={4} align="stretch">
        <HStack justify="space-between">
          <Text fontSize="lg" fontWeight="bold">Sheet Parameters Configuration</Text>
          <HStack>
            <Button size="sm" onClick={resetToDefaults} variant="outline">
              Reset to Defaults
            </Button>
            <Button size="sm" onClick={addSheet} leftIcon={<AddIcon />} colorScheme="blue">
              Add Sheet
            </Button>
          </HStack>
        </HStack>

        <Box overflowX="auto">
          <Table size="sm" variant="simple">
            <Thead>
              <Tr>
                <Th>Sheet Name</Th>
                <Th>Skip Rows</Th>
                <Th>Column Range</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {sheets.map((sheet, index) => (
                <Tr key={index}>
                  <Td>
                    <FormControl>
                      <Input
                        size="sm"
                        value={sheet.name}
                        onChange={(e) => handleSheetChange(index, 'name', e.target.value)}
                        placeholder="Sheet name"
                        bg="white"
                      />
                    </FormControl>
                  </Td>
                  <Td>
                    <FormControl>
                      <Input
                        size="sm"
                        type="number"
                        value={sheet.skip_rows}
                        onChange={(e) => handleSheetChange(index, 'skip_rows', parseInt(e.target.value) || 0)}
                        min="0"
                        bg="white"
                      />
                    </FormControl>
                  </Td>
                  <Td>
                    <FormControl>
                      <Input
                        size="sm"
                        value={sheet.column_range}
                        onChange={(e) => handleSheetChange(index, 'column_range', e.target.value)}
                        placeholder="e.g., A:Z or B:V"
                        bg="white"
                      />
                    </FormControl>
                  </Td>
                  <Td>
                    <IconButton
                      size="sm"
                      icon={<DeleteIcon />}
                      colorScheme="red"
                      variant="ghost"
                      onClick={() => removeSheet(index)}
                      aria-label="Remove sheet"
                    />
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>

        <Box p={3} bg="blue.50" borderRadius="md">
          <Text fontSize="sm" color="blue.700">
            <strong>Instructions:</strong>
            <br />• Sheet Name: Exact name as it appears in Excel
            <br />• Skip Rows: Number of rows to skip from the top
            <br />• Column Range: Excel range (e.g., A:Z, B:V) or leave empty for all columns
          </Text>
        </Box>
      </VStack>
    </Box>
  );
};

export default SheetParametersForm;