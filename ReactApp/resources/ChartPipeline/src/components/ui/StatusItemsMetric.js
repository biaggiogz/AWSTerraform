import React from 'react';
import BaseStatusMetric from './base/BaseStatusMetric';

const StatusItemsMetric = ({ data, onSubsystemFilter }) => {
  return (
    <BaseStatusMetric
      data={data}
      onSubsystemFilter={onSubsystemFilter}
      title="Items Status by Subsystem"
      dataFields={{
        total: 'total_items',
        done: 'done_items'
      }}
      colors={{
        bg: '#B03052',
        hover: '#9A2847',
        selected: '#113F67'
      }}
      minWidth="230px"
    />
  );
};

export default StatusItemsMetric;