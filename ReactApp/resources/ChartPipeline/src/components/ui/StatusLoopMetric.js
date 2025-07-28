import React from 'react';
import BaseStatusMetric from './base/BaseStatusMetric';

const StatusLoopMetric = ({ data, onSubsystemFilter }) => {
  return (
    <BaseStatusMetric
      data={data}
      onSubsystemFilter={onSubsystemFilter}
      title="Loop Signal Status by Subsystem"
      dataFields={{
        total: 'total_loop',
        done: 'done_loop'
      }}
      colors={{
        bg: '#7CA2C5',
        hover: '#5A8DB5',
        selected: '#113F67'
      }}
      minWidth="230px"
    />
  );
};

export default StatusLoopMetric;