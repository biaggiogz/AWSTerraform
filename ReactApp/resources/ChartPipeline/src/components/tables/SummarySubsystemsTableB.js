import React, { useMemo } from 'react';
import { Box, Heading, Text, Progress, HStack, Button } from '@chakra-ui/react';
import { useReactTable, getCoreRowModel, flexRender } from '@tanstack/react-table';
import { FixedSizeList as List } from 'react-window';

const VirtualizedRow = ({ index, style, data }) => {
  const { rows, table } = data;
  const row = rows[index];
  
  return (
    <div style={style}>
      <div className="table-row" style={{ display: 'flex', borderBottom: '1px solid #e2e8f0' }}>
        {row.getVisibleCells().map(cell => (
          <div
            key={cell.id}
            className="table-cell"
            style={{
              width: `${cell.column.getSize()}px`,
              minWidth: `${cell.column.getSize()}px`,
              maxWidth: `${cell.column.getSize()}px`,
              padding: '8px',
              borderRight: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px'
            }}
          >
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </div>
        ))}
      </div>
    </div>
  );
};

const SummarySubsystemsTableB = ({ data, selectedSubsystem, onSubsystemSelect, isProgressFilterVisible, isHitoFilterVisible }) => {
  // Force re-render when hito filter selection changes
  const [, setForceUpdate] = React.useState(0);
  
  React.useEffect(() => {
    // Initialize global state if needed
    if (!window.hitoFilterState) {
      window.hitoFilterState = { selectedHitos: {}, colors: {} };
    }
    
    // Set up a timer to check for changes in the global hitoFilterState
    const intervalId = setInterval(() => {
      setForceUpdate(prev => prev + 1); // Force re-render periodically when filter is visible
    }, 500); // Check every 500ms
    
    return () => clearInterval(intervalId);
  }, [isHitoFilterVisible]);
  const columns = useMemo(() => [
    {
      accessorKey: 'subsystem',
      header: 'SUBSYSTEM',
      size: 104,
      cell: ({ getValue }) => (
        <Button
          size="xs"
          variant={selectedSubsystem === getValue() ? "solid" : "outline"}
          onClick={() => onSubsystemSelect(getValue())}
          _hover={{ bg: selectedSubsystem === getValue() ? "#007598" : "blue.200" }}
          fontSize="10px"
          fontWeight="medium"
          color={selectedSubsystem === getValue() ? "white" : "blue.600"}
          bg={selectedSubsystem === getValue() ? "#007598" : "white"}
          borderColor={selectedSubsystem === getValue() ? "#007598" : "blue.500"}
          minWidth="30px"
          height="18px"
          px={2}
          borderRadius="sm"
          title={getValue()}
          isTruncated
        >
          {getValue()}
        </Button>
      )
    },
    {
      accessorKey: 'testPack',
      header: "TP's INCLUDE",
      size: 60,
      cell: ({ getValue, row }) => {
        const getTestPackColor = () => {
          if (!isProgressFilterVisible) return { bg: 'transparent', color: 'inherit' };
          
          const progress = row.original.testPackProgress || 0;
          let bgColor = 'transparent';
          
          if (progress === 100) bgColor = '#437057';
          else if (progress > 90) bgColor = '#97B067';
          else if (progress >= 70) bgColor = '#FFBF78';
          else bgColor = '#E86A33';
          
          return { bg: bgColor, color: 'white' };
        };
        
        const colors = getTestPackColor();
        
        return (
          <Text 
            fontSize="xs" 
            fontWeight="bold"
            bg={colors.bg}
            color={colors.color}
            px={colors.bg !== 'transparent' ? 2 : 0}
            py={colors.bg !== 'transparent' ? 1 : 0}
            borderRadius={colors.bg !== 'transparent' ? 'sm' : 0}
          >
            {getValue()}
          </Text>
        );
      }
    },
    {
      accessorKey: 'testPackProgress',
      header: 'PROGRESS TEST PACK',
      size: 110,
      cell: ({ getValue }) => {
        const progress = Math.round(getValue() || 0);
        return (
          <Box position="relative" width="100px">
            <Progress
              value={progress}
              size="md"
              width="100px"
              borderRadius="md"
              backgroundColor="#0E2148"
              colorScheme="green"
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
              {progress}%
            </Text>
          </Box>
        );
      }
    },
    {
      accessorKey: 'traceados',
      header: 'TRACEADOS',
      size: 94,
      cell: ({ getValue }) => (
        <Text fontSize="xs" fontWeight="bold">{getValue()}</Text>
      )
    },
    {
      accessorKey: 'priority',
      header: 'PRIORITY',
      size: 72,
      cell: ({ getValue }) => (
        <Text fontSize="xs" fontWeight="bold">{getValue()}</Text>
      )
    },
    {
      accessorKey: 'hito',
      header: 'HITO',
      size: 60,
      cell: ({ getValue, row }) => {
        const getHitoColor = () => {
          if (!isHitoFilterVisible) return { bg: 'transparent', color: 'inherit' };
          
          const hito = getValue() || '';
          if (!hito) return { bg: 'transparent', color: 'inherit' };
          
          // Check if any hitos are selected in the filter
          const hasSelections = window.hitoFilterState && 
                              window.hitoFilterState.selectedHitos && 
                              Object.values(window.hitoFilterState.selectedHitos).some(v => v === true);
          
          // Check if this specific hito is selected in the filter
          const isSelected = window.hitoFilterState && 
                           window.hitoFilterState.selectedHitos && 
                           window.hitoFilterState.selectedHitos[hito];
          
          // If we have selections but this one isn't selected, show with reduced opacity
          if (hasSelections && !isSelected) {
            return { bg: 'transparent', color: 'gray.400' };
          }
          
          // Get the color from the global state if available
          if (window.hitoFilterState && 
              window.hitoFilterState.colors && 
              window.hitoFilterState.colors[hito]) {
            return { bg: window.hitoFilterState.colors[hito], color: 'white' };
          }
          
          // Fallback: Generate color if not in global state
          const hash = hito.split('').reduce((acc, char) => {
            return char.charCodeAt(0) + ((acc << 5) - acc);
          }, 0);
          
          const h = Math.abs(hash) % 360;
          const s = 60 + (Math.abs(hash) % 30); // 60-90%
          const l = 35 + (Math.abs(hash) % 15); // 35-50%
          
          const color = `hsl(${h}, ${s}%, ${l}%)`;
          
          // Store for future use
          if (!window.hitoFilterState) window.hitoFilterState = { colors: {} };
          if (!window.hitoFilterState.colors) window.hitoFilterState.colors = {};
          window.hitoFilterState.colors[hito] = color;
          
          return { bg: color, color: 'white' };
        };
        
        const colors = getHitoColor();
        
        return (
          <Text 
            fontSize="xs" 
            fontWeight="bold"
            bg={colors.bg}
            color={colors.color}
            px={colors.bg !== 'transparent' ? 2 : 0}
            py={colors.bg !== 'transparent' ? 1 : 0}
            borderRadius={colors.bg !== 'transparent' ? 'sm' : 0}
          >
            {getValue()}
          </Text>
        );
      }
    },
    {
      accessorKey: 'teigaReinstatement',
      header: 'TEIGA REINSTATEMENT',
      size: 120,
      cell: ({ getValue }) => (
        <Text fontSize="xs" fontWeight="bold">{getValue()}</Text>
      )
    },
    {
      accessorKey: 'teigaInsulation',
      header: 'TEIGA INSULATION',
      size: 88,
      cell: ({ getValue }) => (
        <Text fontSize="xs" fontWeight="bold">{getValue()}</Text>
      )
    },
    {
      accessorKey: 'siemsa',
      header: 'SIEMSA',
      size: 64,
      cell: ({ getValue }) => (
        <Text fontSize="xs" fontWeight="bold">{getValue()}</Text>
      )
    },
    {
      accessorKey: 'technip',
      header: 'TECHNIP',
      size: 64,
      cell: ({ getValue }) => (
        <Text fontSize="xs" fontWeight="bold">{getValue()}</Text>
      )
    }
  ], [selectedSubsystem, onSubsystemSelect, isProgressFilterVisible, isHitoFilterVisible]);

  // Define multi-level header structure
  const multiLevelHeaders = useMemo(() => {
    return [
      // Level 1 - Main categories
      {
        level: 1,
        headers: [
          { 
            id: 'subsystem_testpack', 
            title: 'SUBSYSTEM & TEST PACK', 
            colspan: 3, 
            startCol: 0,
            color: '#0082A9'
          },
          { 
            id: 'execution_planning', 
            title: 'EXECUTION PLANNING', 
            colspan: 3, 
            startCol: 3,
            color: '#E5D6AC'
          },
          { 
            id: 'contractor_management', 
            title: 'CONTRACTOR MANAGEMENT', 
            colspan: 4, 
            startCol: 6,
            color: '#6FC1B2'
          }
        ]
      },
      // Level 2 - Sub categories
      {
        level: 2,
        headers: [
          { id: 'empty_1', title: '', colspan: 3, startCol: 0, color: 'transparent' },
          { 
            id: 'priority_scheduling', 
            title: 'PRIORITY & SCHEDULING', 
            colspan: 3, 
            startCol: 3,
            color: '#CEC19B'
          },
          { 
            id: 'teiga_management', 
            title: 'TEIGA', 
            colspan: 2, 
            startCol: 6,
            color: '#69B8AA'
          },
          { 
            id: 'other_contractors', 
            title: 'OTHER CONTRACTORS', 
            colspan: 2, 
            startCol: 8,
            color: '#69B8AA'
          }
        ]
      }
    ];
  }, []);

  const table = useReactTable({
    data: data || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    enableColumnResizing: true,
    columnResizeMode: 'onChange',
    debugTable: false,
    defaultColumn: {
      minSize: 60,
      size: 100,
      maxSize: 400,
    },
  });

  const rows = table.getRowModel().rows;
  const headerGroups = useMemo(() => table.getHeaderGroups(), [table]);

  return (
    <Box border="1px solid" borderColor="gray.200" borderRadius="md" bg="white" height="100%" display="flex" flexDirection="column">

      {/* Scrollable Container */}
      <Box flex={1} overflowX="auto" overflowY="hidden">
        {/* Multi-Level Table Header */}
        <Box
          borderBottom="1px solid"
          borderColor="gray.200"
          bg="gray.50"
          position="sticky"
          top={0}
          zIndex={1}
        >
          {/* Level 1 Headers */}
          <Box display="flex" width={`${headerGroups[0].headers.reduce((sum, col) => sum + col.getSize(), 0)}px`} minWidth="fit-content">
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
          <Box display="flex" width={`${headerGroups[0].headers.reduce((sum, col) => sum + col.getSize(), 0)}px`} minWidth="fit-content">
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
          <Box display="flex" width={`${headerGroups[0].headers.reduce((sum, col) => sum + col.getSize(), 0)}px`} minWidth="fit-content">
          {headerGroups[0].headers.map((header, index) => {
            const columnColors = {
              subsystem: '#007598',
              testPack: '#007598',
              testPackProgress: '#007598',
              traceados: '#CEC19B',
              priority: '#CEC19B',
              hito: '#CEC19B',
              teigaReinstatement: '#63AEA1',
              teigaInsulation: '#63AEA1',
              siemsa: '#63AEA1',
              technip: '#63AEA1'
            };
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
        
        {/* Table Body - Virtualized */}
        <Box width={`${headerGroups[0].headers.reduce((sum, col) => sum + col.getSize(), 0)}px`} minWidth="fit-content" flex={1}>
          <List
            height={600}
            itemCount={rows.length}
            itemSize={40}
            itemData={{ rows, table }}
            width={headerGroups[0].headers.reduce((sum, col) => sum + col.getSize(), 0)}
            style={{ overflowX: 'hidden', overflowY: 'auto' }}
          >
            {VirtualizedRow}
          </List>
        </Box>
      </Box>
      
      {rows.length === 0 && (
        <Box p={4} textAlign="center" color="gray.500">
          <Text fontSize="sm">No test pack data available</Text>
        </Box>
      )}
    </Box>
  );
};

export default SummarySubsystemsTableB;