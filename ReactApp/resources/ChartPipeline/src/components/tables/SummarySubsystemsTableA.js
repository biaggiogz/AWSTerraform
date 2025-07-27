import React, { useMemo, useCallback, useRef, useEffect, useState } from 'react';
import { Box, Heading, Text, HStack, Button, Tooltip, Grid, Progress, VStack } from '@chakra-ui/react';
import { useReactTable, getCoreRowModel, flexRender } from '@tanstack/react-table';
import { VariableSizeList as List } from 'react-window';

const VirtualizedRow = ({ index, style, data }) => {
  const { rows, table } = data;
  const row = rows[index];
  
  return (
    <div style={style}>
      <div className="table-row" style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', height: '100%', minHeight: 'clamp(35px, 5vh, 50px)' }}>
        {row.getVisibleCells().map(cell => (
          <div
            key={cell.id}
            className="table-cell"
            style={{
              width: `${cell.column.getSize()}px`,
              minWidth: `${cell.column.getSize()}px`,
              maxWidth: `${cell.column.getSize()}px`,
              padding: '0.25rem',
              borderRight: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: cell.column.id === 'description' ? 'flex-start' : 'center',
              justifyContent: 'center',
              fontSize: 'clamp(10px, 1vw, 14px)',
              lineHeight: '1.3'
            }}
          >
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </div>
        ))}
      </div>
    </div>
  );
};

