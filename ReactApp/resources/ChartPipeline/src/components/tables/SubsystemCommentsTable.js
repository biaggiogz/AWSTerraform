import React, { useEffect, useState } from 'react';
import {
  Box,
  Text,
  Badge,
  Heading,
  HStack,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Spinner,
  Center,
} from '@chakra-ui/react';
import useDuckDB from '../../hooks/useDuckDB3';

const SubsystemCommentsTable = () => {
  const {
    createTableFromCSV,
    createTableFromParquet,
    executeQuery,
    loading: dbLoading,
    error: dbError,
  } = useDuckDB();

  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Only proceed if not loading and no error
        if (dbLoading || dbError) {
          return;
        }

        // Try to fetch Parquet file first, fall back to CSV if not available
        try {
          console.log('Fetching Parquet file...');
          const res = await fetch('/data/master_subsystem.parquet');
          
          console.log('Parquet fetch response:', { 
            status: res.status, 
            statusText: res.statusText,
            contentType: res.headers.get('content-type'),
            contentLength: res.headers.get('content-length')
          });
          
          if (!res.ok) throw new Error(`Failed to fetch Parquet: ${res.status}`);
          
          console.log('Reading Parquet buffer...');
          const parquetBuffer = await res.arrayBuffer();
          console.log('Parquet buffer received:', { byteLength: parquetBuffer.byteLength });
          
          await createTableFromParquet('master_subsystem', parquetBuffer);
        } catch (parquetError) {
          console.log('Falling back to CSV:', parquetError);
          
          // Fall back to CSV
          const res = await fetch('/data/master_subsystem.csv');
          if (!res.ok) throw new Error(`Failed to fetch CSV: ${res.status}`);
          
          const csvText = await res.text();
          await createTableFromCSV('master_subsystem', csvText, { header: true, delimiter: ','});
        }

        // Log the table schema to debug column names
        const schemaResults = await executeQuery(`DESCRIBE master_subsystem`);
        console.log('Table schema:', schemaResults);
        
        // Log a sample row to debug column values
        const sampleRow = await executeQuery(`SELECT item_isoinst FROM master_subsystem LIMIT 100`);
        console.log('Sample row:', sampleRow[0]);
        
        const results = await executeQuery(`
          SELECT
            item_isoinst AS "ITEM",
            subsystem AS "SUBSYSTEM",
            instrument_type_isoinst AS "INSTRUMENT TYPE",
            tag_inst_e3d_isoinst AS "TAG INST"
          FROM master_subsystem
          WHERE item_isoinst IS NOT NULL
          LIMIT 100
        `);
        
        console.log('Query results:', results);

        setTableData(results);
        setError(null);
      } catch (err) {
        console.error('DuckDB error:', err);
        setError(err.message || 'Unknown error');
        setTableData([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [createTableFromCSV, executeQuery, dbLoading, dbError]);

  if (loading || dbLoading) {
    return (
        <Box mt={6}>
          <Heading size="md" color="gray.700" mb={4}>
            Subsystem Instruments
          </Heading>
          <Center p={8}>
            <Spinner size="xl" color="blue.500" />
            <Text ml={4} color="gray.600">
              Loading data with DuckDB...
            </Text>
          </Center>
        </Box>
    );
  }

  if (error || dbError) {
    return (
        <Box mt={6} p={4} bg="red.50" borderRadius="md">
          <Heading size="md" color="red.600" mb={2}>
            Error
          </Heading>
          <Text color="red.700">{error || dbError}</Text>
        </Box>
    );
  }

  return (
      <Box mt={6}>
        <HStack justify="space-between" align="center" mb={4}>
          <Heading size="md" color="gray.700">
            Subsystem Instruments
          </Heading>
          <Badge colorScheme="purple" fontSize="sm" px={3} py={1}>
            {tableData.length} Records
          </Badge>
        </HStack>

        <Box
            border="1px solid"
            borderColor="gray.200"
            borderRadius="lg"
            overflow="hidden"
            bg="white"
            boxShadow="sm"
            width="100%"
        >
          <Table variant="simple" size="sm">
            <Thead bg="purple.600">
              <Tr>
                <Th color="white" textAlign="center">ITEM</Th>
                <Th color="white" textAlign="center">SUBSYSTEM</Th>
                <Th color="white" textAlign="center">INSTRUMENT TYPE</Th>
                <Th color="white" textAlign="center">TAG INST</Th>
              </Tr>
            </Thead>
            <Tbody>
              {tableData.map((row, idx) => (
                  <Tr key={idx} _hover={{ bg: 'gray.50' }}>
                    <Td textAlign="center">
                      <Text fontSize="xs" fontFamily="mono">{String(row.ITEM)}</Text>
                    </Td>
                    <Td textAlign="center">
                      <Badge colorScheme="orange" fontSize="xs">{row.SUBSYSTEM}</Badge>
                    </Td>
                    <Td textAlign="center">
                      <Text fontSize="xs">{row['INSTRUMENT TYPE']}</Text>
                    </Td>
                    <Td textAlign="center">
                      <Text fontSize="xs">{row['TAG INST']}</Text>
                    </Td>
                  </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      </Box>
  );
};

export default SubsystemCommentsTable;
