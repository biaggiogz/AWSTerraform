import React from 'react';
import BaseStatusFilter from './BaseStatusFilter';

const InsulationStatusFilter = ({
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
      title="Insul Status Filter"
      initialY={400}
      dataFields={{
        total: 'total_insulation',
        done: 'done_insulation'
      }}
      tooltipLabels={{
        done: 'Click to show only Done Insul',
        pending: 'Click to show only Pending Insul',
        notapply: 'Click to show only not applicable insulation'
      }}
    />
  );
};

export default React.memo(InsulationStatusFilter);