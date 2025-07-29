import * as XLSX from 'xlsx';

// Color mappings matching SummarySubsystemsTableA.js
const HEADER_COLORS = {
  // Level 1 colors
  subsystem_info: { fgColor: { rgb: "0082A9" } },
  summary_items: { fgColor: { rgb: "B03052" } },
  loop_testing: { fgColor: { rgb: "8AB3DB" } },
  instruments: { fgColor: { rgb: "A888B5" } },
  tracing: { fgColor: { rgb: "0ABAB5" } },
  insulation_progress: { fgColor: { rgb: "ab9f81" } },
  punch: { fgColor: { rgb: "748DAE" } },
  psv: { fgColor: { rgb: "e29d61" } },
  motor: { fgColor: { rgb: "943168" } },
  
  // Level 2 colors
  item_status: { fgColor: { rgb: "9E2B4A" } },
  loop_metrics: { fgColor: { rgb: "7CA2C5" } },
  instrument_metrics: { fgColor: { rgb: "977AA3" } },
  tracing_metrics: { fgColor: { rgb: "09A7A3" } },
  insulation_status: { fgColor: { rgb: "96896e" } },
  punch_metrics: { fgColor: { rgb: "687F9D" } },
  psv_metrics: { fgColor: { rgb: "cc8d57" } },
  motor_metrics: { fgColor: { rgb: "842c5e" } },
  
  // Level 3 colors
  subsystem_columns: { fgColor: { rgb: "007598" } },
  items_columns: { fgColor: { rgb: "B03052" } },
  loop_columns: { fgColor: { rgb: "7CA2C5" } },
  inst_columns: { fgColor: { rgb: "A888B5" } },
  tracing_columns: { fgColor: { rgb: "0ABAB5" } },
  insul_columns: { fgColor: { rgb: "ab9f81" } },
  punch_columns: { fgColor: { rgb: "748DAE" } },
  psv_columns: { fgColor: { rgb: "cc8d57" } },
  motor_columns: { fgColor: { rgb: "943168" } }
};

// Status colors for data cells
const STATUS_COLORS = {
  completed: { fgColor: { rgb: "06923E" } },
  inProgress: { fgColor: { rgb: "E85C0D" } },
  notApply: { fgColor: { rgb: "212121" } }
};

// Column definitions matching the table structure
const COLUMN_DEFINITIONS = [
  { key: 'fluid_subsystem', header: 'FLUID', width: 8, group: 'subsystem' },
  { key: 'subsystem', header: 'SUBSYSTEM', width: 15, group: 'subsystem' },
  { key: 'hito_isos', header: 'HITO', width: 10, group: 'subsystem' },
  { key: 'description', header: 'DESCRIPTION', width: 20, group: 'subsystem' },
  { key: 'n_distinct_tps', header: 'N°TP', width: 8, group: 'subsystem' },
  
  { key: 'total_items', header: 'TOTAL ITEMS', width: 12, group: 'items' },
  { key: 'done_items', header: 'DONE ITEMS', width: 12, group: 'items' },
  { key: 'pending_items', header: 'PENDING ITEMS', width: 12, group: 'items' },
  { key: 'avg_progress_subsystem', header: 'AVG PROGRESS SUBSYSTEM', width: 15, group: 'items' },
  
  { key: 'total_loop', header: 'TOTAL LOOP', width: 12, group: 'loop' },
  { key: 'done_loop', header: 'LOOP DONE', width: 12, group: 'loop' },
  { key: 'pending_loop', header: 'LOOP PENDING', width: 12, group: 'loop' },
  
  { key: 'total_inst', header: 'TOTAL INST', width: 12, group: 'inst' },
  { key: 'done_inst', header: 'DONE INST', width: 12, group: 'inst' },
  { key: 'pending_inst', header: 'PENDING INST', width: 12, group: 'inst' },
  
  { key: 'total_tracing', header: 'TOTAL TRACING', width: 12, group: 'tracing' },
  { key: 'done_tracing', header: 'DONE TRACING', width: 12, group: 'tracing' },
  { key: 'pending_tracing', header: 'PENDING TRACING', width: 12, group: 'tracing' },
  
  { key: 'total_insulation', header: 'TOTAL INSUL', width: 12, group: 'insul' },
  { key: 'done_insulation', header: 'Done Insul', width: 12, group: 'insul' },
  { key: 'pending_insulation', header: 'Pending Insul', width: 12, group: 'insul' },
  
  { key: 'total_punch', header: 'TOTAL PUNCH', width: 12, group: 'punch' },
  { key: 'close_punch', header: 'CLOSE PUNCH', width: 12, group: 'punch' },
  { key: 'pending_punch', header: 'PENDING PUNCH', width: 12, group: 'punch' },
  { key: 'open_punch', header: 'OPEN PUNCH', width: 12, group: 'punch' },
  
  { key: 'psv_total', header: 'PSV TOTAL', width: 12, group: 'psv' },
  { key: 'psv_calibrated', header: 'PSV CALIBRATED', width: 12, group: 'psv' },
  { key: 'psv_to_calibrate', header: 'PSV TO CALIBRATE', width: 12, group: 'psv' },
  
  { key: 'motor_tot', header: 'MOTOR TOTAL', width: 12, group: 'motor' },
  { key: 'motor_solo_run_done', header: 'MOTOR Solo Run DONE', width: 15, group: 'motor' },
  { key: 'solo_run_pending', header: 'MOTOR Solo Run PENDING', width: 15, group: 'motor' }
];

