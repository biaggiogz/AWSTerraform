import React, { useRef, useMemo, useEffect, useState } from 'react';
import { Box } from '@chakra-ui/react';
import { flexRender, useReactTable, getCoreRowModel, getSortedRowModel, getExpandedRowModel } from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import wasmUtils from '../../wasm/wasmUtils.js';

const VirtualizedTableWasm = ({ 
  data, 
  columns, 
  expanded, 
  onExpandedChange, 
  getSubRows,
  width = "100%",
  height = "500px"
}) => {
  const tableContainerRef = useRef(null);
  const [wasmInitialized, setWasmInitialized] = useState(false);

  useEffect(() => {
    const initWasm = async () => {
      try {
        await wasmUtils.initializeWasm();
        setWasmInitialized(true);
      } catch (error) {
        // Silently fall back to JS implementation
        setWasmInitialized(false);
      }
    };
    initWasm();
  }, []);

  const optimizedRowHeights = useMemo(() => {
    if (!wasmInitialized || !data || data.length === 0) {
      return Array(data?.length || 0).fill(30);
    }

    try {
      const textLengths = data.map(row => {
        const textContents = Object.values(row).map(value => 
          String(value || '').length
        );
        return Math.max(...textContents, 0);
      });

      return wasmUtils.calculateTableRowHeights(textLengths);
    } catch (error) {
      console.warn('WASM row height calculation failed:', error);
      return Array(data.length).fill(30);
    }
  }, [wasmInitialized, data]);

  const table = useReactTable({
    data,
    columns,
    state: expanded !== undefined ? { expanded } : undefined,
    onExpandedChange,
    getSubRows,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
  });

  const { rows } = table.getRowModel();

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: (index) => optimizedRowHeights[index] || 30,
    overscan: 10,
    measureElement: typeof window !== 'undefined' && document.getElementById ? 
      (element) => element?.getBoundingClientRect().height || 30 : 
      undefined,
  });

  return (
    <Box
      border="1px solid"
      borderColor="gray.200"
      borderRadius="lg"
      overflow="hidden"
      bg="white"
      boxShadow="sm"
      width={width}
      height={height}
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

          <Box
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {rowVirtualizer.getVirtualItems().map(virtualRow => {
              const row = rows[virtualRow.index];
              const isGroupRow = row.original.children !== undefined;
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
                    alignItems: 'stretch',
                    backgroundColor: isGroupRow ? 'rgba(237, 242, 247, 0.5)' : 'white'
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
                      whiteSpace={cell.column.id.includes('INSTRUMENT TYPE') ? 'normal' : 'nowrap'}
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
  );
};

export default VirtualizedTableWasm;