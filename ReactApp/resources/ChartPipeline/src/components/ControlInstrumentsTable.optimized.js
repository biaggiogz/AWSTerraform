import React, { useMemo, useState } from 'react';
import {
  Box,
  Text,
  Badge,
  Heading,
  HStack,
  Progress,
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverBody,
  PopoverTrigger,
  VStack,
  Button,
  IconButton,
  Portal
} from '@chakra-ui/react';
import { AttachmentIcon } from '@chakra-ui/icons';
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

// Isometric Cell Component
const IsometricCell = ({ isometric, onIsometricSelect, selectedIsometric }) => {
  if (!isometric || isometric === '') {
    return (
      <Box width="100%" height="100%" display="flex" alignItems="center" justifyContent="center">
        <Text fontSize="xs" color="gray.500">-</Text>
      </Box>
    );
  }
  
  return (
    <Box 
      width="100%" 
      height="100%" 
      display="flex" 
      alignItems="center" 
      justifyContent="center"
      border="1px solid"
      borderColor="gray.300"
      borderRadius="md"
      p={1}
    >
      <Button
        size="xs"
        variant={selectedIsometric === isometric ? "solid" : "outline"}
        onClick={() => onIsometricSelect && onIsometricSelect(isometric)}
        _hover={{ bg: selectedIsometric === isometric ? "green.200" : "blue.200" }}
        fontSize="10px"
        fontWeight="medium"
        color={selectedIsometric === isometric ? "white" : "blue.600"}
        bg={selectedIsometric === isometric ? "green.500" : "white"}
        borderColor={selectedIsometric === isometric ? "green.500" : "blue.500"}
        minWidth="30px"
        height="18px"
        px={2}
        borderRadius="sm"
      >
        {isometric}
      </Button>
    </Box>
  );
};

// Subsystem Cell Component
const SubsystemCell = ({ subsystem, onSubsystemSelect, selectedSubsystem }) => {
  if (!subsystem || subsystem === '') {
    return (
      <Box width="100%" height="100%" display="flex" alignItems="center" justifyContent="center">
        <Text fontSize="xs" color="gray.500">-</Text>
      </Box>
    );
  }
  
  return (
    <Box 
      width="100%" 
      height="100%" 
      display="flex" 
      alignItems="center" 
      justifyContent="center"
      border="1px solid"
      borderColor="gray.300"
      borderRadius="md"
      p={1}
    >
      <Button
        size="xs"
        variant={selectedSubsystem === subsystem ? "solid" : "outline"}
        onClick={() => onSubsystemSelect && onSubsystemSelect(subsystem)}
        _hover={{ bg: selectedSubsystem === subsystem ? "green.200" : "blue.200" }}
        fontSize="10px"
        fontWeight="medium"
        color={selectedSubsystem === subsystem ? "white" : "blue.600"}
        bg={selectedSubsystem === subsystem ? "green.500" : "white"}
        borderColor={selectedSubsystem === subsystem ? "green.500" : "blue.500"}
        minWidth="30px"
        height="18px"
        px={2}
        borderRadius="sm"
      >
        {subsystem}
      </Button>
    </Box>
  );
};

// Test Pack Cell Component
const TestPackCell = ({ testPacks, onTestPackSelect, selectedTestPack }) => {
  if (!testPacks || testPacks.length === 0) {
    return (
      <Box width="100%" height="100%" display="flex" alignItems="center" justifyContent="center">
        <Text fontSize="xs" color="gray.500">-</Text>
      </Box>
    );
  }
  
  if (testPacks.length === 1) {
    return (
      <Box 
        width="100%" 
        height="100%" 
        display="flex" 
        alignItems="center" 
        justifyContent="center"
        border="1px solid"
        borderColor="gray.300"
        borderRadius="md"
        p={1}
      >
        <Button
          size="xs"
          variant={selectedTestPack === testPacks[0] ? "solid" : "outline"}
          onClick={() => onTestPackSelect(testPacks[0])}
          _hover={{ bg: selectedTestPack === testPacks[0] ? "green.200" : "blue.200" }}
          fontSize="10px"
          fontWeight="medium"
          color={selectedTestPack === testPacks[0] ? "white" : "blue.600"}
          bg={selectedTestPack === testPacks[0] ? "green.500" : "white"}
          borderColor={selectedTestPack === testPacks[0] ? "green.500" : "blue.500"}
          minWidth="30px"
          height="18px"
          px={2}
          borderRadius="sm"
        >
          {testPacks[0]}
        </Button>
      </Box>
    );
  }
  
  return (
    <Box 
      width="100%" 
      height="100%" 
      display="flex" 
      alignItems="center" 
      justifyContent="center"
      border="1px solid"
      borderColor="gray.300"
      borderRadius="md"
      p={1}
    >
      <HStack spacing={1} wrap="wrap" justify="center">
        {testPacks.map((testPack, index) => (
          <Button
            key={`${testPack}-${index}`}
            size="xs"
            variant={selectedTestPack === testPack ? "solid" : "outline"}
            onClick={() => onTestPackSelect(testPack)}
            _hover={{ bg: selectedTestPack === testPack ? "green.200" : "blue.200" }}
            fontSize="10px"
            fontWeight="medium"
            color={selectedTestPack === testPack ? "white" : "blue.600"}
            bg={selectedTestPack === testPack ? "green.500" : "white"}
            borderColor={selectedTestPack === testPack ? "green.500" : "blue.500"}
            minWidth="30px"
            height="18px"
            px={2}
            borderRadius="sm"
          >
            {testPack}
          </Button>
        ))}
      </HStack>
    </Box>
  );
};

