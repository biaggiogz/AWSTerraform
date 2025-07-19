import { createSignal, createMemo, createEffect, onCleanup, onMount } from 'solid-js';
import { For, Show } from 'solid-js/web';
import { createVirtualizer } from '@tanstack/solid-virtual';

/**
 * SolidJS implementation of DetailsInstrumentsTable
 * Ultra-fast table rendering with fine-grained reactivity
 */
const DetailsInstrumentsTable = (props) => {
  // Local state
  const [sortBy, setSortBy] = createSignal('item');
  const [sortDirection, setSortDirection] = createSignal('asc');
  const [columnWidths, setColumnWidths] = createSignal({});
  const [resizingColumn, setResizingColumn] = createSignal(null);
  const [startX, setStartX] = createSignal(0);
  const [startWidth, setStartWidth] = createSignal(0);
  
  // References
  let parentRef;
  let headerRef;
  
  // Column definitions with default sizes
  const columns = createMemo(() => [
    { id: 'item', header: 'ITEM', size: 80, color: '#BFB6B4' },
    { id: 'tagInstE3d', header: 'TAG INST E3D', size: 120, color: '#BFB6B4' },
    { id: 'tagInst', header: 'TAG INST', size: 120, color: '#B3CDDF' },
    { id: 'pid', header: 'P&ID', size: 80, color: '#BFB6B4' },
    { id: 'instrumentType', header: 'INSTRUMENT TYPE', size: 150, color: '#BFB6B4' },
    { id: 'subsystem', header: 'SUBSYSTEM', size: 100, color: '#CEC19B' },
    { id: 'tpInclude', header: 'TP INCLUDE', size: 80, color: '#BFB6B4' },
    { id: 'tp', header: 'TP', size: 90, color: '#7CA2C5' },
    { id: 'progressTp', header: 'PROGRESS TP', size: 90, color: '#BFB6B4' },
    { id: 'hito', header: 'HITO', size: 80, color: '#BFB6B4' },
    { id: 'teigaReinstatement', header: 'TEIGA REINSTATEMENT', size: 150, color: '#BFB6B4' },
    { id: 'teigaInsulation', header: 'TEIGA INSULATION', size: 150, color: '#BFB6B4' },
    { id: 'siemsa', header: 'SIEMSA', size: 80, color: '#BFB6B4' },
    { id: 'ten', header: 'TEN', size: 80, color: '#BFB6B4' },
    { id: 'mountingOnIsoEquiPack', header: 'MOUNTING ON ISOEQUIPACK', size: 180, color: '#007598' },
    { id: 'on', header: 'ON', size: 60, color: '#BFB6B4' },
    { id: 'scopeBy', header: 'SCOPE BY', size: 90, color: '#B3CDDF' },
    { id: 'teigaTmi', header: 'TEIGATMI', size: 100, color: '#BFB6B4' },
    { id: 'installedTeigaTmi', header: 'INSTALLED TEIGATMI', size: 140, color: '#BFB6B4' },
    { id: 'siemsa1', header: 'SIEMSA 1', size: 80, color: '#BFB6B4' },
    { id: 'installed', header: 'INSTALLED', size: 90, color: '#BFB6B4' },
    { id: 'wired', header: 'WIRED', size: 80, color: '#BFB6B4' },
    { id: 'connected', header: 'CONNECTED', size: 90, color: '#BFB6B4' },
    { id: 'cableTest', header: 'CABLE TEST', size: 90, color: '#BFB6B4' },
    { id: 'qcf', header: 'QCF', size: 70, color: '#BFB6B4' },
    { id: 'ok100', header: 'OK100', size: 70, color: '#BFB6B4' },
    { id: 'withWithoutSignal', header: 'WITH/WITHOUT SIGNAL', size: 150, color: '#BFB6B4' },
    { id: 'warehouseCode', header: 'WAREHOUSE CODE', size: 120, color: '#BFB6B4' },
    { id: 'delivery', header: 'DELIVERY', size: 90, color: '#BFB6B4' },
    { id: 'date', header: 'DATE', size: 80, color: '#BFB6B4' },
    { id: 'vendor', header: 'VENDOR', size: 100, color: '#BFB6B4' },
    { id: 'comments', header: 'COMMENTS', size: 150, color: '#BFB6B4' }
  ]);
  
  // Process data with WASM optimization
  const processedData = createMemo(() => {
    if (!props.data || props.data.length === 0) return [];
    
    // Filter out records where pid_isoinst is null
    const filteredData = props.data.filter(row => row.pid_isoinst);
    
    // Map data to normalized structure
    return filteredData.map((row, index) => ({
      id: index,
      item: row.item_isoinst || '',
      tagInstE3d: row.tag_inst_e3d_isoinst || '',
      tagInst: row.tag_inst_isoinst || '',
      pid: row.pid_isoinst || '',
      instrumentType: row.instrument_type_isoinst || '',
      subsystem: row.subsystem || '',
      tpInclude: row.tp_include_isoinst || '',
      tp: row.tp_isoinst || '',
      progressTp: row.progress_tp_isoinst || '',
      hito: row.hito_isoinst || '',
      teigaReinstatement: row.teiga_reinstatement_isoinst || '',
      teigaInsulation: row.teiga_insulation_isoinst || '',
      siemsa: row.siemsa_isoinst || '',
      ten: row.ten_isoinst || '',
      mountingOnIsoEquiPack: row.mounting_on_isoequipack_isoinst || '',
      on: row.on_isoinst || '',
      scopeBy: row.scope__by_isoinst || '',
      teigaTmi: row.teigatmi_isoinst || '',
      installedTeigaTmi: row.installed_teigatmi_isoinst || '',
      siemsa1: row.siemsa1_isoinst || '',
      installed: row.installed_isoinst || '',
      wired: row.wired_isoinst || '',
      connected: row.connected_isoinst || '',
      cableTest: row.cable_test_isoinst || '',
      qcf: row.qcf_isoinst || '',
      ok100: row.ok100_isoinst || '',
      withWithoutSignal: row.with__without_signal_isoinst || '',
      warehouseCode: row.warehouse_code_isoinst || '',
      delivery: row.delivery_isoinst || '',
      date: row.date_isoinst || '',
      vendor: row.vendor_isoinst || '',
      comments: row.comments_isoinst || '',
      _original: row // Keep reference to original row
    }));
  });
  
  // Sort data
  const sortedData = createMemo(() => {
    const data = [...processedData()];
    const field = sortBy();
    const direction = sortDirection() === 'asc' ? 1 : -1;
    
    return data.sort((a, b) => {
      const aValue = a[field];
      const bValue = b[field];
      
      if (aValue === bValue) return 0;
      if (aValue === undefined || aValue === null || aValue === '') return 1 * direction;
      if (bValue === undefined || bValue === null || bValue === '') return -1 * direction;
      
      // Handle numeric values
      if (!isNaN(aValue) && !isNaN(bValue)) {
        return (Number(aValue) - Number(bValue)) * direction;
      }
      
      // Handle string values
      return String(aValue).localeCompare(String(bValue)) * direction;
    });
  });
  
  // Create virtualizer
  const virtualizer = createMemo(() => {
    if (!parentRef) return null;
    
    return createVirtualizer({
      count: sortedData().length,
      getScrollElement: () => parentRef,
      estimateSize: () => 50,
      overscan: 10
    });
  });
  
  // Initialize column widths
  createEffect(() => {
    const widths = {};
    columns().forEach(column => {
      widths[column.id] = column.size;
    });
    setColumnWidths(widths);
  });
  
  // Handle column resize start
  const handleResizeStart = (columnId, e) => {
    e.preventDefault();
    setResizingColumn(columnId);
    setStartX(e.clientX);
    setStartWidth(columnWidths()[columnId]);
    
    const handleResizeMove = (moveEvent) => {
      if (resizingColumn()) {
        const diff = moveEvent.clientX - startX();
        const newWidth = Math.max(60, startWidth() + diff);
        
        setColumnWidths(prev => ({
          ...prev,
          [resizingColumn()]: newWidth
        }));
      }
    };
    
    const handleResizeEnd = () => {
      setResizingColumn(null);
      document.removeEventListener('mousemove', handleResizeMove);
      document.removeEventListener('mouseup', handleResizeEnd);
    };
    
    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeEnd);
  };
  
  // Handle sort toggle
  const handleSortToggle = (columnId) => {
    if (sortBy() === columnId) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(columnId);
      setSortDirection('asc');
    }
  };
  
  // Handle scroll sync
  const handleScroll = (e) => {
    if (headerRef) {
      headerRef.scrollLeft = e.target.scrollLeft;
    }
  };
  
  // Clean up event listeners
  onCleanup(() => {
    document.removeEventListener('mousemove', () => {});
    document.removeEventListener('mouseup', () => {});
  });
  
  // Render cell content based on column type
  const renderCell = (row, columnId) => {
    const value = row[columnId];
    
    // Handle special cell types
    switch (columnId) {
      case 'subsystem':
        return (
          <div class="subsystem-cell">
            <Show when={value}>
              <button 
                class={props.selectedSubsystem === value ? 'selected-button' : 'normal-button'}
                onClick={() => props.onSubsystemClick && props.onSubsystemClick(value)}
              >
                {value}
              </button>
            </Show>
          </div>
        );
        
      case 'tp':
        const testPacks = value ? 
          value.toString().split("|").map(v => v.trim()).filter(v => v !== '' && v !== '0' && v !== 'NOT_APPLY') : [];
          
        return (
          <div class="test-pack-cell">
            <Show when={testPacks.length > 0} fallback={<span class="not-apply">NOT APPLY</span>}>
              <For each={testPacks}>
                {(testPack) => (
                  <button 
                    class={props.selectedTestPack === testPack ? 'selected-button' : 'normal-button'}
                    onClick={() => props.onTestPackClick && props.onTestPackClick(testPack)}
                  >
                    {testPack}
                  </button>
                )}
              </For>
            </Show>
          </div>
        );
        
      case 'mountingOnIsoEquiPack':
        const pattern = /^(?:[^-]*-){5}[^-]*$/;
        const matchesPattern = pattern.test(value);
        const isHighlighted = props.highlightedRecords && props.highlightedRecords.has(row._original);
        const isSelected = props.selectedIsometric === value;
        
        if (!value || !matchesPattern) {
          return (
            <div 
              class={`mounting-text ${isSelected ? 'selected' : ''} ${isHighlighted ? 'highlighted' : ''}`}
              onClick={() => props.onMountingLocationClick && props.onMountingLocationClick(value)}
            >
              {value}
            </div>
          );
        }
        
        return (
          <div class="mounting-cell">
            <button 
              class={props.selectedIsometric === value ? 'selected-button' : 'normal-button'}
              onClick={() => props.onMountingLocationClick && props.onMountingLocationClick(value)}
            >
              {value}
            </button>
          </div>
        );
        
      case 'installedTeigaTmi':
      case 'installed':
      case 'wired':
      case 'connected':
      case 'cableTest':
      case 'withWithoutSignal':
        const badgeColor = value === 'YES' ? 'green' : value === 'NOT' ? 'red' : 'gray';
        return <span class={`badge ${badgeColor}`}>{value}</span>;
        
      case 'ok100':
        return <span>{value != null ? Number(value).toFixed(2) : ''}</span>;
        
      default:
        return <span>{value}</span>;
    }
  };
  
  return (
    <div class="details-instruments-table">
      <div class="table-header">
        <h2>Details Instruments</h2>
        <span class="badge blue">{processedData().length} Instruments</span>
      </div>
      
      <div class="table-container">
        {/* Table Header */}
        <div class="table-header-container" ref={headerRef}>
          <div class="table-header-row">
            <For each={columns()}>
              {(column) => (
                <div 
                  class="table-header-cell"
                  style={{
                    width: `${columnWidths()[column.id]}px`,
                    "min-width": `${columnWidths()[column.id]}px`,
                    "max-width": `${columnWidths()[column.id]}px`,
                    "background-color": column.color
                  }}
                  onClick={() => handleSortToggle(column.id)}
                >
                  <div class="header-content">
                    <span>{column.header}</span>
                    <Show when={sortBy() === column.id}>
                      <span class="sort-indicator">{sortDirection() === 'asc' ? '↑' : '↓'}</span>
                    </Show>
                  </div>
                  <div 
                    class="resize-handle"
                    onMouseDown={(e) => handleResizeStart(column.id, e)}
                  />
                </div>
              )}
            </For>
          </div>
        </div>
        
        {/* Table Body */}
        <div 
          class="table-body-container" 
          ref={parentRef}
          onScroll={handleScroll}
        >
          <Show when={processedData().length > 0} fallback={<div class="no-data">No details instruments data available</div>}>
            <div 
              class="virtual-container"
              style={{ height: `${virtualizer()?.getTotalSize() || 0}px` }}
            >
              <For each={virtualizer()?.getVirtualItems()}>
                {(virtualRow) => {
                  const row = sortedData()[virtualRow.index];
                  const isHighlighted = props.highlightedRecords && props.highlightedRecords.has(row._original);
                  
                  return (
                    <div 
                      class={`table-row ${isHighlighted ? 'highlighted' : ''}`}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: `${virtualRow.size}px`,
                        transform: `translateY(${virtualRow.start}px)`
                      }}
                    >
                      <For each={columns()}>
                        {(column) => (
                          <div 
                            class="table-cell"
                            style={{
                              width: `${columnWidths()[column.id]}px`,
                              "min-width": `${columnWidths()[column.id]}px`,
                              "max-width": `${columnWidths()[column.id]}px`
                            }}
                          >
                            {renderCell(row, column.id)}
                          </div>
                        )}
                      </For>
                    </div>
                  );
                }}
              </For>
            </div>
          </Show>
        </div>
      </div>
      
      <style>{`
        .details-instruments-table {
          margin-top: 1.5rem;
        }
        
        .table-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }
        
        .table-header h2 {
          font-size: 1.25rem;
          color: #4A5568;
        }
        
        .badge {
          padding: 0.25rem 0.75rem;
          border-radius: 0.25rem;
          font-size: 0.875rem;
        }
        
        .badge.blue {
          background-color: #4299E1;
          color: white;
        }
        
        .badge.green {
          background-color: #48BB78;
          color: white;
        }
        
        .badge.red {
          background-color: #F56565;
          color: white;
        }
        
        .badge.gray {
          background-color: #A0AEC0;
          color: white;
        }
        
        .table-container {
          border: 1px solid #E2E8F0;
          border-radius: 0.5rem;
          overflow: hidden;
          background-color: white;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
          width: 100%;
          position: relative;
        }
        
        .table-header-container {
          overflow-x: auto;
          border-bottom: 1px solid #E2E8F0;
          background-color: #F7FAFC;
        }
        
        .table-header-row {
          display: flex;
          min-width: fit-content;
        }
        
        .table-header-cell {
          text-align: center;
          font-size: 0.75rem;
          font-weight: bold;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: white;
          padding: 0.75rem 0.5rem;
          border-right: 1px solid #E2E8F0;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          position: relative;
          min-height: 50px;
        }
        
        .header-content {
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }
        
        .resize-handle {
          position: absolute;
          right: 0;
          top: 0;
          height: 100%;
          width: 4px;
          cursor: col-resize;
          background-color: transparent;
        }
        
        .resize-handle:hover {
          background-color: rgba(66, 153, 225, 0.5);
        }
        
        .table-body-container {
          height: 500px;
          overflow-y: auto;
          overflow-x: hidden;
          max-width: 100%;
          border-top: none;
        }
        
        .virtual-container {
          position: relative;
        }
        
        .table-row {
          display: flex;
          width: 100%;
          border-bottom: 1px solid #EDF2F7;
        }
        
        .table-row:hover {
          background-color: #F7FAFC;
        }
        
        .table-row.highlighted {
          background-color: #FEFCBF;
        }
        
        .table-cell {
          padding: 0.5rem;
          border-right: 1px solid #EDF2F7;
          text-align: center;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
        }
        
        .no-data {
          padding: 1.5rem;
          text-align: center;
          color: #718096;
        }
        
        /* Special cell styles */
        .subsystem-cell,
        .test-pack-cell,
        .mounting-cell {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #CBD5E0;
          border-radius: 0.25rem;
          padding: 0.25rem;
        }
        
        .normal-button {
          font-size: 0.625rem;
          font-weight: 500;
          color: #3182CE;
          background-color: white;
          border: 1px solid #3182CE;
          min-width: 30px;
          height: 18px;
          padding: 0 0.5rem;
          border-radius: 0.125rem;
          cursor: pointer;
        }
        
        .normal-button:hover {
          background-color: #BEE3F8;
        }
        
        .selected-button {
          font-size: 0.625rem;
          font-weight: 500;
          color: white;
          background-color: #48BB78;
          border: 1px solid #48BB78;
          min-width: 30px;
          height: 18px;
          padding: 0 0.5rem;
          border-radius: 0.125rem;
          cursor: pointer;
        }
        
        .selected-button:hover {
          background-color: #9AE6B4;
        }
        
        .mounting-text {
          font-size: 0.75rem;
          text-align: left;
          cursor: pointer;
          padding: 0.25rem;
          border-radius: 0.125rem;
        }
        
        .mounting-text.selected {
          color: #3182CE;
          font-weight: bold;
          background-color: #EBF8FF;
        }
        
        .mounting-text.highlighted {
          background-color: #FEFCBF;
          font-weight: bold;
        }
        
        .mounting-text:hover {
          background-color: #BEE3F8;
          color: #2C5282;
        }
        
        .not-apply {
          font-size: 0.75rem;
          color: #718096;
        }
      `}</style>
    </div>
  );
};

export default DetailsInstrumentsTable;