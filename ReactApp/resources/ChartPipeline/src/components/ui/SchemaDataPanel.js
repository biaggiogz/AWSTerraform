import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Icon
} from '@chakra-ui/react';
import { CheckIcon, WarningIcon } from '@chakra-ui/icons';

const SchemaDataPanel = ({ schemaVersion }) => {
  if (!schemaVersion) {
    return (
      <Box p={4} bg="gray.50" borderRadius="md" h="full">
        <Text color="gray.500">No schema data available</Text>
      </Box>
    );
  }

  const getDataTypeColor = (dataType) => {
    switch (dataType.toLowerCase()) {
      case 'string': return 'blue';
      case 'int64':
      case 'int32': return 'green';
      case 'float64':
      case 'float32': return 'orange';
      case 'boolean': return 'purple';
      default: return 'gray';
    }
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <Box p={4} bg="gray.50" borderRadius="md" h="full" overflowY="auto">
      <VStack spacing={4} align="stretch">
        <Text fontSize="lg" fontWeight="bold" textAlign="center">
          SCHEMA DATA
        </Text>

        {/* Schema Version Info */}
        <Box p={3} bg="white" borderRadius="md" borderWidth="1px">
          <VStack spacing={2} align="stretch">
            <HStack justify="space-between">
              <Text fontSize="sm" fontWeight="semibold">Version:</Text>
              <Badge colorScheme="blue" variant="solid">
                {schemaVersion.version}
              </Badge>
            </HStack>
            <HStack justify="space-between">
              <Text fontSize="sm" fontWeight="semibold">Created:</Text>
              <Text fontSize="xs" color="gray.600">
                {formatDateTime(schemaVersion.created_at)}
              </Text>
            </HStack>
            <HStack justify="space-between">
              <Text fontSize="sm" fontWeight="semibold">Columns:</Text>
              <Text fontSize="sm">{schemaVersion.columns.length}</Text>
            </HStack>
          </VStack>
        </Box>

        {/* Schema Comparison Note */}
        <Box p={2} bg="blue.50" borderRadius="md" borderLeft="4px solid" borderColor="blue.400">
          <Text fontSize="xs" color="blue.700">
            <Icon as={WarningIcon} mr={1} />
            Schema versioning allows comparison of up to 3 different versions for change tracking.
          </Text>
        </Box>

        {/* Column Schema Table */}
        <Box>
          <Text fontSize="md" fontWeight="semibold" mb={3}>Column Schema</Text>
          <Box overflowX="auto" maxH="300px" overflowY="auto">
            <Table size="sm" variant="simple">
              <Thead position="sticky" top={0} bg="white">
                <Tr>
                  <Th fontSize="xs">Column</Th>
                  <Th fontSize="xs">Type</Th>
                  <Th fontSize="xs">Nullable</Th>
                  <Th fontSize="xs">Constraints</Th>
                </Tr>
              </Thead>
              <Tbody>
                {schemaVersion.columns.map((column, index) => (
                  <Tr key={index}>
                    <Td fontSize="xs" fontWeight="medium">
                      {column.name}
                    </Td>
                    <Td>
                      <Badge 
                        colorScheme={getDataTypeColor(column.data_type)} 
                        variant="subtle"
                        fontSize="xs"
                      >
                        {column.data_type}
                      </Badge>
                    </Td>
                    <Td>
                      <Icon 
                        as={column.nullable ? WarningIcon : CheckIcon}
                        color={column.nullable ? 'orange.500' : 'green.500'}
                        boxSize={3}
                      />
                    </Td>
                    <Td>
                      <VStack spacing={1} align="start">
                        {column.constraints.map((constraint, idx) => (
                          <Badge 
                            key={idx}
                            size="sm"
                            variant="outline"
                            colorScheme={constraint === 'NOT_NULL' ? 'green' : 'blue'}
                          >
                            {constraint}
                          </Badge>
                        ))}
                      </VStack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        </Box>

        {/* Schema Statistics */}
        <Box p={3} bg="white" borderRadius="md" borderWidth="1px">
          <Text fontSize="sm" fontWeight="semibold" mb={2}>Schema Statistics</Text>
          <HStack spacing={4} justify="space-around">
            <Stat size="sm" textAlign="center">
              <StatLabel fontSize="xs">Not Null</StatLabel>
              <StatNumber fontSize="sm">
                {schemaVersion.columns.filter(col => !col.nullable).length}
              </StatNumber>
            </Stat>
            <Stat size="sm" textAlign="center">
              <StatLabel fontSize="xs">Unique</StatLabel>
              <StatNumber fontSize="sm">
                {schemaVersion.columns.filter(col => 
                  col.constraints.includes('UNIQUE')
                ).length}
              </StatNumber>
            </Stat>
            <Stat size="sm" textAlign="center">
              <StatLabel fontSize="xs">String Types</StatLabel>
              <StatNumber fontSize="sm">
                {schemaVersion.columns.filter(col => 
                  col.data_type.toLowerCase().includes('string')
                ).length}
              </StatNumber>
            </Stat>
          </HStack>
        </Box>
      </VStack>
    </Box>
  );
};

export default SchemaDataPanel;