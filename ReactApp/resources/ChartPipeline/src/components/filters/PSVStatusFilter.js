import React from 'react';
import BaseStatusFilter from './BaseStatusFilter';

const PSVStatusFilter = ({
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
      title="PSV Status Filter"
      dataFields={{
        total: 'psv_total',
        done: 'psv_calibrated'
      }}
      tooltipLabels={{
        done: 'Click to show only done psv',
        pending: 'Click to show only pending psv',
        notapply: 'Click to show only not applicable psv'
      }}
    />
  );
};

export default React.memo(PSVStatusFilter);