import ExcelJS from 'exceljs';

// Color mappings matching SummarySubsystemsTableA.js
const HEADER_COLORS = {
  // Level 1 colors
  subsystem_info: '0082A9',
  summary_items: 'B03052',
  loop_testing: '8AB3DB',
  instruments: 'A888B5',
  tracing: '0ABAB5',
  insulation_progress: 'AB9F81',
  punch: '748DAE',
  psv: 'E29D61',
  motor: '943168',
  
  // Level 2 colors
  item_status: '9E2B4A',
  loop_metrics: '7CA2C5',
  instrument_metrics: '977AA3',
  tracing_metrics: '09A7A3',
  insulation_status: '96896E',
  punch_metrics: '687F9D',
  psv_metrics: 'CC8D57',
  motor_metrics: '842C5E',
  
  // Level 3 colors
  subsystem_columns: '007598',
  items_columns: 'B03052',
  loop_columns: '7CA2C5',
  inst_columns: 'A888B5',
  tracing_columns: '0ABAB5',
  insul_columns: 'AB9F81',
  punch_columns: '748DAE',
  psv_columns: 'CC8D57',
  motor_columns: '943168'
};

// Status colors for data cells
const STATUS_COLORS = {
  completed: '06923E',
  inProgress: 'E85C0D',
  notApply: '212121'
};

// Column definitions matching the table structure
const COLUMN_DEFINITIONS = [
  { key: 'fluid_subsystem', header: 'FLUID', width: 10, group: 'subsystem' },
  { key: 'subsystem', header: 'SUBSYSTEM', width: 18, group: 'subsystem' },
  { key: 'hito_isos', header: 'HITO', width: 12, group: 'subsystem' },
  { key: 'description', header: 'DESCRIPTION', width: 25, group: 'subsystem' },
  { key: 'n_distinct_tps', header: 'N°TP', width: 10, group: 'subsystem' },
  
  { key: 'total_items', header: 'TOTAL ITEMS', width: 15, group: 'items' },
  { key: 'done_items', header: 'DONE ITEMS', width: 15, group: 'items' },
  { key: 'pending_items', header: 'PENDING ITEMS', width: 15, group: 'items' },
  { key: 'avg_progress_subsystem', header: 'AVG PROGRESS SUBSYSTEM', width: 20, group: 'items' },
  
  { key: 'total_loop', header: 'TOTAL LOOP', width: 15, group: 'loop' },
  { key: 'done_loop', header: 'LOOP DONE', width: 15, group: 'loop' },
  { key: 'pending_loop', header: 'LOOP PENDING', width: 15, group: 'loop' },
  
  { key: 'total_inst', header: 'TOTAL INST', width: 15, group: 'inst' },
  { key: 'done_inst', header: 'DONE INST', width: 15, group: 'inst' },
  { key: 'pending_inst', header: 'PENDING INST', width: 15, group: 'inst' },
  
  { key: 'total_tracing', header: 'TOTAL TRACING', width: 15, group: 'tracing' },
  { key: 'done_tracing', header: 'DONE TRACING', width: 15, group: 'tracing' },
  { key: 'pending_tracing', header: 'PENDING TRACING', width: 15, group: 'tracing' },
  
  { key: 'total_insulation', header: 'TOTAL INSUL', width: 15, group: 'insul' },
  { key: 'done_insulation', header: 'Done Insul', width: 15, group: 'insul' },
  { key: 'pending_insulation', header: 'Pending Insul', width: 15, group: 'insul' },
  
  { key: 'total_punch', header: 'TOTAL PUNCH', width: 15, group: 'punch' },
  { key: 'close_punch', header: 'CLOSE PUNCH', width: 15, group: 'punch' },
  { key: 'pending_punch', header: 'PENDING PUNCH', width: 15, group: 'punch' },
  { key: 'open_punch', header: 'OPEN PUNCH', width: 15, group: 'punch' },
  
  { key: 'psv_total', header: 'PSV TOTAL', width: 15, group: 'psv' },
  { key: 'psv_calibrated', header: 'PSV CALIBRATED', width: 15, group: 'psv' },
  { key: 'psv_to_calibrate', header: 'PSV TO CALIBRATE', width: 18, group: 'psv' },
  
  { key: 'motor_tot', header: 'MOTOR TOTAL', width: 15, group: 'motor' },
  { key: 'motor_solo_run_done', header: 'MOTOR Solo Run DONE', width: 20, group: 'motor' },
  { key: 'solo_run_pending', header: 'MOTOR Solo Run PENDING', width: 20, group: 'motor' }
];

