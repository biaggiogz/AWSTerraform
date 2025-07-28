import React from 'react';
import BaseStatusMetric from './base/BaseStatusMetric';

const CompletedInstMetric = ({ data, onSubsystemFilter }) => {
  return (
    <BaseStatusMetric
      data={data}
      onSubsystemFilter={onSubsystemFilter}
      title="Instruments Status by Subsystem"
      dataFields={{
        total: 'total_inst',
        done: 'done_inst'
      }}
      colors={{
        bg: '#A888B5',
        hover: '#9A7AA5',
        selected: '#113F67'
      }}
      minWidth="220px"
    />
  );
};

export default CompletedInstMetric;