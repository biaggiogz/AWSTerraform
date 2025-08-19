import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Input,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  IconButton,
  useToast,
  Alert,
  AlertIcon,
  Collapse,
  useDisclosure
} from '@chakra-ui/react';
import { AddIcon, DeleteIcon, ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons';

const DEFAULT_SHEETS = [
  { name: 'TEST_LOOP', skipRows: 11, columnRange: 'B:V' },
  { name: 'TP', skipRows: 4, columnRange: 'B:AS' },
  { name: 'general', skipRows: 3, columnRange: '' },
  { name: 'Subsystems', skipRows: 0, columnRange: '' },
  { name: 'ISOS', skipRows: 1, columnRange: 'A:AL' },
  { name: 'Tuberia', skipRows: 8, columnRange: 'A:BC' },
  { name: 'TRAC_SIEMSA', skipRows: 7, columnRange: 'B:AG' },
  { name: 'FIELD_CONTROL', skipRows: 4, columnRange: 'A:BJ' },
  { name: 'ISO_INST', skipRows: 4, columnRange: 'A:AJ' },
  { name: 'Punch_List', skipRows: 5, columnRange: 'B:W' }
];

const SheetConfigurationPanel = ({ onConfigurationSave, savedConfiguration }) => {
  const [sheets, setSheets] = useState(savedConfiguration || DEFAULT_SHEETS);
  const { isOpen, onToggle } = useDisclosure();
  const toast = useToast();

  const addSheet = () => {
    setSheets([...sheets, { name: '', skipRows: 0, columnRange: '' }]);
  };

  const removeSheet = (index) => {
    setSheets(sheets.filter((_, i) => i !== index));
  };

  const updateSheet = (index, field, value) => {
    const updated = [...sheets];
    updated[index] = { ...updated[index], [field]: value };
    setSheets(updated);
  };

  const saveConfiguration = () => {
    const validSheets = sheets.filter(sheet => sheet.name.trim() !== '');
    
    if (validSheets.length === 0) {
      toast({
        title: "Configuration Error",
        description: "At least one sheet must be configured",
        status: "error",
        duration: 3000
      });
      return;
    }

    onConfigurationSave(validSheets);
    toast({
      title: "Configuration Saved",
      description: `${validSheets.length} sheets configured`,
      status: "success",
      duration: 2000
    });
  };

  const resetToDefaults = () => {
    setSheets(DEFAULT_SHEETS);
    toast({
      title: "Reset Complete",
      description: "Configuration reset to defaults",
      status: "info",
      duration: 2000
    });
  };

  return (
    <Box p={4} bg="gray.50" borderRadius="md" borderWidth="1px">
      <VStack spacing={4} align="stretch">
        <HStack justify="space-between">
          <Text fontSize="md" fontWeight="semibold">
            Sheet Configuration
          </Text>
          <Button
            size="sm"
            leftIcon={isOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
            onClick={onToggle}
            variant="ghost"
          >
            {isOpen ? 'Hide' : 'Show'} Configuration
          </Button>
        </HStack>

        <Collapse in={isOpen}>
          <VStack spacing={4} align="stretch">
            <Alert status="info" size="sm">
              <AlertIcon />
              Configure expected sheet names, skip rows, and column ranges for validation
            </Alert>

            <Box overflowX="auto">
              <Table size="sm" variant="simple">
                <Thead>
                  <Tr>
                    <Th>Sheet Name</Th>
                    <Th>Skip Rows</Th>
                    <Th>Column Range</Th>
                    <Th width="50px">Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {sheets.map((sheet, index) => (
                    <Tr key={index}>
                      <Td>
                        <Input
                          size="sm"
                          value={sheet.name}
                          onChange={(e) => updateSheet(index, 'name', e.target.value)}
                          placeholder="Sheet name"
                        />
                      </Td>
                      <Td>
                        <Input
                          size="sm"
                          type="number"
                          value={sheet.skipRows}
                          onChange={(e) => updateSheet(index, 'skipRows', parseInt(e.target.value) || 0)}
                          min="0"
                          width="80px"
                        />
                      </Td>
                      <Td>
                        <Input
                          size="sm"
                          value={sheet.columnRange}
                          onChange={(e) => updateSheet(index, 'columnRange', e.target.value)}
                          placeholder="e.g., A:Z or B:V"
                        />
                      </Td>
                      <Td>
                        <IconButton
                          size="sm"
                          icon={<DeleteIcon />}
                          onClick={() => removeSheet(index)}
                          colorScheme="red"
                          variant="ghost"
                          aria-label="Remove sheet"
                        />
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>

            <HStack spacing={2}>
              <Button
                size="sm"
                leftIcon={<AddIcon />}
                onClick={addSheet}
                colorScheme="blue"
                variant="outline"
              >
                Add Sheet
              </Button>
              <Button
                size="sm"
                onClick={resetToDefaults}
                variant="outline"
              >
                Reset to Defaults
              </Button>
              <Button
                size="sm"
                onClick={saveConfiguration}
                colorScheme="green"
              >
                Save Configuration
              </Button>
            </HStack>
          </VStack>
        </Collapse>
      </VStack>
    </Box>
  );
};

export default SheetConfigurationPanel;