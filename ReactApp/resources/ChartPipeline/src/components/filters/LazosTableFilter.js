import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';

// Create context
const LazosTableSqlFilterContext = createContext();

// Provider component
export const LazosTableSqlFilterProvider = ({ children, externalFilters = {} }) => {
    // Filter state - subsystem and area filters
    const [lazosTableSqlSelectedSubsystem, setLazosTableSqlSelectedSubsystem] = useState(null);
    const [lazosTableSqlSelectedArea, setLazosTableSqlSelectedArea] = useState(null);
    const [lazosTableSqlCompletionFilter, setLazosTableSqlCompletionFilter] = useState(null);

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

    // Handle completion filter
    const lazosTableSqlHandleCompletionFilter = useCallback((filterType) => {
        setLazosTableSqlCompletionFilter(prev => prev === filterType ? null : filterType);
    }, []);

    // Clear all filters
    const lazosTableSqlClearAllFilters = useCallback(() => {
        setLazosTableSqlSelectedSubsystem(null);
        setLazosTableSqlSelectedArea(null);
        setLazosTableSqlCompletionFilter(null);
    }, []);

    // Filter function for Loop Test Control table
    const lazosTableSqlFilterData = useCallback((data) => {
        if (!data || !data.length) return [];
        if (!lazosTableSqlSelectedSubsystem && !lazosTableSqlSelectedArea && !lazosTableSqlCompletionFilter) return data;

        return data.filter(row => {
            // Filter by subsystem
            if (lazosTableSqlSelectedSubsystem && row['SUBSYSTEM'] !== lazosTableSqlSelectedSubsystem) {
                return false;
            }
            // Filter by area
            if (lazosTableSqlSelectedArea && row['AREA'] !== lazosTableSqlSelectedArea) {
                return false;
            }
            // Filter by completion status
            if (lazosTableSqlCompletionFilter) {
                const subsystem = row['SUBSYSTEM'];
                if (!subsystem) return false;
                
                // Calculate completion status for this subsystem
                const subsystemRows = data.filter(item => item['SUBSYSTEM'] === subsystem);
                const totalLoops = subsystemRows.length;
                const doneLoops = subsystemRows.filter(item => parseFloat(item['OK100']) === 1.0).length;
                
                if (lazosTableSqlCompletionFilter === 'DONE' && totalLoops !== doneLoops) {
                    return false;
                }
                if (lazosTableSqlCompletionFilter === 'PENDING' && totalLoops === doneLoops) {
                    return false;
                }
            }
            return true;
        });
    }, [lazosTableSqlSelectedSubsystem, lazosTableSqlSelectedArea, lazosTableSqlCompletionFilter]);

    // Create SQL WHERE clauses for direct filtering in queries
    const lazosTableSqlGetSqlWhereClause = useCallback(() => {
        const conditions = [];
        
        console.log('External filters received:', externalFilters);

        // Internal filters (from table clicks)
        if (lazosTableSqlSelectedSubsystem) {
            conditions.push(`subsystem = '${lazosTableSqlSelectedSubsystem}'`);
        }

        if (lazosTableSqlSelectedArea) {
            conditions.push(`area_tlp = '${lazosTableSqlSelectedArea}'`);
        }

        // External filters (from main filter panel)
        if (externalFilters.area_tlp && externalFilters.area_tlp.length > 0) {
            const areaValues = externalFilters.area_tlp.map(area => `'${area}'`).join(', ');
            conditions.push(`area_tlp IN (${areaValues})`);
            console.log('Added area filter:', `area_tlp IN (${areaValues})`);
        }

        if (externalFilters.subsystem && externalFilters.subsystem.length > 0) {
            const subsystemValues = externalFilters.subsystem.map(sub => `'${sub}'`).join(', ');
            conditions.push(`subsystem IN (${subsystemValues})`);
            console.log('Added subsystem filter:', `subsystem IN (${subsystemValues})`);
        }

        const finalClause = conditions.length > 0 ? conditions.join(' AND ') : '';
        console.log('Final WHERE clause:', finalClause);
        return finalClause;
    }, [lazosTableSqlSelectedSubsystem, lazosTableSqlSelectedArea, externalFilters]);

    // Context value
    const lazosTableSqlValue = useMemo(() => ({
        // Filter state
        selectedSubsystem: lazosTableSqlSelectedSubsystem,
        selectedArea: lazosTableSqlSelectedArea,
        completionFilter: lazosTableSqlCompletionFilter,

        // Filter handlers
        handleSubsystemClick: lazosTableSqlHandleSubsystemClick,
        handleAreaClick: lazosTableSqlHandleAreaClick,
        handleCompletionFilter: lazosTableSqlHandleCompletionFilter,
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
        lazosTableSqlCompletionFilter,
        lazosTableSqlHandleSubsystemClick,
        lazosTableSqlHandleAreaClick,
        lazosTableSqlHandleCompletionFilter,
        lazosTableSqlClearAllFilters,
        lazosTableSqlFilterData,
        lazosTableSqlGetSqlWhereClause,
        lazosTableSqlTableData,
        setLazosTableSqlTableData,
        lazosTableSqlGroupBy,
        setLazosTableSqlGroupBy
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