import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import { buildOptimizedWhereClause } from '../../utils/sqlOptimizer';
import { applyMultipleFilters } from '../../utils/wasmFilters';

// Create context
const LazosTableSqlFilterContext = createContext();

// Provider component
export const LazosTableSqlFilterProvider = ({ children, externalFilters = {}, progressFilter = null }) => {
    // Filter state - subsystem and area filters
    const [lazosTableSqlSelectedSubsystem, setLazosTableSqlSelectedSubsystem] = useState(null);
    const [lazosTableSqlSelectedArea, setLazosTableSqlSelectedArea] = useState(null);
    const [lazosTableSqlSubsystemCompletionFilter, setLazosTableSqlSubsystemCompletionFilter] = useState(null);

    // Table data for chart visualization
    const [lazosTableSqlTableData, setLazosTableSqlTableData] = useState([]);
    const [lazosTableSqlGroupBy, setLazosTableSqlGroupBy] = useState(['SUBSYSTEM', 'AREA']);

    // Handle subsystem selection
    const lazosTableSqlHandleSubsystemClick = useCallback((subsystem) => {
        setLazosTableSqlSelectedSubsystem(prev => prev === subsystem ? null : subsystem);
    }, []);

    // Handle area selection
    const lazosTableSqlHandleAreaClick = useCallback((area) => {
        setLazosTableSqlSelectedArea(prev => prev === area ? null : area);
    }, []);

    // Handle subsystem completion filter
    const lazosTableSqlHandleSubsystemCompletionFilter = useCallback((filterType) => {
        setLazosTableSqlSubsystemCompletionFilter(prev => prev === filterType ? null : filterType);
    }, []);

    // Clear all filters
    const lazosTableSqlClearAllFilters = useCallback(() => {
        setLazosTableSqlSelectedSubsystem(null);
        setLazosTableSqlSelectedArea(null);
        setLazosTableSqlSubsystemCompletionFilter(null);
    }, []);

    // Filter function for Loop Test Control table with WASM optimization
    const lazosTableSqlFilterData = useCallback((data) => {
        if (!data || !data.length) return [];
        if (!lazosTableSqlSelectedSubsystem && !lazosTableSqlSelectedArea && !progressFilter) return data;

        const filters = {
            subsystem: lazosTableSqlSelectedSubsystem,
            area: lazosTableSqlSelectedArea,
            progress: progressFilter
        };
        
        return applyMultipleFilters(data, filters);
    }, [lazosTableSqlSelectedSubsystem, lazosTableSqlSelectedArea, progressFilter]);

    // Create SQL WHERE clauses for direct filtering in queries with WASM optimization
    const lazosTableSqlGetSqlWhereClause = useCallback(() => {
        const filterParams = {
            subsystem: lazosTableSqlSelectedSubsystem,
            selectedArea: lazosTableSqlSelectedArea,
            progressFilter,
            subsystemCompletionFilter: lazosTableSqlSubsystemCompletionFilter,
            ...externalFilters
        };
        
        return buildOptimizedWhereClause(filterParams);
    }, [lazosTableSqlSelectedSubsystem, lazosTableSqlSelectedArea, lazosTableSqlSubsystemCompletionFilter, externalFilters, progressFilter]);

    // Context value
    const lazosTableSqlValue = useMemo(() => ({
        // Filter state
        selectedSubsystem: lazosTableSqlSelectedSubsystem,
        selectedArea: lazosTableSqlSelectedArea,
        subsystemCompletionFilter: lazosTableSqlSubsystemCompletionFilter,

        // Filter handlers
        handleSubsystemClick: lazosTableSqlHandleSubsystemClick,
        handleAreaClick: lazosTableSqlHandleAreaClick,
        handleSubsystemCompletionFilter: lazosTableSqlHandleSubsystemCompletionFilter,
        clearAllFilters: lazosTableSqlClearAllFilters,

        // Filter functions
        filterData: lazosTableSqlFilterData,

        // SQL helpers
        getSqlWhereClause: lazosTableSqlGetSqlWhereClause,

        // Table data for chart visualization
        tableData: lazosTableSqlTableData,
        setTableData: setLazosTableSqlTableData,
        groupBy: lazosTableSqlGroupBy,
        setGroupBy: setLazosTableSqlGroupBy
    }), [
        lazosTableSqlSelectedSubsystem,
        lazosTableSqlSelectedArea,
        lazosTableSqlSubsystemCompletionFilter,
        lazosTableSqlHandleSubsystemClick,
        lazosTableSqlHandleAreaClick,
        lazosTableSqlHandleSubsystemCompletionFilter,
        lazosTableSqlClearAllFilters,
        lazosTableSqlFilterData,
        lazosTableSqlGetSqlWhereClause,
        lazosTableSqlTableData,
        setLazosTableSqlTableData,
        lazosTableSqlGroupBy,
        setLazosTableSqlGroupBy,
        externalFilters,
        progressFilter
    ]);

    return (
        <LazosTableSqlFilterContext.Provider value={lazosTableSqlValue}>
            {children}
        </LazosTableSqlFilterContext.Provider>
    );
};

// Hook to use the filter context
export const useLazosTableSqlFilterContext = () => {
    const context = useContext(LazosTableSqlFilterContext);
    if (!context) {
        throw new Error('useLazosTableSqlFilterContext must be used within LazosTableSqlFilterProvider');
    }
    return context;
};

// Custom hook for filter state
export const useLazosTableSqlFilter = () => {
    const [lazosTableSqlSelectedSubsystem, setLazosTableSqlSelectedSubsystem] = useState(null);

    // Handle subsystem selection
    const lazosTableSqlHandleSubsystemClick = useCallback((subsystem) => {
        setLazosTableSqlSelectedSubsystem(prev => prev === subsystem ? null : subsystem);
    }, []);

    // Clear all filters
    const lazosTableSqlClearAllFilters = useCallback(() => {
        setLazosTableSqlSelectedSubsystem(null);
    }, []);

    // Filter function
    const lazosTableSqlFilterData = useCallback((data) => {
        if (!data) return [];

        let filteredData = [...data];

        // Filter by subsystem
        if (lazosTableSqlSelectedSubsystem) {
            filteredData = filteredData.filter(row =>
                row['SUBSYSTEM'] === lazosTableSqlSelectedSubsystem
            );
        }

        return filteredData;
    }, [lazosTableSqlSelectedSubsystem]);

    return {
        selectedSubsystem: lazosTableSqlSelectedSubsystem,
        handleSubsystemClick: lazosTableSqlHandleSubsystemClick,
        clearAllFilters: lazosTableSqlClearAllFilters,
        filterData: lazosTableSqlFilterData
    };
};

// Keep original exports for backward compatibility
export const InstrumentsTableFilterProvider = LazosTableSqlFilterProvider;
export const useInstrumentsTableFilterContext = useLazosTableSqlFilterContext;
export const useInstrumentsTableFilter = useLazosTableSqlFilter;

export default {
    LazosTableSqlFilterProvider,
    useLazosTableSqlFilterContext,
    useLazosTableSqlFilter,
    // Backward compatibility
    InstrumentsTableFilterProvider,
    useInstrumentsTableFilterContext,
    useInstrumentsTableFilter
};