const SummarySubsystemsTableA = ({ data, selectedSubsystem, onSubsystemSelect, isInsulFilterVisible, isLoopFilterVisible,isInstFilterVisible, isHitoFilterVisible, isProgressFilterVisible }) => {
  const [filteredData, setFilteredData] = useState(data);
  const lastFilterStateRef = useRef(null);
  const debounceTimeoutRef = useRef(null);
  const filterCacheRef = useRef(new Map());
  const heightCacheRef = useRef(new Map());
  
  // Optimized filter function with caching
  const filterDataByTPs = useCallback((sourceData, filteredTPs) => {
    if (!filteredTPs || filteredTPs.length === 0) return sourceData;
    
    const cacheKey = `${filteredTPs.join(',')}_${sourceData.length}`;
    if (filterCacheRef.current.has(cacheKey)) {
      return filterCacheRef.current.get(cacheKey);
    }
    
    const filteredTPsSet = new Set(filteredTPs.map(String));
    
    const result = sourceData.filter(row => {
      const tpIds = row.list_includes_tp_id;
      if (!tpIds) return false;
      
      let tpIdArray;
      if (typeof tpIds === 'string') {
        tpIdArray = tpIds.split('|');
      } else if (Array.isArray(tpIds)) {
        tpIdArray = tpIds;
      } else if (typeof tpIds === 'number') {
        tpIdArray = [String(tpIds)];
      } else {
        return false;
      }
      
      return tpIdArray.some(tpId => filteredTPsSet.has(String(tpId)));
    });
    
    // Cache result with size limit
    if (filterCacheRef.current.size > 10) {
      filterCacheRef.current.clear();
    }
    filterCacheRef.current.set(cacheKey, result);
    
    return result;
  }, []);
  
  // Optimized filter processing with immediate clear handling
  const processFilterChange = useCallback((filterState, immediate = false) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    const applyFilter = () => {
      const filteredTPs = filterState.map(item => item.testPack);
      const newFilteredData = filterDataByTPs(data, filteredTPs);
      setFilteredData(newFilteredData);
    };
    
    if (immediate || filterState.length === 0) {
      // Apply immediately for clearing filters or when explicitly requested
      applyFilter();
    } else {
      // Use debounce for normal filtering
      debounceTimeoutRef.current = setTimeout(applyFilter, 150);
    }
  }, [data, filterDataByTPs]);
  
  // Optimized effect with immediate clearing
  useEffect(() => {
    if (!window.progressFilterState) {
      window.progressFilterState = { selectedTPs: {}, filteredData: [] };
    }
    
    if (isProgressFilterVisible && window.progressFilterState?.filteredData) {
      const currentFilterData = window.progressFilterState.filteredData;
      const currentFilterState = JSON.stringify(currentFilterData);
      
      if (lastFilterStateRef.current !== currentFilterState) {
        lastFilterStateRef.current = currentFilterState;
        
        // Determine if this is a clearing operation (empty or significantly smaller dataset)
        const wasLarger = lastFilterStateRef.current && 
          JSON.parse(lastFilterStateRef.current).length > currentFilterData.length * 2;
        const isClearing = currentFilterData.length === 0 || wasLarger;
        
        processFilterChange(currentFilterData, isClearing);
      }
    } else {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      lastFilterStateRef.current = null;
      // Immediate reset when filter is turned off
      setFilteredData(data);
    }
    
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [isProgressFilterVisible, data, processFilterChange]);
  
  // Clear caches when data changes
  useEffect(() => {
    filterCacheRef.current.clear();
    heightCacheRef.current.clear();
  }, [data]);

  const columns = useMemo(() => [
    // {
    //   accessorKey: 's_n',
    //   header: 'S/N',
    //   size: 60,
    //   cell: ({ getValue }) => (
    //     <Text fontSize="xs" fontWeight="bold" textAlign="center">{getValue()}</Text>
    //   )
    // },
    {
      // Extract fluid from subsystem (first part before the dash)
      accessorKey: 'fluid_subsystem',
      header: 'FLUID',
      size: 60,
      cell: ({ getValue }) => (
          <Text fontSize="clamp(10px, 1vw, 13px)" textAlign="center">{getValue()}</Text>
      )
    },
    {
      accessorKey: 'subsystem',
      header: 'SUBSYSTEM',
      size: 118,
      cell: ({ getValue, row }) => (
        <Button
          size="xs"
          variant={selectedSubsystem === getValue() ? "solid" : "outline"}
          onClick={() => onSubsystemSelect(getValue())}
          _hover={{ bg: selectedSubsystem === getValue() ? "#007598" : "blue.200" }}
          fontSize="15px"
          fontWeight="small"
          color={selectedSubsystem === getValue() ? "white" : "blue.600"}
          bg={selectedSubsystem === getValue() ? "#007598" : "white"}
          borderColor={selectedSubsystem === getValue() ? "#007598" : "blue.500"}
          minWidth="40px"
          height="26px"
          px={2}
          borderRadius="sm"
          title={getValue()}
          isTruncated
        >
          {getValue()}
        </Button>
      )
    },
    {
      accessorKey: 'hito_isos',
      header: 'HITO',
      size: 80,
      cell: ({ getValue }) => (
        <Text fontSize="clamp(10px, 1vw, 13px)" textAlign="center" title={getValue()}>{getValue()}</Text>
      )
    },
    {
      accessorKey: 'description',
      header: 'DESCRIPTION',
      size: 112,
      cell: ({ getValue }) => (
          <Text fontSize="clamp(10px, 1vw, 13px)" title={getValue()} wordBreak="break-word" textAlign="left" lineHeight="1.3" py={1}>{getValue()}</Text>
      )
    },
    {
      accessorKey: 'n_distinct_tps',
      header: 'N°TP',
      size: 60,
      cell: ({ getValue }) => (
        <Text fontSize="clamp(10px, 1vw, 13px)" textAlign="center">{getValue()}</Text>
      )
    },
    {
      accessorKey: 'total_items',
      header: 'TOTAL ITEMS',
      size: 60,
      cell: ({ getValue }) => (
        <Text fontSize="clamp(10px, 1vw, 13px)" textAlign="center">{getValue()?.toLocaleString()}</Text>
      )
    },
    {
      accessorKey: 'done_items',
      header: 'DONE ITEMS',
      size: 60,
      cell: ({ getValue }) => (
        <Text fontSize="clamp(10px, 1vw, 13px)" textAlign="center">{getValue()?.toLocaleString()}</Text>
      )
    },
    {
      accessorKey: 'pending_items',
      header: 'PENDING ITEMS',
      size: 60,
      cell: ({ getValue }) => (
        <Text fontSize="clamp(10px, 1vw, 13px)"  textAlign="center">{getValue()?.toLocaleString()}</Text>
      )
    },
    {
      accessorKey: 'avg_progress_subsystem',
      header: 'AVG PROGRESS SUBSYSTEM',
      size: 80,
      cell: ({ getValue }) => {
        const value = getValue() || 0;
        const isComplete = value === 100;
        return (
          <Text 
            fontSize="clamp(10px, 1vw, 13px)" 
            textAlign="center"
            bg={isComplete ? '#06923E' : 'transparent'}
            color={isComplete ? 'white' : 'inherit'}
            px={isComplete ? 2 : 0}
            py={isComplete ? 1 : 0}
            borderRadius={isComplete ? 'sm' : 0}
          >
            {value.toFixed(1)}%
          </Text>
        );
      }
    },

    {
      accessorKey: 'total_loop',
      header: 'TOTAL LOOP',
      size: 60,
      cell: ({ getValue, row }) => {
        const getLoopStatusColor = () => {
          const totalLoops = getValue();
          const doneLoops = row.original.done_loop || 0;
          
          if (!isLoopFilterVisible) {
            // When filter is not visible, only show green when total equals done
            const isDone = (totalLoops === doneLoops) && (totalLoops > 0);
            return isDone ? { bg: '#06923E', color: 'white' } : { bg: 'transparent', color: 'inherit' };
          }
          
          // Check if total_loop is null, undefined, empty, or 0 - "Not Apply" case
          if (totalLoops === null || totalLoops === undefined || totalLoops === '' || totalLoops === 0) {
            return { bg: '#212121', color: 'white' };
          }
          
          // Check if all loops are done (total equals done) and there are loops
          const isDone = (totalLoops === doneLoops) && (totalLoops > 0);
          
          // Green for completed, orange for in progress
          const bgColor = isDone ? '#06923E' : '#E85C0D';
          return { bg: bgColor, color: 'white' };
        };
        
        const colors = getLoopStatusColor();
        
        return (
          <Text 
            fontSize="xs" 
            textAlign="center"
            bg={colors.bg}
            color={colors.color}
            px={colors.bg !== 'transparent' ? 2 : 0}
            py={colors.bg !== 'transparent' ? 1 : 0}
            borderRadius={colors.bg !== 'transparent' ? 'sm' : 0}
          >
            {isLoopFilterVisible && (getValue() === null || getValue() === undefined || getValue() === '' || getValue() === 0) ? 'NOT APPLY' : getValue()?.toLocaleString()}
          </Text>
        );
      }
    },
    {
      accessorKey: 'done_loop',
      header: 'LOOP DONE',
      size: 60,
      cell: ({ getValue }) => (
        <Text fontSize="clamp(10px, 1vw, 13px)"  textAlign="center">{getValue()?.toLocaleString()}</Text>
      )
    },
    {
      accessorKey: 'pending_loop',
      header: 'LOOP PENDING',
      size: 60,
      cell: ({ getValue }) => (
        <Text fontSize="clamp(10px, 1vw, 13px)" textAlign="center">{getValue()?.toLocaleString()}</Text>
      )
    },
    {
      accessorKey: 'total_inst',
      header: 'TOTAL INST',
      size: 60,
      cell: ({ getValue, row }) => {
        const getInstStatusColor = () => {
          const totalInst = getValue();
          const doneInst = row.original.done_inst || 0;

          if (!isInstFilterVisible) {
            // When filter is not visible, only show green when total equals done
            const isDone = (totalInst === doneInst) && (totalInst > 0);
            return isDone ? { bg: '#06923E', color: 'white' } : { bg: 'transparent', color: 'inherit' };
          }

          // Check if total_loop is null, undefined, empty, or 0 - "Not Apply" case
          if (totalInst === null || totalInst === undefined || totalInst === '' || totalInst === 0) {
            return { bg: '#212121', color: 'white' };
          }

          // Check if all loops are done (total equals done) and there are loops
          const isDone = (totalInst === doneInst) && (totalInst > 0);

          // Green for completed, orange for in progress
          const bgColor = isDone ? '#06923E' : '#E85C0D';
          return { bg: bgColor, color: 'white' };
        };

        const colors = getInstStatusColor();

        return (
            <Text
                fontSize="xs"
                textAlign="center"
                bg={colors.bg}
                color={colors.color}
                px={colors.bg !== 'transparent' ? 2 : 0}
                py={colors.bg !== 'transparent' ? 1 : 0}
                borderRadius={colors.bg !== 'transparent' ? 'sm' : 0}
            >
              {isInstFilterVisible && (getValue() === null || getValue() === undefined || getValue() === '' || getValue() === 0) ? 'NOT APPLY' : getValue()?.toLocaleString()}
            </Text>
        );
      }

    },
    {
      accessorKey: 'done_inst',
      header: 'DONE INST',
      size: 60,
      cell: ({ getValue }) => (
          <Text fontSize="clamp(10px, 1vw, 13px)"  textAlign="center">{getValue()?.toLocaleString()}</Text>
      )
    },
    {
      accessorKey: 'pending_inst',
      header: 'PENDING INST',
      size: 60,
      cell: ({ getValue }) => (
          <Text fontSize="clamp(10px, 1vw, 13px)" textAlign="center">{getValue()?.toLocaleString()}</Text>
      )
    },
    {
      accessorKey: 'total_tracing',
      header: 'TOTAL TRACING',
      size: 60,
      cell: ({ getValue }) => (
          <Text fontSize="clamp(10px, 1vw, 13px)" textAlign="center">{getValue()?.toLocaleString()}</Text>
      )
    },
    {
      accessorKey: 'done_tracing',
      header: 'DONE TRACING',
      size: 60,
      cell: ({ getValue }) => (
          <Text fontSize="clamp(10px, 1vw, 13px)"  textAlign="center">{getValue()?.toLocaleString()}</Text>
      )
    },
    {
      accessorKey: 'pending_tracing',
      header: 'PENDING TRACING',
      size: 60,
      cell: ({ getValue }) => (
          <Text fontSize="clamp(10px, 1vw, 13px)"  textAlign="center">{getValue()?.toLocaleString()}</Text>
      )
    },
    {
      accessorKey: 'total_insulation',
      header: 'TOTAL INSUL',
      size: 60,
      cell: ({ getValue, row }) => {
        const getInsulStatusColor = () => {

          const totalInsul = getValue() || 0;
          const doneInsul = row.original.done_insulation || 0;

          if (!isInsulFilterVisible) {
            // When filter is not visible, only show green when total equals done
            const isDone = (totalInsul === doneInsul) && (totalInsul > 0);
            return isDone ? { bg: '#06923E', color: 'white' } : { bg: 'transparent', color: 'inherit' };
          }

          // Check if total_loop is null, undefined, empty, or 0 - "Not Apply" case
          if (totalInsul === null || totalInsul === undefined || totalInsul === '' || totalInsul === 0) {
            return { bg: '#212121', color: 'white' };
          }
          // Check if all insul are done (total equals done) and there are insul
          const isDone = (totalInsul === doneInsul) && (totalInsul > 0);
          
          // Green for completed, orange for in progress
          const bgColor = isDone ? '#06923E' : '#E85C0D';
          return { bg: bgColor, color: 'white' };
        };
        
        const colors = getInsulStatusColor();
        
        return (
          <Text 
            fontSize="clamp(10px, 1vw, 13px)" 
            textAlign="center"
            bg={colors.bg}
            color={colors.color}
            px={colors.bg !== 'transparent' ? 2 : 0}
            py={colors.bg !== 'transparent' ? 1 : 0}
            borderRadius={colors.bg !== 'transparent' ? 'sm' : 0}
          >
            {isInsulFilterVisible && (getValue() === null || getValue() === undefined || getValue() === '' || getValue() === 0) ? 'NOT APPLY' : getValue()?.toLocaleString()}
          </Text>
        );
      }
    },
    {
      accessorKey: 'done_insulation',
      header: 'Done Insul',
      size: 60,
      cell: ({ getValue }) => (
        <Text fontSize="clamp(10px, 1vw, 13px)"  textAlign="center">{getValue()?.toLocaleString()}</Text>
      )
    },
    {
      accessorKey: 'pending_insulation',
      header: 'Pending Insul',
      size: 60,
      cell: ({ getValue }) => (
        <Text fontSize="clamp(10px, 1vw, 13px)"  textAlign="center">{getValue()?.toLocaleString()}</Text>
      )
    },
    {
      accessorKey: 'total_punch',
      header: 'TOTAL PUNCH',
      size: 60,
      cell: ({ getValue }) => (
          <Text fontSize="clamp(10px, 1vw, 13px)" textAlign="center">{getValue()?.toLocaleString()}</Text>
      )
    },
    {
      accessorKey: 'close_punch',
      header: 'CLOSE PUNCH',
      size: 60,
      cell: ({ getValue }) => (
          <Text fontSize="clamp(10px, 1vw, 13px)" textAlign="center">{getValue()?.toLocaleString()}</Text>
      )
    },
    {
      accessorKey: 'pending_punch',
      header: 'PENDING PUNCH',
      size: 60,
      cell: ({ getValue }) => (
          <Text fontSize="clamp(10px, 1vw, 13px)"  textAlign="center">{getValue()?.toLocaleString()}</Text>
      )
    },
    {
      accessorKey: 'open_punch',
      header: 'OPEN PUNCH',
      size: 60,
      cell: ({ getValue }) => (
          <Text fontSize="clamp(10px, 1vw, 13px)" textAlign="center">{getValue()?.toLocaleString()}</Text>
      )
    }

  ], [selectedSubsystem, onSubsystemSelect, isInsulFilterVisible, isLoopFilterVisible,isInstFilterVisible, isHitoFilterVisible, isProgressFilterVisible]);

  // Define multi-level header structure
  const multiLevelHeaders = useMemo(() => {
    return [
      // Level 1 - Main categories
      {
        level: 1,
        headers: [
          { 
            id: 'subsystem_info', 
            title: 'SUBSYSTEM INFORMATION', 
            colspan: 5,
            startCol: 0,
            color: '#0082A9'
          },
          { 
            id: 'summary_items', 
            title: 'SUMMARY ITEMS BY SUBSYSTEM', 
            colspan: 4,
            startCol: 5,
            color: '#B03052'
          },
          { 
            id: 'loop_testing', 
            title: 'LOOP SIGNAL PROGRESS', 
            colspan: 3, 
            startCol: 9,
            color: '#8AB3DB'
          },
          { 
            id: 'instruments', 
            title: 'INSTRUMENTS PROGRESS',
            colspan: 3, 
            startCol: 12,
            color: '#A888B5'
          },
          { 
            id: 'tracing', 
            title: 'TRACING PROGRESS',
            colspan: 3, 
            startCol: 15,
            color: '#0ABAB5'
          },
          { 
            id: 'insulation_progress',
            title: 'INSULATION PROGRESS',
            colspan: 3, 
            startCol: 18,
            color: '#E5D6AC'
          },
          {
            id: 'punch',
            title: 'PUNCH LIST PROGRESS',
            colspan: 4,
            startCol: 21,
            color: '#748DAE'
          }
        ]
      },
      // Level 2 - Sub categories
      {
        level: 2,
        headers: [
          { id: 'empty_1', title: '', colspan: 5, startCol: 0, color: 'transparent' },
          { 
            id: 'item_status', 
            title: 'ITEM STATUS',
            colspan: 4, 
            startCol: 5,
            color: '#9E2B4A'
          },
          { 
            id: 'loop_metrics', 
            title: 'LOOP STATUS',
            colspan: 3, 
            startCol: 9,
            color: '#7CA2C5'
          },
          { 
            id: 'instrument_metrics', 
            title: 'INSTRUMENT STATUS',
            colspan: 3, 
            startCol: 12,
            color: '#977AA3'
          },
          { 
            id: 'tracing_metrics', 
            title: 'TRACING STATUS',
            colspan: 3, 
            startCol: 15,
            color: '#09A7A3'
          },
          { 
            id: 'insulation_status',
            title: 'INSULATION STATUS',
            colspan: 3, 
            startCol: 18,
            color: '#CEC19B'
          },
          {
            id: 'punch_metrics',
            title: 'PUNCH LIST STATUS',
            colspan: 4,
            startCol: 21,
            color: '#687F9D'
          }
        ]
      }
    ];
  }, []);

  const listRef = useRef();
  
  // Calculate row height based on description length
  const calculateRowHeight = useCallback((description) => {
    if (!description) return 40;
    
    const textLength = description.length;
    const charsPerLine = 15; // Approximate chars per line in description column
    const linesNeeded = Math.ceil(textLength / charsPerLine);
    const baseHeight = 40;
    const lineHeight = 16;
    
    return Math.max(baseHeight, baseHeight + (linesNeeded - 1) * lineHeight);
  }, []);
  
  // Memoized row heights based on description length
  const rowHeights = useMemo(() => {
    const currentData = isProgressFilterVisible ? filteredData : data;
    const heights = new Map();
    
    currentData?.forEach((row, index) => {
      const description = row.description || '';
      const cacheKey = `${row.id || index}_${description.substring(0, 50)}`;
      
      if (heightCacheRef.current.has(cacheKey)) {
        heights.set(index, heightCacheRef.current.get(cacheKey));
      } else {
        const height = calculateRowHeight(description);
        heights.set(index, height);
        heightCacheRef.current.set(cacheKey, height);
      }
    });
    
    // Limit cache size
    if (heightCacheRef.current.size > 100) {
      const entries = Array.from(heightCacheRef.current.entries());
      heightCacheRef.current.clear();
      entries.slice(-50).forEach(([key, value]) => {
        heightCacheRef.current.set(key, value);
      });
    }
    
    return heights;
  }, [data, filteredData, isProgressFilterVisible, calculateRowHeight]);
  
  // Optimized getRowHeight function
  const getRowHeight = useCallback((index) => {
    return rowHeights.get(index) || 40;
  }, [rowHeights]);
  
  // Memoized table data with subsystem selection priority
  const tableData = useMemo(() => {
    const baseData = isProgressFilterVisible ? filteredData || [] : data || [];
    // Ensure immediate response for subsystem changes by not blocking on filter state
    return baseData;
  }, [isProgressFilterVisible, filteredData, data]);
  
  const table = useReactTable({
    data: tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    enableColumnResizing: true,
    columnResizeMode: 'onChange',
    debugTable: false,
    defaultColumn: {
      minSize: 60,
      size: 100,
      maxSize: 400,
    },
  });

  const rows = table.getRowModel().rows;
  const headerGroups = useMemo(() => table.getHeaderGroups(), [table]);

  return (
    <Box border="1px solid" borderColor="gray.200" borderRadius="md" bg="white" height="100%" display="flex" flexDirection="column">

      {/* Scrollable Container */}
      <Box flex={1} overflowX="auto" overflowY="hidden">
        {/* Multi-Level Table Header */}
        <Box
          borderBottom="1px solid"
          borderColor="gray.200"
          bg="gray.50"
          position="sticky"
          top={0}
          zIndex={1}
        >
          {/* Level 1 Headers */}
          <Box display="flex" width={`${headerGroups[0].headers.reduce((sum, col) => sum + col.getSize(), 0)}px`} minWidth="fit-content">
          {multiLevelHeaders[0].headers.map(header => {
            const totalWidth = headerGroups[0].headers.slice(header.startCol, header.startCol + header.colspan)
              .reduce((sum, col) => sum + col.getSize(), 0);
            return (
              <Box
                key={header.id}
                width={`${totalWidth}px`}
                minWidth={`${totalWidth}px`}
                textAlign="center"
                fontSize="xs"
                textTransform="uppercase"
                letterSpacing="wide"
                color="white"
                py={2}
                px={1}
                borderRight="1px solid"
                borderColor="gray.300"
                borderBottom="1px solid"
                display="flex"
                alignItems="center"
                justifyContent="center"
                bg={header.color}
                minHeight="35px"
              >
                <Text fontSize="xs" textAlign="center" noOfLines={2}>
                  {header.title}
                </Text>
              </Box>
            );
          })}
        </Box>

          {/* Level 2 Headers */}
          <Box display="flex" width={`${headerGroups[0].headers.reduce((sum, col) => sum + col.getSize(), 0)}px`} minWidth="fit-content">
          {multiLevelHeaders[1].headers.map(header => {
            const totalWidth = headerGroups[0].headers.slice(header.startCol, header.startCol + header.colspan)
              .reduce((sum, col) => sum + col.getSize(), 0);
            return (
              <Box
                key={header.id}
                width={`${totalWidth}px`}
                minWidth={`${totalWidth}px`}
                textAlign="center"
                fontSize="xs"
                textTransform="uppercase"
                letterSpacing="wide"
                color={header.color === 'transparent' ? 'transparent' : 'white'}
                py={2}
                px={1}
                borderRight="1px solid"
                borderColor="gray.200"
                borderBottom="1px solid"
                display="flex"
                alignItems="center"
                justifyContent="center"
                bg={header.color}
                minHeight="35px"
              >
                <Text fontSize="xs"  textAlign="center" noOfLines={2}>
                  {header.title}
                </Text>
              </Box>
            );
          })}
        </Box>

          {/* Level 3 Headers - Column Headers */}
          <Box display="flex" width={`${headerGroups[0].headers.reduce((sum, col) => sum + col.getSize(), 0)}px`} minWidth="fit-content">
          {headerGroups[0].headers.map((header, index) => {
            const columnColors = {
              // Subsystem information
              's_n': '#007598',
              'fluid_subsystem': '#007598',
              'subsystem': '#007598', // Both subsystem and fluid use the same accessor
              'hito_isos': '#007598', // HITO is part of subsystem information
              'description': '#007598',
              'n_distinct_tps': '#007598', // N°TP is now part of subsystem information

              // Summary Items by Subsystem
              'total_items': '#B03052',
              'done_items': '#B03052',
              'pending_items': '#B03052',
              'avg_progress_subsystem': '#B03052',

              // Loop Signal Progress
              'total_loop': '#7CA2C5',
              'done_loop': '#7CA2C5',
              'pending_loop': '#7CA2C5',
              
              // Instruments (INST)
              'total_inst': '#A888B5',
              'done_inst': '#A888B5',
              'pending_inst': '#A888B5',
              'total_tracing': '#0ABAB5',
              'done_tracing': '#0ABAB5',
              'pending_tracing': '#0ABAB5',

              // Insul progress
              'total_insulation': '#CEC19B',
              'done_insulation': '#CEC19B',
              'pending_insulation': '#CEC19B',

              'total_punch': '#748DAE',
              'pending_punch': '#748DAE',
              'close_punch': '#748DAE',
              'open_punch': '#748DAE'


            };
            const columnId = header.column.id;
            const bgColor = columnColors[columnId] || '#F7FAFC';
            
            return (
              <Box
                key={header.id}
                width={`${header.getSize()}px`}
                minWidth={`${header.getSize()}px`}
                maxWidth={`${header.getSize()}px`}
                textAlign="center"
                fontSize="xs"
                textTransform="uppercase"
                letterSpacing="wide"
                color="white"
                py={2}
                px={1}
                borderRight="1px solid"
                borderColor="gray.100"
                display="flex"
                alignItems="center"
                justifyContent="center"
                cursor={header.column.getCanSort() ? 'pointer' : 'default'}
                onClick={header.column.getToggleSortingHandler()}
                _hover={header.column.getCanSort() ? { opacity: 0.8 } : {}}
                minHeight="45px"
                position="relative"
                bg={bgColor}
              >
                <HStack spacing={1}>
                  <Text fontSize="xs" noOfLines={3} textAlign="center">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </Text>
                  {header.column.getIsSorted() && (
                    <Text fontSize="xs">{header.column.getIsSorted() === 'desc' ? '↓' : '↑'}</Text>
                  )}
                </HStack>
                {header.column.getCanResize() && (
                  <Box
                    position="absolute"
                    right="0"
                    top="0"
                    height="100%"
                    width="4px"
                    cursor="col-resize"
                    bg="transparent"
                    _hover={{ bg: 'blue.200' }}
                    onMouseDown={header.getResizeHandler()}
                    onTouchStart={header.getResizeHandler()}
                  />
                )}
              </Box>
            );
          })}
          </Box>
        </Box>
        
        {/* Table Body - Virtualized */}
        <Box width={`${headerGroups[0].headers.reduce((sum, col) => sum + col.getSize(), 0)}px`} minWidth="fit-content" flex={1}>
          <List
            ref={listRef}
            height={Math.min(800, window.innerHeight - 300)}
            itemCount={rows.length}
            itemSize={getRowHeight}
            itemData={{ rows, table }}
            width={headerGroups[0].headers.reduce((sum, col) => sum + col.getSize(), 0)}
            style={{ overflowX: 'hidden', overflowY: 'auto' }}
          >
            {VirtualizedRow}
          </List>
        </Box>
      </Box>
      
      {rows.length === 0 && (
        <Box p={4} textAlign="center" color="gray.500">
          <Text fontSize="sm">No subsystem data available</Text>
        </Box>
      )}
    </Box>
  );
};

export default SummarySubsystemsTableA;