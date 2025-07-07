import React from 'react';
import { Box, HStack, VStack, Divider } from '@chakra-ui/react';
import SummarySubsystemsTableA from './SummarySubsystemsTableA';
import SummarySubsystemsTableB from './SummarySubsystemsTableB';
import { useSubsystemBidirectionalFilter } from '../hooks/useSubsystemBidirectionalFilter';
import SummaryStatsPanel from './SummaryStatsPanel';

const SummarySubsystemsContainer = ({ 
  tableAData, 
  tableBData, 
  summaryStats,
  performanceMetrics 
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
      {/* Summary Statistics Panel */}
      <SummaryStatsPanel 
        summaryStats={summaryStats}
        performanceMetrics={performanceMetrics}
        selectedSubsystem={selectedSubsystem}
        onClearFilter={clearFilter}
      />
      
      <Divider />
      
      {/* Split Table Layout */}
      <HStack spacing={4} align="start" height="600px">
        {/* TableA: Subsystem Overview (Left Side) */}
        <Box flex="1" minWidth="0">
          <SummarySubsystemsTableA
            data={filteredTableAData}
            selectedSubsystem={selectedSubsystem}
            onSubsystemSelect={handleSubsystemSelect}
          />
        </Box>
        
        {/* TableB: Test Pack Details (Right Side) */}
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