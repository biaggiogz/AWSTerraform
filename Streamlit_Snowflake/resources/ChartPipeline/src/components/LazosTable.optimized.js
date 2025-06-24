import React, { useMemo, useCallback, useState, useEffect, memo } from 'react';
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
  Button
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
import { FixedSizeList as List } from 'react-window';

const columnHelper = createColumnHelper();

// Memoized cell components for better performance
const TextCell = memo(({ value, ...props }) => (
  <Text fontSize="sm" textAlign="center" {...props}>
    {value}
  </Text>
));

const ProgressCell = memo(({ value }) => {
  const progressValue = parseFloat(value.replace('%', '')) || 0;
  const colorScheme = progressValue === 100 ? 'green' : progressValue >= 50 ? 'yellow' : 'red';
  
  return (
    <Box display="flex" flexDirection="column" alignItems="center">
      <Progress 
        value={progressValue} 
        size="sm" 
        colorScheme={colorScheme}
        borderRadius="md"
        mb={1}
        width="80px"
      />
      <Text fontSize="xs" textAlign="center" fontWeight="medium">
        {value}
      </Text>
    </Box>
  );
});

// Optimized HTML generation using efficient array methods
const generateTableHTML = (data) => {
  const headers = ['Code', 'Subsystem', 'Tag Loop', 'Area', 'Priority', 'Service', 'Installed', 'Wired', 'Connected', 'Cable Test', 'Progress', 'Dossier', 'Test Loop'];
  const headerRow = headers.map(h => `<th style="border:1px solid #ddd;padding:8px;text-align:center;font-size:12px;background-color:#f2f2f2;font-weight:bold">${h}</th>`).join('');
  
  const rows = data.map((row, i) => 
    `<tr style="${i % 2 === 0 ? 'background-color:#f9f9f9' : ''}">${[
      row.code, row.subsystem, row.tagLoop, row.area, row.priority, row.service,
      row.installed, row.wired, row.connected, row.cableTest, row.progress, row.dossier, row.testLoop
    ].map(cell => `<td style="border:1px solid #ddd;padding:8px;text-align:center;font-size:12px">${cell}</td>`).join('')}</tr>`
  ).join('');
  
  return `<!DOCTYPE html><html><head><title>Loop Test Control - Precommissioning</title><style>body{font-family:Arial,sans-serif;margin:20px}table{border-collapse:collapse;width:100%}</style></head><body><h2>Loop Test Control - Precommissioning (${data.length} LOOPS)</h2><table><thead><tr>${headerRow}</tr></thead><tbody>${rows}</tbody></table></body></html>`;
};