/**
 * ControlInstrumentsTable component - Virtualized table for control instruments data with multi-level headers
 * @param {Object} props - Component props
 * @param {Array} props.data - Filtered dataset from control_inst_by_isos.csv
 * @param {string} props.selectedIsometric - Currently selected isometric ID
 * @param {Function} props.onIsometricClick - Handler for isometric selection
 * @param {Set} props.highlightedRecords - Set of highlighted records
 */
const ControlInstrumentsTable = React.memo(({ 
  data, 
  selectedIsometric, 
  onIsometricClick, 
  highlightedRecords = new Set(),
  selectedTestPack,
  onTestPackClick,
  selectedSubsystem,
  onSubsystemClick
}) => {
  // Memoize processed data to avoid recalculations
  const processedData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    return data.map((row, index) => ({
      id: index,
      isometric: row.ISOMETRIC || '',
      weldingFwSw: parseFloat(row['TP 100% FW+SW']) || 0,
      subsystem: row.SUBSYSTEM || row.SUSSYTEM || '', // Use SUBSYSTEM field
      crono: parseInt(row.CRONO) || 0,
      priority: parseInt(row.PRIORITY) || 0,
      hito: row.HITO || '',
      reinstatement: row.REINSTATEMENT || '',
      insulation: row.INSULATION || '',
      siemsa: row.SIEMSA || '',
      technip: row.TECHNIP || '',
      testPack: row.TESTPACK || '',
      deliveryProgress: row['DELIVERY PROGRESS 100% BY TEN'] || row['DELIVERY PROGRESS BY TEN'] || '',
      readyToInstall: row['READY TO INSTALL INST (SIEMSA)'] || '',
      qtyInst: parseInt(row['QTY INST']) || 0,
      scopeTiegaTmi: parseInt(row['SCOPE BY TEIGA-TMI']) || 0,
      scopeSiemsa: parseInt(row['SCOPE BY SIEMSA']) || 0,
      installedSiemsa: row['INSTALLED (SIEMSA)'] || '',
      installedTiegaTmi: parseInt(row['INSTALLED (TEIGA-TMI)']) || 0,
      totalInstalled: parseInt(row['TOTAL INSTALLED']) || 0,
      tracYesNot: row['TRAC (YES & NOT)'] || '',
      tagCircuitoTraceado: row['Tag Circuito Traceado'] || ''
    }));
  }, [data]);

  // Split test pack function
  const splitTestPack = (testPackStr) => {
    if (!testPackStr || testPackStr === '' || testPackStr === '0') return [];
    return testPackStr.toString().split("|").map(v => v.trim()).filter(v => v !== '' && v !== '0');
  };

  // Group data by isometric to consolidate duplicate rows with different test packs
  const groupedData = useMemo(() => {
    const grouped = {};
    processedData.forEach(row => {
      const key = `${row.isometric}-${row.subsystem}-${row.crono}`;
      const testPacks = splitTestPack(row.testPack);
      if (!grouped[key]) {
        grouped[key] = { ...row, testPacks: testPacks };
      } else {
        // Merge test packs without duplicates
        const existingTestPacks = grouped[key].testPacks;
        testPacks.forEach(tp => {
          if (!existingTestPacks.includes(tp)) {
            existingTestPacks.push(tp);
          }
        });
      }
    });
    return Object.values(grouped);
  }, [processedData]);

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
            color: '#0082A9' // Base color
          },
          { 
            id: 'planning_delivery', 
            title: 'PLANNING DELIVERY TO ADISSEO', 
            colspan: 3, 
            startCol: 2,
            color: '#E5D6AC' // Base color
          },
          { 
            id: 'mc_realistic', 
            title: 'MECHANICAL COMPLETION (MC) REALISTIC DATE BY SUBSYSTEM', 
            colspan: 5, 
            startCol: 5,
            color: '#6FC1B2' // Base color
          },
          { 
            id: 'progress_iso_test', 
            title: 'PROGRESS ISO & TEST PACK', 
            colspan: 3, 
            startCol: 10,
            color: '#8AB3DB' // Base color
          },
          { 
            id: 'progress_inst_iso', 
            title: 'PROGRESS INST & ISO', 
            colspan: 6, 
            startCol: 13,
            color: '#C7E4F8' // Base color
          },
          { 
            id: 'tracing_insulation', 
            title: 'TRACING & INSULATION', 
            colspan: 2, 
            startCol: 19,
            color: '#F09071' // Base color
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
            color: '#69B8AA' // #6FC1B2 -5% dark
          },
          { 
            id: 'siemsa_sub', 
            title: 'SIEMSA', 
            colspan: 1, 
            startCol: 8,
            color: '#69B8AA' // #6FC1B2 -5% dark
          },
          { 
            id: 'technip_sub', 
            title: 'TECHNIP', 
            colspan: 1, 
            startCol: 9,
            color: '#69B8AA' // #6FC1B2 -5% dark
          },
          { id: 'empty_3', title: '', colspan: 3, startCol: 10, color: 'transparent' },
          { 
            id: 'instrument_distribution', 
            title: 'INSTRUMENT DISTRIBUTION', 
            colspan: 3, 
            startCol: 13,
            color: '#BDD9EC' // #C7E4F8 -5% dark
          },
          { 
            id: 'instrument_installed', 
            title: 'INSTRUMENT INSTALLED', 
            colspan: 3, 
            startCol: 16,
            color: '#BDD9EC' // #C7E4F8 -5% dark
          },
          { 
            id: 'siemsa_tracing', 
            title: 'SIEMSA', 
            colspan: 2, 
            startCol: 19,
            color: '#E6896B' // #F09071 -5% dark
          }
        ]
      }
    ];
  }, []);

  // Define column colors based on requirements
  const columnColors = useMemo(() => {
    return {
      isometric: '#007598', // #0082A9 -10% dark
      weldingFwSw: '#007598', // #0082A9 -10% dark
      subsystem: '#CEC19B', // #E5D6AC -10% dark
      crono: '#CEC19B', // #E5D6AC -10% dark
      priority: '#CEC19B', // #E5D6AC -10% dark
      hito: '#63AEA1', // #6FC1B2 -10% dark
      reinstatement: '#63AEA1', // #6FC1B2 -10% dark
      insulation: '#63AEA1', // #6FC1B2 -10% dark
      siemsa: '#63AEA1', // #6FC1B2 -10% dark
      technip: '#63AEA1', // #6FC1B2 -10% dark
      testPack: '#7CA2C5', // #8AB3DB -10% dark
      deliveryProgress: '#7CA2C5', // #8AB3DB -10% dark
      readyToInstall: '#7CA2C5', // #8AB3DB -10% dark
      qtyInst: '#B3CDDF', // #C7E4F8 -10% dark
      scopeTiegaTmi: '#B3CDDF', // #C7E4F8 -10% dark
      scopeSiemsa: '#B3CDDF', // #C7E4F8 -10% dark
      installedSiemsa: '#B3CDDF', // #C7E4F8 -10% dark
      installedTiegaTmi: '#B3CDDF', // #C7E4F8 -10% dark
      totalInstalled: '#B3CDDF', // #C7E4F8 -10% dark
      tracYesNot: '#D98265', // #F09071 -10% dark
      tagCircuitoTraceado: '#D98265' // #F09071 -10% dark
    };
  }, []);

  // Define table columns with optimized sizing for viewport fit
  const columns = useMemo(() => [
    columnHelper.accessor('isometric', {
      header: 'ISOMETRIC',
      minSize: 270,
      maxSize: 400,
      size: 180,
      enableResizing: true,
      cell: ({ getValue }) => (
        <IsometricCell 
          isometric={getValue()}
          onIsometricSelect={onIsometricClick}
          selectedIsometric={selectedIsometric}
        />
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
      minSize: 110,
      maxSize: 200,
      size: 90,
      enableResizing: true,
      cell: ({ getValue }) => (
        <SubsystemCell 
          subsystem={getValue()}
          onSubsystemSelect={onSubsystemClick}
          selectedSubsystem={selectedSubsystem}
        />
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
      minSize: 100,
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
      cell: ({ getValue, row }) => {
        const testPacks = row.original.testPacks || splitTestPack(getValue());
        
        return (
          <TestPackCell 
            testPacks={testPacks}
            onTestPackSelect={onTestPackClick}
            selectedTestPack={selectedTestPack}
          />
        );
      }
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
      header: 'SCOPE BY TEIGA-TMI',
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

  // Create table instance with memoization using grouped data
  const table = useReactTable({
    data: groupedData,
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
            {groupedData.length} ISOS
          </Badge>
          {selectedTestPack && (
            <Badge colorScheme="green" fontSize="sm" px={3} py={1}>
              Test Pack: {selectedTestPack}
            </Badge>
          )}
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
                  color="white"
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
                    bg={highlightedRecords.has(row.original) ? 'yellow.50' : 'transparent'}
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