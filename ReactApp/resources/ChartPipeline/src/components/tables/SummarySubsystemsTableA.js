import React, { useMemo } from 'react';
import { Box, Heading, Text, HStack, Button, Tooltip, Grid, Progress } from '@chakra-ui/react';
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

const SummarySubsystemsTableA = ({ data, selectedSubsystem, onSubsystemSelect, isItemsFilterVisible, isLoopFilterVisible, isHitoFilterVisible }) => {
  // Log the data structure to help with debugging
  React.useEffect(() => {
    if (data && data.length > 0) {
      console.log('Table A data sample:', data[0]);
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
      accessorKey: 'list_includes_tp_id',
      header: 'TP IDs',
      size: 100,
      cell: ({ getValue, row }) => {
        const value = getValue();
        const tpIds = (value && typeof value === 'string') ? value.split('|') : [];

        const progressRaw = row.original?.list_id_tp_total_progress || '';
        const progressValues = (progressRaw && typeof progressRaw === 'string')
            ? progressRaw.split('|').map(p => parseFloat(p) || 0)
            : [];

        const getColor = (p) => {
          if (p >= 1) return 'green.500';
          if (p >= 0.7) return 'green.300';
          if (p >= 0.4) return 'green.100';
          return 'red.400';
        };

        // Determine grid layout based on number of TPs
        const useGrid = tpIds.length > 2;
        const columnCount = tpIds.length > 4 ? 3 : 2;
        
        return (
            <Box width="100%" maxWidth="100px" overflow="hidden" mx="auto">
              <Box 
                borderWidth="1px" 
                borderRadius="md" 
                bg="white" 
                width="100%"
                p={1}
              >
                {useGrid ? (
                  <Grid templateColumns={`repeat(${columnCount}, 1fr)`} gap={1}>
                    {tpIds.map((id, idx) => {
                      const progress = progressValues[idx] ?? 0;
                      return (
                        <Tooltip key={id} label={`TP ${id} - ${(progress * 100).toFixed(0)}%`} hasArrow>
                          <Box 
                            p={1}
                            bg="gray.50"
                            borderRadius="sm"
                            mb={1}
                          >
                            <Text fontSize="8px" fontWeight="bold" textAlign="center">{id}</Text>
                            <Progress
                              value={progress * 100}
                              size="xs"
                              mt={1}
                              colorScheme={
                                progress >= 1 ? 'green' :
                                progress >= 0.7 ? 'green' :
                                progress >= 0.4 ? 'orange' : 'red'
                              }
                              borderRadius="sm"
                            />
                            <Text fontSize="7px" textAlign="right" mt={0.5}>
                              {(progress * 100).toFixed(0)}%
                            </Text>
                          </Box>
                        </Tooltip>
                      );
                    })}
                  </Grid>
                ) : (
                  // Original vertical layout for 1-2 TPs
                  <Box>
                    {tpIds.map((id, idx) => {
                      const progress = progressValues[idx] ?? 0;
                      return (
                        <Tooltip key={id} label={`TP ${id} - ${(progress * 100).toFixed(0)}%`} hasArrow>
                          <Box 
                            display="flex" 
                            alignItems="center" 
                            justifyContent="space-between"
                            mb={1}
                            p={1}
                            bg="gray.50"
                            borderRadius="sm"
                          >
                            <Text fontSize="9px" fontWeight="bold" width="40%">{id}</Text>
                            <Box width="55%">
                              <Progress
                                value={progress * 100}
                                size="xs"
                                colorScheme={
                                  progress >= 1 ? 'green' :
                                  progress >= 0.7 ? 'green' :
                                  progress >= 0.4 ? 'orange' : 'red'
                                }
                                borderRadius="sm"
                              />
                              <Text fontSize="8px" textAlign="right" mt={0.5}>
                                {(progress * 100).toFixed(0)}%
                              </Text>
                            </Box>
                          </Box>
                        </Tooltip>
                      );
                    })}
                  </Box>
                )}
              </Box>
            </Box>
        );
      }
      },
    {
      accessorKey: 'list_id_tp_total_progress',
      header: 'TP PROGRESS',
      size: 80,
      cell: ({ getValue, row }) => {
        const value = getValue();
        let progressValues = [];
        
        if (value && typeof value === 'string') {
          try {
            progressValues = value.split('|').map(v => parseFloat(v) || 0);
          } catch (error) {
            console.error('Error parsing progress values:', error);
          }
        }
        
        // Calculate average progress if there are values
        let avgProgress = 0;
        if (progressValues.length > 0) {
          avgProgress = progressValues.reduce((sum, val) => sum + val, 0) / progressValues.length;
        }
        
        // Color based on progress percentage
        const getProgressColor = (progress) => {
          if (progress >= 1) return '#2F5249'; // Green for 100%
          if (progress >= 0.7) return '#4C9A8A'; // Lighter green for >= 70%
          if (progress >= 0.4) return '#E85C0D'; // Orange for >= 40%
          return '#C53030'; // Red for < 40%
        };
        
        const bgColor = getProgressColor(avgProgress);
        
        return (
          <Tooltip 
            label={`Average Progress: ${(avgProgress * 100).toFixed(0)}%`}
            hasArrow
            placement="top"
          >
            <Text 
              fontSize="xs" 
              fontWeight="bold" 
              textAlign="center"
              bg={bgColor}
              color="white"
              px={2}
              py={1}
              borderRadius="sm"
            >
              {(avgProgress * 100).toFixed(0)}%
            </Text>
          </Tooltip>
        );
      }
    },
    {
      accessorKey: 'total_insulation',
      header: 'TOTAL ITEMS',
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
      header: 'DONE ITEMS',
      size: 60,
      cell: ({ getValue }) => (
        <Text fontSize="xs" fontWeight="bold" textAlign="center">{getValue()?.toLocaleString()}</Text>
      )
    },
    {
      accessorKey: 'pending_insulation',
      header: 'PENDING ITEMS',
      size: 60,
      cell: ({ getValue }) => (
        <Text fontSize="xs" fontWeight="bold" textAlign="center">{getValue()?.toLocaleString()}</Text>
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

  ], [selectedSubsystem, onSubsystemSelect, isItemsFilterVisible, isLoopFilterVisible, isHitoFilterVisible]);

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
            colspan: 8,
            startCol: 0,
            color: '#0082A9'
          },
          { 
            id: 'items_progress', 
            title: 'ITEMS INSULATION PROGRESS',
            colspan: 3, 
            startCol: 8,
            color: '#E5D6AC'
          },
          { 
            id: 'loop_testing', 
            title: 'LOOP SIGNAL PROGRESS', 
            colspan: 3, 
            startCol: 11,
            color: '#8AB3DB'
          },
          { 
            id: 'instruments', 
            title: 'INSTRUMENTS PROGRESS',
            colspan: 3, 
            startCol: 14,
            color: '#A888B5'
          },
          { 
            id: 'tracing', 
            title: 'TRACING PROGRESS',
            colspan: 3, 
            startCol: 17,
            color: '#0ABAB5'
          },
          {
            id: 'punch',
            title: 'PUNCH LIST PROGRESS',
            colspan: 4,
            startCol: 20,
            color: '#748DAE'
          }
        ]
      },
      // Level 2 - Sub categories
      {
        level: 2,
        headers: [
          { id: 'empty_1', title: '', colspan: 8, startCol: 0, color: 'transparent' },
          { 
            id: 'insulation_status',
            title: 'INSULATION STATUS',
            colspan: 3, 
            startCol: 8,
            color: '#CEC19B'
          },
          { 
            id: 'loop_metrics', 
            title: 'LOOP STATUS',
            colspan: 3, 
            startCol: 11,
            color: '#7CA2C5'
          },
          { 
            id: 'instrument_metrics', 
            title: 'INSTRUMENT STATUS',
            colspan: 3, 
            startCol: 14,
            color: '#977AA3'
          },
          { 
            id: 'tracing_metrics', 
            title: 'TRACING STATUS',
            colspan: 3, 
            startCol: 17,
            color: '#09A7A3'
          },
          {
            id: 'punch_metrics',
            title: 'PUNCH LIST STATUS',
            colspan: 4,
            startCol: 20,
            color: '#687F9D'
          }
        ]
      }
    ];
  }, []);

  // Create a ref for the list component
  const listRef = React.useRef();
  
  // Function to calculate row heights
  const getRowHeight = React.useCallback((index) => {
    const row = data?.[index];
    if (!row) return 60; // Default height
    
    const tpIds = row.list_includes_tp_id || '';
    const tpCount = tpIds && typeof tpIds === 'string' ? tpIds.split('|').length : 0;
    
    // Determine layout based on TP count
    if (tpCount > 4) {
      // 3-column grid for more than 4 TPs
      const rowsNeeded = Math.ceil(tpCount / 3);
      return Math.max(60, (rowsNeeded * 30) + 10);
    } else if (tpCount > 2) {
      // 2-column grid for 3-4 TPs
      const rowsNeeded = Math.ceil(tpCount / 2);
      return Math.max(60, (rowsNeeded * 30) + 10);
    } else {
      // Vertical layout for 1-2 TPs
      return Math.max(60, (tpCount * 22) + 10);
    }
  }, [data]);
  
  const table = useReactTable({
    data: data || [],
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
              'list_includes_tp_id': '#007598', // TP IDs column
              'list_id_tp_total_progress': '#007598', // TP Progress column

              // Items progress
              'total_insulation': '#CEC19B',
              'done_insulation': '#CEC19B',
              'pending_insulation': '#CEC19B',
              
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