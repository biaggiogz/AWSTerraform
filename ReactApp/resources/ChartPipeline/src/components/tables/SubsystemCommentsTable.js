import React, { useEffect, useState, useMemo } from 'react';
import {
  Box,
  Text,
  Badge,
  Heading,
  HStack,
  Spinner,
  Center,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
} from '@chakra-ui/react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
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
  
  // Define columns using TanStack's column helper
  const columnHelper = createColumnHelper();
  
  const columns = useMemo(() => [
    columnHelper.accessor('ITEM', {
      header: 'ITEM',
      cell: info => <Text fontSize="xs" fontFamily="mono">{String(info.getValue())}</Text>,
    }),
    columnHelper.accessor('SUBSYSTEM', {
      header: 'SUBSYSTEM',
      cell: info => <Badge colorScheme="orange" fontSize="xs">{info.getValue()}</Badge>,
    }),
    columnHelper.accessor('INSTRUMENT TYPE', {
      header: 'INSTRUMENT TYPE',
      cell: info => <Text fontSize="xs">{info.getValue()}</Text>,
    }),
    columnHelper.accessor('TAG INST', {
      header: 'TAG INST',
      cell: info => <Text fontSize="xs">{info.getValue()}</Text>,
    }),
  ], []);

  // Create table instance
  const table = useReactTable({
    data: tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

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
            {table.getHeaderGroups().map(headerGroup => (
              <Tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <Th 
                    key={header.id}
                    color="white" 
                    textAlign="center"
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </Th>
                ))}
              </Tr>
            ))}
          </Thead>
          <Tbody>
            {table.getRowModel().rows.map(row => (
              <Tr 
                key={row.id}
                _hover={{ bg: 'gray.50' }}
              >
                {row.getVisibleCells().map(cell => (
                  <Td 
                    key={cell.id}
                    textAlign="center"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </Td>
                ))}
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>
    </Box>
  );
};

export default SubsystemCommentsTable;
