import React, { lazy, Suspense, useState } from 'react';
import { Box, VStack, Center, Spinner } from '@chakra-ui/react';
import SummarySubsystemsTableA from '../tables/SummarySubsystemsTableA';
import SummarySubsystemsTableB from '../tables/SummarySubsystemsTableB';
import ResizableDraggablePanel from '../ui/ResizableDraggablePanel';
import { useSubsystemBidirectionalFilter } from '../../hooks/useSubsystemBidirectionalFilter';

const DynamicCalculationPanel = lazy(() => import('../panels/DynamicCalculationPanel'));

const SummarySubsystemsContainer = ({ 
  tableAData, 
  tableBData
}) => {
  const [progressFilteredData, setProgressFilteredData] = useState(tableBData);
  
  const {
    selectedSubsystem,
    filteredTableAData,
    filteredTableBData,
    handleSubsystemSelect,
    clearFilter
  } = useSubsystemBidirectionalFilter(tableAData, progressFilteredData);
  
  React.useEffect(() => {
    setProgressFilteredData(tableBData);
  }, [tableBData]);
  
  const handleProgressFilterChange = (filteredData) => {
    setProgressFilteredData(filteredData);
  };

  return (
    <VStack spacing={4} align="stretch">
      {/* SQL Query Interface */}
      <Suspense fallback={<Center p={4}><Spinner /></Center>}>
        <DynamicCalculationPanel
          controlData={tableAData}
          detailsData={tableBData}
          filteredControlData={filteredTableAData}
          filteredDetailsData={filteredTableBData}
          filters={{
            selectedSubsystem: selectedSubsystem
          }}
          onFilteredDataChange={handleProgressFilterChange}
        />
      </Suspense>
      
      {/* Draggable Tables */}
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
    </VStack>
  );
};

export default SummarySubsystemsContainer;