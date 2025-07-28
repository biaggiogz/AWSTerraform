import React, { lazy, Suspense, useState, useMemo, useEffect, useCallback } from 'react';
import { Box, VStack, HStack, Center, Spinner } from '@chakra-ui/react';
import SummarySubsystemsTableA from '../tables/SummarySubsystemsTableA';
import ProgressTestpackTable from '../tables/ProgressTespackTable';
import ResizableDraggablePanel from '../ui/ResizableDraggablePanel';
import { useSubsystemBidirectionalFilter } from '../../hooks/useSubsystemBidirectionalFilter';
import StatusLoopMetric from '../ui/StatusLoopMetric';
import StatusInstMetric from "../ui/StatusInstMetric";
import StatusItemsMetric from "../ui/StatusItemsMetric";
import Papa from 'papaparse';
import StatusTracingMetric from "../ui/StatusTracingMetric";
import StatusInsulMetric from "../ui/StatusInsulMetric";
import StatusPunchMetric from "../ui/StatusPunchMetric";
import StatusPSVMetric from "../ui/StatusPSVMetric";
import StatusMotorMetric from "../ui/StatusMotorMetric";
import wasmUtils from '../../wasm/wasmUtils.js';
import useFilterStore from '../../stores/filterStore.js';
import usePerformanceStore from '../../stores/performanceStore.js';

const DynamicCalculationPanel = lazy(() => import('../panels/DynamicCalculationPanel'));

