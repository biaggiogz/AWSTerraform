import React, { useEffect, useState, useMemo, useRef } from 'react';
import {
  Box,
  Text,
  Badge,
  Heading,
  HStack,
  Spinner,
  Center,
  Tooltip,
  Button,
} from '@chakra-ui/react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import useDuckDB from '../../hooks/useDuckDB3';
import { useInstrumentsTableFilterContext } from '../filters/InstrumentsTableFilter';

// Performance measurement component
const PerformanceMetric = React.memo(({ label, value, description }) => (
  <Tooltip label={description} placement="top">
    <Badge colorScheme="blue" fontSize="xs" px={2} py={1} mr={2} cursor="help">
      {label}: {value}
    </Badge>
  </Tooltip>
));

// Test Pack Progress Cell Component
const TestPackProgressCell = React.memo(({ testPacks, progressValues }) => {
  if (!testPacks || testPacks.length === 0) {
    return <Text fontSize="xs" color="gray.500">NOT APPLY</Text>;
  }
  
  // Get progress values for each test pack
  const progressData = testPacks.map((_, index) => {
    const progressKey = `progress_ac_tp_${index + 1}`;
    return progressValues && progressValues[progressKey] ? progressValues[progressKey] : 0;
  });
  
  if (testPacks.length === 1) {
    const progress = progressData[0];
    const percentage = Math.round(progress * 100);
    
    return (
      <Box position="relative" width="100%" height="18px">
        <Box 
          height="18px" 
          width={`${percentage}%`} 
          bg="green.500"
          borderRadius="sm"
        />
        <Text 
          fontSize="10px" 
          position="absolute" 
          top="0" 
          left="0" 
          right="0" 
          height="18px"
          display="flex"
          alignItems="center"
          justifyContent="center"
          color="white"
          fontWeight="bold"
          textShadow="0px 0px 2px rgba(0,0,0,0.7)"
        >
          {percentage}%
        </Text>
      </Box>
    );
  }
  
  return (
    <Box>
      {testPacks.map((testPack, index) => {
        const progress = progressData[index] || 0;
        const percentage = Math.round(progress * 100);
        
        return (
          <Box key={`${testPack}-progress-${index}`} position="relative" width="100%" height="18px" mb={1}>
            <Box 
              height="18px" 
              width={`${percentage}%`} 
              bg="green.500"
              borderRadius="sm"
            />
            <Text 
              fontSize="10px" 
              position="absolute" 
              top="0" 
              left="0" 
              right="0" 
              height="18px"
              display="flex"
              alignItems="center"
              justifyContent="center"
              color="white"
              fontWeight="bold"
              textShadow="0px 0px 2px rgba(0,0,0,0.7)"
            >
              {percentage}%
            </Text>
          </Box>
        );
      })}
    </Box>
  );
});

