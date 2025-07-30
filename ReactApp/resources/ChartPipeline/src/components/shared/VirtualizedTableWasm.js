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
  multiLevelHeaders,
  width = "100%",
  height = "500px",
  showTagInstCount = false,
  frozenTagInstCount = null,
  showControlCounts = false,
  frozenControlCounts = null
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
      borderColor="gray.800"
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
            borderCollapse: 'collapse'
          }}
        >
          {/* Multi-Level Headers */}
          {multiLevelHeaders && (
            <React.Fragment>
              {multiLevelHeaders.map((levelGroup, levelIndex) => (
                <React.Fragment key={`level-${levelGroup.level}`}>
                  {levelGroup.headers.map(header => {
                    return (
                      <Box
                        key={header.id}
                        bg={header.color}
                        color="white"
                        p={2}
                        textAlign="center"
                        fontWeight="bold"
                        fontSize="xs"
                        borderRight="1px solid"
                        borderColor="gray.800"
                        borderBottom="1px solid"
                        boxSizing="border-box"
                        style={{
                          position: 'sticky',
                          top: `${levelIndex * 40}px`,
                          zIndex: 10 - levelIndex,
                          gridColumn: `${header.startCol + 1} / span ${header.colspan}`,
                          minHeight: '40px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        {header.title}
                      </Box>
                    );
                  })}
                </React.Fragment>
              ))}
            </React.Fragment>
          )}

          {/* Column Headers */}
          {table.getHeaderGroups().map(headerGroup => (
            <React.Fragment key={headerGroup.id}>
              {headerGroup.headers.map((header, headerIndex) => {
                // Find which header group this column belongs to
                let headerColor = 'gray.700';
                if (multiLevelHeaders && multiLevelHeaders[0]) {
                  const groupHeader = multiLevelHeaders[0].headers.find(h => 
                    headerIndex >= h.startCol && headerIndex < h.startCol + h.colspan
                  );
                  if (groupHeader) {
                    headerColor = groupHeader.color;
                  }
                }
                
                return (
                  <Box
                    key={header.id}
                    bg={headerColor}
                    color="white"
                    p={2}
                    textAlign="center"
                    fontWeight="bold"
                    fontSize="xs"
                    borderRight="1px solid"
                    borderColor="gray.800"
                    borderBottom="1px solid"
                    boxSizing="border-box"
                    width="100%"
                    height="100%"
                    style={{
                      position: 'sticky',
                      top: multiLevelHeaders ? `${multiLevelHeaders.length * 40}px` : '0px',
                      zIndex: 1,
                      minHeight: '45px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </Box>
                );
              })}
            </React.Fragment>
          ))}

          {/* Frozen Count Row for TAG INST (not responsive to filters) */}
          {showTagInstCount && frozenTagInstCount && (
            <React.Fragment>
              {table.getHeaderGroups().map(headerGroup => (
                <React.Fragment key={`frozen-count-${headerGroup.id}`}>
                  {headerGroup.headers.map((header, headerIndex) => {
                    let countValue = '';
                    if (header.column.id === 'TAG INST') {
                      countValue = `TOTAL: ${frozenTagInstCount}`;
                    }
                    
                    return (
                      <Box
                        key={`frozen-count-${header.id}`}
                        bg="blue.100"
                        color="blue.700"
                        p={2}
                        textAlign="center"
                        fontWeight="bold"
                        fontSize="xs"
                        borderRight="1px solid"
                        borderColor="gray.800"
                        borderBottom="1px solid"
                        boxSizing="border-box"
                        width="100%"
                        height="100%"
                        style={{
                          position: 'sticky',
                          top: multiLevelHeaders ? `${multiLevelHeaders.length * 40 + 45}px` : '45px',
                          zIndex: 1,
                          minHeight: '30px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        {countValue}
                      </Box>
                    );
                  })}
                </React.Fragment>
              ))}
            </React.Fragment>
          )}

          {/* Responsive Count Row for TAG INST (responsive to filters) */}
          {showTagInstCount && (
            <React.Fragment>
              {table.getHeaderGroups().map(headerGroup => (
                <React.Fragment key={`count-${headerGroup.id}`}>
                  {headerGroup.headers.map((header, headerIndex) => {
                    let countValue = '';
                    if (header.column.id === 'TAG INST' && data) {
                      const uniqueTags = new Set(
                        data.map(row => row['TAG INST']).filter(tag => tag && tag !== '')
                      );
                      countValue = `CURRENTLY: ${uniqueTags.size}`;
                    }
                    
                    return (
                      <Box
                        key={`count-${header.id}`}
                        bg="gray.100"
                        color="gray.700"
                        p={2}
                        textAlign="center"
                        fontWeight="bold"
                        fontSize="xs"
                        borderRight="1px solid"
                        borderColor="gray.800"
                        borderBottom="1px solid"
                        boxSizing="border-box"
                        width="100%"
                        height="100%"
                        style={{
                          position: 'sticky',
                          top: multiLevelHeaders ? `${multiLevelHeaders.length * 40 + 45 + (frozenTagInstCount ? 30 : 0)}px` : `${45 + (frozenTagInstCount ? 30 : 0)}px`,
                          zIndex: 1,
                          minHeight: '30px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        {countValue}
                      </Box>
                    );
                  })}
                </React.Fragment>
              ))}
            </React.Fragment>
          )}

          {/* Frozen Control Counts Row (not responsive to filters) */}
          {showControlCounts && frozenControlCounts && (
            <React.Fragment>
              {table.getHeaderGroups().map(headerGroup => (
                <React.Fragment key={`frozen-control-count-${headerGroup.id}`}>
                  {headerGroup.headers.map((header, headerIndex) => {
                    let countValue = '';
                    if (header.column.id === 'ISOMETRIC') countValue = `TOTAL: ${frozenControlCounts.isometricCount}`;
                    else if (header.column.id === 'QTY INST') countValue = `TOTAL: ${frozenControlCounts.qtyInstSum}`;
                    else if (header.column.id === 'SCOPE BY TEIGA-TMI') countValue = `TOTAL: ${frozenControlCounts.scopeTeigaSum}`;
                    else if (header.column.id === 'SCOPE BY SIEMSA') countValue = `TOTAL: ${frozenControlCounts.scopeSiemsaSum}`;
                    else if (header.column.id === 'INSTALLED BY TEIGA-TMI') countValue = `TOTAL: ${frozenControlCounts.installedTeigaSum}`;
                    else if (header.column.id === 'INSTALLED BY SIEMSA') countValue = `TOTAL: ${frozenControlCounts.installedSiemsaSum}`;
                    else if (header.column.id === 'PENDING') countValue = `TOTAL: ${frozenControlCounts.pendingSum}`;
                    
                    return (
                      <Box
                        key={`frozen-control-count-${header.id}`}
                        bg="blue.100"
                        color="blue.700"
                        p={2}
                        textAlign="center"
                        fontWeight="bold"
                        fontSize="xs"
                        borderRight="1px solid"
                        borderColor="gray.800"
                        borderBottom="1px solid"
                        boxSizing="border-box"
                        width="100%"
                        height="100%"
                        style={{
                          position: 'sticky',
                          top: multiLevelHeaders ? `${multiLevelHeaders.length * 40 + 45}px` : '45px',
                          zIndex: 1,
                          minHeight: '30px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        {countValue}
                      </Box>
                    );
                  })}
                </React.Fragment>
              ))}
            </React.Fragment>
          )}

          {/* Responsive Control Counts Row (responsive to filters) */}
          {showControlCounts && (
            <React.Fragment>
              {table.getHeaderGroups().map(headerGroup => (
                <React.Fragment key={`control-count-${headerGroup.id}`}>
                  {headerGroup.headers.map((header, headerIndex) => {
                    let countValue = '';
                    if (data && data.length > 0) {
                      if (header.column.id === 'ISOMETRIC') countValue = `CURRENTLY: ${data.length}`;
                      else if (header.column.id === 'QTY INST') countValue = `CURRENTLY: ${data.reduce((sum, row) => sum + (Number(row['QTY INST']) || 0), 0)}`;
                      else if (header.column.id === 'SCOPE BY TEIGA-TMI') countValue = `CURRENTLY: ${data.reduce((sum, row) => sum + (Number(row['SCOPE BY TEIGA-TMI']) || 0), 0)}`;
                      else if (header.column.id === 'SCOPE BY SIEMSA') countValue = `CURRENTLY: ${data.reduce((sum, row) => sum + (Number(row['SCOPE BY SIEMSA']) || 0), 0)}`;
                      else if (header.column.id === 'INSTALLED BY TEIGA-TMI') countValue = `CURRENTLY: ${data.reduce((sum, row) => sum + (Number(row['INSTALLED BY TEIGA-TMI']) || 0), 0)}`;
                      else if (header.column.id === 'INSTALLED BY SIEMSA') countValue = `CURRENTLY: ${data.reduce((sum, row) => sum + (Number(row['INSTALLED BY SIEMSA']) || 0), 0)}`;
                      else if (header.column.id === 'PENDING') countValue = `CURRENTLY: ${data.reduce((sum, row) => sum + (Number(row['PENDING']) || 0), 0)}`;
                    }
                    
                    return (
                      <Box
                        key={`control-count-${header.id}`}
                        bg="gray.100"
                        color="gray.700"
                        p={2}
                        textAlign="center"
                        fontWeight="bold"
                        fontSize="xs"
                        borderRight="1px solid"
                        borderColor="gray.800"
                        borderBottom="1px solid"
                        boxSizing="border-box"
                        width="100%"
                        height="100%"
                        style={{
                          position: 'sticky',
                          top: multiLevelHeaders ? `${multiLevelHeaders.length * 40 + 45 + (frozenControlCounts ? 30 : 0)}px` : `${45 + (frozenControlCounts ? 30 : 0)}px`,
                          zIndex: 1,
                          minHeight: '30px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        {countValue}
                      </Box>
                    );
                  })}
                </React.Fragment>
              ))}
            </React.Fragment>
          )}

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
                    backgroundColor: isGroupRow ? 'rgba(237, 242, 247, 0.5)' : 'white',
                    boxSizing: 'border-box'
                  }}
                >
                  {row.getVisibleCells().map((cell, cellIndex) => {
                    // Find which header group this column belongs to
                    let headerColor = '#ffffff';
                    if (multiLevelHeaders && multiLevelHeaders[0]) {
                      const header = multiLevelHeaders[0].headers.find(h => 
                        cellIndex >= h.startCol && cellIndex < h.startCol + h.colspan
                      );
                      if (header) {
                        headerColor = header.color + '20'; // Add transparency
                      }
                    }
                    
                    return (
                      <Box
                        key={cell.id}
                        p={2}
                        textAlign="center"
                        borderBottom="1px solid"
                        borderRight="1px solid"
                        borderColor="gray.800"
                        bg={headerColor}
                        _hover={{ bg: 'gray.50' }}
                        overflow="hidden"
                        textOverflow="ellipsis"
                        whiteSpace={cell.column.id.includes('INSTRUMENT TYPE') ? 'normal' : 'nowrap'}
                        boxSizing="border-box"
                        width="100%"
                        height="100%"
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </Box>
                    );
                  })}
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