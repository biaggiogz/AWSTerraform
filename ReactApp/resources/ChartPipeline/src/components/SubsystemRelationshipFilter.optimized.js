import React, { useMemo, useCallback, useState } from 'react';

/**
 * Custom hook for SUBSYSTEM cross-dataset filtering
 * @returns {Object} Filter state and handlers
 */
export const useSubsystemFilter = () => {
  const [selectedSubsystem, setSelectedSubsystem] = useState(null);

  // Handle subsystem selection
  const handleSubsystemClick = useCallback((subsystemValue) => {
    setSelectedSubsystem(prev => prev === subsystemValue ? null : subsystemValue);
  }, []);

  // Filter control data by selected subsystem
  const filterControlData = useCallback((data) => {
    if (!selectedSubsystem || !data) return data;
    
    return data.filter(row => {
      const subsystem = row.SUBSYSTEM || row.SUSSYTEM || ''; // Handle both field names
      return subsystem === selectedSubsystem;
    });
  }, [selectedSubsystem]);

  // Filter detail data by selected subsystem
  const filterDetailData = useCallback((data) => {
    if (!selectedSubsystem || !data) return data;
    
    return data.filter(row => {
      const subsystem = row.SUBSYSTEM || '';
      return subsystem === selectedSubsystem;
    });
  }, [selectedSubsystem]);

  // Clear filter
  const clearSubsystemFilter = useCallback(() => {
    setSelectedSubsystem(null);
  }, []);

  return {
    selectedSubsystem,
    handleSubsystemClick,
    filterControlData,
    filterDetailData,
    clearSubsystemFilter
  };
};

/**
 * SubsystemRelationshipFilter Context Provider
 */
export const SubsystemRelationshipContext = React.createContext();

export const SubsystemRelationshipProvider = ({ children }) => {
  const filterState = useSubsystemFilter();
  
  return (
    <SubsystemRelationshipContext.Provider value={filterState}>
      {children}
    </SubsystemRelationshipContext.Provider>
  );
};

/**
 * Hook to use subsystem relationship context
 */
export const useSubsystemRelationshipContext = () => {
  const context = React.useContext(SubsystemRelationshipContext);
  if (!context) {
    throw new Error('useSubsystemRelationshipContext must be used within SubsystemRelationshipProvider');
  }
  return context;
};

export default {
  useSubsystemFilter,
  SubsystemRelationshipProvider,
  useSubsystemRelationshipContext
};