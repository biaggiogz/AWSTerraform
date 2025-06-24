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
import { calculateSubsystemTotalItems } from './SidebarProgressItemsPanel';

/**
 * Subsystem Precommissioning component showing unique subsystems
 * @param {Array} data - Raw dataset from pipelinedata.csv
 */
const SubsystemPrecommissioning = ({ data }) => {
  // Get unique subsystems and total items using memoization for performance
  const { uniqueSubsystems, totalItemsBySubsystem } = useMemo(() => {
    if (!data || data.length === 0) {
      return { uniqueSubsystems: [], totalItemsBySubsystem: {} };
    }

    const subsystemSet = new Set();
    
    data.forEach(item => {
      if (item['SUBSYSTEM'] && item['SUBSYSTEM'].trim() !== '') {
        subsystemSet.add(item['SUBSYSTEM']);
      }
    });

    const uniqueSubsystems = Array.from(subsystemSet).sort();
    const totalItemsBySubsystem = calculateSubsystemTotalItems(data);

    return { uniqueSubsystems, totalItemsBySubsystem };
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
              <Th>Total Items</Th>
            </Tr>
          </Thead>
          <Tbody>
            {uniqueSubsystems.map((subsystem, index) => (
              <Tr key={index}>
                <Td>{subsystem}</Td>
                <Td>{totalItemsBySubsystem[subsystem] || 0}</Td>
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