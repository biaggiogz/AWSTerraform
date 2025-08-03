import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Progress,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText
} from '@chakra-ui/react';

const ProfileDataPanel = ({ profileData }) => {
  if (!profileData) {
    return (
      <Box p={4} bg="gray.50" borderRadius="md" h="full">
        <Text color="gray.500">No profile data available</Text>
      </Box>
    );
  }

  const getQualityColor = (score) => {
    if (score >= 90) return 'green';
    if (score >= 70) return 'yellow';
    return 'red';
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 90) return 'green';
    if (confidence >= 70) return 'yellow';
    return 'red';
  };

  return (
    <Box p={4} bg="gray.50" borderRadius="md" h="full" overflowY="auto">
      <VStack spacing={4} align="stretch">
        <Text fontSize="lg" fontWeight="bold" textAlign="center">
          PROFILE DATA
        </Text>

        {/* Summary Stats */}
        <HStack spacing={4} justify="center">
          <Stat size="sm" textAlign="center">
            <StatLabel>Total Rows</StatLabel>
            <StatNumber>{profileData.total_rows.toLocaleString()}</StatNumber>
          </Stat>
          <Stat size="sm" textAlign="center">
            <StatLabel>Columns</StatLabel>
            <StatNumber>{profileData.total_columns}</StatNumber>
          </Stat>
        </HStack>

        {/* Data Quality Score */}
        <Box>
          <HStack justify="space-between" mb={2}>
            <Text fontSize="sm" fontWeight="semibold">Data Quality Score</Text>
            <Badge colorScheme={getQualityColor(profileData.data_quality_score)}>
              {profileData.data_quality_score.toFixed(1)}%
            </Badge>
          </HStack>
          <Progress 
            value={profileData.data_quality_score} 
            colorScheme={getQualityColor(profileData.data_quality_score)}
            size="sm"
          />
        </Box>

        {/* Column Details */}
        <Box>
          <Text fontSize="md" fontWeight="semibold" mb={3}>Column Analysis</Text>
          <Accordion allowMultiple size="sm">
            {profileData.columns.map((column, index) => (
              <AccordionItem key={index}>
                <AccordionButton py={2}>
                  <Box flex="1" textAlign="left">
                    <HStack justify="space-between">
                      <Text fontSize="sm" fontWeight="medium">{column.name}</Text>
                      <HStack spacing={2}>
                        <Badge colorScheme={getConfidenceColor(column.data_type_confidence)} size="sm">
                          {column.data_type_confidence.toFixed(0)}%
                        </Badge>
                        <Badge variant="outline" size="sm">
                          {column.inferred_type}
                        </Badge>
                      </HStack>
                    </HStack>
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
                <AccordionPanel pb={4}>
                  <VStack spacing={3} align="stretch">
                    {/* Professional Inference */}
                    <Box>
                      <Text fontSize="xs" fontWeight="semibold" color="blue.600">
                        Professional Analysis:
                      </Text>
                      <Text fontSize="xs" color="gray.700">
                        {column.professional_inference}
                      </Text>
                    </Box>

                    {/* Stats */}
                    <HStack spacing={4}>
                      <Box>
                        <Text fontSize="xs" color="gray.500">Nulls</Text>
                        <Text fontSize="sm">{column.null_count} ({column.null_percentage.toFixed(1)}%)</Text>
                      </Box>
                      {column.unique_count && (
                        <Box>
                          <Text fontSize="xs" color="gray.500">Unique</Text>
                          <Text fontSize="sm">{column.unique_count}</Text>
                        </Box>
                      )}
                    </HStack>

                    {/* Sample Values */}
                    {column.sample_values.length > 0 && (
                      <Box>
                        <Text fontSize="xs" fontWeight="semibold" mb={1}>Sample Values:</Text>
                        <HStack spacing={1} flexWrap="wrap">
                          {column.sample_values.slice(0, 3).map((value, idx) => (
                            <Badge key={idx} variant="subtle" fontSize="xs">
                              {value.length > 20 ? `${value.substring(0, 20)}...` : value}
                            </Badge>
                          ))}
                        </HStack>
                      </Box>
                    )}

                    {/* Data Patterns */}
                    {column.data_patterns.length > 0 && (
                      <Box>
                        <Text fontSize="xs" fontWeight="semibold" mb={1}>Data Patterns:</Text>
                        <VStack spacing={1} align="stretch">
                          {column.data_patterns.map((pattern, idx) => (
                            <HStack key={idx} justify="space-between" fontSize="xs">
                              <Text>{pattern.pattern_type}</Text>
                              <Badge size="sm">{pattern.frequency}</Badge>
                            </HStack>
                          ))}
                        </VStack>
                      </Box>
                    )}
                  </VStack>
                </AccordionPanel>
              </AccordionItem>
            ))}
          </Accordion>
        </Box>
      </VStack>
    </Box>
  );
};

export default ProfileDataPanel;