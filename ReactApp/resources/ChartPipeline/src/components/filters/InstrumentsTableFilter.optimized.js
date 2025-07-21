import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';

/**
 * Split test pack string into array of test packs
 * Memoized for better performance
 * @param {string} testPackStr - Test pack string (e.g., "1|2|3")
 * @returns {Array} Array of test pack values
 */
function splitTestPack(testPackStr) {
  if (!testPackStr || testPackStr === '' || testPackStr === 'NOT_APPLY') return [];
  return testPackStr.toString().split("|").map(v => v.trim()).filter(v => v !== '');
}

/**
 * Context for sharing filter state between instrument tables
 */
const InstrumentsTableFilterContext = createContext();

/**
 * Custom hook for instruments table filtering
 * @returns {Object} Filter state and handlers
 */
export const useInstrumentsTableFilter = () => {
  // Filter state
  const [selectedIsometric, setSelectedIsometric] = useState(null);
  const [selectedTestPack, setSelectedTestPack] = useState(null);
  const [selectedSubsystem, setSelectedSubsystem] = useState(null);
  
  // Handle isometric selection - memoized for performance
  const onIsometricSelect = useCallback((isoId) => {
    setSelectedIsometric(prev => prev === isoId ? null : isoId);
  }, []);
  
  // Handle test pack selection - memoized for performance
  const handleTestPackClick = useCallback((testPack) => {
    setSelectedTestPack(prev => prev === testPack ? null : testPack);
  }, []);
  
  // Handle subsystem selection - memoized for performance
  const handleSubsystemClick = useCallback((subsystem) => {
    setSelectedSubsystem(prev => prev === subsystem ? null : subsystem);
  }, []);
  
  // Clear all filters - memoized for performance
  const clearAllFilters = useCallback(() => {
    setSelectedIsometric(null);
    setSelectedTestPack(null);
    setSelectedSubsystem(null);
  }, []);
  
  // Filter functions for each table type - memoized for performance
  const filterDetailsTable = useCallback((data) => {
    if (!data || !data.length) return [];
    if (!selectedIsometric && !selectedTestPack && !selectedSubsystem) return data;
    
    return data.filter(row => {
      // Filter by isometric
      if (selectedIsometric && row['MOUNTING ON ISO/EQUI/PACK'] !== selectedIsometric) {
        return false;
      }
      
      // Filter by test pack
      if (selectedTestPack) {
        const testPacks = splitTestPack(row['TPs']);
        if (!testPacks.includes(selectedTestPack)) {
          return false;
        }
      }
      
      // Filter by subsystem
      if (selectedSubsystem && row['SUBSYSTEM'] !== selectedSubsystem) {
        return false;
      }
      
      return true;
    });
  }, [selectedIsometric, selectedTestPack, selectedSubsystem]);
  
  const filterControlTable = useCallback((data) => {
    if (!data || !data.length) return [];
    if (!selectedIsometric && !selectedTestPack && !selectedSubsystem) return data;
    
    return data.filter(row => {
      // Filter by isometric
      if (selectedIsometric && row['ISOMETRIC'] !== selectedIsometric) {
        return false;
      }
      
      // Filter by test pack
      if (selectedTestPack) {
        const testPacks = splitTestPack(row['TPs']);
        if (!testPacks.includes(selectedTestPack)) {
          return false;
        }
      }
      
      // Filter by subsystem
      if (selectedSubsystem && row['SUBSYSTEM'] !== selectedSubsystem) {
        return false;
      }
      
      return true;
    });
  }, [selectedIsometric, selectedTestPack, selectedSubsystem]);
  
  const filterDynamicTable = useCallback((data) => {
    if (!data || !data.length) return [];
    if (!selectedTestPack && !selectedSubsystem) return data;
    
    return data.filter(row => {
      // Filter by test pack
      if (selectedTestPack && row['TP'] !== selectedTestPack) {
        return false;
      }
      
      // Filter by subsystem
      if (selectedSubsystem && row['SUBSYSTEM'] !== selectedSubsystem) {
        return false;
      }
      
      return true;
    });
  }, [selectedTestPack, selectedSubsystem]);
  
  // Return filter state and handlers - memoized for performance
  return useMemo(() => ({
    // Filter state
    selectedIsometric,
    selectedTestPack,
    selectedSubsystem,
    
    // Filter handlers
    onIsometricSelect,
    handleTestPackClick,
    handleSubsystemClick,
    clearAllFilters,
    
    // Filter functions
    filterDetailsTable,
    filterControlTable,
    filterDynamicTable
  }), [
    selectedIsometric, 
    selectedTestPack, 
    selectedSubsystem, 
    onIsometricSelect, 
    handleTestPackClick, 
    handleSubsystemClick, 
    clearAllFilters, 
    filterDetailsTable, 
    filterControlTable, 
    filterDynamicTable
  ]);
};

/**
 * Provider component for instruments table filter
 */
export const InstrumentsTableFilterProvider = React.memo(({ children }) => {
  const filterState = useInstrumentsTableFilter();
  
  return (
    <InstrumentsTableFilterContext.Provider value={filterState}>
      {children}
    </InstrumentsTableFilterContext.Provider>
  );
});

/**
 * Hook to use instruments table filter context
 */
export const useInstrumentsTableFilterContext = () => {
  const context = useContext(InstrumentsTableFilterContext);
  if (!context) {
    throw new Error('useInstrumentsTableFilterContext must be used within InstrumentsTableFilterProvider');
  }
  return context;
};

export default {
  InstrumentsTableFilterProvider,
  useInstrumentsTableFilterContext,
  useInstrumentsTableFilter
};