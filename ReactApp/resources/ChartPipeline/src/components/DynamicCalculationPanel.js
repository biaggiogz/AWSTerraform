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

const DynamicCalculationPanel = ({ controlData, detailsData, filters }) => {
  const [sqlQuery, setSqlQuery] = useState(`SELECT COUNT("ISOMETRIC") AS "Total Isometrics"
FROM "Control Instruments";`);
  
  const { calculations, loading, executeSQLQuery, controlColumns, detailColumns } = useDynamicCalculations(
    controlData, 
    detailsData, 
    filters
  );

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const handleExecute = () => {
    if (!sqlQuery.trim()) return;
    executeSQLQuery(sqlQuery);
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
        <HStack spacing={6} fontSize="xs" color="gray.600">
          <Text><strong>Tables:</strong> "Control Instruments", "Details Instruments"</Text>
          <Text><strong>Key Fields:</strong> ISOMETRIC, SUSSYTEM, PRIORITY, TESTPACK</Text>
        </HStack>

        {/* Example Queries */}
        <Box>
          <Text fontSize="sm" fontWeight="semibold" mb={2}>Quick Examples:</Text>
          <HStack spacing={2} wrap="wrap">
            <Button size="xs" variant="outline" onClick={() => setSqlQuery('SELECT COUNT("ISOMETRIC") AS "Total Isometrics"\nFROM "Control Instruments";')}>
              Count Isometrics
            </Button>
            <Button size="xs" variant="outline" onClick={() => setSqlQuery('SELECT "SUSSYTEM", COUNT("ISOMETRIC") AS "Count by Subsystem"\nFROM "Control Instruments"\nGROUP BY "SUSSYTEM";')}>
              Group by Subsystem
            </Button>
            <Button size="xs" variant="outline" onClick={() => setSqlQuery('SELECT COUNT(*) AS "Total Records"\nFROM "Details Instruments";')}>
              Count Details
            </Button>
            <Button size="xs" variant="outline" onClick={() => setSqlQuery('SELECT "PRIORITY", COUNT(*) AS "Count by Priority"\nFROM "Control Instruments"\nGROUP BY "PRIORITY";')}>
              Group by Priority
            </Button>
          </HStack>
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
                  p={4}
                  minW="120px"
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