import React from 'react';
import { Badge, Tooltip, HStack } from '@chakra-ui/react';

const PerformanceMetricWasm = React.memo(({ 
  label, 
  value, 
  description, 
  processingTime, 
  wasmEnabled 
}) => (
  <HStack spacing={1}>
    <Tooltip label={description} placement="top">
      <Badge colorScheme="blue" fontSize="xs" px={2} py={1} cursor="help">
        {label}: {value}
      </Badge>
    </Tooltip>
    {processingTime && (
      <Tooltip label="WASM processing time" placement="top">
        <Badge 
          colorScheme={wasmEnabled ? "green" : "orange"} 
          fontSize="xs" 
          px={2} 
          py={1} 
          cursor="help"
        >
          {wasmEnabled ? "WASM" : "JS"}: {processingTime}ms
        </Badge>
      </Tooltip>
    )}
  </HStack>
));

export default PerformanceMetricWasm;