const LazosTable = React.memo(({ data }) => {
  const [isDetached, setIsDetached] = useState(false);
  const [detachedWindow, setDetachedWindow] = useState(null);
  const [tableSize, setTableSize] = useState({ width: 1200, height: 600 });

  const processedData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    return data.map((row, index) => ({
      id: index,
      code: row.CODE || '',
      subsystem: row.SUBS_PRE || '',
      tagLoop: row['TAG LOOP'] || '',
      area: row.Area || '',
      priority: row.PRIORITY || '',
      service: row.SERVICE || '',
      installed: row.INSTALLED || '',
      wired: row.WIRED || '',
      connected: row.CONNECTED || '',
      cableTest: row['CABLE TEST'] || '',
      progress: row['OK=100%'] || '0.00%',
      dossier: row.DOSSIER || '',
      testLoop: row['TEST LOOP'] || ''
    }));
  }, [data]);

  const columns = useMemo(() => [
    columnHelper.accessor('code', {
      header: 'Code',
      cell: ({ getValue }) => <TextCell value={getValue()} fontWeight="medium" color="blue.600" />
    }),
    columnHelper.accessor('subsystem', {
      header: 'Subsystem',
      cell: ({ getValue }) => <TextCell value={getValue()} fontWeight="medium" />
    }),
    columnHelper.accessor('tagLoop', {
      header: 'Tag Loop',
      cell: ({ getValue }) => <TextCell value={getValue()} fontFamily="mono" />
    }),
    columnHelper.accessor('area', {
      header: 'Area',
      cell: ({ getValue }) => <TextCell value={getValue()} fontWeight="medium" />
    }),
    columnHelper.accessor('priority', {
      header: 'Priority',
      cell: ({ getValue }) => <TextCell value={getValue()} fontWeight="medium" />
    }),
    columnHelper.accessor('service', {
      header: 'Service',
      cell: ({ getValue }) => <TextCell value={getValue()} noOfLines={2} />
    }),
    columnHelper.accessor('installed', {
      header: 'Installed',
      cell: ({ getValue }) => <TextCell value={getValue()} />
    }),
    columnHelper.accessor('wired', {
      header: 'Wired',
      cell: ({ getValue }) => <TextCell value={getValue()} />
    }),
    columnHelper.accessor('connected', {
      header: 'Connected',
      cell: ({ getValue }) => <TextCell value={getValue()} />
    }),
    columnHelper.accessor('cableTest', {
      header: 'Cable Test',
      cell: ({ getValue }) => <TextCell value={getValue()} />
    }),
    columnHelper.accessor('progress', {
      header: 'Progress',
      cell: ({ getValue }) => <ProgressCell value={getValue()} />
    }),
    columnHelper.accessor('dossier', {
      header: 'Dossier',
      cell: ({ getValue }) => <TextCell value={getValue()} color="gray.600" />
    }),
    columnHelper.accessor('testLoop', {
      header: 'Test Loop',
      cell: ({ getValue }) => <TextCell value={getValue()} fontFamily="mono" color="blue.500" />
    })
  ], []);

  const table = useReactTable({
    data: processedData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const handleDetach = useCallback(async () => {
    let newWindow;
    
    try {
      if ('getScreenDetails' in window) {
        const screens = await window.getScreenDetails();
        const externalScreen = screens.screens.find(screen => !screen.internal) || screens.screens[1];
        
        if (externalScreen) {
          const left = externalScreen.left + 100;
          const top = externalScreen.top + 100;
          newWindow = window.open('', 'DetachedTable',
            `width=${tableSize.width + 50},height=${tableSize.height + 100},` +
            `left=${left},top=${top},resizable=yes,scrollbars=yes`
          );
        }
      }
    } catch (error) {
      console.log('Screen Details API not available or failed:', error);
    }
    
    if (!newWindow) {
      const secondaryX = window.screen.width + 100;
      newWindow = window.open('', 'DetachedTable',
        `width=${tableSize.width + 50},height=${tableSize.height + 100},` +
        `left=${secondaryX},top=100,resizable=yes,scrollbars=yes`
      );
    }

    if (newWindow) {
      const htmlContent = generateTableHTML(processedData);
      newWindow.document.write(htmlContent);
      newWindow.document.close();
      setIsDetached(true);
      setDetachedWindow(newWindow);

      newWindow.addEventListener('beforeunload', () => {
        setIsDetached(false);
        setDetachedWindow(null);
      });
    }
  }, [tableSize, processedData]);

  useEffect(() => {
    if (detachedWindow && !detachedWindow.closed && isDetached) {
      const htmlContent = generateTableHTML(processedData);
      detachedWindow.document.body.innerHTML = htmlContent.match(/<body>(.*)<\/body>/s)[1];
    }
  }, [processedData, detachedWindow, isDetached]);

  if (!data || data.length === 0) {
    return (
      <Box p={6} textAlign="center">
        <Text color="gray.500">No data available</Text>
      </Box>
    );
  }

  return (
    <Box mt={6}>
      <HStack justify="space-between" align="center" mb={4}>
        <Heading size="md" color="gray.700">
          Loop Test Control - Precommissioning
        </Heading>
        <HStack spacing={3}>
          <Badge colorScheme="blue" fontSize="sm" px={3} py={1}>
            {processedData.length} LOOPS
          </Badge>
          {!isDetached ? (
            <Button
              leftIcon={<ExternalLinkIcon />}
              size="sm"
              colorScheme="blue"
              variant="outline"
              onClick={handleDetach}
              title="Move table to another monitor"
            >
              Move to Monitor
            </Button>
          ) : (
            <Button
              leftIcon={<AttachmentIcon />}
              size="sm"
              colorScheme="green"
              variant="outline"
              onClick={() => {
                if (detachedWindow) detachedWindow.close();
                setIsDetached(false);
                setDetachedWindow(null);
              }}
            >
              Return to Dashboard
            </Button>
          )}
        </HStack>
      </HStack>
      
      {!isDetached && (
        <Box
          border="1px solid"
          borderColor="gray.200"
          borderRadius="lg"
          overflow="hidden"
          bg="white"
          boxShadow="sm"
          height="500px"
        >
          <Table size="sm">
            <Thead bg="gray.50" position="sticky" top={0} zIndex={1}>
              {table.getHeaderGroups().map(headerGroup => (
                <Tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <Th key={header.id} textAlign="center" fontSize="xs" fontWeight="bold" color="gray.700" py={3}>
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </Th>
                  ))}
                </Tr>
              ))}
            </Thead>
          </Table>
          <Box height="calc(100% - 60px)" overflow="hidden">
            <List
              height={440}
              itemCount={table.getRowModel().rows.length}
              itemSize={40}
              itemData={table.getRowModel().rows}
            >
              {({ index, style, data }) => {
                const row = data[index];
                return (
                  <div style={style}>
                    <Table size="sm">
                      <Tbody>
                        <Tr _hover={{ bg: 'gray.50' }}>
                          {row.getVisibleCells().map(cell => (
                            <Td key={cell.id} py={2} px={2} textAlign="center" borderColor="gray.100" width={`${100/13}%`}>
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </Td>
                          ))}
                        </Tr>
                      </Tbody>
                    </Table>
                  </div>
                );
              }}
            </List>
          </Box>
        </Box>
      )}
      
      {isDetached && (
        <Box
          border="2px dashed"
          borderColor="gray.300"
          borderRadius="lg"
          p={8}
          textAlign="center"
          bg="gray.50"
        >
          <Text color="gray.500" fontSize="lg" mb={2}>
            Table moved to external monitor
          </Text>
          <Text color="gray.400" fontSize="sm">
            The table is now displayed on another monitor and will update automatically when you apply filters.
          </Text>
        </Box>
      )}
    </Box>
  );
});

LazosTable.displayName = 'LazosTable';

export default LazosTable;