import React, { useMemo } from 'react';
import { Box, Heading, Text } from '@chakra-ui/react';
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
              flex: cell.column.getSize(),
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
        <Text fontSize="xs" title={getValue()} isTruncated>{getValue()}</Text>
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

  const table = useReactTable({
    data: data || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const rows = table.getRowModel().rows;

  return (
    <Box border="1px solid" borderColor="gray.200" borderRadius="md" bg="white">
      <Box p={3} borderBottom="1px solid" borderColor="gray.200" bg="gray.50">
        <Heading size="sm">Subsystem Overview</Heading>
        <Text fontSize="xs" color="gray.600">
          {data?.length || 0} subsystems • Click SUBSYSTEM to filter
        </Text>
      </Box>
      
      {/* Header */}
      <div style={{ display: 'flex', borderBottom: '2px solid #e2e8f0', backgroundColor: '#f7fafc' }}>
        {table.getHeaderGroups()[0]?.headers.map(header => (
          <div
            key={header.id}
            style={{
              flex: header.getSize(),
              padding: '8px',
              borderRight: '1px solid #e2e8f0',
              fontWeight: 'bold',
              fontSize: '10px',
              textAlign: 'center'
            }}
          >
            {flexRender(header.column.columnDef.header, header.getContext())}
          </div>
        ))}
      </div>
      
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