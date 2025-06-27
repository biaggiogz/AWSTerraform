import React, { useMemo } from 'react';
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
  HStack
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
 * InsulationProgressTable component - Virtualized table for insulation progress data
 * @param {Object} props - Component props
 * @param {Array} props.data - Filtered dataset from aislamientos.csv
 */
const InsulationProgressTable = React.memo(({ data }) => {
  // Memoize processed data to avoid recalculations
  const processedData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    return data.map((row, index) => ({
      id: index,
      cod: row.COD || '',
      iso: row.ISO || '',
      subsystem: row.SUBSYSTEM || '',
      tp: row.TP || '',
      tracingYesNot: row['TRACING YES & NOT'] || '',
      tagTracing: row['TAG TRACING'] || '',
      area: row.Area || '',
      mleq: parseFloat(row.Mleq) || 0,
      m2eq: parseFloat(row.M2eq) || 0,
      avanceDistanciadores: parseFloat(row['Avance Distanciadores']) || 0,
      avanceAislamiento: parseFloat(row['Avance Aislamiento']) || 0,
      avanceChapa: parseFloat(row['Avance Chapa']) || 0,
      avanceCajas: parseFloat(row['Avance Cajas']) || 0,
      avanceRematar: parseFloat(row['Avance Rematar']) || 0,
      avanceMleqTotales: parseFloat(row['Avance Mleq totales']) || 0
    }));
  }, [data]);

  // Define table columns with fixed layout and consistent styling
  const columns = useMemo(() => [
    columnHelper.accessor('cod', {
      header: 'COD',
      minSize: 120,
      maxSize: 120,
      size: 120,
      cell: ({ getValue }) => (
        <Text fontSize="sm" fontWeight="medium" color="blue.600" textAlign="center">
          {getValue()}
        </Text>
      )
    }),
    columnHelper.accessor('iso', {
      header: 'ISO',
      minSize: 200,
      maxSize: 200,
      size: 200,
      cell: ({ getValue }) => (
        <Text fontSize="sm" fontFamily="mono" textAlign="center" noOfLines={2}>
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
    columnHelper.accessor('tp', {
      header: 'TP',
      minSize: 80,
      maxSize: 80,
      size: 80,
      cell: ({ getValue }) => (
        <Text fontSize="sm" textAlign="center">
          {getValue()}
        </Text>
      )
    }),
    columnHelper.accessor('tracingYesNot', {
      header: 'Tracing',
      minSize: 80,
      maxSize: 80,
      size: 80,
      cell: ({ getValue }) => {
        const value = getValue();
        const colorScheme = value === 'YES' ? 'green' : 'red';
        return (
          <Badge colorScheme={colorScheme} fontSize="xs" textAlign="center">
            {value}
          </Badge>
        );
      }
    }),
    columnHelper.accessor('tagTracing', {
      header: 'Tag Tracing',
      minSize: 120,
      maxSize: 120,
      size: 120,
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
    columnHelper.accessor('mleq', {
      header: 'Mleq',
      minSize: 80,
      maxSize: 80,
      size: 80,
      cell: ({ getValue }) => (
        <Text fontSize="sm" textAlign="center" fontWeight="medium">
          {getValue().toFixed(2)}
        </Text>
      )
    }),
    columnHelper.accessor('m2eq', {
      header: 'M2eq',
      minSize: 80,
      maxSize: 80,
      size: 80,
      cell: ({ getValue }) => (
        <Text fontSize="sm" textAlign="center" fontWeight="medium">
          {getValue().toFixed(2)}
        </Text>
      )
    }),
    columnHelper.accessor('avanceDistanciadores', {
      header: 'Spacers',
      minSize: 100,
      maxSize: 100,
      size: 100,
      cell: ({ getValue }) => {
        const value = getValue();
        const percentage = value * 100;
        const colorScheme = percentage === 100 ? 'green' : percentage >= 50 ? 'yellow' : 'red';
        
        return (
          <Box height="40px" display="flex" flexDirection="column" justifyContent="center">
            <Progress 
              value={percentage} 
              size="sm" 
              colorScheme={colorScheme}
              borderRadius="md"
              mb={1}
            />
            <Text fontSize="xs" textAlign="center" fontWeight="medium">
              {percentage.toFixed(0)}%
            </Text>
          </Box>
        );
      }
    }),
    columnHelper.accessor('avanceAislamiento', {
      header: 'Insulation',
      minSize: 100,
      maxSize: 100,
      size: 100,
      cell: ({ getValue }) => {
        const value = getValue();
        const percentage = value * 100;
        const colorScheme = percentage === 100 ? 'green' : percentage >= 50 ? 'yellow' : 'red';
        
        return (
          <Box height="40px" display="flex" flexDirection="column" justifyContent="center">
            <Progress 
              value={percentage} 
              size="sm" 
              colorScheme={colorScheme}
              borderRadius="md"
              mb={1}
            />
            <Text fontSize="xs" textAlign="center" fontWeight="medium">
              {percentage.toFixed(0)}%
            </Text>
          </Box>
        );
      }
    }),
    columnHelper.accessor('avanceChapa', {
      header: 'Sheet Metal',
      minSize: 100,
      maxSize: 100,
      size: 100,
      cell: ({ getValue }) => {
        const value = getValue();
        const percentage = value * 100;
        const colorScheme = percentage === 100 ? 'green' : percentage >= 50 ? 'yellow' : 'red';
        
        return (
          <Box height="40px" display="flex" flexDirection="column" justifyContent="center">
            <Progress 
              value={percentage} 
              size="sm" 
              colorScheme={colorScheme}
              borderRadius="md"
              mb={1}
            />
            <Text fontSize="xs" textAlign="center" fontWeight="medium">
              {percentage.toFixed(0)}%
            </Text>
          </Box>
        );
      }
    }),
    columnHelper.accessor('avanceCajas', {
      header: 'Boxes',
      minSize: 100,
      maxSize: 100,
      size: 100,
      cell: ({ getValue }) => {
        const value = getValue();
        const percentage = value * 100;
        const colorScheme = percentage === 100 ? 'green' : percentage >= 50 ? 'yellow' : 'red';
        
        return (
          <Box height="40px" display="flex" flexDirection="column" justifyContent="center">
            <Progress 
              value={percentage} 
              size="sm" 
              colorScheme={colorScheme}
              borderRadius="md"
              mb={1}
            />
            <Text fontSize="xs" textAlign="center" fontWeight="medium">
              {percentage.toFixed(0)}%
            </Text>
          </Box>
        );
      }
    }),
    columnHelper.accessor('avanceRematar', {
      header: 'Finish',
      minSize: 100,
      maxSize: 100,
      size: 100,
      cell: ({ getValue }) => {
        const value = getValue();
        const percentage = value * 100;
        const colorScheme = percentage === 100 ? 'green' : percentage >= 50 ? 'yellow' : 'red';
        
        return (
          <Box height="40px" display="flex" flexDirection="column" justifyContent="center">
            <Progress 
              value={percentage} 
              size="sm" 
              colorScheme={colorScheme}
              borderRadius="md"
              mb={1}
            />
            <Text fontSize="xs" textAlign="center" fontWeight="medium">
              {percentage.toFixed(0)}%
            </Text>
          </Box>
        );
      }
    }),
    columnHelper.accessor('avanceMleqTotales', {
      header: 'Mleq Total',
      minSize: 100,
      maxSize: 100,
      size: 100,
      cell: ({ getValue }) => (
        <Text fontSize="sm" textAlign="center" fontWeight="medium" color="blue.500">
          {getValue().toFixed(2)}
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

  // Create refs for virtualization
  const parentRef = React.useRef();
  const headerRef = React.useRef();

  // Create virtualizer
  const virtualizer = useVirtualizer({
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
        <Text color="gray.500">No insulation data available</Text>
      </Box>
    );
  }

  return (
    <Box mt={6}>
      <HStack justify="space-between" align="center" mb={4}>
        <Heading size="md" color="gray.700">
          Insulation Progress
        </Heading>
        <HStack spacing={3}>
          <Badge colorScheme="blue" fontSize="sm" px={3} py={1}>
            {processedData.length} ITEMS
          </Badge>
        </HStack>
      </HStack>

      <Box
        border="1px solid"
        borderColor="gray.200"
        borderRadius="lg"
        overflow="hidden"
        bg="white"
        boxShadow="sm"
        width="100%"
        height="auto"
        maxWidth="100%"
        position="relative"
      >
        {/* Table Header */}
        <Box 
          bg="gray.50" 
          borderBottom="1px solid" 
          borderColor="gray.200"
          overflowX="hidden"
          ref={headerRef}
        >
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
          onScroll={(e) => {
            if (headerRef.current) {
              headerRef.current.scrollLeft = e.target.scrollLeft;
            }
          }}
          borderTop="none"
        >
          <Box
            height={`${virtualizer.getTotalSize()}px`}
            position="relative"
          >
            {virtualizer.getVirtualItems().map(virtualRow => {
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
                  <Box
                    as="div"
                    display="flex"
                    width="100%"
                    height="100%"
                    _hover={{ bg: 'gray.50' }}
                    borderBottom="1px solid"
                    borderColor="gray.100"
                  >
                    {row.getVisibleCells().map(cell => (
                      <Box
                        key={cell.id}
                        width={`${cell.column.getSize()}px`}
                        minWidth={`${cell.column.getSize()}px`}
                        maxWidth={`${cell.column.getSize()}px`}
                        borderRight="1px solid"
                        borderColor="gray.100"
                        py={2}
                        px={2}
                        textAlign="center"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </Box>
                    ))}
                  </Box>
                </Box>
              );
            })}
          </Box>
        </Box>
      </Box>
    </Box>
  );
});

InsulationProgressTable.displayName = 'InsulationProgressTable';

export default InsulationProgressTable;