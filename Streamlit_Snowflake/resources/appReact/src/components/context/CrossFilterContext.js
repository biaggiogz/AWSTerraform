import React, { createContext, useState, useContext } from 'react';

// Create context for cross-filtering
const CrossFilterContext = createContext();

// Provider component for cross-filtering
export const CrossFilterProvider = ({ children }) => {
  const [filters, setFilters] = useState({
    designArea: null,
    lineId: null,
    train: null
  });

  // Function to update filters
  const updateFilter = (filterType, value) => {
    setFilters(prevFilters => {
      // If clicking the same value, clear the filter (toggle behavior)
      if (prevFilters[filterType] === value) {
        return { ...prevFilters, [filterType]: null };
      }
      // Otherwise set the new filter value
      return { ...prevFilters, [filterType]: value };
    });
  };

  // Function to clear all filters
  const clearAllFilters = () => {
    setFilters({
      designArea: null,
      lineId: null,
      train: null
    });
  };

  return (
    <CrossFilterContext.Provider value={{ filters, updateFilter, clearAllFilters }}>
      {children}
    </CrossFilterContext.Provider>
  );
};

// Custom hook to use the cross-filter context
export const useCrossFilter = () => useContext(CrossFilterContext);