// Test Pack Cell Component
const TestPackCell = React.memo(({ testPacks, onTestPackSelect, selectedTestPack }) => {
  if (!testPacks || testPacks.length === 0) {
    return <Text fontSize="xs" color="gray.500">NOT APPLY</Text>;
  }
  
  if (testPacks.length === 1) {
    return (
      <Button
        size="xs"
        variant={selectedTestPack === testPacks[0] ? "solid" : "outline"}
        onClick={() => onTestPackSelect && onTestPackSelect(testPacks[0])}
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
    );
  }
  
  return (
    <HStack spacing={1} wrap="wrap" justify="center">
      {testPacks.map((testPack, index) => (
        <Button
          key={`${testPack}-${index}`}
          size="xs"
          variant={selectedTestPack === testPack ? "solid" : "outline"}
          onClick={() => onTestPackSelect && onTestPackSelect(testPack)}
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
  );
});

// Subsystem Cell Component
const SubsystemCell = React.memo(({ subsystem, onSubsystemSelect, selectedSubsystem }) => {
  if (!subsystem || subsystem === '') {
    return <Text fontSize="xs" color="gray.500">-</Text>;
  }
  
  return (
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
  );
});

const DetailsInstrumentsTable = () => {
  // Get filter context
  const {
    selectedIsometric,
    selectedTestPack,
    selectedSubsystem,
    onIsometricSelect,
    handleTestPackClick,
    handleSubsystemClick,
    getSqlWhereClause
  } = useInstrumentsTableFilterContext();
  
  const {
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
  const [queryTime, setQueryTime] = useState(null);
  const tableContainerRef = useRef(null);
  
  // Helper function to format timestamp to date
  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    // Convert timestamp to milliseconds if it's in seconds
    const ts = timestamp > 9999999999 ? timestamp : timestamp * 1000;
    try {
      return new Date(ts).toLocaleDateString();
    } catch (e) {
      return 'Invalid date';
    }
  };

  // Split test pack function
  const splitTestPack = (testPackStr) => {
    if (!testPackStr || testPackStr === '' || testPackStr === 'NOT_APPLY') return [];
    return testPackStr.toString().split("|").map(v => v.trim()).filter(v => v !== '');
  };
  
  // Define columns using TanStack's column helper
  const columnHelper = createColumnHelper();
  
  const columns = useMemo(() => [
    columnHelper.accessor('ITEM', {
      header: 'ITEM',
      cell: info => <Text fontSize="xs" fontFamily="mono">{String(info.getValue())}</Text>,
      size: 60,
    }),
    columnHelper.accessor('TAG INST', {
      header: 'TAG INST',
      cell: info => <Text fontSize="xs">{info.getValue()}</Text>,
      size: 90,
    }),
    columnHelper.accessor('P&ID', {
      header: 'P&ID',
      cell: info => <Text fontSize="xs" whiteSpace="normal" wordBreak="break-word">{info.getValue()}</Text>,
      size: 120,
    }),
    columnHelper.accessor('INSTRUMENT TYPE', {
      header: 'INSTRUMENT TYPE',
      cell: info => <Text fontSize="xs" whiteSpace="normal" wordBreak="break-word">{info.getValue()}</Text>,
      size: 120,
    }),
    columnHelper.accessor('SUBSYSTEM', {
      header: 'SUBSYSTEM',
      cell: info => (
        <SubsystemCell 
          subsystem={info.getValue()}
          onSubsystemSelect={handleSubsystemClick}
          selectedSubsystem={selectedSubsystem}
        />
      ),
      size: 95,
    }),
    columnHelper.accessor('TPs', {
      header: 'TPs',
      cell: info => {
        const testPackValue = info.getValue();
        const testPacks = splitTestPack(testPackValue);
        
        return (
          <TestPackCell 
            testPacks={testPacks}
            onTestPackSelect={handleTestPackClick}
            selectedTestPack={selectedTestPack}
          />
        );
      },
      size: 95,
    }),
    columnHelper.accessor('PROGRESS TP', {
      header: 'PROGRESS TP',
      cell: info => {
        const row = info.row.original;
        const testPackValue = row['TPs'];
        const testPacks = splitTestPack(testPackValue);
        
        // Get progress values from the row
        const progressValues = {
          progress_ac_tp_1: row.progress_ac_tp_1,
          progress_ac_tp_2: row.progress_ac_tp_2,
          progress_ac_tp_3: row.progress_ac_tp_3
        };
        
        return (
          <TestPackProgressCell 
            testPacks={testPacks}
            progressValues={progressValues}
          />
        );
      },
      size: 95,
    }),
    columnHelper.accessor('HITO', {
      header: 'HITO',
      cell: info => <Text fontSize="xs">{info.getValue()}</Text>,
      size: 95,
    }),
    columnHelper.accessor('TEIGA REINSTATEMENT', {
      header: 'TEIGA REINSTATEMENT',
      cell: info => <Text fontSize="xs">{formatDate(info.getValue())}</Text>,
      size: 95,
    }),
    columnHelper.accessor('TEIGA INSULATION', {
      header: 'TEIGA INSULATION',
      cell: info => <Text fontSize="xs">{formatDate(info.getValue())}</Text>,
      size: 95,
    }),
    columnHelper.accessor('SIEMSA', {
      header: 'SIEMSA',
      cell: info => <Text fontSize="xs">{formatDate(info.getValue())}</Text>,
      size: 90,
    }),
    columnHelper.accessor('TEN', {
      header: 'TEN',
      cell: info => <Text fontSize="xs">{formatDate(info.getValue())}</Text>,
      size: 90,
    }),
    columnHelper.accessor('MOUNTING ON ISO/EQUI/PACK', {
      header: 'MOUNTING ON ISO/EQUI/PACK',
      cell: info => {
        const isometric = info.getValue();
        return (
          <Button
            size="xs"
            variant={selectedIsometric === isometric ? "solid" : "outline"}
            onClick={() => onIsometricSelect && onIsometricSelect(isometric)}
            _hover={{ bg: selectedIsometric === isometric ? "purple.200" : "blue.200" }}
            fontSize="10px"
            fontWeight="medium"
            color={selectedIsometric === isometric ? "white" : "blue.600"}
            bg={selectedIsometric === isometric ? "purple.500" : "white"}
            borderColor={selectedIsometric === isometric ? "purple.500" : "blue.500"}
            minWidth="30px"
            height="18px"
            px={2}
            borderRadius="sm"
          >
            {isometric}
          </Button>
        );
      },
      size: 230,
    }),
    columnHelper.accessor('ON', {
      header: 'ON',
      cell: info => <Text fontSize="xs">{info.getValue()}</Text>,
      size: 70,
    }),
    columnHelper.accessor('SCOPE BY', {
      header: 'SCOPE BY',
      cell: info => <Text fontSize="xs">{info.getValue()}</Text>,
      size: 95,
    }),
    columnHelper.accessor('TEIGA-TMI', {
      header: 'TEIGA-TMI',
      cell: info => <Text fontSize="xs">{info.getValue()}</Text>,
      size: 70,
    }),
    columnHelper.accessor('SIEMSA_2', {
      header: 'SIEMSA',
      cell: info => <Text fontSize="xs" whiteSpace="normal" wordBreak="break-word">{info.getValue()}</Text>,
      size: 95,
    }),
    columnHelper.accessor('INSTALLED', {
      header: 'INSTALLED',
      cell: info => <Text fontSize="xs" whiteSpace="normal" wordBreak="break-word">{info.getValue()}</Text>,
      size: 95,
    }),
    columnHelper.accessor('WIRED', {
      header: 'WIRED',
      cell: info => <Text fontSize="xs" whiteSpace="normal" wordBreak="break-word">{info.getValue()}</Text>,
      size: 95,
    }),
    columnHelper.accessor('CONNECTED', {
      header: 'CONNECTED',
      cell: info => <Text fontSize="xs" whiteSpace="normal" wordBreak="break-word">{info.getValue()}</Text>,
      size: 95,
    }),
    columnHelper.accessor('CABLE TEST', {
      header: 'CABLE TEST',
      cell: info => <Text fontSize="xs">{info.getValue()}</Text>,
      size: 95,
    }),
    columnHelper.accessor('QFC', {
      header: 'QFC',
      cell: info => <Text fontSize="xs">{info.getValue()}</Text>,
      size: 70,
    }),
    columnHelper.accessor('OK=100%', {
      header: 'OK=100%',
      cell: info => {
        const value = parseFloat(info.getValue()) || 0;
        const percentage = Math.min(Math.max(value, 0), 1) * 100;
        return (
          <Box w="100%" position="relative">
            <Box 
              h="16px" 
              w={`${percentage}%`} 
              bg="green.500"
              borderRadius="sm"
            />
            <Text 
              fontSize="xs" 
              position="absolute" 
              top="0" 
              left="0" 
              right="0" 
              textAlign="center"
              color="white"
              fontWeight="bold"
              textShadow="0px 0px 2px rgba(0,0,0,0.7)"
            >
              {percentage.toFixed(0)}%
            </Text>
          </Box>
        );
      },
      size: 95,
    }),
    columnHelper.accessor('WITH & WITHOUT SIGNAL', {
      header: 'WITH & WITHOUT SIGNAL',
      cell: info => <Text fontSize="xs">{info.getValue()}</Text>,
      size: 95,
    }),
    columnHelper.accessor('WAREHOUSE CODE', {
      header: 'WAREHOUSE CODE',
      cell: info => <Text fontSize="xs">{info.getValue()}</Text>,
      size: 95,
    }),
    columnHelper.accessor('DELIVERY', {
      header: 'DELIVERY',
      cell: info => <Text fontSize="xs">{info.getValue()}</Text>,
      size: 90,
    }),
    columnHelper.accessor('DATE', {
      header: 'DATE',
      cell: info => <Text fontSize="xs">{formatDate(info.getValue())}</Text>,
      size: 95,
    }),
    columnHelper.accessor('VENDOR', {
      header: 'VENDOR',
      cell: info => <Text fontSize="xs">{info.getValue()}</Text>,
      size: 95,
    }),
  ], [formatDate, handleSubsystemClick, handleTestPackClick, onIsometricSelect, selectedIsometric, selectedSubsystem, selectedTestPack]);

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
    estimateSize: () => 30,
    overscan: 10,
    measureElement: typeof window !== 'undefined' && document.getElementById ? 
      (element) => element?.getBoundingClientRect().height || 30 : 
      undefined,
  });

  // Load data from DuckDB
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

        // Try to fetch Parquet file
        try {
          const res = await fetch('/data/master_subsystem.parquet');
          
          if (!res.ok) throw new Error(`Failed to fetch Parquet: ${res.status}`);
          
          const parquetBuffer = await res.arrayBuffer();
          await createTableFromParquet('master_subsystem', parquetBuffer);
        } catch (parquetError) {
          console.error('Error loading Parquet:', parquetError);
          throw new Error('Failed to load data source');
        }

        // Get SQL where clause from filter context
        const whereClause = getSqlWhereClause('details');

        // Execute optimized query with all needed columns
        const startQueryTime = performance.now();
        const results = await executeQuery(`
          SELECT
            item_isoinst AS "ITEM",
            tag_inst_isoinst AS "TAG INST",
            instrument_type_isoinst AS "INSTRUMENT TYPE",
            subsystem AS "SUBSYSTEM",
            tp_include_isoinst AS "TPs",
            progress_ac_tp_1,
            progress_ac_tp_2,
            progress_ac_tp_3,
            pid_isoinst AS "P&ID",
            hito_isoinst AS "HITO",
            teiga_reinstatement_isoinst AS "TEIGA REINSTATEMENT",
            teiga_insulation_isoinst AS "TEIGA INSULATION",
            siemsa_isoinst AS "SIEMSA",
            ten_isoinst AS "TEN",
            mounting_on_isoequipack_isoinst AS "MOUNTING ON ISO/EQUI/PACK",
            on_isoinst AS "ON",
            scope__by_isoinst AS "SCOPE BY",
            teigatmi_isoinst AS "TEIGA-TMI",
            siemsa1_isoinst AS "SIEMSA_2",
            installed_isoinst AS "INSTALLED",
            wired_isoinst AS "WIRED",
            connected_isoinst AS "CONNECTED",
            cable_test_isoinst AS "CABLE TEST",
            qcf_isoinst AS "QFC",
            ok100_isoinst AS "OK=100%",
            with__without_signal_isoinst AS "WITH & WITHOUT SIGNAL",
            warehouse_code_isoinst AS "WAREHOUSE CODE",
            delivery_isoinst AS "DELIVERY",
            date_isoinst AS "DATE",
            vendor_isoinst AS "VENDOR"
          FROM master_subsystem
          WHERE item_isoinst IS NOT NULL
          ${whereClause ? 'AND ' + whereClause.substring(6) : ''}
          LIMIT 1000
        `, { 
          useCache: true,
          cacheKey: `details_${selectedIsometric || 'all'}_${selectedSubsystem || 'all'}_${selectedTestPack || 'all'}`
        });
        
        const endQueryTime = performance.now();
        setQueryTime((endQueryTime - startQueryTime).toFixed(2));

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
  }, [createTableFromParquet, executeQuery, dbLoading, dbError, selectedIsometric, selectedSubsystem, selectedTestPack, getSqlWhereClause]);

  if (loading || dbLoading) {
    return (
      <Box mt={6}>
        <Heading size="xs" color="gray.700" mb={2}>
          Details Instruments
        </Heading>
        <Center p={8}>
          <Spinner size="xs" color="blue.500" />
          <Text ml={2} color="gray.600">
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
        <Heading size="md" color="gray.700">Details Instruments</Heading>
        <HStack>
          {loadTime && <PerformanceMetric label="Load" value={`${loadTime}ms`} description="Time to load data from source and process it" />}
          {queryTime && <PerformanceMetric label="Query" value={`${queryTime}ms`} description="Time to execute DuckDB query" />}
          <Badge colorScheme="purple" fontSize="sm" px={3} py={1}>
            {table.getFilteredRowModel().rows.length} Records
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
                      p={1}
                      textAlign="center"
                      fontWeight="bold"
                      fontSize="xs"
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
                    ref={rowVirtualizer.measureElement}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      minHeight: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                      display: 'grid',
                      gridTemplateColumns: table.getAllColumns().map(col => `${col.getSize() || 150}px`).join(' '),
                      alignItems: 'stretch'
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
                        whiteSpace={cell.column.id.includes('INSTRUMENT TYPE') ? 'normal' : 'nowrap'}
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

export default DetailsInstrumentsTable;