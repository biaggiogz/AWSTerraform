import React, { useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
} from '@tanstack/react-table';
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Input,
  VStack,
  HStack,
  Text,
  Badge,
} from '@chakra-ui/react';

/**
 * Table component for displaying Loop Test data
 * @param {Object} props - Component props
 * @param {Array} props.data - Dataset from CSV
 */
const LoopTestTable = ({ data }) => {
  // Define table columns
  const columns = useMemo(
    () => [
      {
        accessorKey: 'CODE',
        header: 'Code',
        size: 80,
      },
      {
        accessorKey: 'SUBS_PRE',
        header: 'Subsystem',
        size: 120,
      },
      {
        accessorKey: 'TAG LOOP',
        header: 'Tag Loop',
        size: 100,
      },
      {
        accessorKey: 'Area',
        header: 'Area',
        size: 80,
      },
      {
        accessorKey: 'SERVICE',
        header: 'Service',
        size: 200,
      },
      {
        accessorKey: 'INSTALLED',
        header: 'Installed',
        size: 100,
      },
      {
        accessorKey: 'WIRED',
        header: 'Wired',
        size: 100,
      },
      {
        accessorKey: 'CONNECTED',
        header: 'Connected',
        size: 100,
      },
      {
        accessorKey: 'CABLE TEST',
        header: 'Cable Test',
        size: 100,
      },
      {
        accessorKey: 'QCF',
        header: 'QCF',
        size: 80,
      },
      {
        accessorKey: 'OK=100%',
        header: 'OK %',
        size: 80,
        cell: ({ getValue }) => {
          const value = getValue();
          const percentage = parseFloat(value?.toString().replace('%', '') || '0');
          const colorScheme = percentage === 100 ? 'green' : percentage > 0 ? 'yellow' : 'red';
          return (
            <Badge colorScheme={colorScheme} variant="solid">
              {value || '0%'}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'DOSSIER',
        header: 'Dossier',
        size: 100,
      },
      {
        accessorKey: 'TEST LOOP',
        header: 'Test Loop',
        size: 100,
      },
    ],
    []
  );

  // Initialize table
  const table = useReactTable({
    data: data || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  // Global filter state
  const [globalFilter, setGlobalFilter] = React.useState('');

  // Apply global filter
  React.useEffect(() => {
    table.setGlobalFilter(globalFilter);
  }, [globalFilter, table]);

  return (
    <Box p={4} borderWidth="1px" borderRadius="lg" bg="white">
      <VStack spacing={4} align="stretch">
        {/* Header */}
        <HStack justify="space-between" align="center">
          <Text fontSize="lg" fontWeight="bold">
            Loop Test Data Table
          </Text>
          <Badge colorScheme="blue">
            {table.getFilteredRowModel().rows.length} records
          </Badge>
        </HStack>

        {/* Global Search */}
        <Input
          placeholder="Search all columns..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          maxW="300px"
        />

        {/* Table Container with Scroll */}
        <Box
          overflowX="auto"
          overflowY="auto"
          maxHeight="600px"
          border="1px solid"
          borderColor="gray.200"
          borderRadius="md"
        >
          <Table size="sm" variant="striped">
            <Thead position="sticky" top={0} bg="gray.50" zIndex={1}>
              {table.getHeaderGroups().map((headerGroup) => (
                <Tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <Th
                      key={header.id}
                      cursor={header.column.getCanSort() ? 'pointer' : 'default'}
                      onClick={header.column.getToggleSortingHandler()}
                      minW={`${header.getSize()}px`}
                      fontSize="xs"
                      textTransform="uppercase"
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                      {header.column.getIsSorted() && (
                        <Text as="span" ml={1}>
                          {header.column.getIsSorted() === 'desc' ? ' ↓' : ' ↑'}
                        </Text>
                      )}
                    </Th>
                  ))}
                </Tr>
              ))}
            </Thead>
            <Tbody>
              {table.getRowModel().rows.map((row) => (
                <Tr key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <Td
                      key={cell.id}
                      fontSize="xs"
                      minW={`${cell.column.getSize()}px`}
                      maxW={`${cell.column.getSize()}px`}
                      overflow="hidden"
                      textOverflow="ellipsis"
                      whiteSpace="nowrap"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </Td>
                  ))}
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      </VStack>
    </Box>
  );
};

export default React.memo(LoopTestTable);