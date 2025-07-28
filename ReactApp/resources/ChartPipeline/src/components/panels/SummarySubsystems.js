import React, { useState, useEffect } from 'react';
import BasePanelWrapper from './base/BasePanelWrapper';
import SummarySubsystemsContainer from './SummarySubsystemsContainer';
import PersistentMetricCards from '../ui/PersistentMetricCards';
import PersistentStateNotification from '../ui/PersistentStateNotification';
import { useSummarySubsystemsData } from '../../hooks/useSummarySubsystemsData';
import WasmPerformanceMonitor from '../ui/WasmPerformanceMonitor';
import wasmUtils from '../../wasm/wasmUtils.js';
import usePerformanceStore from '../../stores/performanceStore.js';

const SummarySubsystems = ({ data: filteredData = [], isZoomed = false }) => {
  const [performanceMetrics, setPerformanceMetrics] = useState({});
  
  // Initialize WASM and performance tracking
  const { setWasmInitialized } = usePerformanceStore();
  
  useEffect(() => {
    const initWasm = async () => {
      const initialized = await wasmUtils.initializeWasm();
      setWasmInitialized(initialized);
    };
    initWasm();
  }, [setWasmInitialized]);
  
  const {
    tableAData,
    tableBData,
    loading,
    error,
    summaryStats
  } = useSummarySubsystemsData(filteredData);

  const handlePerformanceUpdate = (metrics) => {
    setPerformanceMetrics(metrics);
  };

  return (
    <BasePanelWrapper
      loading={loading}
      error={error}
      isZoomed={isZoomed}
      containerProps={{
        p: 6,
        width: "100%",
        height: "100vh",
        maxWidth: isZoomed ? "146.67vw" : "150vw",
        overflow: "hidden"
      }}
    >
      <PersistentStateNotification tabName="summarySubsystems" />
      <PersistentMetricCards tabName="summarySubsystems" />
      <SummarySubsystemsContainer
        tableAData={tableAData}
        tableBData={tableBData}
        summaryStats={summaryStats}
        performanceMetrics={performanceMetrics}
      />
    </BasePanelWrapper>
  );
};

export default SummarySubsystems;