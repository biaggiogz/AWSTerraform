import React from 'react';
import { useCrossFilter } from '../context/CrossFilterContext';

const FilterControls = () => {
  const { filters, updateFilter, clearAllFilters } = useCrossFilter();

  return (
    <div className="filter-controls">
      <button 
        className="reset-button" 
        onClick={clearAllFilters}
      >
        Clear All Filters
      </button>
      
      {filters.designArea && (
        <div className="active-filter">
          Design Area: {filters.designArea}
          <button onClick={() => updateFilter('designArea', null)}>×</button>
        </div>
      )}
      
      {filters.lineId && (
        <div className="active-filter">
          Line ID: {filters.lineId}
          <button onClick={() => updateFilter('lineId', null)}>×</button>
        </div>
      )}
      
      {filters.train && (
        <div className="active-filter">
          Train: {filters.train}
          <button onClick={() => updateFilter('train', null)}>×</button>
        </div>
      )}
    </div>
  );
};

export default FilterControls;