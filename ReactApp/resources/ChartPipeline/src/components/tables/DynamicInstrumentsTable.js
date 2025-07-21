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
  Tooltip,
  Button,
  Select,
  Flex,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Divider,
} from '@chakra-ui/react';
import { DragHandleIcon } from '@chakra-ui/icons';
import { measurePerformance, analyzeTablePerformance, monitorTablePerformance } from '../../utils/tablePerformance';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  getExpandedRowModel,
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

// Progress Cell Component
const ProgressCell = ({ progress }) => {
  if (progress === null || progress === undefined) {
    return (
      <Box width="100%" height="100%" display="flex" alignItems="center" justifyContent="center">
        <Text fontSize="xs" color="gray.500">-</Text>
      </Box>
    );
  }

  const percentage = Math.round(progress * 100);

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
const TestPackCell = ({ tp, onTestPackSelect, selectedTestPack }) => {
  if (!tp || tp === '') {
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
        variant={selectedTestPack === tp ? "solid" : "outline"}
        onClick={() => onTestPackSelect && onTestPackSelect(tp)}
        _hover={{ bg: selectedTestPack === tp ? "green.200" : "blue.200" }}
        fontSize="10px"
        fontWeight="medium"
        color={selectedTestPack === tp ? "white" : "blue.600"}
        bg={selectedTestPack === tp ? "green.500" : "white"}
        borderColor={selectedTestPack === tp ? "green.500" : "blue.500"}
        minWidth="30px"
        height="18px"
        px={2}
        borderRadius="sm"
      >
        {tp}
      </Button>
    </Box>
  );
};

const DynamicInstrumentsTable = () => {
  const {
    createTableFromCSV,
    createTableFromParquet,
    executeQuery,
    loading: dbLoading,
    error: dbError,
  } = useDuckDB();

  // State declarations
  const [tableData, setTableData] = useState([]);
  const [rawData, setRawData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTestPack, setSelectedTestPack] = useState(null);
  const [selectedSubsystem, setSelectedSubsystem] = useState(null);
  const [selectedHito, setSelectedHito] = useState(null);
  
  // Grouping state
  const [availableFields, setAvailableFields] = useState(['SUBSYSTEM', 'HITO', 'TP']);
  const [groupBy, setGroupBy] = useState(['SUBSYSTEM', 'HITO']);
  const [expanded, setExpanded] = useState({});

  // Performance metrics
  const [loadTime, setLoadTime] = useState(null);
  const [renderTime, setRenderTime] = useState(null);
  const [queryTime, setQueryTime] = useState(null);
  const [fps, setFps] = useState(null);
  const [memoryUsage, setMemoryUsage] = useState(null);
  const tableContainerRef = useRef(null);

  // Grouping and aggregation function
  const groupAndAggregate = useCallback((data, groupByFields) => {
    const numericFields = [
      'TOTAL INST',
      'INSTALLED BY TEIGA-TMI',
      'INSTALLED BY SIEMSA',
      'PENDING',
    ];

    const aggregateGroup = (rows, level = 0) => {
      if (level >= groupByFields.length) return [];

      const key = groupByFields[level];
      const groups = {};

      rows.forEach(row => {
        const val = row[key] || 'N/A';
        if (!groups[val]) groups[val] = [];
        groups[val].push(row);
      });

      return Object.entries(groups).map(([val, items]) => {
        const node = { [key]: val };

        // Sum numeric fields
        numericFields.forEach(f => {
          node[f] = items.reduce((sum, r) => sum + (parseFloat(r[f]) || 0), 0);
        });

        // Average progress
        node['PROGRESS'] = (
          items.reduce((sum, r) => sum + (parseFloat(r['PROGRESS']) || 0), 0) / items.length
        ).toFixed(2);

        const children = aggregateGroup(items, level + 1);
        if (children.length > 0) {
          node.children = children;
        }

        return node;
      });
    };

    return aggregateGroup(data);
  }, []);

  // Update table data when grouping changes
  useEffect(() => {
    if (rawData.length > 0) {
      const grouped = groupAndAggregate(rawData, groupBy);
      setTableData(grouped);
    }
  }, [rawData, groupBy, groupAndAggregate]);

  // Handle grouping changes
  const handleAddGroupLevel = (field) => {
    if (!groupBy.includes(field)) {
      setGroupBy([...groupBy, field]);
    }
  };

  const handleRemoveGroupLevel = (field) => {
    if (groupBy.includes(field)) {
      setGroupBy(groupBy.filter(f => f !== field));
    }
  };

  const handleReorderGrouping = (fromIndex, toIndex) => {
    const newGroupBy = [...groupBy];
    const [movedItem] = newGroupBy.splice(fromIndex, 1);
    newGroupBy.splice(toIndex, 0, movedItem);
    setGroupBy(newGroupBy);
  };

  // Column definitions
  const columnHelper = createColumnHelper();
  
  const columns = useMemo(() => {
    const common = [
      columnHelper.accessor('TOTAL INST', {
        header: 'TOTAL INST',
        cell: info => <Text fontSize="xs">{Number(info.getValue())}</Text>,
        size: 90,
        sortingFn: 'basic',
      }),
      columnHelper.accessor('INSTALLED BY TEIGA-TMI', {
        header: 'INSTALLED BY TEIGA-TMI',
        cell: info => <Text fontSize="xs">{Number(info.getValue())}</Text>,
        size: 90,
        sortingFn: 'basic',
      }),
      columnHelper.accessor('INSTALLED BY SIEMSA', {
        header: 'INSTALLED BY SIEMSA',
        cell: info => <Text fontSize="xs">{Number(info.getValue())}</Text>,
        size: 90,
        sortingFn: 'basic',
      }),
      columnHelper.accessor('PENDING', {
        header: 'PENDING',
        cell: info => <Text fontSize="xs">{Number(info.getValue())}</Text>,
        size: 90,
        sortingFn: 'basic',
      }),
      columnHelper.accessor('PROGRESS', {
        header: 'PROGRESS',
        cell: info => <ProgressCell progress={info.getValue()} />,
        size: 120,
      }),
    ];

    const dynamicGroupColumns = groupBy.map(level =>
      columnHelper.accessor(level, {
        header: level,
        cell: info => {
          const row = info.row;
          const value = info.getValue();
          const hasChildren = row.subRows?.length > 0;
          
          return (
            <Flex alignItems="center">
              {hasChildren && (
                <IconButton
                  size="xs"
                  variant="ghost"
                  icon={row.getIsExpanded() ? <Text>-</Text> : <Text>+</Text>}
                  onClick={() => row.toggleExpanded()}
                  mr={1}
                  aria-label={row.getIsExpanded() ? "Collapse row" : "Expand row"}
                />
              )}
              <Text fontSize="xs" fontWeight="medium" pl={hasChildren ? 0 : 4}>
                {value}
              </Text>
            </Flex>
          );
        },
        size: 120,
      })
    );

    return [...dynamicGroupColumns, ...common];
  }, [groupBy]);

  // Create table instance
  const table = useReactTable({
    data: tableData,
    columns,
    state: {
      expanded,
    },
    onExpandedChange: setExpanded,
    getSubRows: row => row.children,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
  });

  // Set up virtualization
  const { rows } = table.getRowModel();

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 30, // reduced default height estimate
    overscan: 20, // Show more rows to prevent blank spaces during fast scrolling
    measureElement: typeof window !== 'undefined' && document.getElementById ?
        (element) => element?.getBoundingClientRect().height || 30 :
        undefined,
    // This is critical - ensure we always measure after render
    measureDependency: [tableData],
  });

  // Handle row expansion
  const handleRowExpansion = (rowId) => {
    setExpanded(prev => ({
      ...prev,
      [rowId]: !prev[rowId]
    }));
  };

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

        // Execute optimized query with all needed columns
        // Use a more efficient query that limits the data returned
        const { result: results, executionTime } = await measurePerformance(() => executeQuery(`
          WITH inst_data AS (SELECT mounting_on_isoequipack_isoinst AS isometric,
                                    MAX(subsystem)                  AS subsystem,
                                    MAX(tp_include_isoinst)         AS tps,
                                    MAX(progress_ac_tp_1)           AS progress_ac_tp_1,
                                    MAX(progress_ac_tp_2)           AS progress_ac_tp_2,
                                    MAX(progress_ac_tp_3)           AS progress_ac_tp_3,
                                    COUNT(tag_inst_isoinst)         AS qty_inst,
                                    COUNT(scope__by_isoinst)           FILTER(WHERE scope__by_isoinst = 'TEIGA-TMI') AS scope_teiga_tmi, COUNT(scope__by_isoinst) FILTER(WHERE scope__by_isoinst = 'SIEMSA') AS scope_siemsa, COUNT(scope__by_isoinst) FILTER(WHERE scope__by_isoinst = 'TEIGA-TMI' AND ok100_isoinst = 1) AS installed_teiga_tmi, COUNT(scope__by_isoinst) FILTER(WHERE scope__by_isoinst = 'SIEMSA' AND ok100_isoinst = 1) AS installed_siemsa
                             FROM master_subsystem
                             WHERE on_isoinst = 'PIP'
                             GROUP BY mounting_on_isoequipack_isoinst),

               progress_data AS (SELECT isometricos_ifc3_isos     AS isometric,
                                        isometric__progress__isos AS isometric_progress,
                                        hito_isos                 AS hito
                                 FROM master_subsystem
                                 WHERE isometricos_ifc3_isos IS NOT NULL),

               exploded_tps AS (SELECT i.isometric,
                                       i.subsystem,
                                       p.hito,
                                       UNNEST(string_to_array(i.tps, '|'))                       AS tp,
                                       CASE idx
                                         WHEN 1 THEN i.progress_ac_tp_1
                                         WHEN 2 THEN i.progress_ac_tp_2
                                         WHEN 3 THEN i.progress_ac_tp_3
                                         END                                                     AS progress,
                                       i.qty_inst,
                                       i.scope_teiga_tmi,
                                       i.scope_siemsa,
                                       i.installed_teiga_tmi,
                                       i.installed_siemsa,
                                       (i.qty_inst - i.installed_teiga_tmi - i.installed_siemsa) AS pending
                                FROM (SELECT *,
                                             generate_subscripts(string_to_array(tps, '|'), 1) AS idx
                                      FROM inst_data) i
                                       LEFT JOIN progress_data p ON i.isometric = p.isometric)

          SELECT subsystem                AS "SUBSYSTEM",
                 hito                     AS "HITO",
                 tp                       AS "TP",
                 SUM(qty_inst)            AS "TOTAL INST",
                 SUM(installed_teiga_tmi) AS "INSTALLED BY TEIGA-TMI",
                 SUM(installed_siemsa)    AS "INSTALLED BY SIEMSA",
                 SUM(pending)             AS "PENDING",
                 MAX(progress)            AS "PROGRESS"
          FROM exploded_tps
          GROUP BY subsystem, hito, tp
          ORDER BY subsystem, hito, tp;
          `));


        setQueryTime(executionTime.toFixed(2));
        console.log(`Query execution time: ${executionTime.toFixed(2)}ms`);

        // Store raw data for grouping
        setRawData(results);
        
        // Apply initial grouping
        const grouped = groupAndAggregate(results, groupBy);
        setTableData(grouped);
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
  
  // Monitor performance during scrolling
  useEffect(() => {
    if (tableContainerRef.current) {
      const cleanup = monitorTablePerformance((metrics) => {
        setFps(metrics.fps.toFixed(1));
        setMemoryUsage({
          usedJSHeapSize: metrics.memory?.usedJSHeapSize ? (metrics.memory.usedJSHeapSize / (1024 * 1024)).toFixed(1) : '0',
          totalJSHeapSize: metrics.memory?.totalJSHeapSize ? (metrics.memory.totalJSHeapSize / (1024 * 1024)).toFixed(1) : '0',
        });
      });
      return cleanup;
    }
  }, [tableData]);

  if (loading || dbLoading) {
    return (
        <Box mt={6}>
          <Heading size="xs" color="gray.700" mb={2}>
            Control Instruments by Isometric
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

  // Render the grouping controls
  const renderGroupingControls = () => (
    <Box mb={4} p={2} borderWidth="1px" borderRadius="md" bg="gray.50" width="500px">
      <VStack spacing={2} align="stretch">
        <HStack justify="space-between">
          <Text fontWeight="bold" fontSize="sm">Group By Hierarchy:</Text>
          <Menu>
            <MenuButton as={Button} size="xs" rightIcon={<Text>+</Text>}>
              Add Level
            </MenuButton>
            <MenuList>
              {availableFields.map(field => (
                <MenuItem 
                  key={field} 
                  onClick={() => handleAddGroupLevel(field)}
                  isDisabled={groupBy.includes(field)}
                >
                  {field}
                </MenuItem>
              ))}
            </MenuList>
          </Menu>
        </HStack>
        
        <Flex wrap="wrap" gap={2}>
          {groupBy.map((field, index) => (
            <Flex 
              key={field} 
              borderWidth="1px" 
              borderRadius="md" 
              p={1} 
              alignItems="center"
              bg="blue.50"
            >
              <DragHandleIcon mr={1} cursor="grab" />
              <Text fontSize="xs">{field}</Text>
              <IconButton
                icon={<Text>×</Text>}
                size="xs"
                variant="ghost"
                ml={1}
                onClick={() => handleRemoveGroupLevel(field)}
                aria-label="Remove group level"
              />
            </Flex>
          ))}
        </Flex>
      </VStack>
    </Box>
  );

  return (
      <Box mt={6}>
        <HStack justify="space-between" align="center" mb={4}>
          <Heading size="md" color="gray.700">Dynamic Instruments Table</Heading>
          <HStack>
            {loadTime && <PerformanceMetric label="Load" value={`${loadTime}ms`} description="Time to load data from source and process it" />}
            {queryTime && <PerformanceMetric label="Query" value={`${queryTime}ms`} description="Time to execute DuckDB query" />}
            {renderTime && <PerformanceMetric label="Render" value={`${renderTime}ms`} description="Time to render table with data" />}
            {fps && <PerformanceMetric label="FPS" value={fps} description="Frames per second during scrolling" />}
            {memoryUsage && <PerformanceMetric label="Mem" value={`${memoryUsage.usedJSHeapSize}MB`} description={`Memory usage: ${memoryUsage.usedJSHeapSize}MB / ${memoryUsage.totalJSHeapSize}MB`} />}
            <Badge colorScheme="purple" fontSize="sm" px={3} py={1}>
              {table.getFilteredRowModel().rows.length} / {tableData.length} Records
            </Badge>
            {selectedSubsystem && (
                <Badge colorScheme="orange" fontSize="sm" px={3} py={1}>
                  Subsystem: {selectedSubsystem}
                </Badge>
            )}
            {selectedTestPack && (
                <Badge colorScheme="green" fontSize="sm" px={3} py={1}>
                  Test Pack: {selectedTestPack}
                </Badge>
            )}
          </HStack>
        </HStack>
        
        {renderGroupingControls()}



        <Box
            border="1px solid"
            borderColor="gray.200"
            borderRadius="lg"
            overflow="hidden"
            bg="white"
            boxShadow="sm"
            width="800px"
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
                  const isGroupRow = row.original.children !== undefined;
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
                            alignItems: 'stretch',
                            backgroundColor: isGroupRow ? 'rgba(237, 242, 247, 0.5)' : 'white'
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
                                maxHeight="none"
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

export default DynamicInstrumentsTable;