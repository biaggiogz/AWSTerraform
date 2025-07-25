import React, { lazy, Suspense, useState, useMemo, useEffect, useCallback } from 'react';
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
  const [topZIndex, setTopZIndex] = useState(100);
  const [isProgressTableVisible, setIsProgressTableVisible] = useState(true);
  
  // Centralized filter state management
  const [filterState, setFilterState] = useState({
    progress: { data: tableBData, visible: false },
    status: { data: tableAData, visible: false },
    loop: { data: tableAData, visible: false },
    hito: { data: tableBData, visible: false },
    subsystem: { data: tableAData, visible: false }
  });
  
  // Centralized filter update function
  const updateFilter = useCallback((filterType, updates) => {
    setFilterState(prev => ({
      ...prev,
      [filterType]: { ...prev[filterType], ...updates }
    }));
  }, []);
  
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
  
  // Optimized combined filter logic
  const combinedFilteredTableAData = useMemo(() => {
    const { status, loop, subsystem } = filterState;
    
    // Find intersection of all TableA filters
    const statusSubsystems = new Set(status.data.map(row => row.subsystem));
    const loopSubsystems = new Set(loop.data.map(row => row.subsystem));
    const subsystemSubsystems = new Set(subsystem.data.map(row => row.subsystem));
    
    return tableAData.filter(row => 
      statusSubsystems.has(row.subsystem) && 
      loopSubsystems.has(row.subsystem) &&
      subsystemSubsystems.has(row.subsystem)
    );
  }, [tableAData, filterState.status.data, filterState.loop.data, filterState.subsystem.data]);
  
  const combinedFilteredTableBData = useMemo(() => {
    const { progress, hito } = filterState;
    
    if (hito.data.length === 0) {
      return progress.data;
    }
    
    const hitoSubsystems = new Set(hito.data.map(row => row.subsystem));
    return progress.data.filter(row => hitoSubsystems.has(row.subsystem));
  }, [filterState.progress.data, filterState.hito.data]);
  
  const {
    selectedSubsystem,
    filteredTableAData,
    filteredTableBData,
    handleSubsystemSelect,
    clearFilter
  } = useSubsystemBidirectionalFilter(combinedFilteredTableAData, combinedFilteredTableBData);
  
  // Initialize filter data when source data changes
  useEffect(() => {
    setFilterState(prev => ({
      progress: { ...prev.progress, data: tableBData },
      status: { ...prev.status, data: tableAData },
      loop: { ...prev.loop, data: tableAData },
      hito: { ...prev.hito, data: tableBData },
      subsystem: { ...prev.subsystem, data: tableAData }
    }));
  }, [tableAData, tableBData]);
  
  // Centralized filter change handlers
  const handleProgressFilterChange = useCallback((filteredData) => {
    updateFilter('progress', { data: filteredData });
  }, [updateFilter]);
  
  const handleStatusFilterChange = useCallback((filteredData) => {
    updateFilter('status', { data: filteredData });
  }, [updateFilter]);
  
  const handleLoopFilterChange = useCallback((filteredData) => {
    updateFilter('loop', { data: filteredData });
  }, [updateFilter]);
  
  const handleHitoFilterChange = useCallback((filteredData) => {
    updateFilter('hito', { data: filteredData });
  }, [updateFilter]);
  
  const handleSubsystemFilterChange = useCallback((filteredData) => {
    updateFilter('subsystem', { data: filteredData });
  }, [updateFilter]);
  
  // Optimized propagation handlers
  const handleLoopPropagationChange = useCallback((filteredData, target) => {
    if (target === 'tableB') {
      const allowedSubsystems = new Set(filteredData.map(row => row.subsystem));
      const propagatedData = tableBData.filter(row => allowedSubsystems.has(row.subsystem));
      updateFilter('progress', { data: propagatedData });
    } else if (target === 'nothing') {
      updateFilter('progress', { data: tableBData });
    }
  }, [tableBData, updateFilter]);
  
  const handleItemsPropagationChange = useCallback((filteredData, target) => {
    if (target === 'tableB') {
      const allowedSubsystems = new Set(filteredData.map(row => row.subsystem));
      const propagatedData = tableBData.filter(row => allowedSubsystems.has(row.subsystem));
      updateFilter('progress', { data: propagatedData });
    } else if (target === 'nothing') {
      updateFilter('progress', { data: tableBData });
    }
  }, [tableBData, updateFilter]);
  
  const handleProgressPropagationChange = useCallback((filteredData, target) => {
    if (target === 'tableA' || target === 'both') {
      if (filteredData.length === 0) {
        updateFilter('status', { data: tableAData });
        return;
      }
      
      const filteredTestPacks = filteredData.map(row => 
        String(row.testPack || row.tp_id || '')
      ).filter(Boolean);
      
      const propagatedData = tableAData.filter(row => {
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
      });
      
      updateFilter('status', { data: propagatedData });
    } else if (target === 'nothing') {
      updateFilter('status', { data: tableAData });
    }
  }, [tableAData, updateFilter]);
  
  const handleHitoPropagationChange = useCallback((filteredData, target) => {
    if (target === 'tableA') {
      const allowedSubsystems = new Set(filteredData.map(row => row.subsystem));
      const propagatedData = tableAData.filter(row => allowedSubsystems.has(row.subsystem));
      updateFilter('status', { data: propagatedData });
    } else if (target === 'nothing') {
      updateFilter('hito', { data: tableBData });
    }
  }, [tableAData, tableBData, updateFilter]);
  
  const handleSubsystemPropagationChange = useCallback((filteredData, target) => {
    if (target === 'tableB') {
      const allowedSubsystems = new Set(filteredData.map(row => row.subsystem));
      const propagatedData = tableBData.filter(row => allowedSubsystems.has(row.subsystem));
      updateFilter('progress', { data: propagatedData });
    } else if (target === 'nothing') {
      updateFilter('subsystem', { data: tableAData });
    }
  }, [tableAData, tableBData, updateFilter]);
  
  const handleBringToFront = () => {
    const newZIndex = topZIndex + 1;
    setTopZIndex(newZIndex);
    return newZIndex;
  };
  
  // Enhanced filter bring to front with higher z-index
  const handleFilterBringToFront = () => {
    const newZIndex = topZIndex + 100; // Ensure filters are always above tables
    setTopZIndex(newZIndex + 1);
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
          onProgressFilterVisibilityChange={(visible) => updateFilter('progress', { visible })}
          onItemsFilterVisibilityChange={(visible) => updateFilter('status', { visible })}
          onLoopFilterVisibilityChange={(visible) => updateFilter('loop', { visible })}
          onProgressPropagationChange={handleProgressPropagationChange}
          onHitoFilteredDataChange={handleHitoFilterChange}
          onHitoFilterVisibilityChange={(visible) => updateFilter('hito', { visible })}
          onHitoPropagationChange={handleHitoPropagationChange}
          onSubsystemFilteredDataChange={handleSubsystemFilterChange}
          onSubsystemFilterVisibilityChange={(visible) => updateFilter('subsystem', { visible })}
          onSubsystemPropagationChange={handleSubsystemPropagationChange}
          onProgressTableVisibilityChange={setIsProgressTableVisible}
          onBringToFront={handleFilterBringToFront}
        />
      </Suspense>
      
      {/* Draggable Tables */}
      <Box position="relative" width="120%" height="800px" overflow="hidden" zIndex={1}>
        <ResizableDraggablePanel
          title="Subsystem Overview"
          initialWidth={1660}
          initialHeight={700}
          initialX={10}
          initialY={10}
          minWidth={1657}
          minHeight={700}
          onBringToFront={handleBringToFront}
          disableDragging={true}
          zIndex={10}
        >
          <SummarySubsystemsTableA
            data={filteredTableAData}
            selectedSubsystem={selectedSubsystem}
            onSubsystemSelect={handleSubsystemSelect}
            isItemsFilterVisible={filterState.status.visible}
            isLoopFilterVisible={filterState.loop.visible}
            isHitoFilterVisible={filterState.hito.visible}
            isProgressFilterVisible={filterState.progress.visible}
            isSubsystemFilterVisible={filterState.subsystem.visible}
          />
        </ResizableDraggablePanel>

        {isProgressTableVisible && (
          <ResizableDraggablePanel
            title="Test Pack Progress Details"
            initialWidth={470}
            initialHeight={550}
            initialX={10 + 1660 + 5}
            initialY={10}
            minWidth={470}
            minHeight={700}
            onBringToFront={handleBringToFront}
            disableDragging={true}
            zIndex={10}
          >
            <ProgressTestpackTable
              data={tpProgressData}
              selectedSubsystem={selectedSubsystem}
              isProgressFilterVisible={filterState.progress.visible}
            />
          </ResizableDraggablePanel>
        )}
      </Box>
    </VStack>
  );
};


export default SummarySubsystemsContainer;