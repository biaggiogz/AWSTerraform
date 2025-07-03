import React, { useMemo } from 'react';
import {
  Box,
  Text,
  Badge,
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
 * ControlInstrumentsTable component - Virtualized table for control instruments data
 * @param {Object} props - Component props
 * @param {Array} props.data - Filtered dataset from control_inst_by_isos.csv
 */
const ControlInstrumentsTable = React.memo(({ data }) => {
  // Memoize processed data to avoid recalculations
  const processedData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    return data.map((row, index) => ({
      id: index,
      isometric: row.ISOMETRIC || '',
      weldingFwSw: parseFloat(row['TP 100% FW+SW']) || 0,
      subsystem: row.SUSSYTEM || row.SUBSYSTEM || '',
      crono: parseInt(row.CRONO) || 0,
      priority: parseInt(row.PRIORITY) || 0,
      hito: row.HITO || '',
      reinstatement: row.REINSTATEMENT || '',
      insulation: row.INSULATION || '',
      siemsa: row.SIEMSA || '',
      technip: row.TECHNIP || '',
      testPack: parseInt(row['TEST PACK']) || 0,
      deliveryProgress: row['DELIVERY PROGRESS 100% BY TEN'] || row['DELIVERY PROGRESS BY TEN'] || '',
      readyToInstall: row['READY TO INSTALL INST (SIEMSA)'] || '',
      qtyInst: parseInt(row['QTY INST']) || 0,
      scopeTiegaTmi: parseInt(row['SCOPE BY TIEGA-TMI']) || 0,
      scopeSiemsa: parseInt(row['SCOPE BY SIEMSA']) || 0,
      installedSiemsa: row['INSTALLED (SIEMSA)'] || '',
      installedTiegaTmi: parseInt(row['INSTALLED (TEIGA-TMI)']) || 0,
      totalInstalled: parseInt(row['TOTAL INSTALLED']) || 0,
      tracYesNot: row['TRAC (YES & NOT)'] || '',
      tagCircuitoTraceado: row['Tag Circuito Traceado'] || ''
    }));
  }, [data]);

  // Define table columns with all required columns from CSV
  const columns = useMemo(() => [
    columnHelper.accessor('isometric', {
      header: 'ISOMETRIC',
      minSize: 250,
      maxSize: 250,
      size: 250,
      cell: ({ getValue }) => (
        <Text fontSize="sm" fontFamily="mono" textAlign="left" noOfLines={2}>
          {getValue()}
        </Text>
      )
    }),
    columnHelper.accessor('weldingFwSw', {
      header: 'WELDING FW+SW',
      minSize: 120,
      maxSize: 120,
      size: 120,
      cell: ({ getValue }) => {
        const value = getValue();
        const percentage = value * 100;
        const colorScheme = percentage === 100 ? 'green' : percentage >= 50 ? 'yellow' : 'red';
        
        return (
          <Badge colorScheme={colorScheme} fontSize="xs" textAlign="center">
            {percentage.toFixed(0)}%
          </Badge>
        );
      }
    }),
    columnHelper.accessor('subsystem', {
      header: 'SUBSYSTEM',
      minSize: 120,
      maxSize: 120,
      size: 120,
      cell: ({ getValue }) => (
        <Text fontSize="sm" fontWeight="medium" textAlign="center">
          {getValue()}
        </Text>
      )
    }),
    columnHelper.accessor('crono', {
      header: 'CRONO',
      minSize: 80,
      maxSize: 80,
      size: 80,
      cell: ({ getValue }) => (
        <Text fontSize="sm" textAlign="center" fontWeight="medium">
          {getValue()}
        </Text>
      )
    }),
    columnHelper.accessor('priority', {
      header: 'PRIORITY',
      minSize: 80,
      maxSize: 80,
      size: 80,
      cell: ({ getValue }) => {
        const value = getValue();
        const colorScheme = value <= 3 ? 'red' : value <= 5 ? 'yellow' : 'green';
        
        return (
          <Badge colorScheme={colorScheme} fontSize="xs">
            {value}
          </Badge>
        );
      }
    }),
    columnHelper.accessor('hito', {
      header: 'HITO',
      minSize: 100,
      maxSize: 100,
      size: 100,
      cell: ({ getValue }) => (
        <Text fontSize="sm" textAlign="center" fontWeight="medium">
          {getValue()}
        </Text>
      )
    }),
    columnHelper.accessor('reinstatement', {
      header: 'REINSTATEMENT',
      minSize: 120,
      maxSize: 120,
      size: 120,
      cell: ({ getValue }) => (
        <Text fontSize="sm" textAlign="center">
          {getValue()}
        </Text>
      )
    }),
    columnHelper.accessor('insulation', {
      header: 'INSULATION',
      minSize: 120,
      maxSize: 120,
      size: 120,
      cell: ({ getValue }) => (
        <Text fontSize="sm" textAlign="center">
          {getValue()}
        </Text>
      )
    }),
    columnHelper.accessor('siemsa', {
      header: 'SIEMSA',
      minSize: 120,
      maxSize: 120,
      size: 120,
      cell: ({ getValue }) => (
        <Text fontSize="sm" textAlign="center">
          {getValue()}
        </Text>
      )
    }),
    columnHelper.accessor('technip', {
      header: 'TECHNIP',
      minSize: 120,
      maxSize: 120,
      size: 120,
      cell: ({ getValue }) => (
        <Text fontSize="sm" textAlign="center">
          {getValue()}
        </Text>
      )
    }),
    columnHelper.accessor('testPack', {
      header: 'TEST PACK',
      minSize: 100,
      maxSize: 100,
      size: 100,
      cell: ({ getValue }) => (
        <Text fontSize="sm" textAlign="center" fontWeight="medium" color="blue.600">
          {getValue()}
        </Text>
      )
    }),
    columnHelper.accessor('deliveryProgress', {
      header: 'DELIVERY PROGRESS BY TEN',
      minSize: 180,
      maxSize: 180,
      size: 180,
      cell: ({ getValue }) => (
        <Text fontSize="sm" textAlign="center">
          {getValue()}
        </Text>
      )
    }),
    columnHelper.accessor('readyToInstall', {
      header: 'READY TO INSTALL INST (SIEMSA)',
      minSize: 200,
      maxSize: 200,
      size: 200,
      cell: ({ getValue }) => (
        <Text fontSize="sm" textAlign="center">
          {getValue()}
        </Text>
      )
    }),
    columnHelper.accessor('qtyInst', {
      header: 'QTY INST',
      minSize: 80,
      maxSize: 80,
      size: 80,
      cell: ({ getValue }) => (
        <Text fontSize="sm" textAlign="center" fontWeight="medium">
          {getValue()}
        </Text>
      )
    }),
    columnHelper.accessor('scopeTiegaTmi', {
      header: 'SCOPE BY TIEGA-TMI',
      minSize: 150,
      maxSize: 150,
      size: 150,
      cell: ({ getValue }) => (
        <Text fontSize="sm" textAlign="center" fontWeight="medium">
          {getValue()}
        </Text>
      )
    }),
    columnHelper.accessor('scopeSiemsa', {
      header: 'SCOPE BY SIEMSA',
      minSize: 130,
      maxSize: 130,
      size: 130,
      cell: ({ getValue }) => (
        <Text fontSize="sm" textAlign="center" fontWeight="medium">
          {getValue()}
        </Text>
      )
    }),
    columnHelper.accessor('installedSiemsa', {
      header: 'INSTALLED (SIEMSA)',
      minSize: 140,
      maxSize: 140,
      size: 140,
      cell: ({ getValue }) => (
        <Text fontSize="sm" textAlign="center">
          {getValue()}
        </Text>
      )
    }),
    columnHelper.accessor('installedTiegaTmi', {
      header: 'INSTALLED (TEIGA-TMI)',
      minSize: 160,
      maxSize: 160,
      size: 160,
      cell: ({ getValue }) => (
        <Text fontSize="sm" textAlign="center" fontWeight="medium">
          {getValue()}
        </Text>
      )
    }),
    columnHelper.accessor('totalInstalled', {
      header: 'TOTAL INSTALLED',
      minSize: 120,
      maxSize: 120,
      size: 120,
      cell: ({ getValue }) => (
        <Text fontSize="sm" textAlign="center" fontWeight="bold" color="green.600">
          {getValue()}
        </Text>
      )
    }),
    columnHelper.accessor('tracYesNot', {
      header: 'TRAC (YES & NOT)',
      minSize: 120,
      maxSize: 120,
      size: 120,
      cell: ({ getValue }) => {
        const value = getValue();
        const colorScheme = value === 'YES' ? 'green' : 'red';
        return (
          <Badge colorScheme={colorScheme} fontSize="xs">
            {value}
          </Badge>
        );
      }
    }),
    columnHelper.accessor('tagCircuitoTraceado', {
      header: 'Tag Circuito Traceado',
      minSize: 160,
      maxSize: 160,
      size: 160,
      cell: ({ getValue }) => (
        <Text fontSize="sm" fontFamily="mono" textAlign="center">
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
        <Text color="gray.500">No control instruments data available</Text>
      </Box>
    );
  }

  return (
    <Box mt={6}>
      <HStack justify="space-between" align="center" mb={4}>
        <Heading size="md" color="gray.700">
          Control Instruments
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
          display="flex"
          width="100%"
          borderBottom="1px solid"
          borderColor="gray.200"
          bg="gray.50"
          ref={headerRef}
        >
          {headerGroups[0].headers.map(header => (
            <Box
              key={header.id}
              width={`${header.getSize()}px`}
              minWidth={`${header.getSize()}px`}
              maxWidth={`${header.getSize()}px`}
              textAlign="center"
              fontSize="xs"
              fontWeight="bold"
              textTransform="uppercase"
              letterSpacing="wide"
              color="gray.600"
              py={2}
              px={2}
              borderRight="1px solid"
              borderColor="gray.100"
              display="flex"
              alignItems="center"
              justifyContent="center"
              cursor={header.column.getCanSort() ? 'pointer' : 'default'}
              onClick={header.column.getToggleSortingHandler()}
            >
              <HStack spacing={1}>
                <Text>{flexRender(header.column.columnDef.header, header.getContext())}</Text>
                {header.column.getIsSorted() && (
                  <Text fontSize="xs">{header.column.getIsSorted() === 'desc' ? '↓' : '↑'}</Text>
                )}
              </HStack>
            </Box>
          ))}
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

ControlInstrumentsTable.displayName = 'ControlInstrumentsTable';

export default ControlInstrumentsTable;