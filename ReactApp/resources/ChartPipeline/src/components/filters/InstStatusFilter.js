import React from 'react';
import BaseStatusFilter from './BaseStatusFilter';

const InstStatusFilter = ({ 
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
      title="Inst Status Filter"
      dataFields={{
        total: 'total_inst',
        done: 'done_inst'
      }}
      tooltipLabels={{
        done: 'Click to show only done inst',
        pending: 'Click to show only pending inst',
        notapply: 'Click to show only not applicable inst'
      }}
    />
  );
};

export default React.memo(InstStatusFilter);