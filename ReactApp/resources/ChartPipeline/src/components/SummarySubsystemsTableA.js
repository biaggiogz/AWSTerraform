import React, { useMemo } from 'react';
import { Box, Heading, Text, HStack } from '@chakra-ui/react';
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

const SummarySubsystemsTableA = ({ data, selectedSubsystem, onSubsystemSelect }) => {
  const columns = useMemo(() => [
    {
      accessorKey: 'serialNumber',
      header: 'S/N',
      size: 60,
      cell: ({ getValue }) => (
        <Text fontSize="xs" fontWeight="bold">{getValue()}</Text>
      )
    },
    {
      accessorKey: 'fluid',
      header: 'FLUID',
      size: 80,
      cell: ({ getValue }) => (
        <Text fontSize="xs" fontWeight="bold">{getValue()}</Text>
      )
    },
    {
      accessorKey: 'subsystem',
      header: 'SUBSYSTEM',
      size: 140,
      cell: ({ getValue, row }) => (
        <Text
          fontSize="xs"
          fontWeight="bold"
          cursor="pointer"
          color={selectedSubsystem === getValue() ? "blue.600" : "black"}
          bg={selectedSubsystem === getValue() ? "blue.50" : "transparent"}
          p={1}
          borderRadius="md"
          onClick={() => onSubsystemSelect(getValue())}
          _hover={{ bg: "gray.100" }}
          title={getValue()}
          isTruncated
        >
          {getValue()}
        </Text>
      )
    },
    {
      accessorKey: 'totalItems',
      header: 'TOTAL ITEMS',
      size: 90,
      cell: ({ getValue }) => (
        <Text fontSize="xs" fontWeight="semibold">{getValue()?.toLocaleString()}</Text>
      )
    },
    {
      accessorKey: 'doneItems',
      header: 'DONE ITEMS',
      size: 90,
      cell: ({ getValue }) => (
        <Text fontSize="xs" fontWeight="semibold">{getValue()?.toLocaleString()}</Text>
      )
    },
    {
      accessorKey: 'pendingItems',
      header: 'PENDING ITEMS',
      size: 100,
      cell: ({ getValue }) => (
        <Text fontSize="xs" fontWeight="semibold">{getValue()?.toLocaleString()}</Text>
      )
    },
    {
      accessorKey: 'description',
      header: 'DESCRIPTION',
      size: 140,
      cell: ({ getValue }) => (
        <Text fontSize="xs" title={getValue()} noOfLines={2} wordBreak="break-word">{getValue()}</Text>
      )
    },
    {
      accessorKey: 'numTestPacks',
      header: 'N°TP',
      size: 60,
      cell: ({ getValue }) => (
        <Text fontSize="xs" fontWeight="bold">{getValue()}</Text>
      )
    },
    {
      accessorKey: 'totalLoops',
      header: 'TOTAL LOOP',
      size: 90,
      cell: ({ getValue }) => (
        <Text fontSize="xs" fontWeight="semibold">{getValue()?.toLocaleString()}</Text>
      )
    },
    {
      accessorKey: 'doneLoops',
      header: 'LOOP DONE',
      size: 90,
      cell: ({ getValue }) => (
        <Text fontSize="xs" fontWeight="semibold">{getValue()?.toLocaleString()}</Text>
      )
    },
    {
      accessorKey: 'pendingLoops',
      header: 'LOOP PENDING',
      size: 100,
      cell: ({ getValue }) => (
        <Text fontSize="xs" fontWeight="semibold">{getValue()?.toLocaleString()}</Text>
      )
    }
  ], [selectedSubsystem, onSubsystemSelect]);

  // Define multi-level header structure
  const multiLevelHeaders = useMemo(() => {
    return [
      // Level 1 - Main categories
      {
        level: 1,
        headers: [
          { 
            id: 'subsystem_info', 
            title: 'SUBSYSTEM INFORMATION', 
            colspan: 3, 
            startCol: 0,
            color: '#0082A9'
          },
          { 
            id: 'items_progress', 
            title: 'ITEMS PROGRESS', 
            colspan: 3, 
            startCol: 3,
            color: '#E5D6AC'
          },
          { 
            id: 'description_testpacks', 
            title: 'DESCRIPTION & TEST PACKS', 
            colspan: 2, 
            startCol: 6,
            color: '#6FC1B2'
          },
          { 
            id: 'loop_testing', 
            title: 'LOOP TESTING PROGRESS', 
            colspan: 3, 
            startCol: 8,
            color: '#8AB3DB'
          }
        ]
      },
      // Level 2 - Sub categories
      {
        level: 2,
        headers: [
          { id: 'empty_1', title: '', colspan: 3, startCol: 0, color: 'transparent' },
          { 
            id: 'completion_status', 
            title: 'COMPLETION STATUS', 
            colspan: 3, 
            startCol: 3,
            color: '#CEC19B'
          },
          { id: 'empty_2', title: '', colspan: 2, startCol: 6, color: 'transparent' },
          { 
            id: 'loop_metrics', 
            title: 'LOOP METRICS', 
            colspan: 3, 
            startCol: 8,
            color: '#7CA2C5'
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
    <Box border="1px solid" borderColor="gray.200" borderRadius="md" bg="white">
      <Box p={3} borderBottom="1px solid" borderColor="gray.200" bg="gray.50">
        <Heading size="sm">Subsystem Overview</Heading>
        <Text fontSize="xs" color="gray.600">
          {data?.length || 0} subsystems • Click SUBSYSTEM to filter
        </Text>
      </Box>
      
      {/* Multi-Level Table Header */}
      <Box
        overflowX="hidden"
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
            const columnColors = {
              serialNumber: '#007598',
              fluid: '#007598', 
              subsystem: '#007598',
              totalItems: '#CEC19B',
              doneItems: '#CEC19B',
              pendingItems: '#CEC19B',
              description: '#63AEA1',
              numTestPacks: '#63AEA1',
              totalLoops: '#7CA2C5',
              doneLoops: '#7CA2C5',
              pendingLoops: '#7CA2C5'
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
      
      {/* Virtualized Body */}
      <List
        height={500}
        itemCount={rows.length}
        itemSize={40}
        itemData={{ rows, table }}
      >
        {VirtualizedRow}
      </List>
      
      {rows.length === 0 && (
        <Box p={4} textAlign="center" color="gray.500">
          <Text fontSize="sm">No subsystem data available</Text>
        </Box>
      )}
    </Box>
  );
};

export default SummarySubsystemsTableA;