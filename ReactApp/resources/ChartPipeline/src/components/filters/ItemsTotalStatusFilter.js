import React from 'react';
import BaseStatusFilter from './BaseStatusFilter';

const ItemsTotalStatusFilter = ({ 
  data, 
  onFilterChange, 
  isVisible, 
  onClose,
  onPropagationChange,
  onBringToFront
}) => {
  return (
    <BaseStatusFilter
      data={data}
      onFilterChange={onFilterChange}
      isVisible={isVisible}
      onClose={onClose}
      onPropagationChange={onPropagationChange}
      onBringToFront={onBringToFront}
      title="Items Total Status Filter"
      dataFields={{
        total: 'total_items',
        done: 'done_items'
      }}
      tooltipLabels={{
        done: 'Click to show only done items',
        pending: 'Click to show only pending items',
        notapply: 'Click to show only not applicable items'
      }}
    />
  );
};

export default ItemsTotalStatusFilter;