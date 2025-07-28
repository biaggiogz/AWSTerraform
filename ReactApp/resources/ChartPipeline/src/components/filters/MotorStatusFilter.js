import React from 'react';
import BaseStatusFilter from './BaseStatusFilter';

const MotorStatusFilter = ({ 
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
      title="Motor Status Filter"
      dataFields={{
        total: 'motor_tot',
        done: 'motor_solo_run_done'
      }}
      tooltipLabels={{
        done: 'Click to show only done motors',
        pending: 'Click to show only pending motors',
        notapply: 'Click to show only not applicable motors'
      }}
    />
  );
};

export default React.memo(MotorStatusFilter);