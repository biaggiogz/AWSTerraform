import React, { useMemo } from 'react';
import { Box, Text } from '@chakra-ui/react';

const CompletedLoopMetric = ({ data }) => {
  const completedLoops = useMemo(() => {
    if (!data || data.length === 0) return 0;
    
    return data.reduce((count, row) => {
      const totalLoop = row.total_loop;
      const doneLoop = row.done_loop;
      
      if (totalLoop != null && totalLoop !== '' && totalLoop > 0 && totalLoop === doneLoop) {
        return count + 1;
      }
      return count;
    }, 0);
  }, [data]);

  return (
    <Box
      bg="#7CA2C5"
      border="3px solid #7CA2C5"
      borderRadius="lg"
      p={3}
      minW="150px"
      textAlign="center"
      boxShadow="md"
    >
      <Text fontSize="md" fontWeight="bold" color="white">
        {completedLoops}
      </Text>
      <Text fontSize="xs" color="white">
        Completed Loop
      </Text>
    </Box>
  );
};

export default CompletedLoopMetric;