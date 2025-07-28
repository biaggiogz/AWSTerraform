import React from 'react';
import BaseStatusMetric from './base/BaseStatusMetric';

const StatusPSVMetric = ({ data, onSubsystemFilter }) => {
  return (
    <BaseStatusMetric
      data={data}
      onSubsystemFilter={onSubsystemFilter}
      title="PSV Status by Subsystem"
      dataFields={{
        total: 'psv_total',
        done: 'psv_calibrated'
      }}
      colors={{
        bg: '#cc8d57',
        hover: '#b8794a',
        selected: '#113F67'
      }}
      minWidth="230px"
    />
  );
};

export default StatusPSVMetric;