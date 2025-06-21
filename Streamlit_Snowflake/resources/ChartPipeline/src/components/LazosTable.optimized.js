import React, { useMemo, useCallback, useState, useEffect } from 'react';
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Text,
  Badge,
  Progress,
  Heading,
  HStack,
  VStack,
  Button,
  Portal,
  IconButton,
  useBreakpointValue
} from '@chakra-ui/react';
import { ExternalLinkIcon, AttachmentIcon } from '@chakra-ui/icons';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import Draggable from 'react-draggable';
import { Resizable } from 'react-resizable';
import 'react-resizable/css/styles.css';
import './ResizableTable.css';

const columnHelper = createColumnHelper();

/**
 * LazosTable component - Virtualized table for loop test progress data
 * @param {Object} props - Component props
 * @param {Array} props.data - Filtered dataset
 */
const LazosTable = React.memo(({ data }) => {
  // State for detached table
  const [isDetached, setIsDetached] = useState(false);
  
  // State for resizable dimensions
  const [tableSize, setTableSize] = useState({ width: 1200, height: 600 });
  
  // Responsive breakpoint values
  const isMobile = useBreakpointValue({ base: true, md: false });
  const isTablet = useBreakpointValue({ base: false, md: true, lg: false });
  
  // Responsive table dimensions
  const responsiveWidth = useMemo(() => {
    if (isMobile) return Math.min(tableSize.width, window.innerWidth - 40);
    if (isTablet) return Math.min(tableSize.width, window.innerWidth - 80);
    return tableSize.width;
  }, [tableSize.width, isMobile, isTablet]);
  
  const responsiveHeight = useMemo(() => {
    if (isMobile) return Math.min(tableSize.height, window.innerHeight - 200);
    return tableSize.height;
  }, [tableSize.height, isMobile]);
  // Memoize processed data to avoid recalculations
  const processedData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    return data.map((row, index) => ({
      id: index,
      code: row.CODE || '',
      subsystem: row.SUBS_PRE || '',
      tagLoop: row['TAG LOOP'] || '',
      area: row.Area || '',
      priority: row.PRIORITY || '',
      loop: row.LOOP || '',
      tags: row.TagS || '',
      service: row.SERVICE || '',
      installed: row.INSTALLED || '',
      wired: row.WIRED || '',
      connected: row.CONNECTED || '',
      cableTest: row['CABLE TEST'] || '',
      qcf: row.QCF || '',
      progress: row['OK=100%'] || '0.00%',
      dossier: row.DOSSIER || '',
      testLoop: row['TEST LOOP'] || ''
    }));
  }, [data]);

  // Define table columns with fixed layout and consistent styling
  const columns = useMemo(() => [
    columnHelper.accessor('code', {
      header: 'Code',
      minSize: 80,
      maxSize: 80,
      size: 80,
      cell: ({ getValue }) => (
        <Text fontSize="sm" fontWeight="medium" color="blue.600" textAlign="center">
          {getValue()}
        </Text>
      )
    }),
    columnHelper.accessor('subsystem', {
      header: 'Subsystem',
      minSize: 120,
      maxSize: 120,
      size: 120,
      cell: ({ getValue }) => (
          <Text fontSize="sm" fontWeight="medium" textAlign="center">
            {getValue()}
          </Text>
      )
    }),
    columnHelper.accessor('tagLoop', {
      header: 'Tag Loop',
      minSize: 100,
      maxSize: 100,
      size: 100,
      cell: ({ getValue }) => (
        <Text fontSize="sm" fontFamily="mono" textAlign="center">
          {getValue()}
        </Text>
      )
    }),
    columnHelper.accessor('area', {
      header: 'Area',
      minSize: 80,
      maxSize: 80,
      size: 80,
      cell: ({ getValue }) => (
          <Text fontSize="sm" fontWeight="medium" textAlign="center">
            {getValue()}
          </Text>
      )
    }),
    columnHelper.accessor('priority', {
      header: 'Priority',
      minSize: 70,
      maxSize: 70,
      size: 70,
      cell: ({ getValue }) => {
        const priority = getValue();
        return (
            <Text fontSize="sm" fontWeight="medium" textAlign="center">
              {priority}
            </Text>
        );
      }
    }),
    columnHelper.accessor('service', {
      header: 'Service',
      minSize: 200,
      maxSize: 200,
      size: 200,
      cell: ({ getValue }) => (
          <Text fontSize="sm" noOfLines={2} maxW="190px" textAlign="center">
            {getValue()}
          </Text>
      )
    }),
    columnHelper.accessor('installed', {
      header: 'Installed',
      minSize: 100,
      maxSize: 100,
      size: 100,
      cell: ({ getValue }) => {
        const value = getValue();
        const parts = value ? value.split(' ') : ['Pending'];

        return (
            <VStack spacing={0} py={1}>
              {parts.map((part, i) => (
                  <Text key={i} fontSize="xs" fontWeight="medium" textAlign="center">
                    {part}
                  </Text>
              ))}
            </VStack>
        );
      }
    }),
    columnHelper.accessor('wired', {
      header: 'Wired',
      minSize: 100,
      maxSize: 100,
      size: 100,
      cell: ({ getValue }) => {
        const value = getValue();
        const parts = value ? value.split(' ') : ['Pending'];
        return (
            <VStack spacing={0} py={1}>
              {parts.map((part, i) => (
                  <Text key={i} fontSize="xs" fontWeight="medium" textAlign="center">
                    {part}
                  </Text>
              ))}
            </VStack>
        );
      }
    }),
    columnHelper.accessor('connected', {
      header: 'Connected',
      minSize: 100,
      maxSize: 100,
      size: 100,
      cell: ({ getValue }) => {
        const value = getValue();
        const parts = value ? value.split(' ') : ['Pending'];
        return (
            <VStack spacing={0} py={1}>
              {parts.map((part, i) => (
                  <Text key={i} fontSize="xs" fontWeight="medium" textAlign="center">
                    {part}
                  </Text>
              ))}
            </VStack>
        );
      }
    }),
    columnHelper.accessor('cableTest', {
      header: 'Cable Test',
      minSize: 100,
      maxSize: 100,
      size: 100,
      cell: ({ getValue }) => {
        const value = getValue();
        const parts = value ? value.split(' ') : ['Pending'];
        return (
            <VStack spacing={0} py={1}>
              {parts.map((part, i) => (
                  <Text key={i} fontSize="xs" fontWeight="medium" textAlign="center">
                    {part}
                  </Text>
              ))}
            </VStack>
        );
      }
    }),
    columnHelper.accessor('progress', {
      header: 'Progress',
      minSize: 120,
      maxSize: 120,
      size: 120,
      cell: ({ getValue }) => {
        const progressStr = getValue();
        const progressValue = parseFloat(progressStr.replace('%', '')) || 0;
        const colorScheme = progressValue === 100 ? 'green' : progressValue >= 50 ? 'yellow' : 'red';
        
        return (
          <Box height="40px" display="flex" flexDirection="column" justifyContent="center">
            <Progress 
              value={progressValue} 
              size="sm" 
              colorScheme={colorScheme}
              borderRadius="md"
              mb={1}
            />
            <Text fontSize="xs" textAlign="center" fontWeight="medium">
              {progressStr}
            </Text>
          </Box>
        );
      }
    }),
    columnHelper.accessor('dossier', {
      header: 'Dossier',
      minSize: 100,
      maxSize: 100,
      size: 100,
      cell: ({ getValue }) => (
        <Text fontSize="sm" color="gray.600" textAlign="center">
          {getValue()}
        </Text>
      )
    }),
    columnHelper.accessor('testLoop', {
      header: 'Test Loop',
      minSize: 100,
      maxSize: 100,
      size: 100,
      cell: ({ getValue }) => (
        <Text fontSize="sm" fontFamily="mono" color="blue.500" textAlign="center">
          {getValue()}
        </Text>
      )
    })
  ], []);

  // Create table instance with memoization
  const table = useReactTable({
    data: processedData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    debugTable: false,
  });

  // Get table rows
  const { rows } = table.getRowModel();

  // Create separate refs for attached and detached states
  const attachedParentRef = React.useRef();
  const detachedParentRef = React.useRef();

  // Create separate virtualizers for attached and detached states
  const attachedVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => attachedParentRef.current,
    estimateSize: () => 50,
    overscan: 10,
  });

  const detachedVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => detachedParentRef.current,
    estimateSize: () => 50,
    overscan: 10,
  });

  // Memoize header rendering
  const headerGroups = useMemo(() => table.getHeaderGroups(), [table]);

  // Toggle detach/attach functionality
  const toggleDetach = useCallback(() => {
    setIsDetached(prev => !prev);
  }, []);

  // Handle resize for detached table
  const handleResize = useCallback((event, { size }) => {
    setTableSize({
      width: Math.max(800, Math.min(size.width, window.innerWidth - 100)),
      height: Math.max(400, Math.min(size.height, window.innerHeight - 150))
    });
  }, []);

  // Force virtualizer re-measurement when detaching/attaching or resizing
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isDetached && detachedVirtualizer) {
        detachedVirtualizer.measure();
      } else if (!isDetached && attachedVirtualizer) {
        attachedVirtualizer.measure();
      }
    }, 0);
    
    return () => clearTimeout(timer);
  }, [isDetached, detachedVirtualizer, attachedVirtualizer, tableSize]);

  // Render table content (reusable for both inline and detached)
  const renderTableContent = useCallback((showControls = false) => {
    const currentParentRef = isDetached ? detachedParentRef : attachedParentRef;
    const currentVirtualizer = isDetached ? detachedVirtualizer : attachedVirtualizer;
    
    const tableContent = (
    <Box
      border="1px solid"
      borderColor="gray.200"
      borderRadius="lg"
      overflow="hidden"
      bg="white"
      boxShadow={isDetached ? "2xl" : "sm"}
      width={isDetached ? `${responsiveWidth}px` : "100%"}
      height={isDetached ? `${responsiveHeight}px` : "auto"}
      maxWidth={isDetached ? "none" : "100%"}
      position="relative"
    >
      {/* Header with controls for detached mode */}
      {showControls && (
        <Box 
          bg="blue.50" 
          borderBottom="1px solid" 
          borderColor="gray.200"
          p={2}
          cursor="move"
          className="drag-handle"
        >
          <HStack justify="space-between" align="center">
            <HStack>
              <Heading size="sm" color="gray.700">
                Loop Test Control - Precommissioning (Detached)
              </Heading>
              <Badge colorScheme="blue" fontSize="xs" px={2} py={1}>
                {processedData.length} LOOPS
              </Badge>
            </HStack>
            <IconButton
              icon={<AttachmentIcon />}
              size="sm"
              colorScheme="blue"
              variant="ghost"
              onClick={toggleDetach}
              aria-label="Attach table"
              title="Attach table back to tab"
            />
          </HStack>
        </Box>
      )}
      
      {/* Table Header */}
      <Box bg="gray.50" borderBottom="1px solid" borderColor="gray.200">
        <Table size="sm" style={{ tableLayout: 'fixed' }}>
          <Thead>
            {headerGroups.map(headerGroup => (
              <Tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <Th
                    key={header.id}
                    width={`${header.getSize()}px`}
                    minWidth={`${header.getSize()}px`}
                    maxWidth={`${header.getSize()}px`}
                    cursor={header.column.getCanSort() ? 'pointer' : 'default'}
                    onClick={header.column.getToggleSortingHandler()}
                    bg="gray.50"
                    borderColor="gray.200"
                    fontSize="xs"
                    fontWeight="bold"
                    textTransform="uppercase"
                    letterSpacing="wide"
                    color="gray.600"
                    py={2}
                    px={2}
                    textAlign="center"
                  >
                    {header.isPlaceholder ? null : (
                      <HStack spacing={1} justify="center">
                        <Text>
                          {flexRender(header.column.columnDef.header, header.getContext())}
                        </Text>
                        {header.column.getIsSorted() && (
                          <Text fontSize="xs">
                            {header.column.getIsSorted() === 'desc' ? '↓' : '↑'}
                          </Text>
                        )}
                      </HStack>
                    )}
                  </Th>
                ))}
              </Tr>
            ))}
          </Thead>
        </Table>
      </Box>

      {/* Virtualized Table Body */}
      <Box
        ref={currentParentRef}
        height={isDetached ? `${responsiveHeight - 120}px` : "500px"}
        overflowY="auto"
        overflowX="auto"
      >
        <Box
          height={`${currentVirtualizer.getTotalSize()}px`}
          position="relative"
        >
          {currentVirtualizer.getVirtualItems().map(virtualRow => {
            const row = rows[virtualRow.index];
            return (
              <Box
                key={row.id}
                position="absolute"
                top={0}
                left={0}
                width="100%"
                height={`${virtualRow.size}px`}
                transform={`translateY(${virtualRow.start}px)`}
              >
                <Table size="sm" style={{ tableLayout: 'fixed' }}>
                  <Tbody>
                    <Tr
                      _hover={{ bg: 'gray.50' }}
                      borderBottom="1px solid"
                      borderColor="gray.100"
                    >
                      {row.getVisibleCells().map(cell => (
                        <Td
                          key={cell.id}
                          width={`${cell.column.getSize()}px`}
                          minWidth={`${cell.column.getSize()}px`}
                          maxWidth={`${cell.column.getSize()}px`}
                          borderColor="gray.100"
                          py={2}
                          px={2}
                          textAlign="center"
                          verticalAlign="middle"
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </Td>
                      ))}
                    </Tr>
                  </Tbody>
                </Table>
              </Box>
            );
          })}
        </Box>
      </Box>
      
      {/* Resize handle indicator for detached mode */}
      {isDetached && showControls && (
        <Box
          position="absolute"
          bottom="2px"
          right="2px"
          width="12px"
          height="12px"
          cursor="se-resize"
          opacity={0.6}
          _hover={{ opacity: 1 }}
          sx={{
            '&::before': {
              content: '""',
              position: 'absolute',
              right: '2px',
              bottom: '2px',
              width: '0',
              height: '0',
              borderLeft: '8px solid transparent',
              borderBottom: '8px solid #CBD5E0'
            },
            '&::after': {
              content: '""',
              position: 'absolute',
              right: '2px',
              bottom: '6px',
              width: '0',
              height: '0',
              borderLeft: '4px solid transparent',
              borderBottom: '4px solid #A0AEC0'
            }
          }}
        />
      )}
    </Box>
    );
    
    // Wrap with Resizable component for detached mode
    if (isDetached && showControls) {
      return (
        <Resizable
          width={responsiveWidth}
          height={responsiveHeight}
          onResize={handleResize}
          minConstraints={[800, 400]}
          maxConstraints={[window.innerWidth - 100, window.innerHeight - 150]}
          resizeHandles={['se']}
        >
          {tableContent}
        </Resizable>
      );
    }
    
    return tableContent;
  }, [headerGroups, attachedParentRef, detachedParentRef, attachedVirtualizer, detachedVirtualizer, rows, processedData.length, isDetached, toggleDetach, responsiveWidth, responsiveHeight, handleResize]);

  if (!data || data.length === 0) {
    return (
      <Box p={6} textAlign="center">
        <Text color="gray.500">No data available</Text>
      </Box>
    );
  }

  return (
    <>
      {/* Inline table when not detached */}
      {!isDetached && (
        <Box mt={6}>
          <HStack justify="space-between" align="center" mb={4}>
            <Heading size="md" color="gray.700">
              Loop Test Control - Precommissioning
            </Heading>
            <HStack spacing={3}>
              <Badge colorScheme="blue" fontSize="sm" px={3} py={1}>
                {processedData.length} LOOPS
              </Badge>
              <Button
                leftIcon={<ExternalLinkIcon />}
                size="sm"
                colorScheme="blue"
                variant="outline"
                onClick={toggleDetach}
              >
                Detach Table
              </Button>
            </HStack>
          </HStack>
          {renderTableContent(false)}
        </Box>
      )}

      {/* Detached table in portal */}
      {isDetached && (
        <Portal>
          <Draggable
            handle=".drag-handle"
            defaultPosition={{ x: 100, y: 100 }}
            bounds="body"
          >
            <Box
              position="fixed"
              zIndex={9999}
              top="100px"
              left="100px"
            >
              {renderTableContent(true)}
            </Box>
          </Draggable>
        </Portal>
      )}

      {/* Placeholder when table is detached */}
      {isDetached && (
        <Box mt={6}>
          <HStack justify="space-between" align="center" mb={4}>
            <Heading size="md" color="gray.700">
              Loop Test Control - Precommissioning
            </Heading>
            <HStack spacing={3}>
              <Badge colorScheme="blue" fontSize="sm" px={3} py={1}>
                {processedData.length} LOOPS
              </Badge>
              <Button
                leftIcon={<AttachmentIcon />}
                size="sm"
                colorScheme="green"
                variant="outline"
                onClick={toggleDetach}
              >
                Attach Table
              </Button>
            </HStack>
          </HStack>
          <Box
            border="2px dashed"
            borderColor="gray.300"
            borderRadius="lg"
            p={8}
            textAlign="center"
            bg="gray.50"
          >
            <Text color="gray.500" fontSize="lg" mb={2}>
              Table is currently detached
            </Text>
            <Text color="gray.400" fontSize="sm">
              The table is now floating in a separate window. You can drag it around and use the attach button to bring it back.
            </Text>
          </Box>
        </Box>
      )}
    </>
  );
});

LazosTable.displayName = 'LazosTable';

export default LazosTable;