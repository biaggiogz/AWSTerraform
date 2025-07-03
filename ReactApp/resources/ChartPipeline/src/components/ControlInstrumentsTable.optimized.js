import React, { useMemo } from 'react';
import {
  Box,
  Text,
  Badge,
  Heading,
  HStack,
  Progress
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
      subsystem: row.SUSSYTEM || row.SUBSYSTEM || '', // Note: CSV uses SUSSYTEM
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

  // Define multi-level header structure with colors based on requirements
  const multiLevelHeaders = useMemo(() => {
    return [
      // Level 1 - Main categories (6 groups)
      {
        level: 1,
        headers: [
          { 
            id: 'progress_weld_iso', 
            title: 'PROGRESS WELD ISO', 
            colspan: 2, 
            startCol: 0,
            color: '#789FAA' // #8DBCC7 + 15% dark
          },
          { 
            id: 'planning_delivery', 
            title: 'PLANNING DELIVERY TO ADISSEO', 
            colspan: 3, 
            startCol: 2,
            color: '#C7C2B5' // #EAE4D5 + 15% dark
          },
          { 
            id: 'mc_realistic', 
            title: 'MECHANICAL COMPLETION (MC) REALISTIC DATE BY SUBSYSTEM', 
            colspan: 5, 
            startCol: 5,
            color: '#909ABE' // #A9B5DF + 15% dark
          },
          { 
            id: 'progress_iso_test', 
            title: 'PROGRESS ISO & TEST PACK', 
            colspan: 3, 
            startCol: 10,
            color: '#ABC4CC' // #C9E6F0 + 15% dark
          },
          { 
            id: 'progress_inst_iso', 
            title: 'PROGRESS INST & ISO', 
            colspan: 6, 
            startCol: 13,
            color: '#B5A2C2' // #D4BEE4 + 15% dark
          },
          { 
            id: 'tracing_insulation', 
            title: 'TRACING & INSULATION', 
            colspan: 2, 
            startCol: 19,
            color: '#CBD2D9' // #EEF7FF + 15% dark
          }
        ]
      },
      // Level 2 - Sub categories
      {
        level: 2,
        headers: [
          { id: 'empty_1', title: '', colspan: 2, startCol: 0, color: 'transparent' },
          { id: 'empty_2', title: '', colspan: 3, startCol: 2, color: 'transparent' },
          { 
            id: 'teiga_tmi', 
            title: 'TEIGA-TMI', 
            colspan: 3, 
            startCol: 5,
            color: '#98A3C9' // #A9B5DF + 10% dark
          },
          { 
            id: 'siemsa_sub', 
            title: 'SIEMSA', 
            colspan: 1, 
            startCol: 8,
            color: '#98A3C9' // #A9B5DF + 10% dark
          },
          { 
            id: 'technip_sub', 
            title: 'TECHNIP', 
            colspan: 1, 
            startCol: 9,
            color: '#98A3C9' // #A9B5DF + 10% dark
          },
          { id: 'empty_3', title: '', colspan: 3, startCol: 10, color: 'transparent' },
          { 
            id: 'instrument_distribution', 
            title: 'INSTRUMENT DISTRIBUTION', 
            colspan: 3, 
            startCol: 13,
            color: '#C0ABCE' // #D4BEE4 + 10% dark
          },
          { 
            id: 'instrument_installed', 
            title: 'INSTRUMENT INSTALLED', 
            colspan: 3, 
            startCol: 16,
            color: '#C0ABCE' // #D4BEE4 + 10% dark
          },
          { 
            id: 'siemsa_tracing', 
            title: 'SIEMSA', 
            colspan: 2, 
            startCol: 19,
            color: '#D6DEE6' // #EEF7FF + 10% dark
          }
        ]
      }
    ];
  }, []);

  // Define column colors based on requirements
  const columnColors = useMemo(() => {
    return {
      isometric: '#8DBCC7',
      weldingFwSw: '#8DBCC7',
      subsystem: '#EAE4D5',
      crono: '#EAE4D5',
      priority: '#EAE4D5',
      hito: '#A9B5DF',
      reinstatement: '#A9B5DF',
      insulation: '#A9B5DF',
      siemsa: '#A9B5DF',
      technip: '#A9B5DF',
      testPack: '#C9E6F0',
      deliveryProgress: '#C9E6F0',
      readyToInstall: '#C9E6F0',
      qtyInst: '#D4BEE4',
      scopeTiegaTmi: '#D4BEE4',
      scopeSiemsa: '#D4BEE4',
      installedSiemsa: '#C9B5D6', // #D4BEE4 + 5% dark
      installedTiegaTmi: '#C9B5D6', // #D4BEE4 + 5% dark
      totalInstalled: '#C9B5D6', // #D4BEE4 + 5% dark
      tracYesNot: '#EEF7FF',
      tagCircuitoTraceado: '#EEF7FF'
    };
  }, []);

  // Define table columns with optimized sizing for viewport fit
  const columns = useMemo(() => [
    columnHelper.accessor('isometric', {
      header: 'ISOMETRIC',
      minSize: 100,
      maxSize: 400,
      size: 180,
      enableResizing: true,
      cell: ({ getValue }) => (
        <Text fontSize="xs" fontFamily="mono" textAlign="left" noOfLines={2}>
          {getValue()}
        </Text>
      )
    }),
    columnHelper.accessor('weldingFwSw', {
      header: 'WELDING FW+SW',
      minSize: 120,
      maxSize: 200,
      size: 140,
      enableResizing: true,
      cell: ({ getValue }) => {
        const value = getValue();
        const percentage = value * 100;
        
        return (
          <Box position="relative" width="100px" margin="0 auto">
            <Progress 
              value={Math.round(percentage)} 
              size="md" 
              width="100px"
              borderRadius="md"
              backgroundColor="#0E2148"
              colorScheme="teal"
            />
            <Text 
              position="absolute" 
              top="50%" 
              left="50%" 
              transform="translate(-50%, -50%)" 
              fontSize="xs" 
              fontWeight="bold" 
              color="white"
              textShadow="1px 1px 2px rgba(0,0,0,0.8)"
            >
              {Math.round(percentage)}%
            </Text>
          </Box>
        );
      }
    }),
    columnHelper.accessor('subsystem', {
      header: 'SUBSYSTEM',
      minSize: 60,
      maxSize: 200,
      size: 90,
      enableResizing: true,
      cell: ({ getValue }) => (
        <Text fontSize="xs" fontWeight="medium" textAlign="center">
          {getValue()}
        </Text>
      )
    }),
    columnHelper.accessor('crono', {
      header: 'CRONO',
      minSize: 50,
      maxSize: 150,
      size: 60,
      enableResizing: true,
      cell: ({ getValue }) => (
        <Text fontSize="xs" textAlign="center" fontWeight="medium">
          {getValue()}
        </Text>
      )
    }),
    columnHelper.accessor('priority', {
      header: 'PRIORITY',
      minSize: 60,
      maxSize: 150,
      size: 70,
      enableResizing: true,
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
      minSize: 60,
      maxSize: 150,
      size: 70,
      enableResizing: true,
      cell: ({ getValue }) => (
        <Text fontSize="xs" textAlign="center" fontWeight="medium">
          {getValue()}
        </Text>
      )
    }),
    columnHelper.accessor('reinstatement', {
      header: 'REINSTATEMENT',
      minSize: 80,
      maxSize: 200,
      size: 90,
      enableResizing: true,
      cell: ({ getValue }) => (
        <Text fontSize="xs" textAlign="center">
          {getValue()}
        </Text>
      )
    }),
    columnHelper.accessor('insulation', {
      header: 'INSULATION',
      minSize: 70,
      maxSize: 180,
      size: 80,
      enableResizing: true,
      cell: ({ getValue }) => (
        <Text fontSize="xs" textAlign="center">
          {getValue()}
        </Text>
      )
    }),
    columnHelper.accessor('siemsa', {
      header: 'SIEMSA',
      minSize: 60,
      maxSize: 150,
      size: 70,
      enableResizing: true,
      cell: ({ getValue }) => (
        <Text fontSize="xs" textAlign="center">
          {getValue()}
        </Text>
      )
    }),
    columnHelper.accessor('technip', {
      header: 'TECHNIP',
      minSize: 60,
      maxSize: 150,
      size: 70,
      enableResizing: true,
      cell: ({ getValue }) => (
        <Text fontSize="xs" textAlign="center">
          {getValue()}
        </Text>
      )
    }),
    columnHelper.accessor('testPack', {
      header: 'TEST PACK',
      minSize: 70,
      maxSize: 180,
      size: 80,
      enableResizing: true,
      cell: ({ getValue }) => (
        <Text fontSize="xs" textAlign="center" fontWeight="medium" color="blue.600">
          {getValue()}
        </Text>
      )
    }),
    columnHelper.accessor('deliveryProgress', {
      header: 'DELIVERY PROGRESS BY TEN',
      minSize: 100,
      maxSize: 250,
      size: 120,
      enableResizing: true,
      cell: ({ getValue }) => (
        <Text fontSize="xs" textAlign="center">
          {getValue()}
        </Text>
      )
    }),
    columnHelper.accessor('readyToInstall', {
      header: 'READY TO INSTALL INST (SIEMSA)',
      minSize: 110,
      maxSize: 300,
      size: 130,
      enableResizing: true,
      cell: ({ getValue }) => (
        <Text fontSize="xs" textAlign="center">
          {getValue()}
        </Text>
      )
    }),
    columnHelper.accessor('qtyInst', {
      header: 'QTY INST',
      minSize: 60,
      maxSize: 150,
      size: 70,
      enableResizing: true,
      cell: ({ getValue }) => (
        <Text fontSize="xs" textAlign="center" fontWeight="medium">
          {getValue()}
        </Text>
      )
    }),
    columnHelper.accessor('scopeTiegaTmi', {
      header: 'SCOPE BY TIEGA-TMI',
      minSize: 80,
      maxSize: 200,
      size: 100,
      enableResizing: true,
      cell: ({ getValue }) => (
        <Text fontSize="xs" textAlign="center" fontWeight="medium">
          {getValue()}
        </Text>
      )
    }),
    columnHelper.accessor('scopeSiemsa', {
      header: 'SCOPE BY SIEMSA',
      minSize: 80,
      maxSize: 200,
      size: 100,
      enableResizing: true,
      cell: ({ getValue }) => (
        <Text fontSize="xs" textAlign="center" fontWeight="medium">
          {getValue()}
        </Text>
      )
    }),
    columnHelper.accessor('installedSiemsa', {
      header: 'INSTALLED (SIEMSA)',
      minSize: 80,
      maxSize: 200,
      size: 100,
      enableResizing: true,
      cell: ({ getValue }) => (
        <Text fontSize="xs" textAlign="center">
          {getValue()}
        </Text>
      )
    }),
    columnHelper.accessor('installedTiegaTmi', {
      header: 'INSTALLED (TEIGA-TMI)',
      minSize: 90,
      maxSize: 220,
      size: 110,
      enableResizing: true,
      cell: ({ getValue }) => (
        <Text fontSize="xs" textAlign="center" fontWeight="medium">
          {getValue()}
        </Text>
      )
    }),
    columnHelper.accessor('totalInstalled', {
      header: 'TOTAL INSTALLED',
      minSize: 80,
      maxSize: 200,
      size: 100,
      enableResizing: true,
      cell: ({ getValue }) => (
        <Text fontSize="xs" textAlign="center" fontWeight="bold" color="green.600">
          {getValue()}
        </Text>
      )
    }),
    columnHelper.accessor('tracYesNot', {
      header: 'TRAC (YES & NOT)',
      minSize: 80,
      maxSize: 180,
      size: 90,
      enableResizing: true,
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
      minSize: 100,
      maxSize: 250,
      size: 120,
      enableResizing: true,
      cell: ({ getValue }) => (
        <Text fontSize="xs" fontFamily="mono" textAlign="center">
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
    enableColumnResizing: true,
    columnResizeMode: 'onChange',
    debugTable: false,
    defaultColumn: {
      minSize: 60,
      size: 100,
      maxSize: 400,
    },
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
        maxWidth="100%"
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
              const totalWidth = headerGroups[0].headers.slice(header.startCol, header.startCol + header.colspan)
                .reduce((sum, col) => sum + col.getSize(), 0);
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
                  color="white"
                  py={2}
                  px={1}
                  borderRight="1px solid"
                  borderColor="gray.300"
                  borderBottom="1px solid"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  bg={header.color}
                  minHeight="35px"
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
              const totalWidth = headerGroups[0].headers.slice(header.startCol, header.startCol + header.colspan)
                .reduce((sum, col) => sum + col.getSize(), 0);
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
                  color={header.color === 'transparent' ? 'transparent' : 'white'}
                  py={2}
                  px={1}
                  borderRight="1px solid"
                  borderColor="gray.200"
                  borderBottom="1px solid"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  bg={header.color}
                  minHeight="35px"
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
            {headerGroups[0].headers.map((header, index) => {
              const columnId = header.column.id;
              const bgColor = columnColors[columnId] || '#F7FAFC';
              
              return (
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
                  color="gray.700"
                  py={2}
                  px={1}
                  borderRight="1px solid"
                  borderColor="gray.100"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  cursor={header.column.getCanSort() ? 'pointer' : 'default'}
                  onClick={header.column.getToggleSortingHandler()}
                  _hover={header.column.getCanSort() ? { opacity: 0.8 } : {}}
                  minHeight="45px"
                  position="relative"
                  bg={bgColor}
                >
                  <HStack spacing={1}>
                    <Text fontSize="xs" noOfLines={3} textAlign="center">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </Text>
                    {header.column.getIsSorted() && (
                      <Text fontSize="xs">{header.column.getIsSorted() === 'desc' ? '↓' : '↑'}</Text>
                    )}
                  </HStack>
                  {header.column.getCanResize() && (
                    <Box
                      position="absolute"
                      right="0"
                      top="0"
                      height="100%"
                      width="4px"
                      cursor="col-resize"
                      bg="transparent"
                      _hover={{ bg: 'blue.200' }}
                      onMouseDown={header.getResizeHandler()}
                      onTouchStart={header.getResizeHandler()}
                    />
                  )}
                </Box>
              );
            })}
          </Box>
        </Box>

        {/* Virtualized Table Body */}
        <Box
          ref={parentRef}
          height="500px"
          overflowY="auto"
          overflowX="hidden"
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