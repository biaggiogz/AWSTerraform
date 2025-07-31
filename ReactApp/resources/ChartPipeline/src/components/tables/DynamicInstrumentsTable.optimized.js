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
import { createColumnHelper } from '@tanstack/react-table';
import useInstrumentsTableDataWasm from '../../hooks/useInstrumentsTableDataWasm';
import PerformanceMetricWasm from '../shared/PerformanceMetricWasm';
import SubsystemCell from '../shared/SubsystemCell';
import TestPackCell from '../shared/TestPackCell';
import VirtualizedTableWasm from '../shared/VirtualizedTableWasm';



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
  // Get data and filter integration with WASM optimization
  const {
    data: rawData,
    loading,
    error,
    loadTime,
    queryTime,
    processingTime,
    wasmEnabled,
    selectedIsometric,
    selectedTestPack,
    selectedSubsystem,
    handleTestPackClick,
    handleSubsystemClick,
    setContextTableData,
    setContextGroupBy
  } = useInstrumentsTableDataWasm('dynamic');

  // State declarations
  const [tableData, setTableData] = useState([]);

  // Grouping state
  const [availableFields] = useState(['SUBSYSTEM', 'HITO', 'TP']);
  const [groupBy, setGroupBy] = useState(['SUBSYSTEM', 'HITO']);
  const [expanded, setExpanded] = useState({});

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

  // Calculate frozen sums from raw data (not affected by filters)
  const frozenSums = useMemo(() => {
    if (!rawData || rawData.length === 0) return null;
    
    return {
      totalInst: rawData.reduce((sum, row) => sum + (Number(row['TOTAL INST']) || 0), 0),
      totalSiemsa: rawData.reduce((sum, row) => sum + (Number(row['TOTAL SIEMSA']) || 0), 0),
      installedSiemsa: rawData.reduce((sum, row) => sum + (Number(row['INSTALLED SIEMSA']) || 0), 0),
      totalTeiga: rawData.reduce((sum, row) => sum + (Number(row['TOTAL TEIGA']) || 0), 0),
      installedTeiga: rawData.reduce((sum, row) => sum + (Number(row['INSTALLED TEIGA']) || 0), 0),
      pending: rawData.reduce((sum, row) => sum + (Number(row['PENDING']) || 0), 0),
      done: rawData.reduce((sum, row) => sum + (Number(row['DONE']) || 0), 0)
    };
  }, [rawData]);

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

  if (loading) {
    return (
        <Box mt={6}>
          <Heading size="xs" color="gray.700" mb={2}>
            Dynamic Instruments Table
          </Heading>
          <Center p={8}>
            <Spinner size="xs" color="blue.500" />
            <Text ml={2} color="gray.600">
              Loading data ...
            </Text>
          </Center>
        </Box>
    );
  }

  if (error) {
    return (
        <Box mt={6} p={4} bg="red.50" borderRadius="md">
          <Heading size="md" color="red.600" mb={2}>
            Error
          </Heading>
          <Text color="red.700">{error}</Text>
        </Box>
    );
  }

  return (
      <Box mt={6}>
        <HStack justify="space-between" align="center" mb={4}>
          <Heading size="md" color="gray.700">Dynamic Instruments Table</Heading>
          <HStack>
            {loadTime && <PerformanceMetricWasm label="Load" value={`${loadTime}ms`} description="Time to load data from source and process it" processingTime={processingTime} wasmEnabled={wasmEnabled} />}
            {queryTime && <PerformanceMetricWasm label="Query" value={`${queryTime}ms`} description="Time to execute DuckDB query" />}
            <Badge colorScheme="purple" fontSize="sm" px={3} py={1}>
              {tableData.length} / {rawData.length} Records
            </Badge>
          </HStack>
        </HStack>

        {renderGroupingControls()}

        <VirtualizedTableWasm
          data={tableData}
          columns={columns}
          expanded={expanded}
          onExpandedChange={setExpanded}
          getSubRows={row => row.children}
          width="800px"
          height="500px"
          showDynamicCounts={true}
          frozenDynamicCounts={frozenSums}
        />
      </Box>
  );
};

export default DynamicInstrumentsTable;