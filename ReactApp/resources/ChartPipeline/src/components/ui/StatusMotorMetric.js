import React from 'react';
import BaseStatusMetric from './base/BaseStatusMetric';

const StatusMotorMetric = ({ data, onSubsystemFilter }) => {
  return (
    <BaseStatusMetric
      data={data}
      onSubsystemFilter={onSubsystemFilter}
      title="Motor Status by Subsystem"
      dataFields={{
        total: 'motor_tot',
        done: 'motor_solo_run_done'
      }}
      colors={{
        bg: '#943168',
        hover: '#842c5e',
        selected: '#113F67'
      }}
      minWidth="230px"
    />
  );
};

export default StatusMotorMetric;