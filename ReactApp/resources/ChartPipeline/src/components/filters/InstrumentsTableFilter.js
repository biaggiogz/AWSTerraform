import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';

/**
 * Split test pack string into array of test packs
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
  
  // Handle isometric selection
  const onIsometricSelect = useCallback((isoId) => {
    setSelectedIsometric(prev => prev === isoId ? null : isoId);
  }, []);
  
  // Handle test pack selection
  const handleTestPackClick = useCallback((testPack) => {
    setSelectedTestPack(prev => prev === testPack ? null : testPack);
  }, []);
  
  // Handle subsystem selection
  const handleSubsystemClick = useCallback((subsystem) => {
    setSelectedSubsystem(prev => prev === subsystem ? null : subsystem);
  }, []);
  
  // Clear all filters
  const clearAllFilters = useCallback(() => {
    setSelectedIsometric(null);
    setSelectedTestPack(null);
    setSelectedSubsystem(null);
  }, []);
  
  // Filter functions for each table type
  const filterDetailsTable = useCallback((data) => {
    if (!data) return [];
    
    let filteredData = [...data];
    
    // Filter by isometric
    if (selectedIsometric) {
      filteredData = filteredData.filter(row => 
        row['MOUNTING ON ISO/EQUI/PACK'] === selectedIsometric
      );
    }
    
    // Filter by test pack
    if (selectedTestPack) {
      filteredData = filteredData.filter(row => {
        const testPacks = splitTestPack(row['TPs']);
        return testPacks.includes(selectedTestPack);
      });
    }
    
    // Filter by subsystem
    if (selectedSubsystem) {
      filteredData = filteredData.filter(row => 
        row['SUBSYSTEM'] === selectedSubsystem
      );
    }
    
    return filteredData;
  }, [selectedIsometric, selectedTestPack, selectedSubsystem]);
  
  const filterControlTable = useCallback((data) => {
    if (!data) return [];
    
    let filteredData = [...data];
    
    // Filter by isometric
    if (selectedIsometric) {
      filteredData = filteredData.filter(row => 
        row['ISOMETRIC'] === selectedIsometric
      );
    }
    
    // Filter by test pack
    if (selectedTestPack) {
      filteredData = filteredData.filter(row => {
        const testPacks = splitTestPack(row['TPs']);
        return testPacks.includes(selectedTestPack);
      });
    }
    
    // Filter by subsystem
    if (selectedSubsystem) {
      filteredData = filteredData.filter(row => 
        row['SUBSYSTEM'] === selectedSubsystem
      );
    }
    
    return filteredData;
  }, [selectedIsometric, selectedTestPack, selectedSubsystem]);
  
  const filterDynamicTable = useCallback((data) => {
    if (!data) return [];
    
    let filteredData = [...data];
    
    // Filter by test pack
    if (selectedTestPack) {
      filteredData = filteredData.filter(row => 
        row['TP'] === selectedTestPack
      );
    }
    
    // Filter by subsystem
    if (selectedSubsystem) {
      filteredData = filteredData.filter(row => 
        row['SUBSYSTEM'] === selectedSubsystem
      );
    }
    
    return filteredData;
  }, [selectedTestPack, selectedSubsystem]);
  
  // Return filter state and handlers
  return {
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
  };
};

/**
 * Provider component for instruments table filter
 */
export const InstrumentsTableFilterProvider = ({ children }) => {
  const filterState = useInstrumentsTableFilter();
  
  return (
    <InstrumentsTableFilterContext.Provider value={filterState}>
      {children}
    </InstrumentsTableFilterContext.Provider>
  );
};

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