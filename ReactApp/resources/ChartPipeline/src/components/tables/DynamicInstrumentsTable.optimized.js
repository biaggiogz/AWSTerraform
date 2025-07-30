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
  Button,
  Flex,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
} from '@chakra-ui/react';
import { DragHandleIcon } from '@chakra-ui/icons';
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
import { useInstrumentsTableFilterContext } from '../filters/InstrumentsTableFilter';
import PerformanceMetric from '../shared/PerformanceMetric';
import SubsystemCell from '../shared/SubsystemCell';
import TestPackCell from '../shared/TestPackCell';



// Progress Cell Component
const ProgressCell = React.memo(({ progress }) => {
  if (progress === null || progress === undefined) {
    return <Text fontSize="xs" color="gray.500">-</Text>;
  }

  const percentage = Math.round(progress * 100);

  return (
      <Box position="relative" width="100%" height="18px">
        <Box
            height="18px"
            width={`${percentage}%`}
            bg={percentage === 100 ? "#4CAF50" : "#ED7D31"}
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
});





const DynamicInstrumentsTable = () => {
  // Get filter context
  const {
    selectedIsometric,
    selectedTestPack,
    selectedSubsystem,
    handleTestPackClick,
    handleSubsystemClick,
    getSqlWhereClause,
    setTableData: setContextTableData,
    setGroupBy: setContextGroupBy
  } = useInstrumentsTableFilterContext();

  const {
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

  // Grouping state
  const [availableFields] = useState(['SUBSYSTEM', 'HITO', 'TP']);
  const [groupBy, setGroupBy] = useState(['SUBSYSTEM', 'HITO']);
  const [expanded, setExpanded] = useState({});

  // Performance metrics
  const [loadTime, setLoadTime] = useState(null);
  const [queryTime, setQueryTime] = useState(null);
  const tableContainerRef = useRef(null);

  // Grouping and aggregation function
  const groupAndAggregate = useCallback((data, groupByFields) => {
    if (!data || data.length === 0) return [];

    const numericFields = [
      'TOTAL INST',
      'TOTAL SIEMSA',
      'INSTALLED TEIGA',
      'INSTALLED SIEMSA',
      'TOTAL TEIGA',
      'PENDING',
      'DONE',
    ];

    // Special case for SUBSYSTEM | HITO grouping
    if (groupByFields.length === 2 && groupByFields[0] === 'SUBSYSTEM' && groupByFields[1] === 'HITO') {
      // First group by SUBSYSTEM only
      const subsystemGroups = {};

      data.forEach(row => {
        const subsystem = row['SUBSYSTEM'] || 'N/A';
        if (!subsystemGroups[subsystem]) subsystemGroups[subsystem] = [];
        subsystemGroups[subsystem].push(row);
      });

      // Create subsystem nodes with aggregated data
      return Object.entries(subsystemGroups).map(([subsystem, items]) => {
        const node = { 'SUBSYSTEM': subsystem };

        // Group by HITO within this subsystem
        const hitoGroups = {};
        items.forEach(row => {
          const hito = row['HITO'] || 'N/A';
          if (!hitoGroups[hito]) hitoGroups[hito] = [];
          hitoGroups[hito].push(row);
        });

        // If there's only one HITO, merge it with the parent row
        if (Object.keys(hitoGroups).length === 1) {
          const singleHito = Object.keys(hitoGroups)[0];
          const hitoItems = hitoGroups[singleHito];

          // Add the HITO value to the parent node
          node['HITO'] = singleHito;

          // Sum numeric fields directly into the parent node
          numericFields.forEach(f => {
            if (f === 'DONE') {
              const total = hitoItems.reduce((sum, r) => sum + (parseFloat(r['TOTAL INST']) || 0), 0);
              const teiga = hitoItems.reduce((sum, r) => sum + (parseFloat(r['INSTALLED TEIGA']) || 0), 0);
              const siemsa = hitoItems.reduce((sum, r) => sum + (parseFloat(r['INSTALLED SIEMSA']) || 0), 0);
              const installed = teiga + siemsa;
              node[f] = Math.abs(total - installed) < 0.01 ? total : 0;
            } else {
              node[f] = hitoItems.reduce((sum, r) => sum + (parseFloat(r[f]) || 0), 0);
            }
          });

          // Average progress
          node['PROGRESS TP'] = hitoItems.length > 0 ?
              (hitoItems.reduce((sum, r) => sum + (parseFloat(r['PROGRESS TP']) || 0), 0) / hitoItems.length) : 0;

          // No children needed since we merged the single HITO into the parent
          return node;
        } else {
          // Multiple HITOs - use the standard approach
          // Sum numeric fields for the subsystem
          numericFields.forEach(f => {
            if (f === 'DONE') {
              const total = items.reduce((sum, r) => sum + (parseFloat(r['TOTAL INST']) || 0), 0);
              const teiga = items.reduce((sum, r) => sum + (parseFloat(r['INSTALLED TEIGA']) || 0), 0);
              const siemsa = items.reduce((sum, r) => sum + (parseFloat(r['INSTALLED SIEMSA']) || 0), 0);
              const installed = teiga + siemsa;
              node[f] = Math.abs(total - installed) < 0.01 ? total : 0;
            } else {
              node[f] = items.reduce((sum, r) => sum + (parseFloat(r[f]) || 0), 0);
            }
          });

          // Average progress for the subsystem
          node['PROGRESS TP'] = items.length > 0 ?
              (items.reduce((sum, r) => sum + (parseFloat(r['PROGRESS TP']) || 0), 0) / items.length) : 0;

          // Create HITO children
          const children = Object.entries(hitoGroups).map(([hito, hitoItems]) => {
            const hitoNode = { 'HITO': hito };

            // Sum numeric fields for this HITO
            numericFields.forEach(f => {
              if (f === 'DONE') {
                const total = hitoItems.reduce((sum, r) => sum + (parseFloat(r['TOTAL INST']) || 0), 0);
                const teiga = hitoItems.reduce((sum, r) => sum + (parseFloat(r['INSTALLED TEIGA']) || 0), 0);
                const siemsa = hitoItems.reduce((sum, r) => sum + (parseFloat(r['INSTALLED SIEMSA']) || 0), 0);
                const installed = teiga + siemsa;
                hitoNode[f] = Math.abs(total - installed) < 0.01 ? total : 0;
              } else {
                hitoNode[f] = hitoItems.reduce((sum, r) => sum + (parseFloat(r[f]) || 0), 0);
              }
            });

            // Average progress for this HITO
            hitoNode['PROGRESS TP'] = hitoItems.length > 0 ?
                (hitoItems.reduce((sum, r) => sum + (parseFloat(r['PROGRESS TP']) || 0), 0) / hitoItems.length) : 0;

            return hitoNode;
          });

          if (children.length > 0) {
            node.children = children;
          }

          return node;
        }
      });
    }

    // Standard grouping for other combinations
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

        // Check if we're not at the last level and should process children
        if (level < groupByFields.length - 1) {
          // Process next level to check if there's only one child
          const nextKey = groupByFields[level + 1];
          const nextGroups = {};

          items.forEach(row => {
            const nextVal = row[nextKey] || 'N/A';
            if (!nextGroups[nextVal]) nextGroups[nextVal] = [];
            nextGroups[nextVal].push(row);
          });

          // If there's only one child at the next level, merge it with this node
          if (Object.keys(nextGroups).length === 1) {
            const singleChildKey = Object.keys(nextGroups)[0];
            const singleChildItems = nextGroups[singleChildKey];

            // Add the child's key-value to the parent node
            node[nextKey] = singleChildKey;

            // If we're not at the second-to-last level, recursively check for more single children
            if (level < groupByFields.length - 2) {
              // Process the single child's items recursively
              const mergedChildren = aggregateGroup(singleChildItems, level + 2);
              if (mergedChildren.length > 0) {
                node.children = mergedChildren;
              }
            }

            // Sum numeric fields for this merged node
            numericFields.forEach(f => {
              if (f === 'DONE') {
                const total = singleChildItems.reduce((sum, r) => sum + (parseFloat(r['TOTAL INST']) || 0), 0);
                const teiga = singleChildItems.reduce((sum, r) => sum + (parseFloat(r['INSTALLED TEIGA']) || 0), 0);
                const siemsa = singleChildItems.reduce((sum, r) => sum + (parseFloat(r['INSTALLED SIEMSA']) || 0), 0);
                const installed = teiga + siemsa;
                node[f] = Math.abs(total - installed) < 0.01 ? total : 0;
              } else {
                node[f] = singleChildItems.reduce((sum, r) => sum + (parseFloat(r[f]) || 0), 0);
              }
            });

            // Average progress
            node['PROGRESS TP'] = singleChildItems.length > 0 ?
                (singleChildItems.reduce((sum, r) => sum + (parseFloat(r['PROGRESS TP']) || 0), 0) / singleChildItems.length) : 0;

            return node;
          } else {
            // Multiple children - standard approach
            // Sum numeric fields
            numericFields.forEach(f => {
              if (f === 'DONE') {
                const total = items.reduce((sum, r) => sum + (parseFloat(r['TOTAL INST']) || 0), 0);
                const teiga = items.reduce((sum, r) => sum + (parseFloat(r['INSTALLED TEIGA']) || 0), 0);
                const siemsa = items.reduce((sum, r) => sum + (parseFloat(r['INSTALLED SIEMSA']) || 0), 0);
                const installed = teiga + siemsa;
                node[f] = Math.abs(total - installed) < 0.01 ? total : 0;
              } else {
                node[f] = items.reduce((sum, r) => sum + (parseFloat(r[f]) || 0), 0);
              }
            });

            // Average progress
            node['PROGRESS TP'] = items.length > 0 ?
                (items.reduce((sum, r) => sum + (parseFloat(r['PROGRESS TP']) || 0), 0) / items.length) : 0;

            // Process children normally
            const children = aggregateGroup(items, level + 1);
            if (children.length > 0) {
              node.children = children;
            }

            return node;
          }
        } else {
          // Last level - no children to process
          // Sum numeric fields
          numericFields.forEach(f => {
            if (f === 'DONE') {
              const total = items.reduce((sum, r) => sum + (parseFloat(r['TOTAL INST']) || 0), 0);
              const teiga = items.reduce((sum, r) => sum + (parseFloat(r['INSTALLED TEIGA']) || 0), 0);
              const siemsa = items.reduce((sum, r) => sum + (parseFloat(r['INSTALLED SIEMSA']) || 0), 0);
              const installed = teiga + siemsa;
              node[f] = Math.abs(total - installed) < 0.01 ? total : 0;
            } else {
              node[f] = items.reduce((sum, r) => sum + (parseFloat(r[f]) || 0), 0);
            }
          });

          // Average progress
          node['PROGRESS TP'] = items.length > 0 ?
              (items.reduce((sum, r) => sum + (parseFloat(r['PROGRESS TP']) || 0), 0) / items.length) : 0;

          return node;
        }
      });
    };

    return aggregateGroup(data);
  }, []);

  // Apply filters and grouping when data or filter state changes
  useEffect(() => {
    if (rawData.length > 0) {
      const grouped = groupAndAggregate(rawData, groupBy);
      setTableData(grouped);

      // Update the context with the table data and groupBy for the chart component
      setContextTableData(grouped);
      setContextGroupBy(groupBy);
    }
  }, [rawData, groupBy, groupAndAggregate, setContextTableData, setContextGroupBy]);

  // Handle grouping changes
  const handleAddGroupLevel = useCallback((field) => {
    if (!groupBy.includes(field)) {
      setGroupBy(prev => [...prev, field]);
    }
  }, [groupBy]);

  const handleRemoveGroupLevel = useCallback((field) => {
    setGroupBy(prev => prev.filter(f => f !== field));
  }, []);



  // Column definitions
  const columnHelper = createColumnHelper();

  const columns = useMemo(() => {
    const common = [
      columnHelper.accessor('TOTAL INST', {
        header: 'TOTAL INST',
        cell: info => <Text fontSize="xs">{Number(info.getValue())}</Text>,
        size: 90,
      }),
      columnHelper.accessor('TOTAL SIEMSA', {
        header: 'TOTAL SIEMSA',
        cell: info => <Text fontSize="xs">{Number(info.getValue())}</Text>,
        size: 90,
      }),
      columnHelper.accessor('INSTALLED SIEMSA', {
        header: 'INSTALLED SIEMSA',
        cell: info => <Text fontSize="xs">{Number(info.getValue())}</Text>,
        size: 90,
      }),
      columnHelper.accessor('TOTAL TEIGA', {
        header: 'TOTAL TEIGA',
        cell: info => <Text fontSize="xs">{Number(info.getValue())}</Text>,
        size: 90,
      }),
      columnHelper.accessor('INSTALLED TEIGA', {
        header: 'INSTALLED TEIGA',
        cell: info => <Text fontSize="xs">{Number(info.getValue())}</Text>,
        size: 90,
      }),
      columnHelper.accessor('PENDING', {
        header: 'PENDING',
        cell: info => <Text fontSize="xs">{Number(info.getValue())}</Text>,
        size: 90,
      }),
      columnHelper.accessor('DONE', {
        header: 'DONE',
        cell: info => {
          const value = Number(info.getValue());
          return <Text fontSize="xs">{value}</Text>
        },
        size: 90,
      }),
    ];

    // Only show PROGRESS column when TP is in the groupBy array
    if (groupBy.includes('TP')) {
      common.push(
          columnHelper.accessor('PROGRESS TP', {
            header: 'PROGRESS TP',
            cell: info => <ProgressCell progress={info.getValue()} />,
            size: 120,
          })
      );
    }

    const dynamicGroupColumns = groupBy.map(level =>
        columnHelper.accessor(level, {
          header: level,
          cell: info => {
            const row = info.row;
            const value = info.getValue();
            const hasChildren = row.subRows?.length > 0;

            // Use SubsystemCell component for SUBSYSTEM column
            if (level === 'SUBSYSTEM') {
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
                    <Box pl={hasChildren ? 0 : 4} width="100%">
                      <SubsystemCell
                          subsystem={value}
                          onSubsystemSelect={handleSubsystemClick}
                          selectedSubsystem={selectedSubsystem}
                      />
                    </Box>
                  </Flex>
              );
            }

            // Use TestPackCell component for TP column
            if (level === 'TP') {
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
                    <Box pl={hasChildren ? 0 : 4} width="100%">
                      <TestPackCell
                          tp={value}
                          onTestPackSelect={handleTestPackClick}
                          selectedTestPack={selectedTestPack}
                      />
                    </Box>
                  </Flex>
              );
            }

            // Default rendering for other columns
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
  }, [groupBy, selectedSubsystem, selectedTestPack, handleSubsystemClick, handleTestPackClick]);

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
        if (dbLoading || dbError) return;

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
        const whereClause = getSqlWhereClause('dynamic');

        // Execute optimized query
        const startQueryTime = performance.now();
        const results = await executeQuery(`
          WITH inst_data AS (
            SELECT
              mounting_on_isoequipack_isoinst AS isometric,
              MAX(subsystem) AS subsystem,
              MAX(tp_include_isoinst) AS tps,
              MAX(progress_ac_tp_1) AS progress_ac_tp_1,
              MAX(progress_ac_tp_2) AS progress_ac_tp_2,
              MAX(progress_ac_tp_3) AS progress_ac_tp_3,
              COUNT(tag_inst_isoinst) AS qty_inst,
              COUNT(scope__by_isoinst) FILTER(WHERE scope__by_isoinst = 'TEIGA-TMI') AS scope_teiga_tmi,
              COUNT(scope__by_isoinst) FILTER(WHERE scope__by_isoinst = 'SIEMSA') AS scope_siemsa,
              COUNT(scope__by_isoinst) FILTER(WHERE scope__by_isoinst = 'TEIGA-TMI' AND ok100_isoinst = 1) AS installed_teiga_tmi,
              COUNT(scope__by_isoinst) FILTER(WHERE scope__by_isoinst = 'SIEMSA' AND ok100_isoinst = 1) AS installed_siemsa
            FROM master_subsystem
            WHERE on_isoinst = 'PIP'
            ${whereClause ? 'AND ' + whereClause.substring(6) : ''}
          GROUP BY mounting_on_isoequipack_isoinst
            ),
            progress_data AS (
          SELECT
            isometricos_ifc3_isos AS isometric,
            isometric__progress__isos AS isometric_progress,
            hito_isos AS hito
          FROM master_subsystem
          WHERE isometricos_ifc3_isos IS NOT NULL
            ),
            exploded_tps AS (
          SELECT
            i.isometric,
            i.subsystem,
            p.hito,
            UNNEST(string_to_array(i.tps, '|')) AS tp,
            CASE idx
            WHEN 1 THEN i.progress_ac_tp_1
            WHEN 2 THEN i.progress_ac_tp_2
            WHEN 3 THEN i.progress_ac_tp_3
            END AS progress,
            i.qty_inst,
            i.scope_teiga_tmi,
            i.scope_siemsa,
            i.installed_teiga_tmi,
            i.installed_siemsa,
            (i.qty_inst - i.installed_teiga_tmi - i.installed_siemsa) AS pending
          FROM (
            SELECT *,
            generate_subscripts(string_to_array(tps, '|'), 1) AS idx
            FROM inst_data
            ) i
            LEFT JOIN progress_data p ON i.isometric = p.isometric
            )
          SELECT
            subsystem AS "SUBSYSTEM",
            hito AS "HITO",
            tp AS "TP",
            SUM(qty_inst) AS "TOTAL INST",
            SUM(scope_siemsa) AS "TOTAL SIEMSA",
            SUM(scope_teiga_tmi) AS "TOTAL TEIGA",
            SUM(installed_teiga_tmi) AS "INSTALLED TEIGA",
            SUM(installed_siemsa) AS "INSTALLED SIEMSA",
            SUM(pending) AS "PENDING",
            CASE
              WHEN ABS(SUM(qty_inst) - SUM(installed_teiga_tmi) - SUM(installed_siemsa)) < 0.01 AND SUM(qty_inst) > 0
                THEN SUM(qty_inst)
              ELSE 0
              END AS "DONE",
            MAX(progress) AS "PROGRESS TP"
          FROM exploded_tps
          GROUP BY subsystem, hito, tp
          ORDER BY subsystem, hito, tp
            LIMIT 5000
        `, {
          useCache: true,
          cacheKey: `dynamic_${selectedIsometric || 'all'}_${selectedSubsystem || 'all'}_${selectedTestPack || 'all'}`
        });

        const endQueryTime = performance.now();
        setQueryTime((endQueryTime - startQueryTime).toFixed(2));

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
  }, [createTableFromParquet, executeQuery, dbLoading, dbError, selectedIsometric, selectedSubsystem, selectedTestPack, getSqlWhereClause, groupAndAggregate, groupBy]);

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
            {groupBy.map((field) => (
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

  if (loading || dbLoading) {
    return (
        <Box mt={6}>
          <Heading size="xs" color="gray.700" mb={2}>
            Dynamic Instruments Table
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
          <Heading size="md" color="gray.700">Dynamic Instruments Table</Heading>
          <HStack>
            {loadTime && <PerformanceMetric label="Load" value={`${loadTime}ms`} description="Time to load data from source and process it" />}
            {queryTime && <PerformanceMetric label="Query" value={`${queryTime}ms`} description="Time to execute DuckDB query" />}
            <Badge colorScheme="purple" fontSize="sm" px={3} py={1}>
              {table.getFilteredRowModel().rows.length} / {rawData.length} Records
            </Badge>
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