import React from 'react';
import BaseStatusFilter from './BaseStatusFilter';

const LoopStatusFilter = ({ 
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
      title="Loop Status Filter"
      dataFields={{
        total: 'total_loop',
        done: 'done_loop'
      }}
      tooltipLabels={{
        done: 'Click to show only done loops',
        pending: 'Click to show only pending loops',
        notapply: 'Click to show only not applicable loops'
      }}
    />
  );
};

export default React.memo(LoopStatusFilter);