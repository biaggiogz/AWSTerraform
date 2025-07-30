import React from 'react';
import { Badge, Tooltip } from '@chakra-ui/react';

const PerformanceMetric = React.memo(({ label, value, description }) => (
  <Tooltip label={description} placement="top">
    <Badge colorScheme="blue" fontSize="xs" px={2} py={1} mr={2} cursor="help">
      {label}: {value}
    </Badge>
  </Tooltip>
));

export default PerformanceMetric;