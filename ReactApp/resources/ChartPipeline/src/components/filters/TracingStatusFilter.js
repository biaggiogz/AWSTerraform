import React from 'react';
import BaseStatusFilter from './BaseStatusFilter';

const TracingStatusFilter = ({ 
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
      title="Tracing Status Filter"
      dataFields={{
        total: 'total_tracing',
        done: 'done_tracing'
      }}
      tooltipLabels={{
        done: 'Click to show only done tracing',
        pending: 'Click to show only pending tracing',
        notapply: 'Click to show only not applicable tracing'
      }}
    />
  );
};

export default React.memo(TracingStatusFilter);