import React, { useMemo } from 'react';
import { Box, Heading, Text, Progress } from '@chakra-ui/react';
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

const SummarySubsystemsTableB = ({ data, selectedSubsystem, onSubsystemSelect }) => {
  const columns = useMemo(() => [
    {
      accessorKey: 'subsystem',
      header: 'SUBSYSTEM',
      size: 140,
      cell: ({ getValue }) => (
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
      accessorKey: 'testPack',
      header: "TP's INCLUDE",
      size: 100,
      cell: ({ getValue }) => (
        <Text fontSize="xs" fontWeight="medium">{getValue()}</Text>
      )
    },
    {
      accessorKey: 'testPackProgress',
      header: 'PROGRESS TEST PACK',
      size: 140,
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
              colorScheme={progress === 100 ? "green" : progress > 50 ? "blue" : "red"}
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
      size: 100,
      cell: ({ getValue }) => (
        <Text fontSize="xs" fontWeight="medium">{getValue()}</Text>
      )
    },
    {
      accessorKey: 'priority',
      header: 'PRIORITY',
      size: 80,
      cell: ({ getValue }) => (
        <Text fontSize="xs" fontWeight="medium">{getValue()}</Text>
      )
    },
    {
      accessorKey: 'hito',
      header: 'HITO',
      size: 80,
      cell: ({ getValue }) => (
        <Text fontSize="xs" fontWeight="medium">{getValue()}</Text>
      )
    },
    {
      accessorKey: 'teigaReinstatement',
      header: 'TEIGA REINSTATEMENT',
      size: 120,
      cell: ({ getValue }) => (
        <Text fontSize="xs" fontWeight="medium">{getValue()}</Text>
      )
    },
    {
      accessorKey: 'teigaInsulation',
      header: 'TEIGA INSULATION',
      size: 120,
      cell: ({ getValue }) => (
        <Text fontSize="xs" fontWeight="medium">{getValue()}</Text>
      )
    },
    {
      accessorKey: 'siemsa',
      header: 'SIEMSA',
      size: 80,
      cell: ({ getValue }) => (
        <Text fontSize="xs" fontWeight="medium">{getValue()}</Text>
      )
    },
    {
      accessorKey: 'technip',
      header: 'TECHNIP',
      size: 80,
      cell: ({ getValue }) => (
        <Text fontSize="xs" fontWeight="medium">{getValue()}</Text>
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
        <Heading size="sm">Test Pack Details</Heading>
        <Text fontSize="xs" color="gray.600">
          {data?.length || 0} test pack entries • Click SUBSYSTEM to filter
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
          <Text fontSize="sm">No test pack data available</Text>
        </Box>
      )}
    </Box>
  );
};

export default SummarySubsystemsTableB;