import React, { lazy, Suspense, useState, useMemo, useEffect } from 'react';
import { Box, VStack, Center, Spinner } from '@chakra-ui/react';
import SummarySubsystemsTableA from '../tables/SummarySubsystemsTableA';
import ProgressTestpackTable from '../tables/ProgressTespackTable';
import ResizableDraggablePanel from '../ui/ResizableDraggablePanel';
import { useSubsystemBidirectionalFilter } from '../../hooks/useSubsystemBidirectionalFilter';
import Papa from 'papaparse';

const DynamicCalculationPanel = lazy(() => import('../panels/DynamicCalculationPanel'));

const SummarySubsystemsContainer = ({ 
  tableAData, 
  tableBData
}) => {
  const [tpProgressData, setTpProgressData] = useState([]);
  const [progressFilteredData, setProgressFilteredData] = useState(tableBData);
  const [statusFilteredData, setStatusFilteredData] = useState(tableAData);
  const [loopFilteredData, setLoopFilteredData] = useState(tableAData);
  const [hitoFilteredData, setHitoFilteredData] = useState(tableBData);
  const [isProgressFilterVisible, setIsProgressFilterVisible] = useState(false);
  const [isItemsFilterVisible, setIsItemsFilterVisible] = useState(false);
  const [isLoopFilterVisible, setIsLoopFilterVisible] = useState(false);
  const [isHitoFilterVisible, setIsHitoFilterVisible] = useState(false);
  const [isSubsystemFilterVisible, setIsSubsystemFilterVisible] = useState(false);
  const [subsystemFilteredData, setSubsystemFilteredData] = useState(tableAData);
  const [topZIndex, setTopZIndex] = useState(100);
  
  // Load CSV data and transform for ProgressFilter compatibility
  useEffect(() => {
    const loadCSVData = async () => {
      try {
        const response = await fetch('/data/tp_with_progress.csv');
        const csvText = await response.text();
        Papa.parse(csvText, {
          header: true,
          complete: (results) => {
            const filteredData = results.data.filter(row => row.subsystem && row.tp_id);
            
            // Transform CSV data to be compatible with ProgressFilter
            const transformedData = filteredData.map(row => ({
              // Original CSV format for ProgressTestpackTable
              ...row,
              // Transformed format for ProgressFilter compatibility
              testPack: String(row.tp_id),
              testPackProgress: Math.round((parseFloat(row.progress_tp) || 0) * 100)
            }));
            
            console.log('CSV Data loaded and transformed:', {
              totalRows: results.data.length,
              filteredRows: transformedData.length,
              sampleOriginal: filteredData.slice(0, 2),
              sampleTransformed: transformedData.slice(0, 2)
            });
            
            setTpProgressData(transformedData);
          }
        });
      } catch (error) {
        console.error('Error loading CSV data:', error);
      }
    };
    loadCSVData();
  }, []);
  
  // Apply status, loop, hito, and subsystem filters
  const combinedFilteredTableAData = useMemo(() => {
    const statusFiltered = statusFilteredData;
    const loopFiltered = loopFilteredData;
    const subsystemFiltered = subsystemFilteredData;
    
    // Find intersection of all filters
    const statusSubsystems = new Set(statusFiltered.map(row => row.subsystem));
    const loopSubsystems = new Set(loopFiltered.map(row => row.subsystem));
    const subsystemSubsystems = new Set(subsystemFiltered.map(row => row.subsystem));
    
    return tableAData.filter(row => 
      statusSubsystems.has(row.subsystem) && 
      loopSubsystems.has(row.subsystem) &&
      subsystemSubsystems.has(row.subsystem)
    );
  }, [tableAData, statusFilteredData, loopFilteredData, subsystemFilteredData]);
  
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
  
  React.useEffect(() => {
    setSubsystemFilteredData(tableAData);
  }, [tableAData]);
  
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
    console.log('Progress propagation:', { filteredData, target });
    
    // Only handle TableA propagation here
    if (target === 'tableA' || target === 'both') {
      if (filteredData.length === 0) {
        setStatusFilteredData(tableAData);
        return;
      }
      
      // Extract test packs from filtered data (handle both formats)
      const filteredTestPacks = filteredData.map(row => 
        String(row.testPack || row.tp_id || '')
      ).filter(Boolean);
      
      console.log('Filtered test packs for propagation:', filteredTestPacks.slice(0, 5));
      
      // Filter TableA data based on test packs in list_includes_tp_id
      const propagatedTableAData = tableAData.filter(row => {
        try {
          const tpIds = row.list_includes_tp_id;
          if (!tpIds) return false;
          
          let tpIdArray = [];
          if (typeof tpIds === 'string') {
            tpIdArray = tpIds.split('|');
          } else if (Array.isArray(tpIds)) {
            tpIdArray = tpIds;
          } else if (typeof tpIds === 'number') {
            tpIdArray = [String(tpIds)];
          } else {
            return false;
          }
          
          return tpIdArray.some(tpId => filteredTestPacks.includes(String(tpId)));
        } catch (error) {
          console.error('Error filtering row:', error);
          return false;
        }
      });
      
      console.log('Propagated TableA rows:', propagatedTableAData.length);
      setStatusFilteredData(propagatedTableAData);
    } else if (target === 'nothing') {
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
  
  const handleSubsystemFilterChange = (filteredData) => {
    const isReset = filteredData === tableAData;
    setSubsystemFilteredData(filteredData);
  };
  
  const handleSubsystemPropagationChange = (filteredData, target) => {
    if (target === 'tableB') {
      const allowedSubsystems = new Set(filteredData.map(row => row.subsystem));
      const propagatedTableBData = tableBData.filter(row => 
        allowedSubsystems.has(row.subsystem)
      );
      setProgressFilteredData(propagatedTableBData);
    } else if (target === 'nothing') {
      setSubsystemFilteredData(tableAData);
    }
  };
  
  const handleBringToFront = () => {
    const newZIndex = topZIndex + 1;
    setTopZIndex(newZIndex);
    return newZIndex;
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
          csvProgressData={tpProgressData}
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
          onSubsystemFilteredDataChange={handleSubsystemFilterChange}
          onSubsystemFilterVisibilityChange={setIsSubsystemFilterVisible}
          onSubsystemPropagationChange={handleSubsystemPropagationChange}
          onBringToFront={handleBringToFront}
        />
      </Suspense>
      
      {/* Draggable Tables */}
      <Box position="relative" width="120%" height="800px" overflow="hidden">
        <ResizableDraggablePanel
          title="Subsystem Overview"
          initialWidth={1660}
          initialHeight={700}
          initialX={10}
          initialY={10}
          minWidth={1657}
          minHeight={700}
          onBringToFront={handleBringToFront}
        >
          <SummarySubsystemsTableA
            data={filteredTableAData}
            selectedSubsystem={selectedSubsystem}
            onSubsystemSelect={handleSubsystemSelect}
            isItemsFilterVisible={isItemsFilterVisible}
            isLoopFilterVisible={isLoopFilterVisible}
            isHitoFilterVisible={isHitoFilterVisible}
            isProgressFilterVisible={isProgressFilterVisible}
            isSubsystemFilterVisible={isSubsystemFilterVisible}
          />
        </ResizableDraggablePanel>

        <ResizableDraggablePanel
          title="Test Pack Progress Details"
          initialWidth={200}
          initialHeight={550}
          initialX={1180}
          initialY={20}
          minWidth={200}
          minHeight={700}
          onBringToFront={handleBringToFront}
        >
          <ProgressTestpackTable
            data={tpProgressData}
            selectedSubsystem={selectedSubsystem}
            isProgressFilterVisible={isProgressFilterVisible}
          />
        </ResizableDraggablePanel>
      </Box>
    </VStack>
  );
};


export default SummarySubsystemsContainer;