// Multi-level header structure
const MULTI_LEVEL_HEADERS = [
  {
    level: 1,
    headers: [
      { title: 'SUBSYSTEM INFORMATION', colspan: 5, startCol: 0, colorKey: 'subsystem_info' },
      { title: 'SUMMARY ITEMS BY SUBSYSTEM', colspan: 4, startCol: 5, colorKey: 'summary_items' },
      { title: 'LOOP SIGNAL PROGRESS', colspan: 3, startCol: 9, colorKey: 'loop_testing' },
      { title: 'INSTRUMENTS PROGRESS', colspan: 3, startCol: 12, colorKey: 'instruments' },
      { title: 'TRACING PROGRESS', colspan: 3, startCol: 15, colorKey: 'tracing' },
      { title: 'INSULATION PROGRESS', colspan: 3, startCol: 18, colorKey: 'insulation_progress' },
      { title: 'PUNCH LIST PROGRESS', colspan: 4, startCol: 21, colorKey: 'punch' },
      { title: 'PSV PROGRESS', colspan: 3, startCol: 25, colorKey: 'psv' },
      { title: 'MOTOR PROGRESS', colspan: 3, startCol: 28, colorKey: 'motor' }
    ]
  },
  {
    level: 2,
    headers: [
      { title: '', colspan: 5, startCol: 0, colorKey: null },
      { title: 'ITEM STATUS', colspan: 4, startCol: 5, colorKey: 'item_status' },
      { title: 'LOOP STATUS', colspan: 3, startCol: 9, colorKey: 'loop_metrics' },
      { title: 'INSTRUMENT STATUS', colspan: 3, startCol: 12, colorKey: 'instrument_metrics' },
      { title: 'TRACING STATUS', colspan: 3, startCol: 15, colorKey: 'tracing_metrics' },
      { title: 'INSULATION STATUS', colspan: 3, startCol: 18, colorKey: 'insulation_status' },
      { title: 'PUNCH LIST STATUS', colspan: 4, startCol: 21, colorKey: 'punch_metrics' },
      { title: 'PSV STATUS', colspan: 3, startCol: 25, colorKey: 'psv_metrics' },
      { title: 'MOTOR STATUS', colspan: 3, startCol: 28, colorKey: 'motor_metrics' }
    ]
  }
];

