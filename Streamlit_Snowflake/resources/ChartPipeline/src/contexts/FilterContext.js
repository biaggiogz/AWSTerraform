import React, { createContext, useState, useEffect, useContext } from 'react';

// Create the context
const FilterContext = createContext();

// Provider component
export const FilterProvider = ({ children, data, initialFilters = { area: '', subsystem: '' } }) => {
  const [filters, setFilters] = useState(initialFilters);
  const [areas, setAreas] = useState([]);
  const [subsystems, setSubsystems] = useState([]);
  const [areaToSubsystems, setAreaToSubsystems] = useState({});
  const [subsystemToAreas, setSubsystemToAreas] = useState({});

  // Extract unique areas and subsystems from data
  useEffect(() => {
    if (!data || data.length === 0) return;

    const uniqueAreas = new Set();
    const uniqueSubsystems = new Set();
    const areaMap = {};
    const subsystemMap = {};

    data.forEach(item => {
      const area = item['Design Area'];
      const subsystem = item['SUBSYSTEM'];

      if (area) uniqueAreas.add(area);
      if (subsystem) uniqueSubsystems.add(subsystem);

      if (area && subsystem) {
        if (!areaMap[area]) areaMap[area] = new Set();
        areaMap[area].add(subsystem);

        if (!subsystemMap[subsystem]) subsystemMap[subsystem] = new Set();
        subsystemMap[subsystem].add(area);
      }
    });

    setAreas(Array.from(uniqueAreas).sort());
    setSubsystems(Array.from(uniqueSubsystems).sort());

    const processedAreaMap = {};
    Object.keys(areaMap).forEach(area => {
      processedAreaMap[area] = Array.from(areaMap[area]);
    });

    const processedSubsystemMap = {};
    Object.keys(subsystemMap).forEach(subsystem => {
      processedSubsystemMap[subsystem] = Array.from(subsystemMap[subsystem]);
    });

    setAreaToSubsystems(processedAreaMap);
    setSubsystemToAreas(processedSubsystemMap);
  }, [data]);

  // Handle filter changes
  const onFilterChange = (filterType, value) => {
    setFilters(prev => ({ ...prev, [filterType]: value }));
  };

  // Reset all filters
  const resetFilters = () => {
    setFilters({ area: '', subsystem: '' });
  };

  return (
    <FilterContext.Provider value={{
      filters,
      areas,
      subsystems,
      areaToSubsystems,
      subsystemToAreas,
      onFilterChange,
      resetFilters
    }}>
      {children}
    </FilterContext.Provider>
  );
};

// Custom hook to use the filter context
export const useFilters = () => {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error('useFilters must be used within a FilterProvider');
  }
  return context;
};