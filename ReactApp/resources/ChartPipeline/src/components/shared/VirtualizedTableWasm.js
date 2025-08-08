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
  frozenControlCounts = null,
  showDynamicCounts = false,
  frozenDynamicCounts = null,
  showInstalledCounts = false,
  frozenInstalledCount = null,
  showWiredCounts = false,
  frozenWiredCount = null,
  showConnectedCounts = false,
  frozenConnectedCount = null,
  showCableTestCounts = false,
  frozenCableTestCount = null,
  showQcfCounts = false,
  frozenQcfCount = null,
  showOk100Counts = false,
  frozenOk100Count = null,
  showDossierCounts = false,
  frozenDossierCount = null,
  showTestLoopCounts = false,
  frozenTestLoopCount = null,
  showTestPackCounts = false,
  frozenTestPackCount = null,
  showQfcReleasedCounts = false,
  frozenQfcReleasedCount = null,
  showQtyInstCounts = false,
  frozenQtyInstCount = null,
  showScopeCounts = false,
  frozenScopeTeigaCount = null,
  frozenScopeSiemsaCount = null,
  frozenInstalledTeigaCount = null,
  frozenInstalledSiemsaCount = null,
  frozenPendingCount = null
}) => {
  const tableContainerRef = useRef(null);
  const [wasmInitialized, setWasmInitialized] = useState(false);

  // Skip WASM initialization for better performance
  useEffect(() => {
    setWasmInitialized(false);
  }, []);

  const optimizedRowHeights = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    // Try Rust calculation first
    const calculateHeights = async () => {
      try {
        const { calculateRowHeightsRust } = await import('../../wasm/rustFilter');
        return await calculateRowHeightsRust(data);
      } catch (error) {
        return Array(data.length).fill(35);
      }
    };
    
    // For now, use fixed height but prepare for async Rust calculation
    return Array(data.length).fill(35);
  }, [data]);

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

  // Calculate total count rows needed
  const hasFrozenCounts = (showInstalledCounts && frozenInstalledCount) || (showWiredCounts && frozenWiredCount) || (showConnectedCounts && frozenConnectedCount) || (showCableTestCounts && frozenCableTestCount) || (showQcfCounts && frozenQcfCount) || (showOk100Counts && frozenOk100Count) || (showDossierCounts && frozenDossierCount) || (showTestLoopCounts && frozenTestLoopCount) || (showTestPackCounts && frozenTestPackCount) || (showQfcReleasedCounts && frozenQfcReleasedCount);
  const hasResponsiveCounts = showInstalledCounts || showWiredCounts || showConnectedCounts || showCableTestCounts || showQcfCounts || showOk100Counts || showDossierCounts || showTestLoopCounts || showTestPackCounts || showQfcReleasedCounts;
  const countRowsCount = (hasFrozenCounts ? 1 : 0) + (hasResponsiveCounts ? 1 : 0);

  const rowVirtualizer = useVirtualizer({
    count: rows.length + countRowsCount,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: (index) => index < countRowsCount ? 30 : (optimizedRowHeights[index - countRowsCount] || 30),
    overscan: 10,
    measureElement: undefined,
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
                
                // Check for individual column header style first
                if (header.column.columnDef.meta?.headerStyle?.backgroundColor) {
                  headerColor = header.column.columnDef.meta.headerStyle.backgroundColor;
                } else if (multiLevelHeaders && multiLevelHeaders[0]) {
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
          {/*{showTagInstCount && frozenTagInstCount && (*/}
          {/*  <React.Fragment>*/}
          {/*    {table.getHeaderGroups().map(headerGroup => (*/}
          {/*      <React.Fragment key={`frozen-count-${headerGroup.id}`}>*/}
          {/*        {headerGroup.headers.map((header, headerIndex) => {*/}
          {/*          let countValue = '';*/}
          {/*          if (header.column.id === 'TAG INST') {*/}
          {/*            countValue = `TOTAL: ${frozenTagInstCount}`;*/}
          {/*          }*/}
          {/*          */}
          {/*          return (*/}
          {/*            <Box*/}
          {/*              key={`frozen-count-${header.id}`}*/}
          {/*              bg="blue.100"*/}
          {/*              color="blue.700"*/}
          {/*              p={2}*/}
          {/*              textAlign="center"*/}
          {/*              fontWeight="bold"*/}
          {/*              fontSize="xs"*/}
          {/*              borderRight="1px solid"*/}
          {/*              borderColor="gray.800"*/}
          {/*              borderBottom="1px solid"*/}
          {/*              boxSizing="border-box"*/}
          {/*              width="100%"*/}
          {/*              height="100%"*/}
          {/*              style={{*/}
          {/*                position: 'sticky',*/}
          {/*                top: multiLevelHeaders ? `${multiLevelHeaders.length * 40 + 45}px` : '45px',*/}
          {/*                zIndex: 1,*/}
          {/*                minHeight: '30px',*/}
          {/*                display: 'flex',*/}
          {/*                alignItems: 'center',*/}
          {/*                justifyContent: 'center'*/}
          {/*              }}*/}
          {/*            >*/}
          {/*              {countValue}*/}
          {/*            </Box>*/}
          {/*          );*/}
          {/*        })}*/}
          {/*      </React.Fragment>*/}
          {/*    ))}*/}
          {/*  </React.Fragment>*/}
          {/*)}*/}

          {/* Responsive Count Row for TAG INST (responsive to filters) */}
          {/*{showTagInstCount && (*/}
          {/*  <React.Fragment>*/}
          {/*    {table.getHeaderGroups().map(headerGroup => (*/}
          {/*      <React.Fragment key={`count-${headerGroup.id}`}>*/}
          {/*        {headerGroup.headers.map((header, headerIndex) => {*/}
          {/*          let countValue = '';*/}
          {/*          if (header.column.id === 'TAG INST' && data) {*/}
          {/*            const uniqueTags = new Set(*/}
          {/*              data.map(row => row['TAG INST']).filter(tag => tag && tag !== '')*/}
          {/*            );*/}
          {/*            countValue = `CURRENTLY: ${uniqueTags.size}`;*/}
          {/*          }*/}
          {/*          */}
          {/*          return (*/}
          {/*            <Box*/}
          {/*              key={`count-${header.id}`}*/}
          {/*              bg="gray.100"*/}
          {/*              color="gray.700"*/}
          {/*              p={2}*/}
          {/*              textAlign="center"*/}
          {/*              fontWeight="bold"*/}
          {/*              fontSize="xs"*/}
          {/*              borderRight="1px solid"*/}
          {/*              borderColor="gray.800"*/}
          {/*              borderBottom="1px solid"*/}
          {/*              boxSizing="border-box"*/}
          {/*              width="100%"*/}
          {/*              height="100%"*/}
          {/*              style={{*/}
          {/*                position: 'sticky',*/}
          {/*                top: multiLevelHeaders ? `${multiLevelHeaders.length * 40 + 45 + (frozenTagInstCount ? 30 : 0)}px` : `${45 + (frozenTagInstCount ? 30 : 0)}px`,*/}
          {/*                zIndex: 1,*/}
          {/*                minHeight: '30px',*/}
          {/*                display: 'flex',*/}
          {/*                alignItems: 'center',*/}
          {/*                justifyContent: 'center'*/}
          {/*              }}*/}
          {/*            >*/}
          {/*              {countValue}*/}
          {/*            </Box>*/}
          {/*          );*/}
          {/*        })}*/}
          {/*      </React.Fragment>*/}
          {/*    ))}*/}
          {/*  </React.Fragment>*/}
          {/*)}*/}



          {/* Frozen Dynamic Counts Row (not responsive to filters) */}
          {showDynamicCounts && frozenDynamicCounts && (
            <React.Fragment>
              {table.getHeaderGroups().map(headerGroup => (
                <React.Fragment key={`frozen-dynamic-count-${headerGroup.id}`}>
                  {headerGroup.headers.map((header, headerIndex) => {
                    let countValue = '';
                    if (header.column.id === 'TOTAL INST') countValue = `TOTAL: ${frozenDynamicCounts.totalInst}`;
                    else if (header.column.id === 'TOTAL TEIGA') countValue = `TOTAL: ${frozenDynamicCounts.totalTeiga}`;
                    else if (header.column.id === 'INSTALLED TEIGA') countValue = `TOTAL: ${frozenDynamicCounts.installedTeiga}`;
                    else if (header.column.id === 'PENDING TEIGA') countValue = `TOTAL: ${frozenDynamicCounts.pendingTeiga}`;
                    else if (header.column.id === 'TOTAL SIEMSA') countValue = `TOTAL: ${frozenDynamicCounts.totalSiemsa}`;
                    else if (header.column.id === 'INSTALLED SIEMSA') countValue = `TOTAL: ${frozenDynamicCounts.installedSiemsa}`;
                    else if (header.column.id === 'PENDING SIEMSA') countValue = `TOTAL: ${frozenDynamicCounts.pendingSiemsa}`;
                    else if (header.column.id === 'QFC RELEASE') countValue = `TOTAL: ${frozenDynamicCounts.qfcRelease}`;
                    else if (header.column.id === 'QFC PENDING') countValue = `TOTAL: ${frozenDynamicCounts.qfcPending}`;
                    
                    return (
                      <Box
                        key={`frozen-dynamic-count-${header.id}`}
                        bg="#A9D6E5"
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

          {/* Responsive Dynamic Counts Row (responsive to filters) */}
          {showDynamicCounts && (
            <React.Fragment>
              {table.getHeaderGroups().map(headerGroup => (
                <React.Fragment key={`dynamic-count-${headerGroup.id}`}>
                  {headerGroup.headers.map((header, headerIndex) => {
                    let countValue = '';
                    if (data && data.length > 0) {
                      if (header.column.id === 'TOTAL INST') countValue = `CURRENLTY: ${data.reduce((sum, row) => sum + (Number(row['TOTAL INST']) || 0), 0)}`;
                      else if (header.column.id === 'TOTAL TEIGA') countValue = `CURRENLTY: ${data.reduce((sum, row) => sum + (Number(row['TOTAL TEIGA']) || 0), 0)}`;
                      else if (header.column.id === 'INSTALLED TEIGA') countValue = `CURRENLTY: ${data.reduce((sum, row) => sum + (Number(row['INSTALLED TEIGA']) || 0), 0)}`;
                      else if (header.column.id === 'PENDING TEIGA') countValue = `CURRENLTY: ${data.reduce((sum, row) => sum + (Number(row['PENDING TEIGA']) || 0), 0)}`;
                      else if (header.column.id === 'TOTAL SIEMSA') countValue = `CURRENLTY: ${data.reduce((sum, row) => sum + (Number(row['TOTAL SIEMSA']) || 0), 0)}`;
                      else if (header.column.id === 'INSTALLED SIEMSA') countValue = `CURRENLTY: ${data.reduce((sum, row) => sum + (Number(row['INSTALLED SIEMSA']) || 0), 0)}`;
                      else if (header.column.id === 'PENDING SIEMSA') countValue = `CURRENLTY: ${data.reduce((sum, row) => sum + (Number(row['PENDING SIEMSA']) || 0), 0)}`;
                      else if (header.column.id === 'QFC RELEASE') countValue = `CURRENLTY: ${data.reduce((sum, row) => sum + (Number(row['QFC RELEASE']) || 0), 0)}`;
                      else if (header.column.id === 'QFC PENDING') countValue = `CURRENLTY: ${data.reduce((sum, row) => sum + (Number(row['QFC PENDING']) || 0), 0)}`;
                    }
                    
                    return (
                      <Box
                        key={`dynamic-count-${header.id}`}
                        bg="#61A5C2"
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
                          top: multiLevelHeaders ? `${multiLevelHeaders.length * 40 + 45 + (frozenDynamicCounts ? 30 : 0)}px` : `${45 + (frozenDynamicCounts ? 30 : 0)}px`,
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

          {/* Frozen Count Row for QTY INST and SCOPE columns */}
          {(showQtyInstCounts && frozenQtyInstCount) || (showScopeCounts && (frozenScopeTeigaCount || frozenScopeSiemsaCount || frozenInstalledTeigaCount || frozenInstalledSiemsaCount || frozenPendingCount)) ? (
            <React.Fragment>
              {table.getHeaderGroups().map(headerGroup => (
                <React.Fragment key={`frozen-qty-inst-count-${headerGroup.id}`}>
                  {headerGroup.headers.map((header) => {
                    let countValue = '';
                    if (header.column.id === 'QTY INST' && frozenQtyInstCount) {
                      countValue = `TOTAL: ${frozenQtyInstCount}`;
                    } else if (header.column.id === 'SCOPE BY TEIGA-TMI' && frozenScopeTeigaCount) {
                      countValue = `TOTAL: ${frozenScopeTeigaCount}`;
                    } else if (header.column.id === 'SCOPE BY SIEMSA' && frozenScopeSiemsaCount) {
                      countValue = `TOTAL: ${frozenScopeSiemsaCount}`;
                    } else if (header.column.id === 'INSTALLED BY TEIGA-TMI' && frozenInstalledTeigaCount) {
                      countValue = `TOTAL: ${frozenInstalledTeigaCount}`;
                    } else if (header.column.id === 'INSTALLED BY SIEMSA' && frozenInstalledSiemsaCount) {
                      countValue = `TOTAL: ${frozenInstalledSiemsaCount}`;
                    } else if (header.column.id === 'PENDING' && frozenPendingCount) {
                      countValue = `TOTAL: ${frozenPendingCount}`;
                    }
                    
                    return (
                      <Box
                        key={`frozen-qty-inst-count-${header.id}`}
                        bg="#A9D6E5"
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
          ) : null}

          {/* Responsive Count Row for QTY INST and SCOPE columns */}
          {showQtyInstCounts || showScopeCounts ? (
            <React.Fragment>
              {table.getHeaderGroups().map(headerGroup => (
                <React.Fragment key={`qty-inst-count-${headerGroup.id}`}>
                  {headerGroup.headers.map((header) => {
                    let countValue = '';
                    if (data && data.length > 0) {
                      if (header.column.id === 'QTY INST') {
                        const currentCount = data.reduce((sum, row) => sum + (Number(row['QTY INST']) || 0), 0);
                        countValue = `CURRENLTY: ${currentCount}`;
                      } else if (header.column.id === 'SCOPE BY TEIGA-TMI') {
                        countValue = `CURRENLTY: ${data.reduce((sum, row) => sum + (Number(row['SCOPE BY TEIGA-TMI']) || 0), 0)}`;
                      } else if (header.column.id === 'SCOPE BY SIEMSA') {
                        countValue = `CURRENLTY: ${data.reduce((sum, row) => sum + (Number(row['SCOPE BY SIEMSA']) || 0), 0)}`;
                      } else if (header.column.id === 'INSTALLED BY TEIGA-TMI') {
                        countValue = `CURRENLTY: ${data.reduce((sum, row) => sum + (Number(row['INSTALLED BY TEIGA-TMI']) || 0), 0)}`;
                      } else if (header.column.id === 'INSTALLED BY SIEMSA') {
                        countValue = `CURRENLTY: ${data.reduce((sum, row) => sum + (Number(row['INSTALLED BY SIEMSA']) || 0), 0)}`;
                      } else if (header.column.id === 'PENDING') {
                        countValue = `CURRENLTY: ${data.reduce((sum, row) => sum + (Number(row['PENDING']) || 0), 0)}`;
                      }
                    }
                    
                    return (
                      <Box
                        key={`qty-inst-count-${header.id}`}
                        bg="#61A5C2"
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
                          top: multiLevelHeaders ? `${multiLevelHeaders.length * 40 + 45 + 30}px` : `${45 + 30}px`,
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
          ) : null}





          <Box
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {rowVirtualizer.getVirtualItems().map(virtualRow => {
              // Handle count rows
              if (virtualRow.index < countRowsCount) {
                const isFrozenRow = virtualRow.index === 0 && hasFrozenCounts;
                const isResponsiveRow = (virtualRow.index === 0 && !hasFrozenCounts) || (virtualRow.index === 1 && hasFrozenCounts);
                
                return (
                  <Box
                    key={`count-row-${virtualRow.index}`}
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
                      backgroundColor: 'transparent',
                      boxSizing: 'border-box'
                    }}
                  >
                    {table.getAllColumns().map((column, cellIndex) => {
                      let countValue = '';
                      
                      if (isFrozenRow) {
                        if (column.id === 'INSTALLED' && frozenInstalledCount) countValue = `TOTAL: ${frozenInstalledCount}`;
                        else if (column.id === 'WIRED' && frozenWiredCount) countValue = `TOTAL: ${frozenWiredCount}`;
                        else if (column.id === 'CONNECTED' && frozenConnectedCount) countValue = `TOTAL: ${frozenConnectedCount}`;
                        else if (column.id === 'CABLE TEST' && frozenCableTestCount) countValue = `TOTAL: ${frozenCableTestCount}`;
                        else if (column.id === 'QFC' && frozenQcfCount) countValue = `TOTAL: ${frozenQcfCount}`;
                        else if (column.id === 'QFC released instrument' && frozenQfcReleasedCount) countValue = `TOTAL: ${frozenQfcReleasedCount}`;
                        else if (column.id === 'OK=100%' && frozenOk100Count) countValue = `TOTAL: ${frozenOk100Count}`;
                        else if (column.id === 'TPs' && frozenTestPackCount) countValue = `TOTAL: ${frozenTestPackCount}`;
                        else if (column.id === 'DOSSIER' && frozenDossierCount) countValue = `TOTAL: ${frozenDossierCount}`;
                        else if (column.id === 'TEST_LOOP' && frozenTestLoopCount) countValue = `TOTAL: ${frozenTestLoopCount}`;
                      } else if (isResponsiveRow && data) {
                        if (column.id === 'INSTALLED' && showInstalledCounts) {
                          const currentCount = data.reduce((sum, row) => sum + (row.INSTALLED && row.INSTALLED !== '-' && row.INSTALLED !== '' ? 1 : 0), 0);
                          countValue = `CURRENLTY: ${currentCount}`;
                        } else if (column.id === 'WIRED' && showWiredCounts) {
                          const currentCount = data.reduce((sum, row) => sum + (row.WIRED && row.WIRED !== '-' && row.WIRED !== '' ? 1 : 0), 0);
                          countValue = `CURRENLTY: ${currentCount}`;
                        } else if (column.id === 'CONNECTED' && showConnectedCounts) {
                          const currentCount = data.reduce((sum, row) => sum + (row.CONNECTED && row.CONNECTED !== '-' && row.CONNECTED !== '' ? 1 : 0), 0);
                          countValue = `CURRENLTY: ${currentCount}`;
                        } else if (column.id === 'CABLE TEST' && showCableTestCounts) {
                          const currentCount = data.reduce((sum, row) => sum + (row['CABLE TEST'] && row['CABLE TEST'] !== '-' && row['CABLE TEST'] !== '' ? 1 : 0), 0);
                          countValue = `CURRENLTY: ${currentCount}`;
                        } else if (column.id === 'QFC' && showQcfCounts) {
                          const currentCount = data.reduce((sum, row) => sum + (row.QFC && row.QFC !== '-' && row.QFC !== '' ? 1 : 0), 0);
                          countValue = `CURRENLTY: ${currentCount}`;
                        } else if (column.id === 'QFC released instrument' && showQfcReleasedCounts) {
                          const currentCount = data.reduce((sum, row) => sum + (row['QFC released instrument'] && row['QFC released instrument'] !== '-' && row['QFC released instrument'] !== '' ? 1 : 0), 0);
                          countValue = `CURRENLTY: ${currentCount}`;
                        } else if (column.id === 'OK=100%' && showOk100Counts) {
                          const currentCount = data.reduce((sum, row) => sum + (parseFloat(row['OK=100%']) === 1.0 ? 1 : 0), 0);
                          countValue = `CURRENLTY: ${currentCount}`;
                        } else if (column.id === 'TPs' && showTestPackCounts) {
                          const uniqueTestPacks = new Set();
                          data.forEach(row => {
                            if (row.TPs && row.TPs !== '' && row.TPs !== 'NOT_APPLY') {
                              const testPacks = row.TPs.toString().split("|").map(v => v.trim()).filter(v => v !== '');
                              testPacks.forEach(tp => uniqueTestPacks.add(tp));
                            }
                          });
                          countValue = `CURRENLTY: ${uniqueTestPacks.size}`;
                        } else if (column.id === 'DOSSIER' && showDossierCounts) {
                          const currentCount = data.reduce((sum, row) => sum + (row.DOSSIER && row.DOSSIER !== '-' && row.DOSSIER !== '' ? 1 : 0), 0);
                          countValue = `CURRENLTY: ${currentCount}`;
                        } else if (column.id === 'TEST_LOOP' && showTestLoopCounts) {
                          const currentCount = data.reduce((sum, row) => sum + (row.TEST_LOOP && row.TEST_LOOP !== '-' && row.TEST_LOOP !== '' ? 1 : 0), 0);
                          countValue = `CURRENLTY: ${currentCount}`;
                        }
                      }
                      
                      // Find which header group this column belongs to
                      let headerColor = '#ffffff';
                      if (multiLevelHeaders && multiLevelHeaders[0]) {
                        const header = multiLevelHeaders[0].headers.find(h => 
                          cellIndex >= h.startCol && cellIndex < h.startCol + h.colspan
                        );
                        if (header) {
                          headerColor = header.color + '40'; // Add transparency
                        }
                      }
                      
                      return (
                        <Box
                          key={`count-cell-${cellIndex}`}
                          p={2}
                          textAlign="center"
                          borderBottom="1px solid"
                          borderRight="1px solid"
                          borderColor="gray.800"
                          bg={headerColor}
                          color="black"
                          fontWeight="bold"
                          fontSize="xs"
                          boxSizing="border-box"
                          width="100%"
                          height="100%"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                        >
                          {countValue}
                        </Box>
                      );
                    })}
                  </Box>
                );
              }
              
              // Handle data rows
              const row = rows[virtualRow.index - countRowsCount];
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