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
  Divider,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel
} from '@chakra-ui/react';
import useSummarySubsystemsSQL from '../../hooks/useSummarySubsystemsSQL';
import WasmPerformanceMonitorEnhanced from '../ui/WasmPerformanceMonitor.enhanced';

const SummarySubsystemsSQLPanel = ({ tableAData, tableBData, onResultsChange }) => {
  const {
    calculations,
    loading,
    executeSQLQuery,
    uploadCSV,
    availableTables,
    tablesReady,
    getComprehensiveMetrics,
    clearCache
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
      query: 'SELECT subsystem, totalItems, doneItems, pendingItems FROM subsystem_overview ORDER BY totalItems DESC LIMIT 10',
      description: 'Basic aggregation query - optimized for WASM'
    },
    {
      name: 'Test Pack Progress',
      query: 'SELECT subsystem, AVG(testPackProgress) as avg_progress FROM test_pack_details GROUP BY subsystem ORDER BY avg_progress DESC',
      description: 'GROUP BY with aggregation - 2-3x faster with WASM'
    },
    {
      name: 'Cross-Table Join',
      query: 'SELECT a.subsystem, a.totalItems, COUNT(b.testPack) as test_packs FROM subsystem_overview a LEFT JOIN test_pack_details b ON a.subsystem = b.subsystem GROUP BY a.subsystem, a.totalItems',
      description: 'Complex JOIN operation - benefits from pre-indexing'
    },
    {
      name: 'Performance Test',
      query: 'SELECT COUNT(DISTINCT subsystem) as unique_subsystems, SUM(totalItems) as total_items, AVG(doneItems) as avg_done FROM subsystem_overview; SELECT COUNT(*) as test_pack_count FROM test_pack_details',
      description: 'Multi-query test - demonstrates caching benefits'
    }
  ];

  return (
    <Box p={4} border="1px solid" borderColor="gray.200" borderRadius="md" bg="white">
      <Tabs variant="enclosed">
        <TabList>
          <Tab>SQL Interface</Tab>
          <Tab>Performance Monitor</Tab>
        </TabList>
        
        <TabPanels>
          <TabPanel>
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
          <Text fontSize="sm" fontWeight="semibold" mb={2}>Optimized Sample Queries:</Text>
          <VStack spacing={2} align="stretch">
            {sampleQueries.map(sample => (
              <Box key={sample.name} p={2} border="1px solid" borderColor="gray.100" borderRadius="md">
                <HStack justify="space-between" mb={1}>
                  <Text fontSize="sm" fontWeight="medium">{sample.name}</Text>
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() => insertSampleQuery(sample.query)}
                  >
                    Use Query
                  </Button>
                </HStack>
                <Text fontSize="xs" color="gray.600">{sample.description}</Text>
              </Box>
            ))}
          </VStack>
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
        <HStack>
          <Button
            colorScheme="blue"
            onClick={handleExecuteQuery}
            isLoading={loading}
            isDisabled={!tablesReady}
            flex={1}
          >
            Execute Query (WASM Optimized)
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={clearCache}
          >
            Clear Cache
          </Button>
        </HStack>

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
          </TabPanel>
          
          <TabPanel>
            <WasmPerformanceMonitorEnhanced 
              getMetrics={getComprehensiveMetrics}
              onClearCache={clearCache}
            />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
};

export default SummarySubsystemsSQLPanel;