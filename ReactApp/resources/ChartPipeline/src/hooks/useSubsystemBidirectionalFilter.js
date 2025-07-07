import { useState, useMemo, useCallback } from 'react';

export const useSubsystemBidirectionalFilter = (tableAData, tableBData) => {
  const [selectedSubsystem, setSelectedSubsystem] = useState(null);

  // Filter TableA data based on selected subsystem
  const filteredTableAData = useMemo(() => {
    if (!selectedSubsystem || !tableAData) return tableAData;
    return tableAData.filter(item => item.subsystem === selectedSubsystem);
  }, [tableAData, selectedSubsystem]);

  // Filter TableB data based on selected subsystem
  const filteredTableBData = useMemo(() => {
    if (!selectedSubsystem || !tableBData) return tableBData;
    return tableBData.filter(item => item.subsystem === selectedSubsystem);
  }, [tableBData, selectedSubsystem]);

  // Handle subsystem selection from either table
  const handleSubsystemSelect = useCallback((subsystem) => {
    setSelectedSubsystem(prevSelected => 
      prevSelected === subsystem ? null : subsystem
    );
  }, []);

  // Clear filter
  const clearFilter = useCallback(() => {
    setSelectedSubsystem(null);
  }, []);

  return {
    selectedSubsystem,
    filteredTableAData,
    filteredTableBData,
    handleSubsystemSelect,
    clearFilter
  };
};