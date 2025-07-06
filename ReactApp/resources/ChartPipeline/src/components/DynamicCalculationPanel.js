import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Textarea,
  Button,
  Badge,
  Spinner,
  useColorModeValue
} from '@chakra-ui/react';
import useDynamicCalculations from '../hooks/useDynamicCalculations';

const DynamicCalculationPanel = ({ controlData, detailsData, filteredControlData, filteredDetailsData, filters }) => {
  const [sqlQuery, setSqlQuery] = useState(`SELECT COUNT("ISOMETRIC") AS "Total Isos"
FROM "Control Instruments";`);
  
  const { 
    calculations, 
    loading, 
    executeSQLQuery, 
    controlColumns, 
    detailColumns,
    availableTables,
    tableInfo
  } = useDynamicCalculations(
    controlData, 
    detailsData,
    filteredControlData,
    filteredDetailsData,
    filters
  );

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const handleExecute = () => {
    if (!sqlQuery.trim()) return;
    executeSQLQuery(sqlQuery);
  };

  const addMetricQuery = (newQuery) => {
    setSqlQuery(prev => {
      if (!prev.trim()) return newQuery;
      return prev + '\n\n' + newQuery;
    });
  };

  return (
    <Box 
      bg={bgColor} 
      border="1px" 
      borderColor={borderColor} 
      borderRadius="md" 
      p={4} 
      mt={4}
    >
      <VStack spacing={4} align="stretch">
        <Text fontSize="lg" fontWeight="bold" color="blue.600">
          SQL Query Interface
        </Text>
        
        {/* Schema Reference */}
        <VStack spacing={2} align="stretch" fontSize="xs" color="gray.600">
          {Object.entries(tableInfo).map(([tableName, info]) => (
            <Box key={tableName} pl={4} borderLeft="2px solid" borderColor="blue.200">
              <Text fontWeight="bold">"{tableName}" ({info.filteredRows}/{info.totalRows} rows)</Text>
              <Text><strong>Fields:</strong> {info.fields.slice(0, 8).join(', ')}{info.fields.length > 8 ? '...' : ''}</Text>
            </Box>
          ))}
        </VStack>

        {/* Default Quick Metrics */}
        <Box>
          <Text fontSize="sm" fontWeight="semibold" mb={2}>Default Quick Metrics:</Text>
          <VStack spacing={2} align="stretch">
            <HStack spacing={2} wrap="wrap">
              <Button size="xs" variant="outline" onClick={() => addMetricQuery('SELECT COUNT("ISOMETRIC") AS "Total Isos"\nFROM "Control Instruments";')}>
                Total Isos
              </Button>
              <Button size="xs" variant="outline" onClick={() => addMetricQuery('SELECT COUNT("WELDING FW+SW") AS "Total at 100%"\nFROM "Control Instruments"\nWHERE "WELDING FW+SW" = 1;')}>
                Total at 100%
              </Button>
              <Button size="xs" variant="outline" onClick={() => addMetricQuery('SELECT COUNT("SUBSYSTEM") AS "Total Subsystem"\nFROM "Control Instruments";')}>
                Total Subsystem
              </Button>
              <Button size="xs" variant="outline" onClick={() => addMetricQuery('SELECT COUNT(DISTINCT "TEST PACK") AS "Total Test Pack"\nFROM "Control Instruments";')}>
                Total Test Pack
              </Button>
              <Button size="xs" variant="outline" onClick={() => addMetricQuery('SELECT SUM("QTY INST") AS "Total Inst"\nFROM "Control Instruments";')}>
                Total Inst
              </Button>
            </HStack>
            <HStack spacing={2} wrap="wrap">
              <Button size="xs" variant="outline" onClick={() => addMetricQuery('SELECT SUM("SCOPE BY TEIGA-TMI") AS "Total Scope TEIGA"\nFROM "Control Instruments";')}>
                Total Scope TEIGA
              </Button>
              <Button size="xs" variant="outline" onClick={() => addMetricQuery('SELECT SUM("SCOPE BY SIEMSA") AS "Total Scope Siemsa"\nFROM "Control Instruments";')}>
                Total Scope Siemsa
              </Button>
              <Button size="xs" variant="outline" onClick={() => addMetricQuery('SELECT SUM(CAST("INSTALLED (TEIGA-TMI)" AS INTEGER)) AS "Total Installed Teiga"\nFROM "Control Instruments"\nWHERE "INSTALLED (TEIGA-TMI)" != \'NOT APPLY\';')}>
                Total Installed Teiga
              </Button>
              <Button size="xs" variant="outline" onClick={() => addMetricQuery('SELECT SUM("TOTAL INSTALLED") AS "Total Installed"\nFROM "Control Instruments";')}>
                Total Installed
              </Button>
              <Button size="xs" variant="outline" onClick={() => addMetricQuery('SELECT COUNT("TRAC (YES & NOT)") AS "Trac YES"\nFROM "Control Instruments"\nWHERE "TRAC (YES & NOT)" = \'YES\';')}>
                Trac YES
              </Button>
            </HStack>
          </VStack>
        </Box>

        {/* SQL Editor */}
        <Box>
          <Text fontSize="sm" mb={2} fontWeight="semibold">SQL Query:</Text>
          <Textarea 
            value={sqlQuery}
            onChange={(e) => setSqlQuery(e.target.value)}
            placeholder="Enter your SQL query here..."
            fontFamily="monospace"
            fontSize="sm"
            minH="120px"
            resize="vertical"
          />
        </Box>
        
        <HStack justify="space-between">
          <Button 
            colorScheme="blue" 
            onClick={handleExecute}
            isDisabled={!sqlQuery.trim() || loading}
            isLoading={loading}
          >
            Execute Query
          </Button>
          
          {/* Active Filters Display */}
          {(filters.selectedIsometric || filters.selectedTestPack || filters.selectedSubsystem) && (
            <HStack spacing={2}>
              <Text fontSize="xs" color="gray.600">Active Filters:</Text>
              {filters.selectedIsometric && (
                <Badge colorScheme="purple" fontSize="xs">ISO: {filters.selectedIsometric}</Badge>
              )}
              {filters.selectedTestPack && (
                <Badge colorScheme="blue" fontSize="xs">PACK: {filters.selectedTestPack}</Badge>
              )}
              {filters.selectedSubsystem && (
                <Badge colorScheme="orange" fontSize="xs">SUB: {filters.selectedSubsystem}</Badge>
              )}
            </HStack>
          )}
        </HStack>

        {/* Results as Metric Cards */}
        {loading && (
          <HStack justify="center" py={4}>
            <Spinner size="sm" />
            <Text>Executing query...</Text>
          </HStack>
        )}
        
        {calculations.length > 0 && !loading && (
          <HStack spacing={4} wrap="wrap" justify="center">
            {calculations.map((row, idx) => (
              Object.entries(row).map(([key, value]) => (
                <Box
                  key={`${idx}-${key}`}
                  bg="white"
                  border="2px solid"
                  borderColor="blue.200"
                  borderRadius="lg"
                  p={0.5}
                  minW="100px"
                  textAlign="center"
                  boxShadow="md"
                >
                  <Text fontSize="2xl" fontWeight="bold" color="blue.600">
                    {typeof value === 'number' ? value.toLocaleString() : value}
                  </Text>
                  <Text fontSize="sm" color="gray.600" mt={1}>
                    {key}
                  </Text>
                </Box>
              ))
            ))}
          </HStack>
        )}
      </VStack>
    </Box>
  );
};

export default DynamicCalculationPanel;