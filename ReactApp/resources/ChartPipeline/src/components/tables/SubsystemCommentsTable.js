import React, { useMemo, useState, useEffect } from 'react';
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
  Center
} from '@chakra-ui/react';
import useDuckDB from '../../hooks/useDuckDB';
import useGlobalTableRegistry from '../../hooks/useGlobalTableRegistry';

const SubsystemCommentsTable = () => {
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const duckDB = useDuckDB();
  
  // Load data from CSV file
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Fetch the CSV file
        const response = await fetch('/data/master_subsystem.csv');
        if (!response.ok) {
          throw new Error(`Failed to fetch master_subsystem.csv: ${response.status}`);
        }
        
        const csvText = await response.text();
        const rows = csvText.split('\n');
        const headers = rows[0].split(',');
        
        // Parse CSV into array of objects
        const parsedData = rows.slice(1, 50) // Get only 10 rows
          .filter(row => row.trim())
          .map(row => {
            const values = row.split(',');
            const rowData = {};
            
            // Map values to headers
            headers.forEach((header, index) => {
              if (header === 'item_isoinst') {
                rowData['ITEM'] = values[index] || '';
              } else if (header === 'subsystem') {
                rowData['SUBSYSTEM'] = values[index] || '';
              } else if (header === 'instrument_type_isoinst') {
                rowData['INSTRUMENT TYPE'] = values[index] || '';
              }
            });
            
            return rowData;
          });
        
        setTableData(parsedData);
        setError(null);
      } catch (err) {
        console.error('Error loading subsystem data:', err);
        setError(`Failed to load data: ${err.message}`);
        setTableData([]);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);
  
  if (loading) {
    return (
      <Box mt={6}>
        <Heading size="md" color="gray.700" mb={4}>
          Subsystem Instruments
        </Heading>
        <Center p={8}>
          <Spinner size="xl" color="blue.500" />
          <Text ml={4} color="gray.600">Loading subsystem data...</Text>
        </Center>
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box mt={6} p={4} bg="red.50" borderRadius="md">
        <Heading size="md" color="red.600" mb={2}>
          Error Loading Subsystem Data
        </Heading>
        <Text color="red.700">{error}</Text>
      </Box>
    );
  }
  
  if (tableData.length === 0) {
    return (
      <Box mt={6} p={6} bg="gray.50" borderRadius="md" textAlign="center">
        <Heading size="md" color="gray.600" mb={2}>
          Subsystem Instruments
        </Heading>
        <Text color="gray.500">No subsystem data available</Text>
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
            </Tr>
          </Thead>
          <Tbody>
            {tableData.map((row, index) => (
              <Tr key={index} _hover={{ bg: 'gray.50' }}>
                <Td textAlign="center">
                  <Text fontSize="xs" fontFamily="mono">{row['ITEM']}</Text>
                </Td>
                <Td textAlign="center">
                  <Badge colorScheme="orange" fontSize="xs">{row['SUBSYSTEM']}</Badge>
                </Td>
                <Td textAlign="center">
                  <Text fontSize="xs">{row['INSTRUMENT TYPE']}</Text>
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