import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Button,
  SimpleGrid,
  Select,
  useToast,
  Divider,
  Alert,
  AlertIcon
} from '@chakra-ui/react';

const CrossTabDataAccess = ({ globalTableRegistry, onExecuteQuery }) => {
  const [registryStats, setRegistryStats] = useState(null);
  const [selectedTable, setSelectedTable] = useState('');
  const [tableInfo, setTableInfo] = useState(null);
  const toast = useToast();

  // Update registry stats
  useEffect(() => {
    if (globalTableRegistry) {
      const stats = globalTableRegistry.getRegistryStats();
      setRegistryStats(stats);
    }
  }, [globalTableRegistry]);

  // Handle table selection
  const handleTableSelect = (tableName) => {
    setSelectedTable(tableName);
    if (tableName && globalTableRegistry) {
      const info = globalTableRegistry.getTable(tableName);
      setTableInfo(info);
    } else {
      setTableInfo(null);
    }
  };

  // Execute sample query on selected table
  const executeSampleQuery = async (queryType) => {
    if (!selectedTable || !onExecuteQuery) return;

    const queries = {
      count: `SELECT COUNT(*) as total_rows FROM ${selectedTable}`,
      sample: `SELECT * FROM ${selectedTable} LIMIT 5`,
      columns: `SELECT * FROM ${selectedTable} LIMIT 1`,
      subsystems: selectedTable.includes('subsystem') || selectedTable.includes('test_pack') ?
        `SELECT COUNT(DISTINCT subsystem) as unique_subsystems FROM ${selectedTable}` :
        `SELECT COUNT(*) as total_records FROM ${selectedTable}`
    };

    try {
      const result = await onExecuteQuery(queries[queryType]);
      toast({
        title: 'Query Executed',
        description: `${queryType.toUpperCase()} query on ${selectedTable}`,
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Query Failed',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  if (!registryStats) {
    return (
      <Box p={4} border="1px solid" borderColor="gray.200" borderRadius="md">
        <Text>Loading cross-tab data access...</Text>
      </Box>
    );
  }

  return (
    <Box p={4} border="1px solid" borderColor="gray.200" borderRadius="md" bg="white">
      <VStack spacing={4} align="stretch">
        <HStack justify="space-between">
          <Text fontSize="lg" fontWeight="bold">Cross-Tab Data Access</Text>
          <Badge colorScheme="blue">{registryStats.totalTables} Tables</Badge>
        </HStack>

        {/* Registry Overview */}
        <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
          <Box p={3} border="1px solid" borderColor="blue.200" borderRadius="md" bg="blue.50">
            <Text fontSize="sm" fontWeight="semibold">Total Tables</Text>
            <Text fontSize="xl" fontWeight="bold">{registryStats.totalTables}</Text>
          </Box>
          <Box p={3} border="1px solid" borderColor="green.200" borderRadius="md" bg="green.50">
            <Text fontSize="sm" fontWeight="semibold">Total Rows</Text>
            <Text fontSize="xl" fontWeight="bold">{registryStats.totalRows.toLocaleString()}</Text>
          </Box>
          <Box p={3} border="1px solid" borderColor="purple.200" borderRadius="md" bg="purple.50">
            <Text fontSize="sm" fontWeight="semibold">Data Sources</Text>
            <Text fontSize="xl" fontWeight="bold">{registryStats.sources.length}</Text>
          </Box>
          <Box p={3} border="1px solid" borderColor="orange.200" borderRadius="md" bg="orange.50">
            <Text fontSize="sm" fontWeight="semibold">Cross-Tab Access</Text>
            <Text fontSize="xl" fontWeight="bold">Active</Text>
          </Box>
        </SimpleGrid>

        <Divider />

        {/* Tables by Source */}
        <Box>
          <Text fontSize="md" fontWeight="semibold" mb={2}>Available Tables by Source</Text>
          <VStack spacing={2} align="stretch">
            {Object.entries(registryStats.tablesBySource).map(([source, tables]) => (
              <Box key={source} p={2} border="1px solid" borderColor="gray.200" borderRadius="md">
                <HStack justify="space-between" mb={1}>
                  <Text fontSize="sm" fontWeight="medium">{source}</Text>
                  <Badge variant="outline">{tables.length} tables</Badge>
                </HStack>
                <HStack wrap="wrap" spacing={1}>
                  {tables.map(tableName => (
                    <Badge key={tableName} size="sm" colorScheme="blue" variant="subtle">
                      {tableName}
                    </Badge>
                  ))}
                </HStack>
              </Box>
            ))}
          </VStack>
        </Box>

        <Divider />

        {/* Table Explorer */}
        <Box>
          <Text fontSize="md" fontWeight="semibold" mb={2}>Table Explorer</Text>
          <VStack spacing={3} align="stretch">
            <Select
              placeholder="Select a table to explore"
              value={selectedTable}
              onChange={(e) => handleTableSelect(e.target.value)}
            >
              {globalTableRegistry.getAvailableTables().map(tableName => (
                <option key={tableName} value={tableName}>
                  {tableName}
                </option>
              ))}
            </Select>

            {tableInfo && (
              <Box p={3} border="1px solid" borderColor="gray.200" borderRadius="md" bg="gray.50">
                <VStack spacing={2} align="stretch">
                  <HStack justify="space-between">
                    <Text fontSize="sm" fontWeight="semibold">{tableInfo.name}</Text>
                    <Badge colorScheme="green">{tableInfo.metadata.rowCount} rows</Badge>
                  </HStack>
                  <Text fontSize="xs" color="gray.600">{tableInfo.metadata.description}</Text>
                  <Text fontSize="xs" color="gray.600">
                    Source: {tableInfo.metadata.source} | 
                    Columns: {tableInfo.metadata.columns.length} | 
                    Registered: {new Date(tableInfo.metadata.registeredAt).toLocaleTimeString()}
                  </Text>
                  
                  {/* Sample Queries */}
                  <HStack spacing={2} wrap="wrap">
                    <Button size="xs" onClick={() => executeSampleQuery('count')}>
                      Count Rows
                    </Button>
                    <Button size="xs" onClick={() => executeSampleQuery('sample')}>
                      Sample Data
                    </Button>
                    <Button size="xs" onClick={() => executeSampleQuery('subsystems')}>
                      Analyze
                    </Button>
                  </HStack>
                </VStack>
              </Box>
            )}
          </VStack>
        </Box>

        {/* Cross-Tab Query Examples */}
        <Box>
          <Text fontSize="md" fontWeight="semibold" mb={2}>Cross-Tab Query Examples</Text>
          <VStack spacing={2} align="stretch">
            <Box p={2} border="1px solid" borderColor="blue.100" borderRadius="md" bg="blue.50">
              <Text fontSize="sm" fontWeight="medium">Join SUMMARY SUBSYSTEMS with Control Instruments</Text>
              <Text fontSize="xs" color="gray.600" fontFamily="monospace">
                SELECT s.subsystem, s.totalItems, COUNT(c.ISOMETRIC) as iso_count<br/>
                FROM subsystem_overview s<br/>
                LEFT JOIN control_instruments c ON s.subsystem = c.SUSSYTEM
              </Text>
            </Box>
            <Box p={2} border="1px solid" borderColor="green.100" borderRadius="md" bg="green.50">
              <Text fontSize="sm" fontWeight="medium">Cross-reference with Insulation Progress</Text>
              <Text fontSize="xs" color="gray.600" fontFamily="monospace">
                SELECT t.subsystem, t.testPackProgress, i.progress_status<br/>
                FROM test_pack_details t<br/>
                LEFT JOIN insulation_progress i ON t.subsystem = i.SUBSYSTEM
              </Text>
            </Box>
          </VStack>
        </Box>

        {/* Integration Status */}
        <Alert status="success" size="sm">
          <AlertIcon />
          <VStack align="start" spacing={1} fontSize="xs">
            <Text>✓ Cross-tab data access is active and ready</Text>
            <Text>✓ All registered tables are available for SQL queries</Text>
            <Text>✓ Data is automatically synchronized across tabs</Text>
          </VStack>
        </Alert>
      </VStack>
    </Box>
  );
};

export default CrossTabDataAccess;