import React, { useMemo } from 'react';
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Heading,
  Text
} from '@chakra-ui/react';

/**
 * Subsystem Precommissioning component showing unique subsystems
 * @param {Array} data - Raw dataset from pipelinedata.csv
 */
const SubsystemPrecommissioning = ({ data }) => {
  // Get unique subsystems using memoization for performance
  const uniqueSubsystems = useMemo(() => {
    if (!data || data.length === 0) {
      return [];
    }

    const subsystemSet = new Set();
    
    data.forEach(item => {
      if (item['SUBSYSTEM'] && item['SUBSYSTEM'].trim() !== '') {
        subsystemSet.add(item['SUBSYSTEM']);
      }
    });

    return Array.from(subsystemSet).sort();
  }, [data]);

  return (
    <Box p={6}>
      <Box textAlign="center" mb={6}>
        <Heading size="lg" mb={2}>Subsystem Precommissioning</Heading>
        <Text color="gray.600">Unique subsystems from pipeline data</Text>
      </Box>

      <TableContainer>
        <Table variant="simple" size="md">
          <Thead>
            <Tr>
              <Th>Subsystem</Th>
            </Tr>
          </Thead>
          <Tbody>
            {uniqueSubsystems.map((subsystem, index) => (
              <Tr key={index}>
                <Td>{subsystem}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>

      {uniqueSubsystems.length === 0 && (
        <Box textAlign="center" mt={8}>
          <Text color="gray.500">No subsystem data available</Text>
        </Box>
      )}

      <Box bg="gray.50" p={4} borderRadius="md" mt={6}>
        <Text fontSize="sm" color="gray.600" textAlign="center">
          <strong>Data Source:</strong> pipelinedata.csv | 
          <strong> Total Unique Subsystems:</strong> {uniqueSubsystems.length}
        </Text>
      </Box>
    </Box>
  );
};

export default SubsystemPrecommissioning;