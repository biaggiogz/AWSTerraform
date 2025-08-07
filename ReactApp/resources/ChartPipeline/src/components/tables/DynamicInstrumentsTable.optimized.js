import React, { useEffect, useState, useMemo } from 'react';
import {
  Box,
  Text,
  Badge,
  Heading,
  HStack,
  Spinner,
  Center,
  IconButton,
  VStack,
} from '@chakra-ui/react';
import { MdCategory } from 'react-icons/md';
import { createColumnHelper } from '@tanstack/react-table';
import useInstrumentsTableDataWasm from '../../hooks/useInstrumentsTableDataWasm';
import PerformanceMetricWasm from '../shared/PerformanceMetricWasm';
import SubsystemCell from '../shared/SubsystemCell';
import VirtualizedTableWasm from '../shared/VirtualizedTableWasm';
import InstrumentsSubsystemFilter from '../filters/InstrumentsSubsystemFilter';
import InstrumentsProgressChart from '../../charts/InstrumentsProgressChart';
import { useInstrumentsTableFilterContext } from '../filters/InstrumentsTableFilter';









const DynamicInstrumentsTable = () => {
  // Get data and filter integration with WASM optimization
  const {
    data: rawData,
    unfilteredData,
    loading,
    error,
    loadTime,
    queryTime,
    processingTime,
    wasmEnabled,
    selectedSubsystem,
    handleSubsystemClick,
    setContextTableData,
    setContextGroupBy
  } = useInstrumentsTableDataWasm('dynamic');

  // Get subsystem filter context
  const {
    isSubsystemFilterVisible,
    setIsSubsystemFilterVisible,
    subsystemFilteredData,
    setSubsystemFilteredData
  } = useInstrumentsTableFilterContext();

  // State declarations
  const [baseTableData, setBaseTableData] = useState([]);
  const [expanded, setExpanded] = useState({});

  // Calculate frozen sums from truly unfiltered data (never affected by filters)
  const frozenDynamicCounts = useMemo(() => {
    if (!unfilteredData || unfilteredData.length === 0) return null;

    return {
      totalInst: unfilteredData.reduce((sum, row) => sum + (Number(row['TOTAL INST']) || 0), 0),
      totalTeiga: unfilteredData.reduce((sum, row) => sum + (Number(row['TOTAL TEIGA']) || 0), 0),
      installedTeiga: unfilteredData.reduce((sum, row) => sum + (Number(row['INSTALLED TEIGA']) || 0), 0),
      pendingTeiga: unfilteredData.reduce((sum, row) => sum + (Number(row['PENDING TEIGA']) || 0), 0),
      totalSiemsa: unfilteredData.reduce((sum, row) => sum + (Number(row['TOTAL SIEMSA']) || 0), 0),
      installedSiemsa: unfilteredData.reduce((sum, row) => sum + (Number(row['INSTALLED SIEMSA']) || 0), 0),
      pendingSiemsa: unfilteredData.reduce((sum, row) => sum + (Number(row['PENDING SIEMSA']) || 0), 0),
      qfcRelease: unfilteredData.reduce((sum, row) => sum + (Number(row['QFC RELEASE']) || 0), 0),
      qfcPending: unfilteredData.reduce((sum, row) => sum + (Number(row['QFC PENDING']) || 0), 0)
    };
  }, [unfilteredData]);

  // Simple grouping by SUBSYSTEM only
  const groupBySubsystem = useMemo(() => {
    if (!rawData || rawData.length === 0) return [];

    const subsystemGroups = {};
    const numericFields = [
      'TOTAL INST',
      'TOTAL TEIGA',
      'INSTALLED TEIGA',
      'PENDING TEIGA',
      'TOTAL SIEMSA',
      'INSTALLED SIEMSA',
      'PENDING SIEMSA',
      'QFC RELEASE',
      'QFC PENDING'
    ];

    rawData.forEach(row => {
      const subsystem = row['SUBSYSTEM'] || 'N/A';
      if (!subsystemGroups[subsystem]) subsystemGroups[subsystem] = [];
      subsystemGroups[subsystem].push(row);
    });

    return Object.entries(subsystemGroups).map(([subsystem, items]) => {
      const node = { 'SUBSYSTEM': subsystem };

      numericFields.forEach(field => {
        node[field] = items.reduce((sum, row) => sum + (Number(row[field]) || 0), 0);
      });

      return node;
    });
  }, [rawData]);



  // Apply grouping when data changes
  useEffect(() => {
    if (rawData.length > 0) {
      setBaseTableData(groupBySubsystem);
      setContextTableData(groupBySubsystem);
      setContextGroupBy(['SUBSYSTEM']);
    }
  }, [rawData, groupBySubsystem, setContextTableData, setContextGroupBy]);

  // Apply subsystem filter and selected subsystem filter
  const tableData = useMemo(() => {
    let filteredData = baseTableData;

    // Apply subsystem filter from InstrumentsSubsystemFilter
    if (subsystemFilteredData.length > 0) {
      const subsystemSet = new Set(subsystemFilteredData.map(row => row.SUBSYSTEM));
      filteredData = filteredData.filter(row => subsystemSet.has(row.SUBSYSTEM));
    }

    // Apply selected subsystem filter from button clicks
    if (selectedSubsystem) {
      filteredData = filteredData.filter(row => row.SUBSYSTEM === selectedSubsystem);
    }

    return filteredData;
  }, [baseTableData, subsystemFilteredData, selectedSubsystem]);

  // Update context table data for chart
  useEffect(() => {
    setContextTableData(tableData);
  }, [tableData, setContextTableData]);



  // Column definitions
  const columnHelper = createColumnHelper();

  const columns = useMemo(() => [
    columnHelper.accessor('SUBSYSTEM', {
      header: 'SUBSYSTEM',
      cell: info => (
          <SubsystemCell
              subsystem={info.getValue()}
              onSubsystemSelect={handleSubsystemClick}
              selectedSubsystem={selectedSubsystem}
          />
      ),
      size: 120,
    }),
    columnHelper.accessor('TOTAL INST', {
      header: 'TOTAL INST',
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
      meta: { headerStyle: { backgroundColor: '#57564F', color: 'white' } }
    }),
    columnHelper.accessor('PENDING TEIGA', {
      header: 'PENDING TEIGA',
      cell: info => <Text fontSize="xs">{Number(info.getValue())}</Text>,
      size: 90,
      meta: { headerStyle: { backgroundColor: '#DDDAD0', color: 'black' } }
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
      meta: { headerStyle: { backgroundColor: '#015551', color: 'white' } }
    }),
    columnHelper.accessor('PENDING SIEMSA', {
      header: 'PENDING SIEMSA',
      cell: info => <Text fontSize="xs">{Number(info.getValue())}</Text>,
      size: 90,
      meta: { headerStyle: { backgroundColor: '#57B4BA', color: 'white' } }
    }),
    columnHelper.accessor('QFC RELEASE', {
      header: 'QFC RELEASE',
      cell: info => <Text fontSize="xs">{Number(info.getValue())}</Text>,
      size: 90,
      meta: { headerStyle: { backgroundColor: '#386641', color: 'white' } }
    }),
    columnHelper.accessor('QFC PENDING', {
      header: 'QFC PENDING',
      cell: info => <Text fontSize="xs">{Number(info.getValue())}</Text>,
      size: 90,
      meta: { headerStyle: { backgroundColor: '#F97A00', color: 'white' } }
    }),
  ], [selectedSubsystem, handleSubsystemClick]);







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
            {subsystemFilteredData.length > 0 && (
                <Badge colorScheme="orange" fontSize="xs" px={2} py={1}>
                  Filtered from {baseTableData.length}
                </Badge>
            )}
          </HStack>
        </HStack>

        <HStack spacing={4} align="flex-start">
          <Box flex="2">
            <VirtualizedTableWasm
                data={tableData}
                columns={columns}
                expanded={expanded}
                onExpandedChange={setExpanded}
                width="100%"
                height="500px"
                showDynamicCounts={true}
                frozenDynamicCounts={frozenDynamicCounts}
            />
          </Box>
          <Box flex="1">
            <InstrumentsProgressChart />
          </Box>
        </HStack>


      </Box>
  );
};

export default DynamicInstrumentsTable;