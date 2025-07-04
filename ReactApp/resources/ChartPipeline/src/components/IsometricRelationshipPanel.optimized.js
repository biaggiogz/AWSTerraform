import React from 'react';
import {
  Box,
  Text,
  Badge,
  Button,
  HStack,
  VStack,
  Divider,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Tooltip,
  IconButton
} from '@chakra-ui/react';
import { CloseIcon, InfoIcon } from '@chakra-ui/icons';

/**
 * IsometricRelationshipPanel - Visual component for relationship status and controls
 * @param {Object} props - Component props
 * @param {string} props.selectedIsometric - Currently selected isometric
 * @param {Array} props.matchingChains - Array of matching relationship chains
 * @param {Object} props.relationshipStats - Statistics about relationships
 * @param {Function} props.onClearFilter - Handler to clear filters
 * @param {Function} props.onChainSelect - Handler for chain selection
 * @param {number} props.selectedChainIndex - Currently selected chain index
 */
const IsometricRelationshipPanel = ({
  selectedIsometric,
  matchingChains,
  relationshipStats,
  onClearFilter,
  onChainSelect,
  selectedChainIndex
}) => {
  if (!selectedIsometric && !matchingChains.length) {
    return (
      <Box
        p={4}
        bg="gray.50"
        borderRadius="md"
        border="1px solid"
        borderColor="gray.200"
      >
        <HStack spacing={2} align="center">
          <InfoIcon color="gray.400" />
          <Text fontSize="sm" color="gray.600">
            Click on an ISOMETRIC or MOUNTING ON ISO/EQUI/PACK to explore relationships
          </Text>
        </HStack>
      </Box>
    );
  }

  const selectedChainMatches = selectedIsometric 
    ? matchingChains.find(chain => 
        chain.some(match => match.control.ISOMETRIC === selectedIsometric)
      ) || []
    : [];

  return (
    <Box
      p={4}
      bg="white"
      borderRadius="lg"
      border="1px solid"
      borderColor="gray.200"
      boxShadow="sm"
    >
      {/* Header with selected isometric and clear button */}
      {selectedIsometric && (
        <HStack justify="space-between" align="center" mb={4}>
          <HStack spacing={3}>
            <Badge colorScheme="blue" fontSize="md" px={3} py={1}>
              Selected: {selectedIsometric}
            </Badge>
            <Badge colorScheme="green" variant="outline">
              {selectedChainMatches.length} matches
            </Badge>
          </HStack>
          <Tooltip label="Clear selection">
            <IconButton
              size="sm"
              icon={<CloseIcon />}
              onClick={onClearFilter}
              variant="ghost"
              colorScheme="gray"
              aria-label="Clear filter"
            />
          </Tooltip>
        </HStack>
      )}

      {/* Relationship Statistics */}
      <HStack spacing={6} mb={4}>
        <Stat size="sm">
          <StatLabel>Total Chains</StatLabel>
          <StatNumber color="blue.600">{relationshipStats.totalChains}</StatNumber>
          <StatHelpText>Relationship groups</StatHelpText>
        </Stat>
        <Stat size="sm">
          <StatLabel>Total Matches</StatLabel>
          <StatNumber color="green.600">{relationshipStats.totalMatches}</StatNumber>
          <StatHelpText>Control ↔ Detail pairs</StatHelpText>
        </Stat>
        <Stat size="sm">
          <StatLabel>Unique ISOs</StatLabel>
          <StatNumber color="purple.600">{relationshipStats.uniqueIsometrics}</StatNumber>
          <StatHelpText>Connected isometrics</StatHelpText>
        </Stat>
      </HStack>

      <Divider mb={4} />

      {/* Selected Isometric Matches */}
      {selectedIsometric && selectedChainMatches.length > 0 && (
        <Box mb={4}>
          <Text fontSize="sm" fontWeight="bold" mb={2} color="gray.700">
            Matches for {selectedIsometric}:
          </Text>
          <VStack spacing={2} align="stretch">
            {selectedChainMatches.map((match, index) => (
              <Box
                key={index}
                p={3}
                bg="blue.50"
                borderRadius="md"
                border="1px solid"
                borderColor="blue.200"
              >
                <HStack justify="space-between" align="start">
                  <VStack align="start" spacing={1} flex={1}>
                    <HStack spacing={2}>
                      <Badge colorScheme="blue" size="sm">Control</Badge>
                      <Text fontSize="xs" fontFamily="mono">
                        {match.control.SUBSYSTEM || match.control.SUSSYTEM}
                      </Text>
                    </HStack>
                    <HStack spacing={2}>
                      <Badge colorScheme="green" size="sm">Detail</Badge>
                      <Text fontSize="xs" fontFamily="mono">
                        {match.detail.SUBSYSTEM}
                      </Text>
                    </HStack>
                  </VStack>
                  <VStack align="end" spacing={1}>
                    <Text fontSize="xs" color="gray.600">Test Packs:</Text>
                    <HStack spacing={1}>
                      {match.matchingTestPacks && match.matchingTestPacks.length > 0 ? 
                        match.matchingTestPacks.map(tp => (
                          <Badge key={tp} colorScheme="orange" size="xs">
                            {tp}
                          </Badge>
                        )) : 
                        <Badge colorScheme="gray" size="xs">Empty</Badge>
                      }
                    </HStack>
                  </VStack>
                </HStack>
              </Box>
            ))}
          </VStack>
        </Box>
      )}

      {/* All Relationship Chains */}
      {matchingChains.length > 0 && (
        <Accordion allowToggle>
          <AccordionItem>
            <AccordionButton>
              <Box flex="1" textAlign="left">
                <Text fontSize="sm" fontWeight="semibold">
                  All Relationship Chains ({matchingChains.length})
                </Text>
              </Box>
              <AccordionIcon />
            </AccordionButton>
            <AccordionPanel pb={4}>
              <VStack spacing={3} align="stretch">
                {matchingChains.map((chain, chainIndex) => {
                  const firstMatch = chain[0];
                  const isSelected = selectedChainIndex === chainIndex;
                  
                  return (
                    <Box
                      key={chainIndex}
                      p={3}
                      bg={isSelected ? "purple.50" : "gray.50"}
                      borderRadius="md"
                      border="1px solid"
                      borderColor={isSelected ? "purple.200" : "gray.200"}
                      cursor="pointer"
                      _hover={{ bg: isSelected ? "purple.100" : "gray.100" }}
                      onClick={() => onChainSelect(chainIndex)}
                    >
                      <HStack justify="space-between" align="center" mb={2}>
                        <HStack spacing={2}>
                          <Badge colorScheme="purple" size="sm">
                            Chain {chainIndex + 1}
                          </Badge>
                          <Text fontSize="xs" fontWeight="medium">
                            ISO: {firstMatch.control.ISOMETRIC}
                          </Text>
                        </HStack>
                        <Badge colorScheme="gray" variant="outline" size="sm">
                          {chain.length} matches
                        </Badge>
                      </HStack>
                      
                      {isSelected && (
                        <VStack spacing={2} align="stretch" mt={3}>
                          {chain.map((match, matchIndex) => (
                            <Box
                              key={matchIndex}
                              p={2}
                              bg="white"
                              borderRadius="sm"
                              border="1px solid"
                              borderColor="gray.200"
                            >
                              <HStack justify="space-between" align="start">
                                <VStack align="start" spacing={1} flex={1}>
                                  <Text fontSize="xs" color="gray.600">
                                    Control: {match.control.SUBSYSTEM || match.control.SUSSYTEM}
                                  </Text>
                                  <Text fontSize="xs" color="gray.600">
                                    Detail: {match.detail.SUBSYSTEM}
                                  </Text>
                                </VStack>
                                <HStack spacing={1}>
                                  {match.matchingTestPacks && match.matchingTestPacks.length > 0 ? 
                                    match.matchingTestPacks.map(tp => (
                                      <Badge key={tp} colorScheme="orange" size="xs">
                                        {tp}
                                      </Badge>
                                    )) : 
                                    <Badge colorScheme="gray" size="xs">Empty</Badge>
                                  }
                                </HStack>
                              </HStack>
                            </Box>
                          ))}
                        </VStack>
                      )}
                    </Box>
                  );
                })}
              </VStack>
            </AccordionPanel>
          </AccordionItem>
        </Accordion>
      )}

      {/* Legend */}
      <Box mt={4} p={3} bg="gray.50" borderRadius="md">
        <Text fontSize="xs" fontWeight="bold" mb={2} color="gray.700">
          Legend:
        </Text>
        <HStack spacing={4} wrap="wrap">
          <HStack spacing={1}>
            <Box w={3} h={3} bg="blue.50" borderRadius="sm" border="1px solid" borderColor="blue.200" />
            <Text fontSize="xs" color="gray.600">Selected</Text>
          </HStack>
          <HStack spacing={1}>
            <Box w={3} h={3} bg="yellow.50" borderRadius="sm" border="1px solid" borderColor="yellow.200" />
            <Text fontSize="xs" color="gray.600">Highlighted</Text>
          </HStack>
          <HStack spacing={1}>
            <Badge colorScheme="orange" size="xs">TP</Badge>
            <Text fontSize="xs" color="gray.600">Test Pack</Text>
          </HStack>
        </HStack>
      </Box>
    </Box>
  );
};

export default IsometricRelationshipPanel;