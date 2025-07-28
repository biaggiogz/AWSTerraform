import React from 'react';
import BaseStatusMetric from './base/BaseStatusMetric';

const CompletedInsulMetric = ({ data, onSubsystemFilter }) => {
  return (
    <BaseStatusMetric
      data={data}
      onSubsystemFilter={onSubsystemFilter}
      title="Insulation Status by Subsystem"
      dataFields={{
        total: 'total_insulation',
        done: 'done_insulation'
      }}
      colors={{
        bg: '#ab9f81',
        hover: '#9B8F71',
        selected: '#113F67'
      }}
      minWidth="230px"
    />
  );
};

export default CompletedInsulMetric;