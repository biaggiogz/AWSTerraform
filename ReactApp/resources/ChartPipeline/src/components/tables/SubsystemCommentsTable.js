import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import {
  Box,
  Text,
  Badge,
  Heading,
  HStack,
  Spinner,
  Center,
  Stack,
  Tooltip,
  IconButton,
} from '@chakra-ui/react';
import { InfoIcon } from '@chakra-ui/icons';
import { measurePerformance, analyzeTablePerformance, monitorTablePerformance } from '../../utils/tablePerformance';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import useDuckDB from '../../hooks/useDuckDB3';

// Performance measurement component
const PerformanceMetric = ({ label, value, description }) => (
  <Tooltip label={description} placement="top">
    <Badge colorScheme="blue" fontSize="xs" px={2} py={1} mr={2} cursor="help">
      {label}: {value}
    </Badge>
  </Tooltip>
);

const SubsystemCommentsTable = () => {
  const {
    createTableFromCSV,
    createTableFromParquet,
    executeQuery,
    loading: dbLoading,
    error: dbError,
  } = useDuckDB();

  // State declarations
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Performance metrics
  const [loadTime, setLoadTime] = useState(null);
  const [renderTime, setRenderTime] = useState(null);
  const [queryTime, setQueryTime] = useState(null);
  const [fps, setFps] = useState(null);
  const [memoryUsage, setMemoryUsage] = useState(null);
  const tableContainerRef = useRef(null);
  
  // Performance monitoring
  useEffect(() => {
    // Only start monitoring when data is loaded
    if (tableData.length === 0) return;
    
    const stopMonitoring = monitorTablePerformance(metrics => {
      setFps(metrics.fps);
      if (metrics.memoryUsage) {
        setMemoryUsage(metrics.memoryUsage);
      }
    });
    
    return () => stopMonitoring();
  }, [tableData]);
  
  // Define columns using TanStack's column helper
  const columnHelper = createColumnHelper();
  
  const columns = useMemo(() => [
    columnHelper.accessor('ITEM', {
      header: 'ITEM',
      cell: info => <Text fontSize="xs" fontFamily="mono">{String(info.getValue())}</Text>,
      size: 120,
    }),
    columnHelper.accessor('SUBSYSTEM', {
      header: 'SUBSYSTEM',
      cell: info => <Badge colorScheme="orange" fontSize="xs">{info.getValue()}</Badge>,
      size: 150,
    }),
    columnHelper.accessor('INSTRUMENT TYPE', {
      header: 'INSTRUMENT TYPE',
      cell: info => <Text fontSize="xs">{info.getValue()}</Text>,
      size: 150,
    }),
    columnHelper.accessor('TAG INST', {
      header: 'TAG INST',
      cell: info => <Text fontSize="xs">{info.getValue()}</Text>,
      size: 120,
    }),
  ], []);

  // Create table instance
  const table = useReactTable({
    data: tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });
  
  // Set up virtualization
  const { rows } = table.getRowModel();
  
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 35, // approximate row height
    overscan: 20, // Show more rows to prevent blank spaces during fast scrolling
    measureElement: typeof window !== 'undefined' && document.getElementById ? 
      (element) => element?.getBoundingClientRect().height || 35 : 
      undefined,
  });
  


  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Only proceed if not loading and no error
        if (dbLoading || dbError) {
          return;
        }

        // Start measuring load time
        const startLoadTime = performance.now();

        // Try to fetch Parquet file first, fall back to CSV if not available
        try {
          console.log('Fetching Parquet file...');
          const res = await fetch('/data/master_subsystem.parquet');
          
          if (!res.ok) throw new Error(`Failed to fetch Parquet: ${res.status}`);
          
          console.log('Reading Parquet buffer...');
          const parquetBuffer = await res.arrayBuffer();
          console.log('Parquet buffer received:', { byteLength: parquetBuffer.byteLength });
          
          await createTableFromParquet('master_subsystem', parquetBuffer);
        } catch (parquetError) {
          console.log('Falling back to CSV:', parquetError);
          
          // Fall back to CSV
          const res = await fetch('/data/master_subsystem.csv');
          if (!res.ok) throw new Error(`Failed to fetch CSV: ${res.status}`);
          
          const csvText = await res.text();
          await createTableFromCSV('master_subsystem', csvText, { header: true, delimiter: ','});
        }

        // Execute optimized query with all needed columns
        // Use a more efficient query that limits the data returned
        const { result: results, executionTime } = await measurePerformance(() => executeQuery(`
          SELECT
            item_isoinst AS "ITEM",
            subsystem AS "SUBSYSTEM",
            instrument_type_isoinst AS "INSTRUMENT TYPE",
            tag_inst_isoinst AS "TAG INST"
          FROM master_subsystem
          WHERE item_isoinst IS NOT NULL
          LIMIT 2000
        `));
        
        setQueryTime(executionTime.toFixed(2));
        console.log(`Query execution time: ${executionTime.toFixed(2)}ms`);

        // Measure render preparation time
        const startRenderTime = performance.now();
        setTableData(results);
        setError(null);
        
        // Calculate and set load time
        const endLoadTime = performance.now();
        setLoadTime((endLoadTime - startLoadTime).toFixed(2));
      } catch (err) {
        console.error('DuckDB error:', err);
        setError(err.message || 'Unknown error');
        setTableData([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [createTableFromCSV, createTableFromParquet, executeQuery, dbLoading, dbError]);
  
  // Measure render time after data is loaded
  useEffect(() => {
    if (tableData.length > 0) {
      const startRenderTime = performance.now();
      // This will run after the component has rendered with data
      const timeoutId = setTimeout(() => {
        const endRenderTime = performance.now();
        setRenderTime((endRenderTime - startRenderTime).toFixed(2));
      }, 0);
      return () => clearTimeout(timeoutId);
    }
  }, [tableData]);

  if (loading || dbLoading) {
    return (
        <Box mt={6}>
          <Heading size="md" color="gray.700" mb={4}>
            Subsystem Instruments
          </Heading>
          <Center p={8}>
            <Spinner size="xl" color="blue.500" />
            <Text ml={4} color="gray.600">
              Loading data with DuckDB...
            </Text>
          </Center>
        </Box>
    );
  }

  if (error || dbError) {
    return (
        <Box mt={6} p={4} bg="red.50" borderRadius="md">
          <Heading size="md" color="red.600" mb={2}>
            Error
          </Heading>
          <Text color="red.700">{error || dbError}</Text>
        </Box>
    );
  }

  return (
      <Box mt={6}>
        <HStack justify="space-between" align="center" mb={4}>
          <Heading size="md" color="gray.700">Subsystem Instruments</Heading>
          <HStack>
            {loadTime && <PerformanceMetric label="Load" value={`${loadTime}ms`} description="Time to load data from source and process it" />}
            {queryTime && <PerformanceMetric label="Query" value={`${queryTime}ms`} description="Time to execute DuckDB query" />}
            {renderTime && <PerformanceMetric label="Render" value={`${renderTime}ms`} description="Time to render table with data" />}
            {fps && <PerformanceMetric label="FPS" value={fps} description="Frames per second during scrolling" />}
            {memoryUsage && <PerformanceMetric label="Mem" value={`${memoryUsage.usedJSHeapSize}MB`} description={`Memory usage: ${memoryUsage.usedJSHeapSize}MB / ${memoryUsage.totalJSHeapSize}MB`} />}
            <Badge colorScheme="purple" fontSize="sm" px={3} py={1}>
              {table.getFilteredRowModel().rows.length} / {tableData.length} Records
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
            height="500px"
        >
          <Box ref={tableContainerRef} style={{ height: '100%', overflow: 'auto' }}>
            <Box
                style={{
                  display: 'grid',
                  gridTemplateColumns: table.getAllColumns().map(col => `${col.getSize() || 150}px`).join(' '),
                  position: 'relative',
                  width: 'fit-content',
                }}
            >
              {/* Header */}
              <Box style={{ display: 'contents' }}>
                {table.getHeaderGroups().map(headerGroup => (
                    <React.Fragment key={headerGroup.id}>
                      {headerGroup.headers.map(header => (
                          <Box
                              key={header.id}
                              bg="purple.600"
                              color="white"
                              p={2}
                              textAlign="center"
                              fontWeight="bold"
                              fontSize="sm"
                              borderRight="1px solid"
                              borderColor="purple.400"
                              style={{
                                position: 'sticky',
                                top: 0,
                                zIndex: 1,
                              }}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                          </Box>
                      ))}
                    </React.Fragment>
                ))}
              </Box>

              {/* Virtualized Rows */}
              <Box
                  style={{
                    height: `${rowVirtualizer.getTotalSize()}px`,
                    width: '100%',
                    position: 'relative',
                  }}
              >
                {rowVirtualizer.getVirtualItems().map(virtualRow => {
                  const row = rows[virtualRow.index];
                  return (
                      <Box
                          key={row.id}
                          data-index={virtualRow.index}
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: `${virtualRow.size}px`,
                            transform: `translateY(${virtualRow.start}px)`,
                            display: 'grid',
                            gridTemplateColumns: table.getAllColumns().map(col => `${col.getSize() || 150}px`).join(' '),
                          }}
                      >
                        {row.getVisibleCells().map(cell => (
                            <Box
                                key={cell.id}
                                p={2}
                                textAlign="center"
                                borderBottom="1px solid"
                                borderColor="gray.200"
                                _hover={{ bg: 'gray.50' }}
                                overflow="hidden"
                                textOverflow="ellipsis"
                                whiteSpace="nowrap"
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
      </Box>
  );

};

export default SubsystemCommentsTable;
