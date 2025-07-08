import React from 'react';
import { Box, VStack } from '@chakra-ui/react';
import SummarySubsystemsTableA from '../tables/SummarySubsystemsTableA';
import SummarySubsystemsTableB from '../tables/SummarySubsystemsTableB';
import ResizableDraggablePanel from '../ui/ResizableDraggablePanel';
import { useSubsystemBidirectionalFilter } from '../../hooks/useSubsystemBidirectionalFilter';

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
    <Box position="relative" width="100%" height="800px" overflow="hidden">
      <ResizableDraggablePanel
        title="Subsystem Overview"
        initialWidth={700}
        initialHeight={550}
        initialX={20}
        initialY={20}
        minWidth={400}
        minHeight={300}
      >
        <SummarySubsystemsTableA
          data={filteredTableAData}
          selectedSubsystem={selectedSubsystem}
          onSubsystemSelect={handleSubsystemSelect}
        />
      </ResizableDraggablePanel>
      
      <ResizableDraggablePanel
        title="Test Pack Details"
        initialWidth={700}
        initialHeight={550}
        initialX={750}
        initialY={20}
        minWidth={400}
        minHeight={300}
      >
        <SummarySubsystemsTableB
          data={filteredTableBData}
          selectedSubsystem={selectedSubsystem}
          onSubsystemSelect={handleSubsystemSelect}
        />
      </ResizableDraggablePanel>
    </Box>
  );
};

export default SummarySubsystemsContainer;