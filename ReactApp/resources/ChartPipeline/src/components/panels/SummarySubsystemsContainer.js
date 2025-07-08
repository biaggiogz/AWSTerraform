import React, { useState } from 'react';
import { Box, VStack } from '@chakra-ui/react';
import SummarySubsystemsTableA from '../tables/SummarySubsystemsTableA';
import SummarySubsystemsTableB from '../tables/SummarySubsystemsTableB';
import SummarySubsystemsSQLPanel from './SummarySubsystemsSQLPanel';
import SummarySubsystemsPhase2Test from './SummarySubsystemsPhase2Test';
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
  
  const [sqlResults, setSqlResults] = useState([]);

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
      
      <ResizableDraggablePanel
        title="SQL Query Interface"
        initialWidth={600}
        initialHeight={400}
        initialX={20}
        initialY={600}
        minWidth={500}
        minHeight={300}
      >
        <SummarySubsystemsSQLPanel
          tableAData={tableAData}
          tableBData={tableBData}
          onResultsChange={setSqlResults}
        />
      </ResizableDraggablePanel>
      
      <ResizableDraggablePanel
        title="Phase 2 WASM Performance Test"
        initialWidth={700}
        initialHeight={500}
        initialX={650}
        initialY={600}
        minWidth={600}
        minHeight={400}
      >
        <SummarySubsystemsPhase2Test />
      </ResizableDraggablePanel>
    </Box>
  );
};

export default SummarySubsystemsContainer;