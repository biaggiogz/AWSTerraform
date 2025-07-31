let wasmModule = null;

export const initRustFilter = async () => {
  if (wasmModule) return wasmModule;
  
  try {
    const module = await import('./rust-filter/filter_rust.js');
    await module.default();
    wasmModule = module;
    return module;
  } catch (error) {
    console.warn('Rust filter failed to load, using JS fallback');
    return null;
  }
};

export const filterTableDataRust = async (data, filters) => {
  const module = await initRustFilter();
  if (!module) {
    // JS fallback
    return data.filter(row => {
      if (filters.subsystem && row.SUBSYSTEM !== filters.subsystem) return false;
      if (filters.testPack && !row.TPs?.includes(filters.testPack)) return false;
      if (filters.isometric && row['MOUNTING ON ISO/EQUI/PACK'] !== filters.isometric) return false;
      return true;
    });
  }
  
  return module.filter_table_data(data, filters.subsystem, filters.testPack, filters.isometric);
};

export const calculateRowHeightsRust = async (data) => {
  const module = await initRustFilter();
  if (!module) {
    // JS fallback
    return Array(data?.length || 0).fill(35);
  }
  
  return module.calculate_row_heights(data);
};