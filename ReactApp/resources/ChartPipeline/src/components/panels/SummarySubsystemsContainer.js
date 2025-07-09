import React, { lazy, Suspense, useState, useMemo } from 'react';
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
  const [statusFilteredData, setStatusFilteredData] = useState(tableAData);
  const [loopFilteredData, setLoopFilteredData] = useState(tableAData);
  
  // Apply both status and loop filters to TableA
  const combinedFilteredTableAData = useMemo(() => {
    const statusFiltered = statusFilteredData;
    const loopFiltered = loopFilteredData;
    
    // Find intersection of both filters
    const statusSubsystems = new Set(statusFiltered.map(row => row.subsystem));
    const loopSubsystems = new Set(loopFiltered.map(row => row.subsystem));
    
    return tableAData.filter(row => 
      statusSubsystems.has(row.subsystem) && loopSubsystems.has(row.subsystem)
    );
  }, [tableAData, statusFilteredData, loopFilteredData]);
  
  const {
    selectedSubsystem,
    filteredTableAData,
    filteredTableBData,
    handleSubsystemSelect,
    clearFilter
  } = useSubsystemBidirectionalFilter(combinedFilteredTableAData, progressFilteredData);
  
  React.useEffect(() => {
    setProgressFilteredData(tableBData);
  }, [tableBData]);
  
  React.useEffect(() => {
    setStatusFilteredData(tableAData);
  }, [tableAData]);
  
  React.useEffect(() => {
    setLoopFilteredData(tableAData);
  }, [tableAData]);
  
  const handleProgressFilterChange = (filteredData) => {
    setProgressFilteredData(filteredData);
  };
  
  const handleStatusFilterChange = (filteredData) => {
    setStatusFilteredData(filteredData);
  };
  
  const handleLoopFilterChange = (filteredData) => {
    setLoopFilteredData(filteredData);
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
          onFilteredControlDataChange={handleStatusFilterChange}
          onLoopFilteredControlDataChange={handleLoopFilterChange}
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