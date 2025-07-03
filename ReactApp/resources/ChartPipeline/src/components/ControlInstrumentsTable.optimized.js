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
 * ControlInstrumentsTable component - Virtualized table for control instruments data with multi-level headers
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
      subsystem: row.SUBSYSTEM || row.SUSSYTEM || '',
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

  // Define multi-level header structure based on ASCII diagram
  const multiLevelHeaders = useMemo(() => {
    return [
      // Level 1 - Main categories (4 groups)
      {
        level: 1,
        headers: [
          { id: 'progress_weld_iso', title: 'PROGRESS WELD ISO', colspan: 2, startCol: 0 },
          { id: 'mc_realistic', title: 'MECHANICAL COMPLETION (MC) REALISTIC DATE BY SUBSYSTEM', colspan: 8, startCol: 2 },
          { id: 'progress_inst_iso', title: 'PROGRESS INST & ISO', colspan: 9, startCol: 10 },
          { id: 'tracing_insulation', title: 'TRACING & INSULATION', colspan: 2, startCol: 19 }
        ]
      },
      // Level 2 - Sub categories
      {
        level: 2,
        headers: [
          { id: 'empty_1', title: '', colspan: 2, startCol: 0 }, // No sub-groups for PROGRESS WELD ISO
          { id: 'planning_delivery', title: 'PLANNING DELIVERY TO ADISSEO', colspan: 3, startCol: 2 },
          { id: 'teiga_tmi', title: 'TEIGA-TMI', colspan: 3, startCol: 5 },
          { id: 'siemsa_sub', title: 'SIEMSA', colspan: 1, startCol: 8 },
          { id: 'technip_sub', title: 'TECHNIP', colspan: 1, startCol: 9 },
          { id: 'progress_iso_test', title: 'PROGRESS ISO & TEST PACK', colspan: 3, startCol: 10 },
          { id: 'instrument_distribution', title: 'INSTRUMENT DISTRIBUTION', colspan: 3, startCol: 13 },
          { id: 'instrument_installed', title: 'INSTRUMENT INSTALLED', colspan: 3, startCol: 16 },
          { id: 'siemsa_tracing', title: 'SIEMSA', colspan: 2, startCol: 19 }
        ]
      }
    ];
  }, []);

  // Define table columns with all required columns from CSV
  const columns = useMemo(() => [
    columnHelper.accessor('isometric', {
      header: 'ISOMETRIC',
      minSize: 200,
      maxSize: 200,
      size: 200,
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
      minSize: 100,
      maxSize: 100,
      size: 100,
      cell: ({ getValue }) => (
        <Text fontSize="sm" fontWeight="medium" textAlign="center">
          {getValue()}
        </Text>
      )
    }),
    columnHelper.accessor('crono', {
      header: 'CRONO',
      minSize: 70,
      maxSize: 70,
      size: 70,
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
      minSize: 80,
      maxSize: 80,
      size: 80,
      cell: ({ getValue }) => (
        <Text fontSize="sm" textAlign="center" fontWeight="medium">
          {getValue()}
        </Text>
      )
    }),
    columnHelper.accessor('reinstatement', {
      header: 'REINSTATEMENT',
      minSize: 110,
      maxSize: 110,
      size: 110,
      cell: ({ getValue }) => (
        <Text fontSize="sm" textAlign="center">
          {getValue()}
        </Text>
      )
    }),
    columnHelper.accessor('insulation', {
      header: 'INSULATION',
      minSize: 100,
      maxSize: 100,
      size: 100,
      cell: ({ getValue }) => (
        <Text fontSize="sm" textAlign="center">
          {getValue()}
        </Text>
      )
    }),
    columnHelper.accessor('siemsa', {
      header: 'SIEMSA',
      minSize: 80,
      maxSize: 80,
      size: 80,
      cell: ({ getValue }) => (
        <Text fontSize="sm" textAlign="center">
          {getValue()}
        </Text>
      )
    }),
    columnHelper.accessor('technip', {
      header: 'TECHNIP',
      minSize: 80,
      maxSize: 80,
      size: 80,
      cell: ({ getValue }) => (
        <Text fontSize="sm" textAlign="center">
          {getValue()}
        </Text>
      )
    }),
    columnHelper.accessor('testPack', {
      header: 'TEST PACK',
      minSize: 90,
      maxSize: 90,
      size: 90,
      cell: ({ getValue }) => (
        <Text fontSize="sm" textAlign="center" fontWeight="medium" color="blue.600">
          {getValue()}
        </Text>
      )
    }),
    columnHelper.accessor('deliveryProgress', {
      header: 'DELIVERY PROGRESS BY TEN',
      minSize: 140,
      maxSize: 140,
      size: 140,
      cell: ({ getValue }) => (
        <Text fontSize="sm" textAlign="center">
          {getValue()}
        </Text>
      )
    }),
    columnHelper.accessor('readyToInstall', {
      header: 'READY TO INSTALL INST (SIEMSA)',
      minSize: 150,
      maxSize: 150,
      size: 150,
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
      minSize: 120,
      maxSize: 120,
      size: 120,
      cell: ({ getValue }) => (
        <Text fontSize="sm" textAlign="center" fontWeight="medium">
          {getValue()}
        </Text>
      )
    }),
    columnHelper.accessor('scopeSiemsa', {
      header: 'SCOPE BY SIEMSA',
      minSize: 110,
      maxSize: 110,
      size: 110,
      cell: ({ getValue }) => (
        <Text fontSize="sm" textAlign="center" fontWeight="medium">
          {getValue()}
        </Text>
      )
    }),
    columnHelper.accessor('installedSiemsa', {
      header: 'INSTALLED (SIEMSA)',
      minSize: 120,
      maxSize: 120,
      size: 120,
      cell: ({ getValue }) => (
        <Text fontSize="sm" textAlign="center">
          {getValue()}
        </Text>
      )
    }),
    columnHelper.accessor('installedTiegaTmi', {
      header: 'INSTALLED (TEIGA-TMI)',
      minSize: 130,
      maxSize: 130,
      size: 130,
      cell: ({ getValue }) => (
        <Text fontSize="sm" textAlign="center" fontWeight="medium">
          {getValue()}
        </Text>
      )
    }),
    columnHelper.accessor('totalInstalled', {
      header: 'TOTAL INSTALLED',
      minSize: 110,
      maxSize: 110,
      size: 110,
      cell: ({ getValue }) => (
        <Text fontSize="sm" textAlign="center" fontWeight="bold" color="green.600">
          {getValue()}
        </Text>
      )
    }),
    columnHelper.accessor('tracYesNot', {
      header: 'TRAC (YES & NOT)',
      minSize: 100,
      maxSize: 100,
      size: 100,
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
      header: 'TAG CIRCUITO TRACEADO',
      minSize: 140,
      maxSize: 140,
      size: 140,
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
            {processedData.length} INSTRUMENTS
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
        maxWidth="100vw"
        position="relative"
      >
        {/* Multi-Level Table Header */}
        <Box
          ref={headerRef}
          overflowX="auto"
          borderBottom="1px solid"
          borderColor="gray.200"
          bg="gray.50"
        >
          {/* Level 1 Headers */}
          <Box display="flex" width="100%" minWidth="fit-content">
            {multiLevelHeaders[0].headers.map(header => {
              const totalWidth = columns.slice(header.startCol, header.startCol + header.colspan)
                .reduce((sum, col) => sum + col.size, 0);
              return (
                <Box
                  key={header.id}
                  width={`${totalWidth}px`}
                  minWidth={`${totalWidth}px`}
                  textAlign="center"
                  fontSize="xs"
                  fontWeight="bold"
                  textTransform="uppercase"
                  letterSpacing="wide"
                  color="gray.700"
                  py={2}
                  px={1}
                  borderRight="1px solid"
                  borderColor="gray.300"
                  borderBottom="1px solid"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  bg="gray.100"
                  minHeight="40px"
                >
                  <Text fontSize="xs" fontWeight="bold" textAlign="center" noOfLines={2}>
                    {header.title}
                  </Text>
                </Box>
              );
            })}
          </Box>

          {/* Level 2 Headers */}
          <Box display="flex" width="100%" minWidth="fit-content">
            {multiLevelHeaders[1].headers.map(header => {
              const totalWidth = columns.slice(header.startCol, header.startCol + header.colspan)
                .reduce((sum, col) => sum + col.size, 0);
              return (
                <Box
                  key={header.id}
                  width={`${totalWidth}px`}
                  minWidth={`${totalWidth}px`}
                  textAlign="center"
                  fontSize="xs"
                  fontWeight="semibold"
                  textTransform="uppercase"
                  letterSpacing="wide"
                  color="gray.600"
                  py={2}
                  px={1}
                  borderRight="1px solid"
                  borderColor="gray.200"
                  borderBottom="1px solid"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  bg="gray.75"
                  minHeight="40px"
                >
                  <Text fontSize="xs" fontWeight="semibold" textAlign="center" noOfLines={2}>
                    {header.title}
                  </Text>
                </Box>
              );
            })}
          </Box>

          {/* Level 3 Headers - Column Headers */}
          <Box display="flex" width="100%" minWidth="fit-content">
            {headerGroups[0].headers.map((header, index) => (
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
                px={1}
                borderRight="1px solid"
                borderColor="gray.100"
                display="flex"
                alignItems="center"
                justifyContent="center"
                cursor={header.column.getCanSort() ? 'pointer' : 'default'}
                onClick={header.column.getToggleSortingHandler()}
                _hover={header.column.getCanSort() ? { bg: 'gray.100' } : {}}
                minHeight="50px"
              >
                <HStack spacing={1}>
                  <Text fontSize="xs" noOfLines={3} textAlign="center">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </Text>
                  {header.column.getIsSorted() && (
                    <Text fontSize="xs">{header.column.getIsSorted() === 'desc' ? '↓' : '↑'}</Text>
                  )}
                </HStack>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Virtualized Table Body */}
        <Box
          ref={parentRef}
          height="500px"
          overflowY="auto"
          overflowX="auto"
          maxWidth="100%"
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