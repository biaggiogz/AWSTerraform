import React from 'react';
import { Box, HStack, VStack } from '@chakra-ui/react';
import SummarySubsystemsTableA from './SummarySubsystemsTableA';
import SummarySubsystemsTableB from './SummarySubsystemsTableB';
import { useSubsystemBidirectionalFilter } from '../hooks/useSubsystemBidirectionalFilter';

const SummarySubsystemsContainer = ({ 
  tableAData, 
  tableBData
}) => {
  const {
    selectedSubsystem,
    filteredTableAData,
    filteredTableBData,
    handleSubsystemSelect,
    clearFilter
  } = useSubsystemBidirectionalFilter(tableAData, tableBData);

  return (
    <VStack spacing={4} align="stretch">
      <HStack spacing={4} align="start" height="600px">
        <Box flex="1" minWidth="0">
          <SummarySubsystemsTableA
            data={filteredTableAData}
            selectedSubsystem={selectedSubsystem}
            onSubsystemSelect={handleSubsystemSelect}
          />
        </Box>
        
        <Box flex="1" minWidth="0">
          <SummarySubsystemsTableB
            data={filteredTableBData}
            selectedSubsystem={selectedSubsystem}
            onSubsystemSelect={handleSubsystemSelect}
          />
        </Box>
      </HStack>
    </VStack>
  );
};

export default SummarySubsystemsContainer;