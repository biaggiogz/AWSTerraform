import React, { useMemo } from 'react';
import { Box, Text, VStack, Divider } from '@chakra-ui/react';

const StatusLoopMetric = ({ data }) => {
  const metrics = useMemo(() => {
    if (!data || data.length === 0) return { subsystems: 0, done: 0, pending: 0 };
    
    const subsystems = data.filter(row => 
      row.total_loop != null && row.total_loop !== ''
    ).length;
    
    const done = data.reduce((count, row) => {
      const totalLoop = row.total_loop;
      const doneLoop = row.done_loop;
      
      if (totalLoop != null && totalLoop !== '' && totalLoop > 0 && totalLoop === doneLoop) {
        return count + 1;
      }
      return count;
    }, 0);
    
    const pending = data.reduce((count, row) => {
      const totalLoop = row.total_loop;
      const doneLoop = row.done_loop;
      
      if (totalLoop != null && totalLoop !== '' && totalLoop > 0 && totalLoop !== doneLoop) {
        return count + 1;
      }
      return count;
    }, 0);
    
    return { subsystems, done, pending };
  }, [data]);

  return (
    <Box
      bg="#7CA2C5"
      border="3px solid #7CA2C5"
      borderRadius="lg"
      minW="180px"
      boxShadow="md"
    >
      <VStack spacing={0} divider={<Divider borderColor="white" />}>
        <Box p={1} textAlign="center" width="100%">
          <Text fontSize="sm" fontWeight="bold" color="white">
            Loop Signal Status <br />by Subsystem
          </Text>
        </Box>
        
        <Box p={1} textAlign="center" width="100%">
          <Text fontSize="sm" color="white">
            Subsystems: {metrics.subsystems}
          </Text>
        </Box>
        
        <Box p={1} textAlign="center" width="100%">
          <Text fontSize="sm" color="white">
            Done: {metrics.done}
          </Text>
        </Box>
        
        <Box p={2} textAlign="center" width="100%">
          <Text fontSize="sm" color="white">
            Pending: {metrics.pending}
          </Text>
        </Box>
      </VStack>
    </Box>
  );
};

export default StatusLoopMetric;