// Multi-level header structure
const MULTI_LEVEL_HEADERS = [
  {
    level: 1,
    headers: [
      { title: 'SUBSYSTEM INFORMATION', colspan: 5, startCol: 1, colorKey: 'subsystem_info' },
      { title: 'SUMMARY ITEMS BY SUBSYSTEM', colspan: 4, startCol: 6, colorKey: 'summary_items' },
      { title: 'LOOP SIGNAL PROGRESS', colspan: 3, startCol: 10, colorKey: 'loop_testing' },
      { title: 'INSTRUMENTS PROGRESS', colspan: 3, startCol: 13, colorKey: 'instruments' },
      { title: 'TRACING PROGRESS', colspan: 3, startCol: 16, colorKey: 'tracing' },
      { title: 'INSULATION PROGRESS', colspan: 3, startCol: 19, colorKey: 'insulation_progress' },
      { title: 'PUNCH LIST PROGRESS', colspan: 4, startCol: 22, colorKey: 'punch' },
      { title: 'PSV PROGRESS', colspan: 3, startCol: 26, colorKey: 'psv' },
      { title: 'MOTOR PROGRESS', colspan: 3, startCol: 29, colorKey: 'motor' }
    ]
  },
  {
    level: 2,
    headers: [
      { title: '', colspan: 5, startCol: 1, colorKey: null },
      { title: 'ITEM STATUS', colspan: 4, startCol: 6, colorKey: 'item_status' },
      { title: 'LOOP STATUS', colspan: 3, startCol: 10, colorKey: 'loop_metrics' },
      { title: 'INSTRUMENT STATUS', colspan: 3, startCol: 13, colorKey: 'instrument_metrics' },
      { title: 'TRACING STATUS', colspan: 3, startCol: 16, colorKey: 'tracing_metrics' },
      { title: 'INSULATION STATUS', colspan: 3, startCol: 19, colorKey: 'insulation_status' },
      { title: 'PUNCH LIST STATUS', colspan: 4, startCol: 22, colorKey: 'punch_metrics' },
      { title: 'PSV STATUS', colspan: 3, startCol: 26, colorKey: 'psv_metrics' },
      { title: 'MOTOR STATUS', colspan: 3, startCol: 29, colorKey: 'motor_metrics' }
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

export const exportSummarySubsystemsToExcel = async (data, filterStates = {}) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Subsystem Overview');
  
  // Set column widths
  COLUMN_DEFINITIONS.forEach((col, index) => {
    worksheet.getColumn(index + 1).width = col.width;
  });
  
  // Add multi-level headers
  MULTI_LEVEL_HEADERS.forEach((level, levelIndex) => {
    const rowIndex = levelIndex + 1;
    const row = worksheet.getRow(rowIndex);
    
    level.headers.forEach(header => {
      if (header.title) {
        const cell = row.getCell(header.startCol);
        cell.value = header.title;
        
        // Merge cells for colspan
        if (header.colspan > 1) {
          worksheet.mergeCells(rowIndex, header.startCol, rowIndex, header.startCol + header.colspan - 1);
        }
        
        // Apply styling
        if (header.colorKey && HEADER_COLORS[header.colorKey]) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF' + HEADER_COLORS[header.colorKey] }
          };
          cell.font = { color: { argb: 'FFFFFFFF' }, bold: true, size: 10 };
        } else {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF7FAFC' }
          };
          cell.font = { color: { argb: 'FF000000' }, bold: false, size: 10 };
        }
        
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
          left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
          bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
          right: { style: 'thin', color: { argb: 'FFCCCCCC' } }
        };
      }
    });
  });
  
  // Add column headers
  const headerRow = worksheet.getRow(3);
  COLUMN_DEFINITIONS.forEach((col, index) => {
    const cell = headerRow.getCell(index + 1);
    cell.value = col.header;
    
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
    
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF' + HEADER_COLORS[colorKey] }
    };
    cell.font = { color: { argb: 'FFFFFFFF' }, bold: true, size: 9 };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
    };
  });
  
  // Add data rows
  data.forEach((rowData, rowIndex) => {
    const row = worksheet.getRow(rowIndex + 4);
    
    COLUMN_DEFINITIONS.forEach((col, colIndex) => {
      const cell = row.getCell(colIndex + 1);
      const value = rowData[col.key];
      cell.value = formatCellValue(value, col.key, filterStates[col.group]?.visible);
      
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
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF' + statusColor }
          };
          cell.font = { color: { argb: 'FFFFFFFF' }, size: 10 };
        }
      }
      
      // Apply completion color for avg_progress_subsystem when 100%
      if (col.key === 'avg_progress_subsystem' && rowData[col.key] === 100) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF' + STATUS_COLORS.completed }
        };
        cell.font = { color: { argb: 'FFFFFFFF' }, size: 10 };
      }
      
      // Set alignment
      cell.alignment = { 
        horizontal: col.key === 'description' ? 'left' : 'center', 
        vertical: 'middle' 
      };
      
      // Add borders
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
      };
      
      if (!cell.font) cell.font = {};
      if (!cell.font.size) cell.font.size = 10;
    });
  });
  
  // Generate filename with timestamp
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
  const filename = `Subsystem_Overview_${timestamp}.xlsx`;
  
  // Write file
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  window.URL.revokeObjectURL(url);
  
  return filename;
};