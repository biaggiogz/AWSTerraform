import React from 'react';
import BaseStatusMetric from './base/BaseStatusMetric';

const StatusTracingMetric = ({ data, onSubsystemFilter }) => {
  return (
    <BaseStatusMetric
      data={data}
      onSubsystemFilter={onSubsystemFilter}
      title="Tracing Status by Subsystem"
      dataFields={{
        total: 'total_tracing',
        done: 'done_tracing'
      }}
      colors={{
        bg: '#0ABAB5',
        hover: '#08A5A0',
        selected: '#007074'
      }}
      minWidth="230px"
    />
  );
};

export default StatusTracingMetric;