const SummarySubsystemsContainer = ({ 
  tableAData, 
  tableBData
}) => {
  const [tpProgressData, setTpProgressData] = useState([]);
  const [topZIndex, setTopZIndex] = useState(100);
  const [isProgressTableVisible, setIsProgressTableVisible] = useState(true);
  
  // Zustand stores
  const { filterState, updateFilter, batchUpdateFilters, setSourceData, getCombinedTableAData, getCombinedTableBData } = useFilterStore();
  const { recordFilterExecution, recordWasmOperation } = usePerformanceStore();

  // Handle StatusLoopMetric subsystem filtering
  const handleStatusLoopMetricFilter = useCallback((subsystems) => {
    if (subsystems.length === 0) {
      updateFilter('statusLoopMetric', { data: tableAData });
    } else {
      const filteredData = tableAData.filter(row => subsystems.includes(row.subsystem));
      updateFilter('statusLoopMetric', { data: filteredData });
    }
  }, [tableAData, updateFilter]);

  // Handle StatusInstMetric subsystem filtering
  const handleStatusInstMetricFilter = useCallback((subsystems) => {
    if (subsystems.length === 0) {
      updateFilter('statusInstMetric', { data: tableAData });
    } else {
      const filteredData = tableAData.filter(row => subsystems.includes(row.subsystem));
      updateFilter('statusInstMetric', { data: filteredData });
    }
  }, [tableAData, updateFilter]);

  // Handle StatusTracingMetric subsystem filtering
  const handleStatusTracingMetricFilter = useCallback((subsystems) => {
    if (subsystems.length === 0) {
      updateFilter('statusTracingMetric', { data: tableAData });
    } else {
      const filteredData = tableAData.filter(row => subsystems.includes(row.subsystem));
      updateFilter('statusTracingMetric', { data: filteredData });
    }
  }, [tableAData, updateFilter]);

  // Handle StatusItemsMetric subsystem filtering
  const handleStatusItemsMetricFilter = useCallback((subsystems) => {
    if (subsystems.length === 0) {
      updateFilter('statusItemsMetric', { data: tableAData });
    } else {
      const filteredData = tableAData.filter(row => subsystems.includes(row.subsystem));
      updateFilter('statusItemsMetric', { data: filteredData });
    }
  }, [tableAData, updateFilter]);

  // Handle StatusInsulMetric subsystem filtering
  const handleStatusInsulMetricFilter = useCallback((subsystems) => {
    if (subsystems.length === 0) {
      updateFilter('statusInsulMetric', { data: tableAData });
    } else {
      const filteredData = tableAData.filter(row => subsystems.includes(row.subsystem));
      updateFilter('statusInsulMetric', { data: filteredData });
    }
  }, [tableAData, updateFilter]);

  // Handle StatusPSVMetric subsystem filtering
  const handleStatusPSVMetricFilter = useCallback((subsystems) => {
    if (subsystems.length === 0) {
      updateFilter('statusPSVMetric', { data: tableAData });
    } else {
      const filteredData = tableAData.filter(row => subsystems.includes(row.subsystem));
      updateFilter('statusPSVMetric', { data: filteredData });
    }
  }, [tableAData, updateFilter]);

  // Handle StatusMotorMetric subsystem filtering
  const handleStatusMotorMetricFilter = useCallback((subsystems) => {
    if (subsystems.length === 0) {
      updateFilter('statusMotorMetric', { data: tableAData });
    } else {
      const filteredData = tableAData.filter(row => subsystems.includes(row.subsystem));
      updateFilter('statusMotorMetric', { data: filteredData });
    }
  }, [tableAData, updateFilter]);
  
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
  
  // Zustand-powered combined filter logic with performance tracking
  const combinedFilteredTableAData = useMemo(() => {
    const startTime = performance.now();
    const result = getCombinedTableAData();
    const executionTime = performance.now() - startTime;
    recordFilterExecution('intersection', executionTime);
    return result;
  }, [getCombinedTableAData, recordFilterExecution]);
  
  const combinedFilteredTableBData = useMemo(() => {
    const startTime = performance.now();
    const result = getCombinedTableBData();
    const executionTime = performance.now() - startTime;
    recordFilterExecution('intersection', executionTime);
    return result;
  }, [getCombinedTableBData, recordFilterExecution]);
  
  const {
    selectedSubsystem,
    filteredTableAData,
    filteredTableBData,
    handleSubsystemSelect,
    clearFilter
  } = useSubsystemBidirectionalFilter(combinedFilteredTableAData, combinedFilteredTableBData);
  
  // Initialize filter data when source data changes
  useEffect(() => {
    setSourceData(tableAData, tableBData);
  }, [tableAData, tableBData, setSourceData]);
  
  // Zustand-powered filter change handlers with batch updates
  const handleProgressFilterChange = useCallback((filteredData) => {
    const startTime = performance.now();
    updateFilter('progress', { data: filteredData });
    recordFilterExecution('testPackFilter', performance.now() - startTime);
  }, [updateFilter, recordFilterExecution]);
  
  const handleStatusFilterChange = useCallback((filteredData) => {
    updateFilter('status', { data: filteredData });
  }, [updateFilter]);
  
  const handleLoopFilterChange = useCallback((filteredData) => {
    updateFilter('loop', { data: filteredData });
  }, [updateFilter]);

  const handleItemsTotalFilterChange = useCallback((filteredData) => {
    updateFilter('itemsTotal', { data: filteredData });
  }, [updateFilter]);

  const handleInstFilterChange = useCallback((filteredData) => {
    updateFilter('inst', { data: filteredData });
  }, [updateFilter]);
  
  const handleTracingFilterChange = useCallback((filteredData) => {
    updateFilter('tracing', { data: filteredData });
  }, [updateFilter]);
  
  const handlePSVFilterChange = useCallback((filteredData) => {
    updateFilter('psv', { data: filteredData });
  }, [updateFilter]);
  
  const handleMotorFilterChange = useCallback((filteredData) => {
    updateFilter('motor', { data: filteredData });
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

  const handleItemsTotalPropagationChange = useCallback((filteredData, target) => {
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
      {/* Completed Loop Metric */}
      <HStack alignSelf="center" spacing={4}>
        <StatusItemsMetric data={tableAData} onSubsystemFilter={handleStatusItemsMetricFilter} />
        <StatusLoopMetric data={tableAData} onSubsystemFilter={handleStatusLoopMetricFilter} />
        <StatusInstMetric data={tableAData} onSubsystemFilter={handleStatusInstMetricFilter} />
        <StatusTracingMetric data={tableAData} onSubsystemFilter={handleStatusTracingMetricFilter} />
        <StatusInsulMetric data={tableAData} onSubsystemFilter={handleStatusInsulMetricFilter} />
        <StatusPSVMetric data={tableAData} onSubsystemFilter={handleStatusPSVMetricFilter} />
        <StatusMotorMetric data={tableAData} onSubsystemFilter={handleStatusMotorMetricFilter} />
        <StatusPunchMetric data={tableAData} />
      </HStack>

      
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
          onItemsTotalFilteredControlDataChange={handleItemsTotalFilterChange}
          onItemsTotalPropagationChange={handleItemsTotalPropagationChange}
          onItemsTotalFilterVisibilityChange={(visible) => updateFilter('itemsTotal', { visible })}
          onProgressFilterVisibilityChange={(visible) => updateFilter('progress', { visible })}
          onItemsFilterVisibilityChange={(visible) => updateFilter('status', { visible })}
          onLoopFilterVisibilityChange={(visible) => updateFilter('loop', { visible })}
          onInstFilteredControlDataChange={handleInstFilterChange}
          onInstFilterVisibilityChange={(visible) => updateFilter('inst', { visible })}
          onTracingFilteredControlDataChange={handleTracingFilterChange}
          onTracingFilterVisibilityChange={(visible) => updateFilter('tracing', { visible })}
          onPSVFilteredControlDataChange={handlePSVFilterChange}
          onPSVFilterVisibilityChange={(visible) => updateFilter('psv', { visible })}
          onMotorFilteredControlDataChange={handleMotorFilterChange}
          onMotorFilterVisibilityChange={(visible) => updateFilter('motor', { visible })}
          onProgressPropagationChange={handleProgressPropagationChange}
          onHitoFilteredDataChange={handleHitoFilterChange}
          onHitoFilterVisibilityChange={(visible) => updateFilter('hito', { visible })}
          onHitoPropagationChange={handleHitoPropagationChange}
          onSubsystemFilteredDataChange={handleSubsystemFilterChange}
          onSubsystemFilterVisibilityChange={(visible) => updateFilter('subsystem', { visible })}
          onSubsystemPropagationChange={handleSubsystemPropagationChange}
          onProgressTableVisibilityChange={setIsProgressTableVisible}
          onBringToFront={handleFilterBringToFront}
          onStatusLoopMetricFilterChange={handleStatusLoopMetricFilter}
        />
      </Suspense>
      
      {/* Draggable Tables */}
      <Box position="relative" width="120%" height="800px" zIndex={1}>
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
            isInsulFilterVisible={filterState.status.visible}
            isLoopFilterVisible={filterState.loop.visible}
            isItemsTotalFilterVisible={filterState.itemsTotal.visible}
            isInstFilterVisible={filterState.inst.visible}
            isTracingFilterVisible={filterState.tracing.visible}
            isPSVFilterVisible={filterState.psv.visible}
            isMotorFilterVisible={filterState.motor.visible}
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