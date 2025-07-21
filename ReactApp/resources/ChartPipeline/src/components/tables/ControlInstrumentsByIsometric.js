import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import {
  Box,
  Text,
  Badge,
  Heading,
  HStack,
  VStack,
  Spinner,
  Center,
  Stack,
  Tooltip,
  IconButton,
} from '@chakra-ui/react';
import { InfoIcon } from '@chakra-ui/icons';
import { measurePerformance } from '../../utils/tablePerformance';
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

const ControlInstrumentsByIsometric = ({ 
  selectedIsometric, 
  onIsometricClick, 
  selectedSubsystem, 
  onSubsystemClick 
}) => {
  const {
    executeQuery,
    loading: dbLoading,
    error: dbError,
  } = useDuckDB();

  // State declarations
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sorting, setSorting] = useState([]);
  
  // Performance metrics
  const [loadTime, setLoadTime] = useState(null);
  const [renderTime, setRenderTime] = useState(null);
  const [queryTime, setQueryTime] = useState(null);
  const tableContainerRef = useRef(null);
  
  // Load data using DuckDB
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
          
          // Load secondary source from tp.parquet (won't be rendered as table)
          try {
            console.log('Fetching secondary TP Parquet file...');
            const tpRes = await fetch('/data/tp.parquet');
            
            if (tpRes.ok) {
              console.log('Reading TP Parquet buffer...');
              const tpParquetBuffer = await tpRes.arrayBuffer();
              console.log('TP Parquet buffer received:', { byteLength: tpParquetBuffer.byteLength });
              
              await createTableFromParquet('tp_data', tpParquetBuffer);
              console.log('Secondary TP data source loaded successfully');
            } else {
              console.warn(`Secondary TP Parquet file not available: ${tpRes.status}`);
            }
          } catch (tpError) {
            console.warn('Error loading secondary TP data source:', tpError);
            // Continue execution even if secondary source fails to load
          }
        } catch (parquetError) {
          console.log('Falling back to CSV:', parquetError);
          
          // Fall back to CSV
          const res = await fetch('/data/master_subsystem.csv');
          if (!res.ok) throw new Error(`Failed to fetch CSV: ${res.status}`);
          
          const csvText = await res.text();
          await createTableFromCSV('master_subsystem', csvText, { header: true, delimiter: ','});
        }

        // Execute the SQL query
        const startQueryTime = performance.now();
        const result = await executeQuery(`
          WITH inst_data AS (
            SELECT 
              mounting_on_isoequipack_isoinst AS isometric,
              MAX(subsystem) AS subsystem,
              MAX(tp_include_isoinst) AS tps,
              COUNT(tag_inst_isoinst) AS qty_inst,
              COUNT(scope__by_isoinst) FILTER(WHERE scope__by_isoinst = 'TEIGA-TMI') AS scope_teiga_tmi,
              COUNT(scope__by_isoinst) FILTER(WHERE scope__by_isoinst = 'SIEMSA') AS scope_siemsa,
              COUNT(scope__by_isoinst) FILTER(WHERE scope__by_isoinst = 'TEIGA-TMI' AND ok100_isoinst = 1) AS installed_teiga_tmi,
              COUNT(scope__by_isoinst) FILTER(WHERE scope__by_isoinst = 'SIEMSA' AND ok100_isoinst = 1) AS installed_siemsa
            FROM master_subsystem
            WHERE on_isoinst = 'PIP'
            GROUP BY mounting_on_isoequipack_isoinst
          ),
          progress_data AS (
            SELECT 
              isometricos_ifc3_isos AS isometric,
              isometric__progress__isos AS isometric_progress,
              hito_isos AS hito,
              teiga_reinstatement_isos AS teiga_reinstatement,
              teiga_insulation_isos AS teiga_insulation,
              siemsa_isos AS siemsa
            FROM master_subsystem
            WHERE isometricos_ifc3_isos IS NOT NULL
          )
          SELECT 
            i.isometric AS "ISOMETRIC",
            p.isometric_progress AS "ISOMETRIC PROGRESS",
            i.subsystem AS "SUBSYSTEM",
            p.hito AS "HITO",
            p.teiga_reinstatement AS "TEIGA REINSTATEMENT",
            p.teiga_insulation AS "TEIGA INSULATION",
            p.siemsa AS "SIEMSA",
            i.tps AS "TPs",
            i.qty_inst AS "QTY INST",
            i.scope_teiga_tmi AS "SCOPE BY TEIGA-TMI",
            i.scope_siemsa AS "SCOPE BY SIEMSA",
            i.installed_teiga_tmi AS "INSTALLED BY TEIGA-TMI",
            i.installed_siemsa AS "INSTALLED BY SIEMSA"
          FROM inst_data i
          LEFT JOIN progress_data p
            ON i.isometric = p.isometric
        `);
        
        const queryEndTime = performance.now();
        setQueryTime((queryEndTime - startQueryTime).toFixed(2));
        
        setTableData(result);
        setError(null);
        
        const endTime = performance.now();
        setLoadTime((endTime - startLoadTime).toFixed(2));
      } catch (err) {
        console.error('Error loading data:', err);
        setError(err.message || String(err));
        setTableData([]);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [createTableFromCSV, createTableFromParquet, executeQuery, dbLoading, dbError]);
  
  // Define columns
  const columnHelper = createColumnHelper();
  
  const columns = useMemo(() => [
    columnHelper.accessor('ISOMETRIC', {
      header: 'ISOMETRIC',
      cell: info => {
        const value = info.getValue();
        const isSelected = selectedIsometric === value;
        
        return (
          <Box 
            cursor="pointer" 
            fontWeight={isSelected ? "bold" : "normal"}
            color={isSelected ? "blue.600" : "inherit"}
            bg={isSelected ? "blue.50" : "transparent"}
            p={1}
            borderRadius="md"
            onClick={() => onIsometricClick && onIsometricClick(value)}
            _hover={{ bg: "blue.50" }}
          >
            {value}
          </Box>
        );
      },
      size: 150,
    }),
    columnHelper.accessor('ISOMETRIC PROGRESS', {
      header: 'ISOMETRIC PROGRESS',
      cell: info => {
        const value = info.getValue();
        const percentage = value ? Math.round(value * 100) : 0;
        
        return (
          <Box width="100%" position="relative" height="20px">
            <Box 
              height="100%" 
              width={`${percentage}%`} 
              bg="blue.500" 
              borderRadius="sm"
            />
            <Text 
              position="absolute" 
              top="0" 
              left="0" 
              right="0" 
              height="100%"
              display="flex"
              alignItems="center"
              justifyContent="center"
              color="white"
              fontWeight="bold"
              fontSize="xs"
              textShadow="0px 0px 2px rgba(0,0,0,0.7)"
            >
              {percentage}%
            </Text>
          </Box>
        );
      },
      size: 150,
    }),
    columnHelper.accessor('SUBSYSTEM', {
      header: 'SUBSYSTEM',
      cell: info => {
        const value = info.getValue();
        const isSelected = selectedSubsystem === value;
        
        if (!value) return <Text fontSize="xs" color="gray.500">-</Text>;
        
        return (
          <Box 
            cursor="pointer" 
            fontWeight={isSelected ? "bold" : "normal"}
            color={isSelected ? "orange.600" : "inherit"}
            bg={isSelected ? "orange.50" : "transparent"}
            p={1}
            borderRadius="md"
            onClick={() => onSubsystemClick && onSubsystemClick(value)}
            _hover={{ bg: "orange.50" }}
          >
            {value}
          </Box>
        );
      },
      size: 120,
    }),
    columnHelper.accessor('HITO', {
      header: 'HITO',
      cell: info => info.getValue() || '-',
      size: 100,
    }),
    columnHelper.accessor('TEIGA REINSTATEMENT', {
      header: 'TEIGA REINSTATEMENT',
      cell: info => info.getValue() || '-',
      size: 150,
    }),
    columnHelper.accessor('TEIGA INSULATION', {
      header: 'TEIGA INSULATION',
      cell: info => info.getValue() || '-',
      size: 150,
    }),
    columnHelper.accessor('SIEMSA', {
      header: 'SIEMSA',
      cell: info => info.getValue() || '-',
      size: 100,
    }),
    columnHelper.accessor('TPs', {
      header: 'TPs',
      cell: info => info.getValue() || '-',
      size: 80,
    }),
    columnHelper.accessor('QTY INST', {
      header: 'QTY INST',
      cell: info => info.getValue() || '0',
      size: 100,
    }),
    columnHelper.accessor('SCOPE BY TEIGA-TMI', {
      header: 'SCOPE BY TEIGA-TMI',
      cell: info => info.getValue() || '0',
      size: 150,
    }),
    columnHelper.accessor('SCOPE BY SIEMSA', {
      header: 'SCOPE BY SIEMSA',
      cell: info => info.getValue() || '0',
      size: 150,
    }),
    columnHelper.accessor('INSTALLED BY TEIGA-TMI', {
      header: 'INSTALLED BY TEIGA-TMI',
      cell: info => info.getValue() || '0',
      size: 150,
    }),
    columnHelper.accessor('INSTALLED BY SIEMSA', {
      header: 'INSTALLED BY SIEMSA',
      cell: info => info.getValue() || '0',
      size: 150,
    }),
  ], [columnHelper, selectedIsometric, onIsometricClick, selectedSubsystem, onSubsystemClick]);
  
  // Initialize table
  const table = useReactTable({
    data: tableData,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });
  
  // Set up virtualization
  const { rows } = table.getRowModel();
  
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: useCallback(() => 35, []),
    overscan: 10,
  });
  
  // Measure render time
  useEffect(() => {
    if (tableData.length > 0) {
      const { duration } = measurePerformance(() => {
        rowVirtualizer.getVirtualItems();
      });
      setRenderTime(duration.toFixed(2));
    }
  }, [tableData, rowVirtualizer]);
  
  // Loading state
  if (loading || dbLoading) {
    return (
      <Center height="300px">
        <VStack>
          <Spinner size="xl" color="blue.500" />
          <Text mt={4}>Loading Control Instruments by Isometric...</Text>
        </VStack>
      </Center>
    );
  }
  
  // Error state
  if (error || dbError) {
    return (
      <Center height="300px">
        <VStack>
          <InfoIcon boxSize={10} color="red.500" />
          <Text mt={4} color="red.500">Error: {error || dbError}</Text>
        </VStack>
      </Center>
    );
  }
  
  // Empty state
  if (tableData.length === 0) {
    return (
      <Center height="300px">
        <VStack>
          <InfoIcon boxSize={10} color="gray.500" />
          <Text mt={4}>No data available</Text>
        </VStack>
      </Center>
    );
  }
  
  const paddingTop = rowVirtualizer.getVirtualItems().length > 0 ? rowVirtualizer.getVirtualItems()[0].start || 0 : 0;
  const paddingBottom = rowVirtualizer.getVirtualItems().length > 0 
    ? rowVirtualizer.getTotalSize() - (rowVirtualizer.getVirtualItems()[rowVirtualizer.getVirtualItems().length - 1].end || 0) 
    : 0;
  
  return (
    <Box>
      <HStack spacing={2} mb={2} justifyContent="space-between">
        <Heading size="md">Control Instruments by Isometric</Heading>
        <HStack>
          <PerformanceMetric 
            label="Load" 
            value={`${loadTime}ms`} 
            description="Time taken to load and process data" 
          />
          <PerformanceMetric 
            label="Query" 
            value={`${queryTime}ms`} 
            description="Time taken to execute SQL query" 
          />
          <PerformanceMetric 
            label="Render" 
            value={`${renderTime}ms`} 
            description="Time taken to render table" 
          />
          <Badge colorScheme="green">{tableData.length} rows</Badge>
        </HStack>
      </HStack>
      
      <Box
        border="1px"
        borderColor="gray.200"
        borderRadius="md"
        overflow="auto"
        height="500px"
        ref={tableContainerRef}
      >
        <Box width="100%" position="relative">
          <Box
            display="grid"
            gridTemplateColumns={table.getAllColumns().map(column => `${column.getSize()}px`).join(' ')}
            position="sticky"
            top="0"
            bg="gray.100"
            zIndex="1"
            borderBottom="1px"
            borderColor="gray.200"
          >
            {table.getHeaderGroups().map(headerGroup => (
              headerGroup.headers.map(header => (
                <Box
                  key={header.id}
                  px={2}
                  py={2}
                  fontWeight="bold"
                  borderRight="1px"
                  borderColor="gray.200"
                  _hover={{ bg: "gray.200" }}
                  cursor={header.column.getCanSort() ? "pointer" : "default"}
                  onClick={header.column.getToggleSortingHandler()}
                >
                  <HStack spacing={1}>
                    <Text fontSize="sm">{flexRender(header.column.columnDef.header, header.getContext())}</Text>
                    {{
                      asc: ' 🔼',
                      desc: ' 🔽',
                    }[header.column.getIsSorted()] || null}
                  </HStack>
                </Box>
              ))
            ))}
          </Box>
          
          <Box position="relative" width="100%">
            {paddingTop > 0 && (
              <Box height={`${paddingTop}px`} />
            )}
            
            {rowVirtualizer.getVirtualItems().map(virtualRow => {
              const row = rows[virtualRow.index];
              
              return (
                <Box
                  key={row.id}
                  display="grid"
                  gridTemplateColumns={table.getAllColumns().map(column => `${column.getSize()}px`).join(' ')}
                  borderBottom="1px"
                  borderColor="gray.100"
                  _hover={{ bg: "gray.50" }}
                >
                  {row.getVisibleCells().map(cell => (
                    <Box
                      key={cell.id}
                      px={2}
                      py={2}
                      borderRight="1px"
                      borderColor="gray.100"
                      fontSize="sm"
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </Box>
                  ))}
                </Box>
              );
            })}
            
            {paddingBottom > 0 && (
              <Box height={`${paddingBottom}px`} />
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default ControlInstrumentsByIsometric;