// Get status color for data cells
const getStatusColor = (totalValue, doneValue, filterVisible) => {
  if (!filterVisible) {
    const isDone = (totalValue === doneValue) && (totalValue > 0);
    return isDone ? STATUS_COLORS.completed : null;
  }
  
  if (totalValue === null || totalValue === undefined || totalValue === '' || totalValue === 0) {
    return STATUS_COLORS.notApply;
  }
  
  const isDone = (totalValue === doneValue) && (totalValue > 0);
  return isDone ? STATUS_COLORS.completed : STATUS_COLORS.inProgress;
};

// Format cell value
const formatCellValue = (value, key, filterVisible) => {
  if (filterVisible && (value === null || value === undefined || value === '' || value === 0)) {
    return 'NOT APPLY';
  }
  
  if (typeof value === 'number') {
    if (key === 'avg_progress_subsystem') {
      return `${value.toFixed(1)}%`;
    }
    return value.toLocaleString();
  }
  
  return value || '';
};

export const exportSummarySubsystemsToExcel = (data, filterStates = {}) => {
  const wb = XLSX.utils.book_new();
  
  // Create worksheet data array
  const wsData = [];
  
  // Add multi-level headers
  MULTI_LEVEL_HEADERS.forEach((level, levelIndex) => {
    const headerRow = new Array(COLUMN_DEFINITIONS.length).fill('');
    level.headers.forEach(header => {
      if (header.title) {
        headerRow[header.startCol] = header.title;
      }
    });
    wsData.push(headerRow);
  });
  
  // Add column headers
  const columnHeaderRow = COLUMN_DEFINITIONS.map(col => col.header);
  wsData.push(columnHeaderRow);
  
  // Add data rows
  data.forEach(row => {
    const dataRow = COLUMN_DEFINITIONS.map(col => {
      const value = row[col.key];
      return formatCellValue(value, col.key, filterStates[col.group]?.visible);
    });
    wsData.push(dataRow);
  });
  
  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  
  // Set column widths
  ws['!cols'] = COLUMN_DEFINITIONS.map(col => ({ width: col.width }));
  
  // Apply formatting
  const range = XLSX.utils.decode_range(ws['!ref']);
  
  // Format multi-level headers
  MULTI_LEVEL_HEADERS.forEach((level, levelIndex) => {
    level.headers.forEach(header => {
      if (header.colorKey && HEADER_COLORS[header.colorKey]) {
        for (let col = header.startCol; col < header.startCol + header.colspan; col++) {
          const cellRef = XLSX.utils.encode_cell({ r: levelIndex, c: col });
          if (!ws[cellRef]) ws[cellRef] = { t: 's', v: '' };
          ws[cellRef].s = {
            fill: HEADER_COLORS[header.colorKey],
            font: { color: { rgb: "FFFFFF" }, bold: true, sz: 10 },
            alignment: { horizontal: 'center', vertical: 'center' },
            border: {
              top: { style: 'thin', color: { rgb: "000000" } },
              bottom: { style: 'thin', color: { rgb: "000000" } },
              left: { style: 'thin', color: { rgb: "000000" } },
              right: { style: 'thin', color: { rgb: "000000" } }
            }
          };
        }
      }
    });
  });
  
  // Format column headers
  COLUMN_DEFINITIONS.forEach((col, colIndex) => {
    const cellRef = XLSX.utils.encode_cell({ r: 2, c: colIndex });
    if (!ws[cellRef]) ws[cellRef] = { t: 's', v: col.header };
    
    let colorKey;
    switch (col.group) {
      case 'subsystem': colorKey = 'subsystem_columns'; break;
      case 'items': colorKey = 'items_columns'; break;
      case 'loop': colorKey = 'loop_columns'; break;
      case 'inst': colorKey = 'inst_columns'; break;
      case 'tracing': colorKey = 'tracing_columns'; break;
      case 'insul': colorKey = 'insul_columns'; break;
      case 'punch': colorKey = 'punch_columns'; break;
      case 'psv': colorKey = 'psv_columns'; break;
      case 'motor': colorKey = 'motor_columns'; break;
      default: colorKey = 'subsystem_columns';
    }
    
    ws[cellRef].s = {
      fill: HEADER_COLORS[colorKey],
      font: { color: { rgb: "FFFFFF" }, bold: true, sz: 9 },
      alignment: { horizontal: 'center', vertical: 'center' },
      border: {
        top: { style: 'thin', color: { rgb: "000000" } },
        bottom: { style: 'thin', color: { rgb: "000000" } },
        left: { style: 'thin', color: { rgb: "000000" } },
        right: { style: 'thin', color: { rgb: "000000" } }
      }
    };
  });
  
  // Format data cells with status colors
  for (let rowIndex = 3; rowIndex <= range.e.r; rowIndex++) {
    const dataRowIndex = rowIndex - 3;
    const rowData = data[dataRowIndex];
    
    if (!rowData) continue;
    
    COLUMN_DEFINITIONS.forEach((col, colIndex) => {
      const cellRef = XLSX.utils.encode_cell({ r: rowIndex, c: colIndex });
      if (!ws[cellRef]) return;
      
      let cellStyle = {
        font: { sz: 10 },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: {
          top: { style: 'thin', color: { rgb: "E2E8F0" } },
          bottom: { style: 'thin', color: { rgb: "E2E8F0" } },
          left: { style: 'thin', color: { rgb: "E2E8F0" } },
          right: { style: 'thin', color: { rgb: "E2E8F0" } }
        }
      };
      
      // Apply status colors for specific columns
      if (col.key === 'total_items' || col.key === 'total_loop' || col.key === 'total_inst' || 
          col.key === 'total_tracing' || col.key === 'total_insulation' || col.key === 'psv_total' || 
          col.key === 'motor_tot') {
        const totalValue = rowData[col.key];
        let doneValue = 0;
        
        // Map total columns to their corresponding done columns
        switch (col.key) {
          case 'total_items': doneValue = rowData['done_items'] || 0; break;
          case 'total_loop': doneValue = rowData['done_loop'] || 0; break;
          case 'total_inst': doneValue = rowData['done_inst'] || 0; break;
          case 'total_tracing': doneValue = rowData['done_tracing'] || 0; break;
          case 'total_insulation': doneValue = rowData['done_insulation'] || 0; break;
          case 'psv_total': doneValue = rowData['psv_calibrated'] || 0; break;
          case 'motor_tot': doneValue = rowData['motor_solo_run_done'] || 0; break;
        }
        
        const statusColor = getStatusColor(totalValue, doneValue, filterStates[col.group]?.visible);
        if (statusColor) {
          cellStyle.fill = statusColor;
          cellStyle.font.color = { rgb: "FFFFFF" };
        }
      }
      
      // Apply completion color for avg_progress_subsystem when 100%
      if (col.key === 'avg_progress_subsystem' && rowData[col.key] === 100) {
        cellStyle.fill = STATUS_COLORS.completed;
        cellStyle.font.color = { rgb: "FFFFFF" };
      }
      
      // Special alignment for description
      if (col.key === 'description') {
        cellStyle.alignment.horizontal = 'left';
      }
      
      ws[cellRef].s = cellStyle;
    });
  }
  
  // Add merged cells for multi-level headers
  const merges = [];
  MULTI_LEVEL_HEADERS.forEach((level, levelIndex) => {
    level.headers.forEach(header => {
      if (header.colspan > 1) {
        merges.push({
          s: { r: levelIndex, c: header.startCol },
          e: { r: levelIndex, c: header.startCol + header.colspan - 1 }
        });
      }
    });
  });
  
  ws['!merges'] = merges;
  
  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Subsystem Overview');
  
  // Generate filename with timestamp
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
  const filename = `Subsystem_Overview_${timestamp}.xlsx`;
  
  // Save file
  XLSX.writeFile(wb, filename);
  
  return filename;
};