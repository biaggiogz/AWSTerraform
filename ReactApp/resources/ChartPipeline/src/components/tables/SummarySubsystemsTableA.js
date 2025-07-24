import React, { useMemo } from 'react';
import { Box, Heading, Text, HStack, Button, Tooltip, Grid, Progress, VStack } from '@chakra-ui/react';
import { useReactTable, getCoreRowModel, flexRender } from '@tanstack/react-table';
import { VariableSizeList as List } from 'react-window';

const VirtualizedRow = ({ index, style, data }) => {
  const { rows, table } = data;
  const row = rows[index];
  
  return (
    <div style={style}>
      <div className="table-row" style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', height: '100%' }}>
        {row.getVisibleCells().map(cell => (
          <div
            key={cell.id}
            className="table-cell"
            style={{
              width: `${cell.column.getSize()}px`,
              minWidth: `${cell.column.getSize()}px`,
              maxWidth: `${cell.column.getSize()}px`,
              padding: '8px',
              borderRight: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px'
            }}
          >
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </div>
        ))}
      </div>
    </div>
  );
};

const SummarySubsystemsTableA = ({ data, selectedSubsystem, onSubsystemSelect, isItemsFilterVisible, isLoopFilterVisible, isHitoFilterVisible, isProgressFilterVisible }) => {
  // Force re-render when progress filter selection changes
  const [, setForceUpdate] = React.useState(0);
  
  // State to store filtered data
  const [filteredData, setFilteredData] = React.useState(data);
  
  React.useEffect(() => {
    // Initialize global state if needed
    if (!window.progressFilterState) {
      window.progressFilterState = { selectedTPs: {}, filteredData: [] };
    }
    
    // Set up a timer to check for changes in the global progressFilterState
    const intervalId = setInterval(() => {
      setForceUpdate(prev => prev + 1); // Force re-render periodically when filter is visible
      
      // Apply filtering based on progressFilterState
      if (isProgressFilterVisible && window.progressFilterState && window.progressFilterState.filteredData) {
        const filteredTPs = window.progressFilterState.filteredData.map(item => item.testPack);
        
        if (filteredTPs.length > 0) {
          // Filter rows that have at least one matching TP ID
          const newFilteredData = data.filter(row => {
            try {
              const tpIds = row.list_includes_tp_id;
              
              // Handle different data types
              if (!tpIds) return false;
              
              let tpIdArray = [];
              if (typeof tpIds === 'string') {
                tpIdArray = tpIds.split('|');
              } else if (Array.isArray(tpIds)) {
                tpIdArray = tpIds;
              } else if (typeof tpIds === 'number') {
                tpIdArray = [String(tpIds)];
              } else {
                console.warn('Unexpected TP IDs type:', typeof tpIds, tpIds);
                return false;
              }
              
              return tpIdArray.some(tpId => filteredTPs.includes(String(tpId)));
            } catch (error) {
              console.error('Error filtering row:', error, row);
              return false;
            }
          });
          
          setFilteredData(newFilteredData);
        } else {
          setFilteredData(data);
        }
      } else {
        setFilteredData(data);
      }
    }, 500); // Check every 500ms
    
    return () => clearInterval(intervalId);
  }, [isProgressFilterVisible, data]);
  
  // Reset filtered data when progress filter is turned off
  React.useEffect(() => {
    if (!isProgressFilterVisible) {
      setFilteredData(data);
    }
  }, [isProgressFilterVisible, data]);
  // Log the data structure to help with debugging
  React.useEffect(() => {
    if (data && data.length > 0) {
      console.log('Table A data sample:', data[0]);
      console.log('TP IDs type:', typeof data[0].list_includes_tp_id);
      console.log('TP IDs value:', data[0].list_includes_tp_id);
    }
  }, [data]);
  const columns = useMemo(() => [
    {
      accessorKey: 's_n',
      header: 'S/N',
      size: 60,
      cell: ({ getValue }) => (
        <Text fontSize="xs" fontWeight="bold" textAlign="center">{getValue()}</Text>
      )
    },
    {
      // Extract fluid from subsystem (first part before the dash)
      accessorKey: 'fluid_subsystem',
      header: 'FLUID',
      size: 60,
      cell: ({ getValue }) => (
          <Text fontSize="xs" fontWeight="bold" textAlign="center">{getValue()}</Text>
      )
    },
    {
      accessorKey: 'subsystem',
      header: 'SUBSYSTEM',
      size: 104,
      cell: ({ getValue, row }) => (
        <Button
          size="xs"
          variant={selectedSubsystem === getValue() ? "solid" : "outline"}
          onClick={() => onSubsystemSelect(getValue())}
          _hover={{ bg: selectedSubsystem === getValue() ? "#007598" : "blue.200" }}
          fontSize="10px"
          fontWeight="medium"
          color={selectedSubsystem === getValue() ? "white" : "blue.600"}
          bg={selectedSubsystem === getValue() ? "#007598" : "white"}
          borderColor={selectedSubsystem === getValue() ? "#007598" : "blue.500"}
          minWidth="30px"
          height="18px"
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
      size: 104,
      cell: ({ getValue, row }) => {
        // Generate a consistent color based on the hito string for highlighting when filter is active
        const getHitoColor = (hito) => {
          if (!hito) return "#007598";
          const hash = hito.split('').reduce((acc, char) => {
            return char.charCodeAt(0) + ((acc << 5) - acc);
          }, 0);
          
          const h = Math.abs(hash) % 360;
          const s = 60 + (Math.abs(hash) % 30); // 60-90%
          const l = 35 + (Math.abs(hash) % 15); // 35-50%
          
          return `hsl(${h}, ${s}%, ${l}%)`;
        };

        const hitoValue = getValue();
        
        // Only apply special styling when the filter is active or when this specific hito is selected
        const isSelected = selectedSubsystem === hitoValue;
        const bgColor = isHitoFilterVisible ? getHitoColor(hitoValue) : (isSelected ? "#007598" : "white");
        const textColor = isHitoFilterVisible || isSelected ? "white" : "blue.600";
        
        return (
          <Button
            size="xs"
            variant={isHitoFilterVisible || isSelected ? "solid" : "outline"}
            onClick={() => onSubsystemSelect(hitoValue)}
            _hover={{ bg: isHitoFilterVisible || isSelected ? bgColor : "blue.200" }}
            fontSize="10px"
            fontWeight="medium"
            color={textColor}
            bg={bgColor}
            borderColor={isHitoFilterVisible ? bgColor : "blue.500"}
            minWidth="30px"
            height="18px"
            px={2}
            borderRadius="sm"
            title={hitoValue}
            isTruncated
          >
            {hitoValue}
          </Button>
        );
      }
    },
    {
      accessorKey: 'description',
      header: 'DESCRIPTION',
      size: 112,
      cell: ({ getValue }) => (
          <Text fontSize="xs" title={getValue()} noOfLines={2} wordBreak="break-word" textAlign="center">{getValue()}</Text>
      )
    },
    {
      accessorKey: 'n_distinct_tps',
      header: 'N°TP',
      size: 60,
      cell: ({ getValue }) => (
        <Text fontSize="xs" fontWeight="bold" textAlign="center">{getValue()}</Text>
      )
    },
    {
      accessorKey: 'total_items',
      header: 'TOTAL ITEMS',
      size: 60,
      cell: ({ getValue }) => (
        <Text fontSize="xs" fontWeight="bold" textAlign="center">{getValue()?.toLocaleString()}</Text>
      )
    },
    {
      accessorKey: 'done_items',
      header: 'DONE ITEMS',
      size: 60,
      cell: ({ getValue }) => (
        <Text fontSize="xs" fontWeight="bold" textAlign="center">{getValue()?.toLocaleString()}</Text>
      )
    },
    {
      accessorKey: 'pending_items',
      header: 'PENDING ITEMS',
      size: 60,
      cell: ({ getValue }) => (
        <Text fontSize="xs" fontWeight="bold" textAlign="center">{getValue()?.toLocaleString()}</Text>
      )
    },
    {
      accessorKey: 'avg_progress_subsystem',
      header: 'AVG PROGRESS SUBSYSTEM',
      size: 80,
      cell: ({ getValue }) => (
        <Text fontSize="xs" fontWeight="bold" textAlign="center">{(getValue() || 0).toFixed(1)}%</Text>
      )
    },

    {
      accessorKey: 'total_loop',
      header: 'TOTAL LOOP',
      size: 60,
      cell: ({ getValue, row }) => {
        const getLoopStatusColor = () => {
          if (!isLoopFilterVisible) return { bg: 'transparent', color: 'inherit' };
          
          const totalLoops = getValue() || 0;
          const doneLoops = row.original.done_loop || 0;
          // Check if all loops are done (total equals done) and there are loops
          const isDone = (totalLoops === doneLoops) && (totalLoops > 0);
          
          // Green for completed, orange for in progress
          const bgColor = isDone ? '#2F5249' : '#E85C0D';
          return { bg: bgColor, color: 'white' };
        };
        
        const colors = getLoopStatusColor();
        
        return (
          <Text 
            fontSize="xs" 
            fontWeight="bold"
            textAlign="center"
            bg={colors.bg}
            color={colors.color}
            px={colors.bg !== 'transparent' ? 2 : 0}
            py={colors.bg !== 'transparent' ? 1 : 0}
            borderRadius={colors.bg !== 'transparent' ? 'sm' : 0}
          >
            {getValue()?.toLocaleString()}
          </Text>
        );
      }
    },
    {
      accessorKey: 'done_loop',
      header: 'LOOP DONE',
      size: 60,
      cell: ({ getValue }) => (
        <Text fontSize="xs" fontWeight="bold" textAlign="center">{getValue()?.toLocaleString()}</Text>
      )
    },
    {
      accessorKey: 'pending_loop',
      header: 'LOOP PENDING',
      size: 60,
      cell: ({ getValue }) => (
        <Text fontSize="xs" fontWeight="bold" textAlign="center">{getValue()?.toLocaleString()}</Text>
      )
    },
    {
      accessorKey: 'total_inst',
      header: 'TOTAL INST',
      size: 60,
      cell: ({ getValue }) => (
          <Text fontSize="xs" fontWeight="bold" textAlign="center">{getValue()?.toLocaleString()}</Text>
      )
    },
    {
      accessorKey: 'done_inst',
      header: 'DONE INST',
      size: 60,
      cell: ({ getValue }) => (
          <Text fontSize="xs" fontWeight="bold" textAlign="center">{getValue()?.toLocaleString()}</Text>
      )
    },
    {
      accessorKey: 'pending_inst',
      header: 'PENDING INST',
      size: 60,
      cell: ({ getValue }) => (
          <Text fontSize="xs" fontWeight="bold" textAlign="center">{getValue()?.toLocaleString()}</Text>
      )
    },
    {
      accessorKey: 'total_tracing',
      header: 'TOTAL TRACING',
      size: 60,
      cell: ({ getValue }) => (
          <Text fontSize="xs" fontWeight="bold" textAlign="center">{getValue()?.toLocaleString()}</Text>
      )
    },
    {
      accessorKey: 'done_tracing',
      header: 'DONE TRACING',
      size: 60,
      cell: ({ getValue }) => (
          <Text fontSize="xs" fontWeight="bold" textAlign="center">{getValue()?.toLocaleString()}</Text>
      )
    },
    {
      accessorKey: 'pending_tracing',
      header: 'PENDING TRACING',
      size: 60,
      cell: ({ getValue }) => (
          <Text fontSize="xs" fontWeight="bold" textAlign="center">{getValue()?.toLocaleString()}</Text>
      )
    },
    {
      accessorKey: 'total_insulation',
      header: 'Total Insul',
      size: 60,
      cell: ({ getValue, row }) => {
        const getItemsStatusColor = () => {
          if (!isItemsFilterVisible) return { bg: 'transparent', color: 'inherit' };
          
          const totalItems = getValue() || 0;
          const doneItems = row.original.done_insulation || 0;
          // Check if all items are done (total equals done) and there are items
          const isDone = (totalItems === doneItems) && (totalItems > 0);
          
          // Green for completed, orange for in progress
          const bgColor = isDone ? '#2F5249' : '#E85C0D';
          return { bg: bgColor, color: 'white' };
        };
        
        const colors = getItemsStatusColor();
        
        return (
          <Text 
            fontSize="xs" 
            fontWeight="bold"
            textAlign="center"
            bg={colors.bg}
            color={colors.color}
            px={colors.bg !== 'transparent' ? 2 : 0}
            py={colors.bg !== 'transparent' ? 1 : 0}
            borderRadius={colors.bg !== 'transparent' ? 'sm' : 0}
          >
            {getValue()?.toLocaleString()}
          </Text>
        );
      }
    },
    {
      accessorKey: 'done_insulation',
      header: 'Done Insul',
      size: 60,
      cell: ({ getValue }) => (
        <Text fontSize="xs" fontWeight="bold" textAlign="center">{getValue()?.toLocaleString()}</Text>
      )
    },
    {
      accessorKey: 'pending_insulation',
      header: 'Pending Insul',
      size: 60,
      cell: ({ getValue }) => (
        <Text fontSize="xs" fontWeight="bold" textAlign="center">{getValue()?.toLocaleString()}</Text>
      )
    },
    {
      accessorKey: 'total_punch',
      header: 'TOTAL PUNCH',
      size: 60,
      cell: ({ getValue }) => (
          <Text fontSize="xs" fontWeight="bold" textAlign="center">{getValue()?.toLocaleString()}</Text>
      )
    },
    {
      accessorKey: 'close_punch',
      header: 'CLOSE PUNCH',
      size: 60,
      cell: ({ getValue }) => (
          <Text fontSize="xs" fontWeight="bold" textAlign="center">{getValue()?.toLocaleString()}</Text>
      )
    },
    {
      accessorKey: 'pending_punch',
      header: 'PENDING PUNCH',
      size: 60,
      cell: ({ getValue }) => (
          <Text fontSize="xs" fontWeight="bold" textAlign="center">{getValue()?.toLocaleString()}</Text>
      )
    },
    {
      accessorKey: 'open_punch',
      header: 'OPEN PUNCH',
      size: 60,
      cell: ({ getValue }) => (
          <Text fontSize="xs" fontWeight="bold" textAlign="center">{getValue()?.toLocaleString()}</Text>
      )
    }

  ], [selectedSubsystem, onSubsystemSelect, isItemsFilterVisible, isLoopFilterVisible, isHitoFilterVisible, isProgressFilterVisible]);

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
            colspan: 6,
            startCol: 0,
            color: '#0082A9'
          },
          { 
            id: 'summary_items', 
            title: 'SUMMARY ITEMS BY SUBSYSTEM', 
            colspan: 4,
            startCol: 6,
            color: '#B03052'
          },
          { 
            id: 'loop_testing', 
            title: 'LOOP SIGNAL PROGRESS', 
            colspan: 3, 
            startCol: 10,
            color: '#8AB3DB'
          },
          { 
            id: 'instruments', 
            title: 'INSTRUMENTS PROGRESS',
            colspan: 3, 
            startCol: 13,
            color: '#A888B5'
          },
          { 
            id: 'tracing', 
            title: 'TRACING PROGRESS',
            colspan: 3, 
            startCol: 16,
            color: '#0ABAB5'
          },
          { 
            id: 'insulation_progress',
            title: 'INSULATION PROGRESS',
            colspan: 3, 
            startCol: 19,
            color: '#E5D6AC'
          },
          {
            id: 'punch',
            title: 'PUNCH LIST PROGRESS',
            colspan: 4,
            startCol: 22,
            color: '#748DAE'
          }
        ]
      },
      // Level 2 - Sub categories
      {
        level: 2,
        headers: [
          { id: 'empty_1', title: '', colspan: 6, startCol: 0, color: 'transparent' },
          { 
            id: 'item_status', 
            title: 'ITEM STATUS',
            colspan: 4, 
            startCol: 6,
            color: '#9E2B4A'
          },
          { 
            id: 'loop_metrics', 
            title: 'LOOP STATUS',
            colspan: 3, 
            startCol: 10,
            color: '#7CA2C5'
          },
          { 
            id: 'instrument_metrics', 
            title: 'INSTRUMENT STATUS',
            colspan: 3, 
            startCol: 13,
            color: '#977AA3'
          },
          { 
            id: 'tracing_metrics', 
            title: 'TRACING STATUS',
            colspan: 3, 
            startCol: 16,
            color: '#09A7A3'
          },
          { 
            id: 'insulation_status',
            title: 'INSULATION STATUS',
            colspan: 3, 
            startCol: 19,
            color: '#CEC19B'
          },
          {
            id: 'punch_metrics',
            title: 'PUNCH LIST STATUS',
            colspan: 4,
            startCol: 22,
            color: '#687F9D'
          }
        ]
      }
    ];
  }, []);

  // Create a ref for the list component
  const listRef = React.useRef();
  
  // Function to calculate row heights based on TP IDs box height
  const getRowHeight = React.useCallback((index) => {
    const row = data?.[index];
    if (!row) return 60;

    const tpIds = row.list_includes_tp_id || '';
    const tpCount = tpIds && typeof tpIds === 'string' ? tpIds.split('|').length : 0;

    let boxHeight;

    if (tpCount > 6) {
      const rowsNeeded = Math.ceil(tpCount / 4);
      boxHeight = Math.max(80, rowsNeeded * 42 + 24); // Ensure minimum height for 4-column grid
    } else if (tpCount > 4) {
      const rowsNeeded = Math.ceil(tpCount / 3);
      boxHeight = Math.max(80, rowsNeeded * 42 + 24); // Ensure minimum height for 3-column grid
    } else if (tpCount > 2) {
      const rowsNeeded = Math.ceil(tpCount / 2);
      boxHeight = rowsNeeded * 42 + 20;
    } else if (tpCount > 0) {
      boxHeight = tpCount * 42 + 12;
    } else {
      boxHeight = 50;
    }

    return Math.max(70, boxHeight); // slightly bump base height
  }, [data]);
  
  const table = useReactTable({
    data: isProgressFilterVisible ? filteredData || [] : data || [],
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
                fontWeight="bold"
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
                <Text fontSize="xs" fontWeight="bold" textAlign="center" noOfLines={2}>
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
                fontWeight="semibold"
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
                <Text fontSize="xs" fontWeight="semibold" textAlign="center" noOfLines={2}>
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

              // Items progress
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
                fontWeight="bold"
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
            height={600}
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