import React, { useEffect, useState, useMemo } from 'react';
import {
  Box,
  Text,
  Badge,
  Heading,
  HStack,
  Spinner,
  Center,
} from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import useInstrumentsTableDataWasm from '../../hooks/useInstrumentsTableDataWasm';
import PerformanceMetricWasm from '../shared/PerformanceMetricWasm';
import SubsystemCell from '../shared/SubsystemCell';
import VirtualizedTableWasm from '../shared/VirtualizedTableWasm';









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

  // State declarations
  const [tableData, setTableData] = useState([]);
  const [expanded, setExpanded] = useState({});

  // Calculate frozen sums from truly unfiltered data (never affected by filters)
  const frozenDynamicCounts = useMemo(() => {
    if (!unfilteredData || unfilteredData.length === 0) return null;
    
    return {
      totalInst: unfilteredData.reduce((sum, row) => sum + (Number(row['TOTAL INST']) || 0), 0),
      totalSiemsa: unfilteredData.reduce((sum, row) => sum + (Number(row['TOTAL SIEMSA']) || 0), 0),
      installedSiemsa: unfilteredData.reduce((sum, row) => sum + (Number(row['INSTALLED SIEMSA']) || 0), 0),
      totalTeiga: unfilteredData.reduce((sum, row) => sum + (Number(row['TOTAL TEIGA']) || 0), 0),
      installedTeiga: unfilteredData.reduce((sum, row) => sum + (Number(row['INSTALLED TEIGA']) || 0), 0),
      pending: unfilteredData.reduce((sum, row) => sum + (Number(row['PENDING']) || 0), 0),
      done: unfilteredData.reduce((sum, row) => sum + (Number(row['DONE']) || 0), 0)
    };
  }, [unfilteredData]);

  // Simple grouping by SUBSYSTEM only
  const groupBySubsystem = useMemo(() => {
    if (!rawData || rawData.length === 0) return [];

    const subsystemGroups = {};
    const numericFields = [
      'TOTAL INST',
      'TOTAL SIEMSA', 
      'INSTALLED TEIGA',
      'INSTALLED SIEMSA',
      'TOTAL TEIGA',
      'PENDING',
      'DONE'
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
      setTableData(groupBySubsystem);
      setContextTableData(groupBySubsystem);
      setContextGroupBy(['SUBSYSTEM']);
    }
  }, [rawData, groupBySubsystem, setContextTableData, setContextGroupBy]);



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
      cell: info => <Text fontSize="xs">{Number(info.getValue())}</Text>,
      size: 90,
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
          </HStack>
        </HStack>

        <VirtualizedTableWasm
          data={tableData}
          columns={columns}
          expanded={expanded}
          onExpandedChange={setExpanded}
          width="800px"
          height="500px"
          showDynamicCounts={true}
          frozenDynamicCounts={frozenDynamicCounts}
        />
      </Box>
  );
};

export default DynamicInstrumentsTable;