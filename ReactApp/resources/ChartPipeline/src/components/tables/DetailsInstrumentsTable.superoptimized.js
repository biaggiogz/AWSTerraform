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
} from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import useInstrumentsTableDataWasm from '../../hooks/useInstrumentsTableDataWasm';
import PerformanceMetricWasm from '../shared/PerformanceMetricWasm';
import SubsystemCell from '../shared/SubsystemCell';
import TestPackCell from '../shared/TestPackCell';
import TestPackProgressCell from '../shared/TestPackProgressCell';
import VirtualizedTableWasm from '../shared/VirtualizedTableWasm';









const DetailsInstrumentsTable = () => {
  // Get data and filter integration with WASM optimization
  const {
    data: tableData,
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
    onIsometricSelect
  } = useInstrumentsTableDataWasm('details');
  
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
      size: 105,
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
  ], [formatDate, handleSubsystemClick, handleTestPackClick, selectedSubsystem, selectedTestPack, selectedIsometric, onIsometricSelect]);

  // Define multi-level header structure
  const multiLevelHeaders = useMemo(() => {
    return [
      // Level 1 - Main categories
      {
        level: 1,
        headers: [
          {
            id: 'instrument_identification',
            title: 'INSTRUMENT IDENTIFICATION',
            colspan: 4,
            startCol: 0,
            color: '#0082A9'
          },
          {
            id: 'subsystem_tp',
            title: 'SUBSYSTEM & TP',
            colspan: 3,
            startCol: 4,
            color: '#B03052'
          },
          {
            id: 'realistc_date',
            title: 'MC REALISTIC DATE',
            colspan: 5,
            startCol: 7,
            color: '#8AB3DB'
          },
          {
            id: 'installation_location',
            title: 'INSTALLATION LOCATION',
            colspan: 3,
            startCol: 12,
            color: '#A888B5'
          },
          {
            id: 'construction_status',
            title: 'CONSTRUCTION STATUS',
            colspan: 5,
            startCol: 15,
            color: '#9F7AEA'
          },
          {
            id: 'testing_commissioning',
            title: 'TESTING & COMMISSIONING',
            colspan: 4,
            startCol: 20,
            color: '#ED8936'
          },
          {
            id: 'procurement',
            title: 'PROCUREMENT',
            colspan: 4,
            startCol: 24,
            color: '#E53E3E'
          }
        ]
      },
      // Level 2 - Sub categories
      {
        level: 2,
        headers: [
          {
            id: 'basic_info',
            title: 'INFO INSTRUMENT',
            colspan: 4,
            startCol: 0,
            color: '#0082A9'
          },
          {
            id: 'assignment',
            title: 'ASSIGNMENT',
            colspan: 3,
            startCol: 4,
            color: '#B03052'
          },
          {
            id: 'timeline',
            title: 'TIMELINE',
            colspan: 5,
            startCol: 7,
            color: '#48BB78'
          },
          {
            id: 'mounting',
            title: 'MOUNTING',
            colspan: 3,
            startCol: 12,
            color: '#D69E2E'
          },
          {
            id: 'physical_status',
            title: 'PHYSICAL STATUS',
            colspan: 5,
            startCol: 15,
            color: '#805AD5'
          },
          {
            id: 'verification',
            title: 'VERIFICATION',
            colspan: 4,
            startCol: 20,
            color: '#DD6B20'
          },
          {
            id: 'supply_chain',
            title: 'SUPPLY CHAIN',
            colspan: 4,
            startCol: 24,
            color: '#E53E3E'
          }
        ]
      }
    ];
  }, []);

  if (loading) {
    return (
      <Center h="400px">
        <Spinner size="xl" color="blue.500" />
      </Center>
    );
  }

  if (error) {
    return (
      <Center h="400px">
        <Text color="red.500">Error loading data: {error}</Text>
      </Center>
    );
  }

  return (
    <Box>
      <PerformanceMetricWasm
        loadTime={loadTime}
        queryTime={queryTime}
        processingTime={processingTime}
        wasmEnabled={wasmEnabled}
        recordCount={tableData?.length || 0}
      />

      <VirtualizedTableWasm
        data={tableData || []}
        columns={columns}
        multiLevelHeaders={multiLevelHeaders}
        height={600}
        enableSorting
        enableFiltering
      />
    </Box>
  );
};

export default DetailsInstrumentsTable;