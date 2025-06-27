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
  HStack,
  Button
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

const TextCell = ({ value, ...props }) => (
  <Text fontSize="sm" textAlign="center" {...props}>
    {value}
  </Text>
);

const ProgressCell = ({ value }) => {
  const progressValue = parseFloat(value.replace('%', '')) || 0;
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
        {value}
      </Text>
    </Box>
  );
};

const LazosTable = React.memo(({ data }) => {

  const processedData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    return data.map((row, index) => ({
      id: index,
      code: row.CODE || '',
      subsystem: row.SUBS_PRE || '',
      tagLoop: row['TAG LOOP'] || '',
      area: row.Area || '',
      priority: row.PRIORITY || '',
      service: row.SERVICE || '',
      installed: row.INSTALLED || '',
      wired: row.WIRED || '',
      connected: row.CONNECTED || '',
      cableTest: row['CABLE TEST'] || '',
      progress: row['OK=100%'] || '0.00%',
      dossier: row.DOSSIER || '',
      testLoop: row['TEST LOOP'] || ''
    }));
  }, [data]);

  const columns = useMemo(() => [
    columnHelper.accessor('code', {
      header: 'Code',
      minSize: 80,
      maxSize: 300,
      size: 100,
      enableResizing: true,
      cell: ({ getValue }) => (
        <Text fontSize="sm" fontWeight="medium" color="blue.600" textAlign="center">
          {getValue()}
        </Text>
      )
    }),
    columnHelper.accessor('subsystem', {
      header: 'Subsystem',
      minSize: 80,
      maxSize: 300,
      size: 120,
      enableResizing: true,
      cell: ({ getValue }) => (
        <Text fontSize="sm" fontWeight="medium" textAlign="center">
          {getValue()}
        </Text>
      )
    }),
    columnHelper.accessor('tagLoop', {
      header: 'Tag Loop',
      minSize: 100,
      maxSize: 400,
      size: 150,
      enableResizing: true,
      cell: ({ getValue }) => (
        <Text fontSize="sm" fontFamily="mono" textAlign="center">
          {getValue()}
        </Text>
      )
    }),
    columnHelper.accessor('area', {
      header: 'Area',
      minSize: 60,
      maxSize: 200,
      size: 80,
      enableResizing: true,
      cell: ({ getValue }) => (
        <Text fontSize="sm" fontWeight="medium" textAlign="center">
          {getValue()}
        </Text>
      )
    }),
    columnHelper.accessor('priority', {
      header: 'Priority',
      minSize: 60,
      maxSize: 200,
      size: 80,
      enableResizing: true,
      cell: ({ getValue }) => (
        <Text fontSize="sm" fontWeight="medium" textAlign="center">
          {getValue()}
        </Text>
      )
    }),
    columnHelper.accessor('service', {
      header: 'Service',
      minSize: 80,
      maxSize: 300,
      size: 120,
      enableResizing: true,
      cell: ({ getValue }) => (
        <Text fontSize="sm" textAlign="center" noOfLines={2}>
          {getValue()}
        </Text>
      )
    }),
    columnHelper.accessor('installed', {
      header: 'Installed',
      minSize: 60,
      maxSize: 200,
      size: 80,
      enableResizing: true,
      cell: ({ getValue }) => (
        <Text fontSize="sm" textAlign="center">
          {getValue()}
        </Text>
      )
    }),
    columnHelper.accessor('wired', {
      header: 'Wired',
      minSize: 60,
      maxSize: 200,
      size: 80,
      enableResizing: true,
      cell: ({ getValue }) => (
        <Text fontSize="sm" textAlign="center">
          {getValue()}
        </Text>
      )
    }),
    columnHelper.accessor('connected', {
      header: 'Connected',
      minSize: 60,
      maxSize: 200,
      size: 80,
      enableResizing: true,
      cell: ({ getValue }) => (
        <Text fontSize="sm" textAlign="center">
          {getValue()}
        </Text>
      )
    }),
    columnHelper.accessor('cableTest', {
      header: 'Cable Test',
      minSize: 60,
      maxSize: 200,
      size: 80,
      enableResizing: true,
      cell: ({ getValue }) => (
        <Text fontSize="sm" textAlign="center">
          {getValue()}
        </Text>
      )
    }),
    columnHelper.accessor('progress', {
      header: 'Progress',
      minSize: 80,
      maxSize: 200,
      size: 100,
      enableResizing: true,
      cell: ({ getValue }) => {
        const value = getValue();
        const progressValue = parseFloat(value.replace('%', '')) || 0;
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
              {value}
            </Text>
          </Box>
        );
      }
    }),
    columnHelper.accessor('dossier', {
      header: 'Dossier',
      minSize: 60,
      maxSize: 200,
      size: 80,
      enableResizing: true,
      cell: ({ getValue }) => (
        <Text fontSize="sm" textAlign="center" color="gray.600">
          {getValue()}
        </Text>
      )
    }),
    columnHelper.accessor('testLoop', {
      header: 'Test Loop',
      minSize: 80,
      maxSize: 400,
      size: 120,
      enableResizing: true,
      cell: ({ getValue }) => (
        <Text fontSize="sm" fontFamily="mono" textAlign="center" color="blue.500">
          {getValue()}
        </Text>
      )
    })
  ], []);

  const table = useReactTable({
    data: processedData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    enableColumnResizing: true,
    columnResizeMode: 'onChange',
    debugTable: false,
  });
  
  const { rows } = table.getRowModel();
  const parentRef = React.useRef();
  const headerRef = React.useRef();

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
    overscan: 10,
  });

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
        <HStack spacing={3}>
          <Badge colorScheme="blue" fontSize="sm" px={3} py={1}>
            {processedData.length} LOOPS
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
              position="relative"
            >
              <HStack spacing={1}>
                <Text>{flexRender(header.column.columnDef.header, header.getContext())}</Text>
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
          ))}
        </Box>

        <Box
          ref={parentRef}
          height="400px"
          overflow="auto"
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
                  display="flex"
                  borderBottom="1px solid"
                  borderColor="gray.100"
                  _hover={{ bg: 'gray.50' }}
                >
                  {row.getVisibleCells().map(cell => (
                    <Box
                      key={cell.id}
                      width={`${cell.column.getSize()}px`}
                      minWidth={`${cell.column.getSize()}px`}
                      maxWidth={`${cell.column.getSize()}px`}
                      py={2}
                      px={2}
                      borderRight="1px solid"
                      borderColor="gray.100"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </Box>
                  ))}
                </Box>
              );
            })}
          </Box>
        </Box>
      </Box>
    </Box>
  );
});

export default LazosTable;