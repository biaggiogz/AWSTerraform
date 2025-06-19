import React, { useMemo, useCallback } from 'react';
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Text,
  Badge,
  Progress,
  Heading,
  HStack,
  VStack,
  Tooltip
} from '@chakra-ui/react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';

const columnHelper = createColumnHelper();

/**
 * LazosTable component - Virtualized table for loop test progress data
 * @param {Object} props - Component props
 * @param {Array} props.data - Filtered dataset
 */
const LazosTable = React.memo(({ data }) => {
  // Memoize processed data to avoid recalculations
  const processedData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    return data.map((row, index) => ({
      id: index,
      code: row.CODE || '',
      subsystem: row.SUBS_PRE || '',
      tagLoop: row['TAG LOOP'] || '',
      area: row.Area || '',
      priority: row.PRIORITY || '',
      loop: row.LOOP || '',
      tags: row.TagS || '',
      service: row.SERVICE || '',
      installed: row.INSTALLED || '',
      wired: row.WIRED || '',
      connected: row.CONNECTED || '',
      cableTest: row['CABLE TEST'] || '',
      qcf: row.QCF || '',
      progress: row['OK=100%'] || '0.00%',
      dossier: row.DOSSIER || '',
      testLoop: row['TEST LOOP'] || ''
    }));
  }, [data]);

  // Define table columns with fixed layout and consistent styling
  const columns = useMemo(() => [
    columnHelper.accessor('code', {
      header: 'Code',
      minSize: 80,
      maxSize: 80,
      size: 80,
      cell: ({ getValue }) => (
        <Text fontSize="sm" fontWeight="medium" color="blue.600" textAlign="center">
          {getValue()}
        </Text>
      )
    }),
    columnHelper.accessor('subsystem', {
      header: 'Subsystem',
      minSize: 120,
      maxSize: 120,
      size: 120,
      cell: ({ getValue }) => (
          <Text fontSize="sm" fontWeight="medium" textAlign="center">
            {getValue()}
          </Text>
      )
    }),
    columnHelper.accessor('tagLoop', {
      header: 'Tag Loop',
      minSize: 100,
      maxSize: 100,
      size: 100,
      cell: ({ getValue }) => (
        <Text fontSize="sm" fontFamily="mono" textAlign="center">
          {getValue()}
        </Text>
      )
    }),
    columnHelper.accessor('area', {
      header: 'Area',
      minSize: 80,
      maxSize: 80,
      size: 80,
      cell: ({ getValue }) => (
          <Text fontSize="sm" fontWeight="medium" textAlign="center">
            {getValue()}
          </Text>
      )
    }),
    columnHelper.accessor('priority', {
      header: 'Priority',
      minSize: 70,
      maxSize: 70,
      size: 70,
      cell: ({ getValue }) => {
        const priority = getValue();
        // const colorScheme = priority === '1' ? 'red' : priority === '2' ? 'orange' : 'green';
        // return (
        //   <Badge colorScheme="gray" variant="solid" fontSize="xs" px={2} py={1}>
        //     {priority}
        //   </Badge>
        // );
        return (
            <Text fontSize="sm" fontWeight="medium" textAlign="center">
              {priority}
            </Text>
        );
      }
    }),
    columnHelper.accessor('service', {
      header: 'Service',
      minSize: 200,
      maxSize: 200,
      size: 200,
      cell: ({ getValue }) => (
          <Text fontSize="sm" noOfLines={2} maxW="190px" textAlign="center">
            {getValue()}
          </Text>
      )
    }),
    columnHelper.accessor('installed', {
      header: 'Installed',
      minSize: 100,
      maxSize: 100,
      size: 100,
      cell: ({ getValue }) => {
        const value = getValue();
        const parts = value ? value.split(' ') : ['Pending'];

        return (
            <VStack spacing={0} py={1}>
              {parts.map((part, i) => (
                  <Text key={i} fontSize="xs" fontWeight="medium" textAlign="center">
                    {part}
                  </Text>
              ))}
            </VStack>
        );
      }
    }),
    columnHelper.accessor('wired', {
      header: 'Wired',
      minSize: 100,
      maxSize: 100,
      size: 100,
      cell: ({ getValue }) => {
        const value = getValue();
        const parts = value ? value.split(' ') : ['Pending'];
        return (
            <VStack spacing={0} py={1}>
              {parts.map((part, i) => (
                  <Text key={i} fontSize="xs" fontWeight="medium" textAlign="center">
                    {part}
                  </Text>
              ))}
            </VStack>
        );
      }
    }),
    columnHelper.accessor('connected', {
      header: 'Connected',
      minSize: 100,
      maxSize: 100,
      size: 100,
      cell: ({ getValue }) => {
        const value = getValue();
        const parts = value ? value.split(' ') : ['Pending'];
        return (
            <VStack spacing={0} py={1}>
              {parts.map((part, i) => (
                  <Text key={i} fontSize="xs" fontWeight="medium" textAlign="center">
                    {part}
                  </Text>
              ))}
            </VStack>
        );
      }
    }),
    columnHelper.accessor('cableTest', {
      header: 'Cable Test',
      minSize: 100,
      maxSize: 100,
      size: 100,
      cell: ({ getValue }) => {
        const value = getValue();
        const parts = value ? value.split(' ') : ['Pending'];
        return (
            <VStack spacing={0} py={1}>
              {parts.map((part, i) => (
                  <Text key={i} fontSize="xs" fontWeight="medium" textAlign="center">
                    {part}
                  </Text>
              ))}
            </VStack>
        );
      }
    }),
    columnHelper.accessor('progress', {
      header: 'Progress',
      minSize: 120,
      maxSize: 120,
      size: 120,
      cell: ({ getValue }) => {
        const progressStr = getValue();
        const progressValue = parseFloat(progressStr.replace('%', '')) || 0;
        const colorScheme = progressValue === 100 ? 'green' : progressValue >= 50 ? 'yellow' : 'red';
        
        return (
          <Box height="40px" display="flex" flexDirection="column" justifyContent="center">
            <Progress 
              value={progressValue} 
              size="sm" 
              colorScheme={colorScheme}
              borderRadius="md"
              mb={1}
            />
            <Text fontSize="xs" textAlign="center" fontWeight="medium">
              {progressStr}
            </Text>
          </Box>
        );
      }
    }),
    columnHelper.accessor('dossier', {
      header: 'Dossier',
      minSize: 100,
      maxSize: 100,
      size: 100,
      cell: ({ getValue }) => (
        <Text fontSize="sm" color="gray.600" textAlign="center">
          {getValue()}
        </Text>
      )
    }),
    columnHelper.accessor('testLoop', {
      header: 'Test Loop',
      minSize: 100,
      maxSize: 100,
      size: 100,
      cell: ({ getValue }) => (
        <Text fontSize="sm" fontFamily="mono" color="blue.500" textAlign="center">
          {getValue()}
        </Text>
      )
    })
  ], []);

  // Create table instance with memoization
  const table = useReactTable({
    data: processedData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    debugTable: false,
  });

  // Get table rows
  const { rows } = table.getRowModel();

  // Create parent ref for virtualization
  const parentRef = React.useRef();

  // Create virtualizer with fixed row height for consistent layout
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
    overscan: 10,
  });

  // Memoize header rendering
  const headerGroups = useMemo(() => table.getHeaderGroups(), [table]);

  if (!data || data.length === 0) {
    return (
      <Box p={6} textAlign="center">
        <Text color="gray.500">No data available</Text>
      </Box>
    );
  }

  return (
    <Box mt={6}>
      <HStack justify="space-between" align="center" mb={4}>
        <Heading size="md" color="gray.700">
          Loop Test Control - Precommissioning
        </Heading>
        <Badge colorScheme="blue" fontSize="sm" px={3} py={1}>
          {processedData.length} records
        </Badge>
      </HStack>

      <Box
        border="1px solid"
        borderColor="gray.200"
        borderRadius="lg"
        overflow="hidden"
        bg="white"
        boxShadow="sm"
      >
        {/* Table Header */}
        <Box bg="gray.50" borderBottom="1px solid" borderColor="gray.200">
          <Table size="sm" style={{ tableLayout: 'fixed' }}>
            <Thead>
              {headerGroups.map(headerGroup => (
                <Tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <Th
                      key={header.id}
                      width={`${header.getSize()}px`}
                      minWidth={`${header.getSize()}px`}
                      maxWidth={`${header.getSize()}px`}
                      cursor={header.column.getCanSort() ? 'pointer' : 'default'}
                      onClick={header.column.getToggleSortingHandler()}
                      bg="gray.50"
                      borderColor="gray.200"
                      fontSize="xs"
                      fontWeight="bold"
                      textTransform="uppercase"
                      letterSpacing="wide"
                      color="gray.600"
                      py={2}
                      px={2}
                      textAlign="center"
                    >
                      {header.isPlaceholder ? null : (
                        <HStack spacing={1} justify="center">
                          <Text>
                            {flexRender(header.column.columnDef.header, header.getContext())}
                          </Text>
                          {header.column.getIsSorted() && (
                            <Text fontSize="xs">
                              {header.column.getIsSorted() === 'desc' ? '↓' : '↑'}
                            </Text>
                          )}
                        </HStack>
                      )}
                    </Th>
                  ))}
                </Tr>
              ))}
            </Thead>
          </Table>
        </Box>

        {/* Virtualized Table Body */}
        <Box
          ref={parentRef}
          height="500px"
          overflowY="auto"
          overflowX="auto"
        >
          <Box
            height={`${rowVirtualizer.getTotalSize()}px`}
            position="relative"
          >
            {rowVirtualizer.getVirtualItems().map(virtualRow => {
              const row = rows[virtualRow.index];
              return (
                <Box
                  key={row.id}
                  position="absolute"
                  top={0}
                  left={0}
                  width="100%"
                  height={`${virtualRow.size}px`}
                  transform={`translateY(${virtualRow.start}px)`}
                >
                  <Table size="sm" style={{ tableLayout: 'fixed' }}>
                    <Tbody>
                      <Tr
                        _hover={{ bg: 'gray.50' }}
                        borderBottom="1px solid"
                        borderColor="gray.100"
                      >
                        {row.getVisibleCells().map(cell => (
                          <Td
                            key={cell.id}
                            width={`${cell.column.getSize()}px`}
                            minWidth={`${cell.column.getSize()}px`}
                            maxWidth={`${cell.column.getSize()}px`}
                            borderColor="gray.100"
                            py={2}
                            px={2}
                            textAlign="center"
                            verticalAlign="middle"
                          >
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </Td>
                        ))}
                      </Tr>
                    </Tbody>
                  </Table>
                </Box>
              );
            })}
          </Box>
        </Box>
      </Box>
    </Box>
  );
});

LazosTable.displayName = 'LazosTable';

export default LazosTable;