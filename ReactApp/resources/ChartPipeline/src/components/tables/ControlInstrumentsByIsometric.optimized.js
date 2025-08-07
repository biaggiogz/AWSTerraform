import React, { useEffect, useState, useMemo, useRef } from 'react';
import {
  Box,
  Text,
  Badge,
  Heading,
  HStack,
  Spinner,
  Center,
  Button,
  IconButton,
} from '@chakra-ui/react';
import { MdCategory } from 'react-icons/md';
import { createColumnHelper } from '@tanstack/react-table';
import useInstrumentsTableDataWasm from '../../hooks/useInstrumentsTableDataWasm';
import PerformanceMetricWasm from '../shared/PerformanceMetricWasm';
import SubsystemCell from '../shared/SubsystemCell';
import TestPackCell from '../shared/TestPackCell';
import TestPackProgressCell from '../shared/TestPackProgressCell';
import VirtualizedTableWasm from '../shared/VirtualizedTableWasm';
import InstrumentsSubsystemFilter from '../filters/InstrumentsSubsystemFilter';
import { useInstrumentsTableFilterContext } from '../filters/InstrumentsTableFilter';









const ControlInstrumentsByIsometric = () => {
  // Get data and filter integration with WASM optimization
  const {
    data: rawTableData,
    originalData,
    unfilteredData,
    loading,
    error,
    loadTime,
    queryTime,
    processingTime,
    wasmEnabled,
    frozenControlCounts,
    selectedIsometric,
    selectedTestPack,
    selectedSubsystem,
    handleTestPackClick,
    handleSubsystemClick,
    onIsometricSelect
  } = useInstrumentsTableDataWasm('control');

  // Get subsystem filter context
  const {
    isSubsystemFilterVisible,
    setIsSubsystemFilterVisible,
    subsystemFilteredData,
    setSubsystemFilteredData
  } = useInstrumentsTableFilterContext();

  // Apply subsystem filter
  const tableData = useMemo(() => {
    if (subsystemFilteredData.length === 0) return rawTableData;
    const subsystemSet = new Set(subsystemFilteredData.map(row => row.SUBSYSTEM));
    return rawTableData.filter(row => subsystemSet.has(row.SUBSYSTEM));
  }, [rawTableData, subsystemFilteredData]);

  // Calculate frozen QTY INST count from truly unfiltered data
  const frozenQtyInstCount = useMemo(() => {
    if (!unfilteredData || unfilteredData.length === 0) return 0;
    return unfilteredData.reduce((sum, row) => sum + (Number(row['QTY INST']) || 0), 0);
  }, [unfilteredData]);

  // Calculate frozen counts for additional columns from truly unfiltered data
  const frozenScopeTeigaCount = useMemo(() => {
    if (!unfilteredData || unfilteredData.length === 0) return 0;
    return unfilteredData.reduce((sum, row) => sum + (Number(row['SCOPE BY TEIGA-TMI']) || 0), 0);
  }, [unfilteredData]);

  const frozenScopeSiemsaCount = useMemo(() => {
    if (!unfilteredData || unfilteredData.length === 0) return 0;
    return unfilteredData.reduce((sum, row) => sum + (Number(row['SCOPE BY SIEMSA']) || 0), 0);
  }, [unfilteredData]);

  const frozenInstalledTeigaCount = useMemo(() => {
    if (!unfilteredData || unfilteredData.length === 0) return 0;
    return unfilteredData.reduce((sum, row) => sum + (Number(row['INSTALLED BY TEIGA-TMI']) || 0), 0);
  }, [unfilteredData]);

  const frozenInstalledSiemsaCount = useMemo(() => {
    if (!unfilteredData || unfilteredData.length === 0) return 0;
    return unfilteredData.reduce((sum, row) => sum + (Number(row['INSTALLED BY SIEMSA']) || 0), 0);
  }, [unfilteredData]);

  const frozenPendingCount = useMemo(() => {
    if (!unfilteredData || unfilteredData.length === 0) return 0;
    return unfilteredData.reduce((sum, row) => sum + (Number(row['PENDING']) || 0), 0);
  }, [unfilteredData]);

  // Helper function to format timestamp to date
  const formatDate = (timestamp) => {
    if (!timestamp) return '';
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
    columnHelper.accessor('ISOMETRIC', {
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
                fontFamily="mono"
            >
              {String(isometric)}
            </Button>
        );
      },
      size: 240,
    }),
    columnHelper.accessor('PROGRESS FW+SW', {
      header: 'PROGRESS FW+SW',
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
      size: 90,
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
      size: 105,
    }),
    columnHelper.accessor('HITO', {
      header: 'HITO',
      cell: info => <Text fontSize="xs">{info.getValue()}</Text>,
      size: 120,
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
    columnHelper.accessor('TECHNIP', {
      header: 'TECHNIP',
      cell: info => <Text fontSize="xs">{formatDate(info.getValue())}</Text>,
      size: 90,
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
    columnHelper.accessor('QTY INST', {
      header: 'QTY INST',
      cell: info => <Text fontSize="xs">{Number(info.getValue())}</Text>,
      size: 90,
    }),
    columnHelper.accessor('SCOPE BY TEIGA-TMI', {
      header: 'SCOPE BY TEIGA-TMI',
      cell: info => <Text fontSize="xs">{Number(info.getValue())}</Text>,
      size: 90,
    }),
    columnHelper.accessor('SCOPE BY SIEMSA', {
      header: 'SCOPE BY SIEMSA',
      cell: info => <Text fontSize="xs">{Number(info.getValue())}</Text>,
      size: 90,
    }),
    columnHelper.accessor('INSTALLED BY TEIGA-TMI', {
      header: 'INSTALLED BY TEIGA-TMI',
      cell: info => <Text fontSize="xs">{Number(info.getValue())}</Text>,
      size: 90,
    }),
    columnHelper.accessor('INSTALLED BY SIEMSA', {
      header: 'INSTALLED BY SIEMSA',
      cell: info => <Text fontSize="xs">{Number(info.getValue())}</Text>,
      size: 90,
    }),
    columnHelper.accessor('PENDING', {
      header: 'PENDING',
      cell: info => <Text fontSize="xs">{Number(info.getValue())}</Text>,
      size: 90,
    }),
  ], [formatDate, handleSubsystemClick, handleTestPackClick, onIsometricSelect, selectedIsometric, selectedSubsystem, selectedTestPack]);


  // Define multi-level header structure with row colors
  const multiLevelHeaders = useMemo(() => {
    return [
      {
        level: 1,
        headers: [
          {
            id: 'progress_weld_iso',
            title: 'PROGRESS WELD ISO',
            colspan: 2,
            startCol: 0,
            color: '#002b5b',
            rowBgColor: 'rgba(52, 74, 104, 0.2)' // 20% lighter
          },
          {
            id: 'subsystem',
            title: 'SUBSYSTEM',
            colspan: 1,
            startCol: 2,
            color: '#006494',
            rowBgColor: 'rgba(94, 135, 165, 0.2)' // 20% lighter
          },
          {
            id: 'mc',
            title: 'MECHANICAL COMPLETION (MC) REALISTIC DATE BY SUBSYSTEM',
            colspan: 4,
            startCol: 3,
            color: '#1b4965',
            rowBgColor: 'rgba(94, 135, 165, 0.2)' // 20% lighter
          },
          {
            id: 'tp',
            title: 'PROGRESS ISO TEST PACK',
            colspan: 2,
            startCol: 7,
            color: '#264653',
            rowBgColor: 'rgba(69, 89, 113, 0.2)' // 20% lighter
          },
          {
            id: 'inst_distribution',
            title: 'INST DISTRIBUTION',
            colspan: 3,
            startCol: 9,
            color: '#2a9d8F',
            rowBgColor: 'rgba(64, 125, 164, 0.2)' // 20% lighter
          },
          {
            id: 'inst_installed',
            title: 'INST INSTALLED',
            colspan: 3,
            startCol: 12,
            color: '#287271',
            rowBgColor: 'rgba(68, 117, 148, 0.2)' // 20% lighter
          }
        ]
      }
    ];
  }, []);



  if (loading) {
    return (
        <Box mt={6}>
          <Heading size="xs" color="gray.700" mb={2}>
            Control Instruments by Isometric
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
          <Heading size="md" color="gray.700">Controls Instruments By Isometric</Heading>
          <HStack>
            <IconButton
                icon={<MdCategory />}
                size="sm"
                variant="ghost"
                onClick={() => {
                  if (isSubsystemFilterVisible) {
                    setSubsystemFilteredData([]);
                  }
                  setIsSubsystemFilterVisible(!isSubsystemFilterVisible);
                }}
                aria-label="Toggle subsystem filter"
                title="Subsystem Filter"
            />
            {loadTime && <PerformanceMetricWasm label="Load" value={`${loadTime}ms`} description="Time to load data from source and process it" processingTime={processingTime} wasmEnabled={wasmEnabled} />}
            {queryTime && <PerformanceMetricWasm label="Query" value={`${queryTime}ms`} description="Time to execute DuckDB query" />}
            <Badge colorScheme="purple" fontSize="sm" px={3} py={1}>
              {tableData.length} Records
            </Badge>
            {subsystemFilteredData.length > 0 && (
                <Badge colorScheme="orange" fontSize="xs" px={2} py={1}>
                  Filtered from {rawTableData.length}
                </Badge>
            )}
          </HStack>
        </HStack>

        <VirtualizedTableWasm
            data={tableData}
            columns={columns}
            multiLevelHeaders={multiLevelHeaders}
            width="100%"
            height="500px"
            showControlCounts={true}
            frozenControlCounts={frozenControlCounts}
            showQtyInstCounts={true}
            frozenQtyInstCount={frozenQtyInstCount}
            showScopeCounts={true}
            frozenScopeTeigaCount={frozenScopeTeigaCount}
            frozenScopeSiemsaCount={frozenScopeSiemsaCount}
            frozenInstalledTeigaCount={frozenInstalledTeigaCount}
            frozenInstalledSiemsaCount={frozenInstalledSiemsaCount}
            frozenPendingCount={frozenPendingCount}
        />

        <InstrumentsSubsystemFilter
            data={rawTableData}
            onFilterChange={setSubsystemFilteredData}
            isVisible={isSubsystemFilterVisible}
            onClose={() => {
              setIsSubsystemFilterVisible(false);
            }}
        />
      </Box>
  );
};




export default ControlInstrumentsByIsometric;