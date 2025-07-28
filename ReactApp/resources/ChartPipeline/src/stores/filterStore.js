import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

const useFilterStore = create(
  subscribeWithSelector((set, get) => ({
    // Filter states - centralized from SummarySubsystemsContainer
    filterState: {
      progress: { data: [], visible: false },
      status: { data: [], visible: false },
      loop: { data: [], visible: false },
      itemsTotal: { data: [], visible: false },
      inst: { data: [], visible: false },
      tracing: { data: [], visible: false },
      psv: { data: [], visible: false },
      motor: { data: [], visible: false },
      hito: { data: [], visible: false },
      subsystem: { data: [], visible: false },
      statusLoopMetric: { data: [], visible: false },
      statusInstMetric: { data: [], visible: false },
      statusItemsMetric: { data: [], visible: false },
      statusTracingMetric: { data: [], visible: false },
      statusInsulMetric: { data: [], visible: false },
      statusPSVMetric: { data: [], visible: false },
      statusMotorMetric: { data: [], visible: false }
    },

    // Source data
    tableAData: [],
    tableBData: [],

    // Actions
    updateFilter: (filterType, updates) => set((state) => ({
      filterState: {
        ...state.filterState,
        [filterType]: { ...state.filterState[filterType], ...updates }
      }
    })),

    batchUpdateFilters: (updates) => set((state) => {
      const newFilterState = { ...state.filterState };
      Object.entries(updates).forEach(([filterType, filterUpdates]) => {
        newFilterState[filterType] = { ...newFilterState[filterType], ...filterUpdates };
      });
      return { filterState: newFilterState };
    }),

    setSourceData: (tableAData, tableBData) => set((state) => ({
      tableAData,
      tableBData,
      filterState: {
        ...state.filterState,
        progress: { ...state.filterState.progress, data: tableBData },
        status: { ...state.filterState.status, data: tableAData },
        loop: { ...state.filterState.loop, data: tableAData },
        itemsTotal: { ...state.filterState.itemsTotal, data: tableAData },
        inst: { ...state.filterState.inst, data: tableAData },
        tracing: { ...state.filterState.tracing, data: tableAData },
        psv: { ...state.filterState.psv, data: tableAData },
        motor: { ...state.filterState.motor, data: tableAData },
        hito: { ...state.filterState.hito, data: tableBData },
        subsystem: { ...state.filterState.subsystem, data: tableAData },
        statusLoopMetric: { ...state.filterState.statusLoopMetric, data: tableAData },
        statusInstMetric: { ...state.filterState.statusInstMetric, data: tableAData },
        statusItemsMetric: { ...state.filterState.statusItemsMetric, data: tableAData },
        statusTracingMetric: { ...state.filterState.statusTracingMetric, data: tableAData },
        statusInsulMetric: { ...state.filterState.statusInsulMetric, data: tableAData },
        statusPSVMetric: { ...state.filterState.statusPSVMetric, data: tableAData },
        statusMotorMetric: { ...state.filterState.statusMotorMetric, data: tableAData }
      }
    })),

    // Computed selectors
    getCombinedTableAData: () => {
      const { filterState, tableAData } = get();
      const { status, loop, itemsTotal, inst, tracing, psv, motor, subsystem, statusLoopMetric, statusInstMetric, statusItemsMetric, statusTracingMetric, statusInsulMetric, statusPSVMetric, statusMotorMetric } = filterState;
      
      const statusSubsystems = new Set(status.data.map(row => row.subsystem));
      const loopSubsystems = new Set(loop.data.map(row => row.subsystem));
      const itemsTotalSubsystems = new Set(itemsTotal.data.map(row => row.subsystem));
      const instSubsystems = new Set(inst.data.map(row => row.subsystem));
      const tracingSubsystems = new Set(tracing.data.map(row => row.subsystem));
      const psvSubsystems = new Set(psv.data.map(row => row.subsystem));
      const motorSubsystems = new Set(motor.data.map(row => row.subsystem));
      const subsystemSubsystems = new Set(subsystem.data.map(row => row.subsystem));
      const statusLoopMetricSubsystems = new Set(statusLoopMetric.data.map(row => row.subsystem));
      const statusInstMetricSubsystems = new Set(statusInstMetric.data.map(row => row.subsystem));
      const statusItemsMetricSubsystems = new Set(statusItemsMetric.data.map(row => row.subsystem));
      const statusTracingMetricSubsystems = new Set(statusTracingMetric.data.map(row => row.subsystem));
      const statusInsulMetricSubsystems = new Set(statusInsulMetric.data.map(row => row.subsystem));
      const statusPSVMetricSubsystems = new Set(statusPSVMetric.data.map(row => row.subsystem));
      const statusMotorMetricSubsystems = new Set(statusMotorMetric.data.map(row => row.subsystem));
      
      return tableAData.filter(row => 
        statusSubsystems.has(row.subsystem) && 
        loopSubsystems.has(row.subsystem) &&
        itemsTotalSubsystems.has(row.subsystem) &&
        instSubsystems.has(row.subsystem) &&
        tracingSubsystems.has(row.subsystem) &&
        psvSubsystems.has(row.subsystem) &&
        motorSubsystems.has(row.subsystem) &&
        subsystemSubsystems.has(row.subsystem) &&
        statusLoopMetricSubsystems.has(row.subsystem) &&
        statusInstMetricSubsystems.has(row.subsystem) &&
        statusItemsMetricSubsystems.has(row.subsystem) &&
        statusTracingMetricSubsystems.has(row.subsystem) &&
        statusInsulMetricSubsystems.has(row.subsystem) &&
        statusPSVMetricSubsystems.has(row.subsystem) &&
        statusMotorMetricSubsystems.has(row.subsystem)
      );
    },

    getCombinedTableBData: () => {
      const { filterState } = get();
      const { progress, hito } = filterState;
      
      if (hito.data.length === 0) {
        return progress.data;
      }
      
      const hitoSubsystems = new Set(hito.data.map(row => row.subsystem));
      return progress.data.filter(row => hitoSubsystems.has(row.subsystem));
    }
  }))
);

export default useFilterStore;