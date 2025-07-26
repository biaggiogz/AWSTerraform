import React, { useMemo } from 'react';
import { Box, Text, VStack, Divider } from '@chakra-ui/react';

const CompletedInstMetric = ({ data }) => {
  const metrics = useMemo(() => {
    if (!data || data.length === 0) return { subsystems: 0, done: 0, pending: 0 };

    const subsystems = data.filter(row =>
        row.total_inst != null && row.total_inst !== ''
    ).length;

    const done = data.reduce((count, row) => {
      const totalInst = row.total_inst;
      const doneInst = row.done_inst;

      if (totalInst != null && totalInst !== '' && totalInst > 0 && totalInst === doneInst) {
        return count + 1;
      }
      return count;
    }, 0);

    const pending = data.reduce((count, row) => {
      const totalInst = row.total_inst;
      const doneInst = row.done_inst;

      if (totalInst != null && totalInst !== '' && totalInst > 0 && totalInst !== doneInst) {
        return count + 1;
      }
      return count;
    }, 0);

    return { subsystems, done, pending };
  }, [data]);

  return (
      <Box
          bg="#A888B5"
          border="3px solid #A888B5"
          borderRadius="lg"
          minW="180px"
          boxShadow="md"
      >
        <VStack spacing={0} divider={<Divider borderColor="white" />}>
          <Box p={1} textAlign="center" width="100%">
            <Text fontSize="sm" fontWeight="bold" color="white">
              Instruments Status<br />by Subsystem
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

export default CompletedInstMetric;