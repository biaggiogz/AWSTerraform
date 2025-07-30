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
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useInstrumentsTableFilterContext } from '../filters/InstrumentsTableFilter';
import useInstrumentsDataLoader from '../../hooks/useInstrumentsDataLoader';
import PerformanceMetric from '../shared/PerformanceMetric';
import SubsystemCell from '../shared/SubsystemCell';
import TestPackCell from '../shared/TestPackCell';
import TestPackProgressCell from '../shared/TestPackProgressCell';









const ControlInstrumentsByIsometric = () => {
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
  
  // Data loading
  const whereClause = getSqlWhereClause('control');
  const cacheKey = `control_${selectedIsometric || 'all'}_${selectedSubsystem || 'all'}_${selectedTestPack || 'all'}`;
  const {
    data: tableData,
    loading,
    error,
    loadTime,
    queryTime
  } = useInstrumentsDataLoader('control', whereClause, cacheKey);
  const tableContainerRef = useRef(null);

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
      header: 'ISOMETRIC',
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



  if (loading) {
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

export default ControlInstrumentsByIsometric;