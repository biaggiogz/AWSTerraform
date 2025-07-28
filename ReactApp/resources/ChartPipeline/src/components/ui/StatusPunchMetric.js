import React from 'react';
import BaseStatusMetric from './base/BaseStatusMetric';

const StatusPunchMetric = ({ data }) => {
  return (
    <BaseStatusMetric
      data={data}
      onSubsystemFilter={null}
      title="Punch Status by Subsystem"
      dataFields={{
        total: 'total_punch',
        done: 'close_punch'
      }}
      colors={{
        bg: '#748DAE',
        hover: '#5A7A9E',
        selected: '#4A6A8E'
      }}
      minWidth="180px"
      showProcessTypes={false}
    />
  );
};

export default StatusPunchMetric;