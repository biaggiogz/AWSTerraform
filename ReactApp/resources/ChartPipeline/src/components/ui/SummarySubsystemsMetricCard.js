import React from 'react';
import {
  Box,
  Text,
  HStack,
  VStack,
  IconButton,
  Badge,
  Switch,
  Tooltip
} from '@chakra-ui/react';
import { MdClose, MdLock, MdLockOpen, MdRefresh, MdPause } from 'react-icons/md';

const SummarySubsystemsMetricCard = ({
  id,
  title,
  value,
  isLocal = true,
  isFrozen = false,
  onDelete,
  onToggleScope,
  onToggleFreeze,
  onRefresh,
  lastUpdated,
  color = '#007598'
}) => {
  const formatValue = (val) => {
    if (typeof val === 'number') {
      return val.toLocaleString();
    }
    return val;
  };

  const getTimeAgo = (timestamp) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  return (
    <Box
      bg={color}
      border="2px solid"
      borderColor={isFrozen ? "orange.300" : isLocal ? "blue.300" : "green.300"}
      borderRadius="lg"
      p={3}
      minW="140px"
      maxW="180px"
      textAlign="center"
      boxShadow="md"
      position="relative"
      _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
      transition="all 0.2s"
    >
      {/* Control buttons */}
      <HStack
        position="absolute"
        top="2px"
        left="2px"
        right="2px"
        justify="space-between"
        zIndex={1}
      >
        <IconButton
          icon={<MdClose />}
          size="xs"
          variant="ghost"
          color="white"
          onClick={() => onDelete(id)}
          aria-label="Delete metric"
          minW="auto"
          h="auto"
          p={1}
          _hover={{ bg: 'whiteAlpha.200' }}
        />
        
        <HStack spacing={1}>
          <Tooltip label={isFrozen ? "Unfreeze updates" : "Freeze updates"}>
            <IconButton
              icon={isFrozen ? <MdPause /> : <MdRefresh />}
              size="xs"
              variant="ghost"
              color="white"
              onClick={() => onToggleFreeze(id)}
              aria-label={isFrozen ? "Unfreeze" : "Freeze"}
              minW="auto"
              h="auto"
              p={1}
              _hover={{ bg: 'whiteAlpha.200' }}
            />
          </Tooltip>
        </HStack>
      </HStack>

      {/* Metric content */}
      <VStack spacing={2} pt={4}>
        {/* Scope toggle */}
        <HStack spacing={2}>
          <Text fontSize="xs" color="white" fontWeight="bold">
            {isLocal ? 'LOCAL' : 'GLOBAL'}
          </Text>
          <Switch
            size="sm"
            isChecked={!isLocal}
            onChange={() => onToggleScope(id)}
            colorScheme="whiteAlpha"
          />
        </HStack>

        {/* Value */}
        <Text fontSize="xl" fontWeight="bold" color="white" lineHeight="1">
          {formatValue(value)}
        </Text>

        {/* Title */}
        <Text fontSize="sm" color="white" fontWeight="medium" lineHeight="1.2">
          {title}
        </Text>

        {/* Status indicators */}
        <HStack spacing={1} justify="center">
          {isFrozen && (
            <Badge size="xs" colorScheme="orange" variant="solid">
              FROZEN
            </Badge>
          )}
          <Badge 
            size="xs" 
            colorScheme={isLocal ? "blue" : "green"} 
            variant="outline"
            color="white"
            borderColor="white"
          >
            {isLocal ? "FILTER-AWARE" : "STATIC"}
          </Badge>
        </HStack>

        {/* Last updated */}
        {lastUpdated && (
          <Text fontSize="xs" color="whiteAlpha.800">
            {getTimeAgo(lastUpdated)}
          </Text>
        )}
      </VStack>
    </Box>
  );
};

export default SummarySubsystemsMetricCard;