import React, { useState, useCallback } from 'react';
import {
  Box,
  VStack,
  HStack,
  Button,
  Textarea,
  Text,
  Badge,
  useToast,
  Input,
  FormControl,
  FormLabel,
  Switch,
  Divider
} from '@chakra-ui/react';
import useSummarySubsystemsSQL from '../../hooks/useSummarySubsystemsSQL';

const SummarySubsystemsSQLPanel = ({ tableAData, tableBData, onResultsChange }) => {
  const {
    calculations,
    loading,
    executeSQLQuery,
    uploadCSV,
    availableTables,
    tablesReady
  } = useSummarySubsystemsSQL(tableAData, tableBData);

  const [sqlQuery, setSqlQuery] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [tableName, setTableName] = useState('');
  const toast = useToast();

  const handleExecuteQuery = useCallback(async () => {
    if (!sqlQuery.trim()) {
      toast({
        title: 'Query Required',
        description: 'Please enter a SQL query',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      const results = await executeSQLQuery(sqlQuery);
      if (onResultsChange) {
        onResultsChange(results);
      }
      toast({
        title: 'Query Executed',
        description: `Returned ${results.length} rows`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Query Failed',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  }, [sqlQuery, executeSQLQuery, onResultsChange, toast]);

  const handleFileUpload = useCallback(async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!tableName.trim()) {
      toast({
        title: 'Table Name Required',
        description: 'Please enter a table name for the CSV',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      const success = await uploadCSV(file, tableName);
      if (success) {
        setUploadedFile(file);
        toast({
          title: 'CSV Uploaded',
          description: `Table "${tableName}" created successfully`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: 'Upload Failed',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  }, [tableName, uploadCSV, toast]);

  const insertSampleQuery = useCallback((query) => {
    setSqlQuery(query);
  }, []);

  const sampleQueries = [
    {
      name: 'Subsystem Summary',
      query: 'SELECT subsystem, totalItems, doneItems, pendingItems FROM subsystem_overview ORDER BY totalItems DESC LIMIT 10'
    },
    {
      name: 'Test Pack Progress',
      query: 'SELECT subsystem, AVG(testPackProgress) as avg_progress FROM test_pack_details GROUP BY subsystem ORDER BY avg_progress DESC'
    },
    {
      name: 'Cross-Table Join',
      query: 'SELECT a.subsystem, a.totalItems, COUNT(b.testPack) as test_packs FROM subsystem_overview a LEFT JOIN test_pack_details b ON a.subsystem = b.subsystem GROUP BY a.subsystem, a.totalItems'
    }
  ];

  return (
    <Box p={4} border="1px solid" borderColor="gray.200" borderRadius="md" bg="white">
      <VStack spacing={4} align="stretch">
        <HStack justify="space-between">
          <Text fontSize="lg" fontWeight="bold">SQL Query Interface</Text>
          <Badge colorScheme={tablesReady ? 'green' : 'yellow'}>
            {tablesReady ? 'Tables Ready' : 'Loading Tables'}
          </Badge>
        </HStack>

        {/* Available Tables */}
        <Box>
          <Text fontSize="sm" fontWeight="semibold" mb={2}>Available Tables:</Text>
          <HStack wrap="wrap" spacing={2}>
            {availableTables.map(table => (
              <Badge key={table} variant="outline" colorScheme="blue">
                {table}
              </Badge>
            ))}
          </HStack>
        </Box>

        <Divider />

        {/* CSV Upload */}
        <VStack spacing={3} align="stretch">
          <Text fontSize="sm" fontWeight="semibold">Upload CSV File</Text>
          <HStack>
            <FormControl flex={1}>
              <FormLabel fontSize="xs">Table Name</FormLabel>
              <Input
                size="sm"
                placeholder="Enter table name"
                value={tableName}
                onChange={(e) => setTableName(e.target.value)}
              />
            </FormControl>
            <FormControl flex={1}>
              <FormLabel fontSize="xs">CSV File</FormLabel>
              <Input
                type="file"
                accept=".csv"
                size="sm"
                onChange={handleFileUpload}
              />
            </FormControl>
          </HStack>
        </VStack>

        <Divider />

        {/* Sample Queries */}
        <Box>
          <Text fontSize="sm" fontWeight="semibold" mb={2}>Sample Queries:</Text>
          <HStack wrap="wrap" spacing={2}>
            {sampleQueries.map(sample => (
              <Button
                key={sample.name}
                size="xs"
                variant="outline"
                onClick={() => insertSampleQuery(sample.query)}
              >
                {sample.name}
              </Button>
            ))}
          </HStack>
        </Box>

        {/* SQL Query Input */}
        <FormControl>
          <FormLabel fontSize="sm">SQL Query</FormLabel>
          <Textarea
            value={sqlQuery}
            onChange={(e) => setSqlQuery(e.target.value)}
            placeholder="Enter your SQL query here..."
            rows={6}
            fontSize="sm"
            fontFamily="monospace"
          />
        </FormControl>

        {/* Execute Button */}
        <Button
          colorScheme="blue"
          onClick={handleExecuteQuery}
          isLoading={loading}
          isDisabled={!tablesReady}
        >
          Execute Query
        </Button>

        {/* Results Display */}
        {calculations.length > 0 && (
          <Box>
            <Text fontSize="sm" fontWeight="semibold" mb={2}>
              Results ({calculations.length} rows):
            </Text>
            <Box
              maxH="200px"
              overflowY="auto"
              border="1px solid"
              borderColor="gray.200"
              borderRadius="md"
              p={2}
              bg="gray.50"
            >
              <pre style={{ fontSize: '12px', whiteSpace: 'pre-wrap' }}>
                {JSON.stringify(calculations, null, 2)}
              </pre>
            </Box>
          </Box>
        )}
      </VStack>
    </Box>
  );
};

export default SummarySubsystemsSQLPanel;