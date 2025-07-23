import React, { lazy, Suspense, useState, useMemo, useEffect } from 'react';
import { Box, VStack, Center, Spinner } from '@chakra-ui/react';
import SummarySubsystemsTableA from '../tables/SummarySubsystemsTableA';
import SummarySubsystemsTableB from '../tables/SummarySubsystemsTableB';
import ResizableDraggablePanel from '../ui/ResizableDraggablePanel';
import PersistentMetricCards from '../ui/PersistentMetricCards';
import { useSubsystemBidirectionalFilter } from '../../hooks/useSubsystemBidirectionalFilter';

const DynamicCalculationPanel = lazy(() => import('../panels/DynamicCalculationPanel'));

const SummarySubsystemsContainer = ({ 
  tableAData, 
  tableBData
}) => {
  const [progressFilteredData, setProgressFilteredData] = useState(tableBData);
  const [statusFilteredData, setStatusFilteredData] = useState(tableAData);
  const [loopFilteredData, setLoopFilteredData] = useState(tableAData);
  const [hitoFilteredData, setHitoFilteredData] = useState(tableBData);
  const [isProgressFilterVisible, setIsProgressFilterVisible] = useState(false);
  const [isItemsFilterVisible, setIsItemsFilterVisible] = useState(false);
  const [isLoopFilterVisible, setIsLoopFilterVisible] = useState(false);
  const [isHitoFilterVisible, setIsHitoFilterVisible] = useState(false);
  const [topZIndex, setTopZIndex] = useState(100);
  const [updatedMetrics, setUpdatedMetrics] = useState([]);
  
  // Apply status, loop, and hito filters
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
  
  const combinedFilteredTableBData = useMemo(() => {
    // Apply hito filter to progressFilteredData
    if (hitoFilteredData.length === 0) {
      return progressFilteredData;
    }
    
    const hitoSubsystems = new Set(hitoFilteredData.map(row => row.subsystem));
    return progressFilteredData.filter(row => hitoSubsystems.has(row.subsystem));
  }, [progressFilteredData, hitoFilteredData]);
  
  const {
    selectedSubsystem,
    filteredTableAData,
    filteredTableBData,
    handleSubsystemSelect,
    clearFilter
  } = useSubsystemBidirectionalFilter(combinedFilteredTableAData, combinedFilteredTableBData);
  
  React.useEffect(() => {
    setProgressFilteredData(tableBData);
  }, [tableBData]);
  
  React.useEffect(() => {
    setStatusFilteredData(tableAData);
  }, [tableAData]);
  
  React.useEffect(() => {
    setLoopFilteredData(tableAData);
  }, [tableAData]);
  
  React.useEffect(() => {
    setHitoFilteredData(tableBData);
  }, [tableBData]);
  
  const handleProgressFilterChange = (filteredData) => {
    // If we're receiving the original data, it means the filter is being reset
    const isReset = filteredData === tableBData;
    setProgressFilteredData(filteredData);
  };
  
  const handleStatusFilterChange = (filteredData) => {
    // If we're receiving the original data, it means the filter is being reset
    const isReset = filteredData === tableAData;
    setStatusFilteredData(filteredData);
  };
  
  const handleLoopFilterChange = (filteredData) => {
    // If we're receiving the original data, it means the filter is being reset
    const isReset = filteredData === tableAData;
    setLoopFilteredData(filteredData);
  };
  
  const handleHitoFilterChange = (filteredData) => {
    // If we're receiving the original data, it means the filter is being reset
    const isReset = filteredData === tableBData;
    setHitoFilteredData(filteredData);
  };
  
  const handleLoopPropagationChange = (filteredData, target) => {
    if (target === 'tableB') {
      // Extract subsystems from filtered TableA data
      const allowedSubsystems = new Set(filteredData.map(row => row.subsystem));
      // Filter TableB data based on subsystems
      const propagatedTableBData = tableBData.filter(row => 
        allowedSubsystems.has(row.subsystem)
      );
      setProgressFilteredData(propagatedTableBData);
    } else if (target === 'nothing') {
      // Reset TableB to original state when propagation is disabled
      setProgressFilteredData(tableBData);
    }
  };
  
  const handleItemsPropagationChange = (filteredData, target) => {
    if (target === 'tableB') {
      // Extract subsystems from filtered TableA data
      const allowedSubsystems = new Set(filteredData.map(row => row.subsystem));
      // Filter TableB data based on subsystems
      const propagatedTableBData = tableBData.filter(row => 
        allowedSubsystems.has(row.subsystem)
      );
      setProgressFilteredData(propagatedTableBData);
    } else if (target === 'nothing') {
      // Reset TableB to original state when propagation is disabled
      setProgressFilteredData(tableBData);
    }
  };
  
  const handleProgressPropagationChange = (filteredData, target) => {
    if (target === 'tableA') {
      // Extract subsystems from filtered TableB data
      const allowedSubsystems = new Set(filteredData.map(row => row.subsystem));
      // Filter TableA data based on subsystems
      const propagatedTableAData = tableAData.filter(row => 
        allowedSubsystems.has(row.subsystem)
      );
      setStatusFilteredData(propagatedTableAData);
    } else if (target === 'nothing') {
      // Reset TableA to original state when propagation is disabled
      setStatusFilteredData(tableAData);
    }
  };
  
  const handleHitoPropagationChange = (filteredData, target) => {
    if (target === 'tableA') {
      // Extract subsystems from filtered TableB data
      const allowedSubsystems = new Set(filteredData.map(row => row.subsystem));
      // Filter TableA data based on subsystems
      const propagatedTableAData = tableAData.filter(row => 
        allowedSubsystems.has(row.subsystem)
      );
      setStatusFilteredData(propagatedTableAData);
    } else if (target === 'nothing') {
      // Reset TableA to original state when propagation is disabled
      setHitoFilteredData(tableBData);
    }
  };
  
  const handleBringToFront = () => {
    const newZIndex = topZIndex + 1;
    setTopZIndex(newZIndex);
    return newZIndex;
  };

  return (
    <VStack spacing={4} align="stretch">
      {/* Persistent Metric Cards - Inside Container to get filtered data */}
      <PersistentMetricCards 
        tabName="summarySubsystems" 
        controlData={tableAData}
        detailsData={tableBData}
        filteredControlData={filteredTableAData}
        filteredDetailsData={filteredTableBData}
        filters={{
          selectedSubsystem: selectedSubsystem
        }}
      />
      
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
          onLoopPropagationChange={handleLoopPropagationChange}
          onItemsPropagationChange={handleItemsPropagationChange}
          onProgressFilterVisibilityChange={setIsProgressFilterVisible}
          onItemsFilterVisibilityChange={setIsItemsFilterVisible}
          onLoopFilterVisibilityChange={setIsLoopFilterVisible}
          onProgressPropagationChange={handleProgressPropagationChange}
          onHitoFilteredDataChange={handleHitoFilterChange}
          onHitoFilterVisibilityChange={setIsHitoFilterVisible}
          onHitoPropagationChange={handleHitoPropagationChange}
          onBringToFront={handleBringToFront}
          onMetricsUpdated={setUpdatedMetrics}
        />
      </Suspense>
      
      {/* Draggable Tables */}
      <Box position="relative" width="100%" height="800px" overflow="hidden">
        <ResizableDraggablePanel
          title="Subsystem Overview"
          initialWidth={1000}
          initialHeight={700}
          initialX={20}
          initialY={20}
          minWidth={1000}
          minHeight={300}
          onBringToFront={handleBringToFront}
        >
          <SummarySubsystemsTableA
            data={filteredTableAData}
            selectedSubsystem={selectedSubsystem}
            onSubsystemSelect={handleSubsystemSelect}
            isItemsFilterVisible={isItemsFilterVisible}
            isLoopFilterVisible={isLoopFilterVisible}
            isHitoFilterVisible={isHitoFilterVisible}
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
          onBringToFront={handleBringToFront}
        >
          <SummarySubsystemsTableB
            data={filteredTableBData}
            selectedSubsystem={selectedSubsystem}
            onSubsystemSelect={handleSubsystemSelect}
            isProgressFilterVisible={isProgressFilterVisible}
            isHitoFilterVisible={false}
          />
        </ResizableDraggablePanel>
      </Box>
    </VStack>
  );
};

export default SummarySubsystemsContainer;