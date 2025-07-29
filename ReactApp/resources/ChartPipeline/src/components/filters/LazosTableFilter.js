import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';

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

    // Filter function for Loop Test Control table
    const lazosTableSqlFilterData = useCallback((data) => {
        if (!data || !data.length) return [];
        if (!lazosTableSqlSelectedSubsystem && !lazosTableSqlSelectedArea) return data;

        return data.filter(row => {
            // Filter by subsystem
            if (lazosTableSqlSelectedSubsystem && row['SUBSYSTEM'] !== lazosTableSqlSelectedSubsystem) {
                return false;
            }
            // Filter by area
            if (lazosTableSqlSelectedArea && row['AREA'] !== lazosTableSqlSelectedArea) {
                return false;
            }
            return true;
        });
    }, [lazosTableSqlSelectedSubsystem, lazosTableSqlSelectedArea]);

    // Create SQL WHERE clauses for direct filtering in queries
    const lazosTableSqlGetSqlWhereClause = useCallback(() => {
        const conditions = [];
        
        console.log('External filters received:', externalFilters);
        console.log('Progress filter received:', progressFilter);
        console.log('Subsystem completion filter received:', lazosTableSqlSubsystemCompletionFilter);

        // Internal filters (from table clicks)
        if (lazosTableSqlSelectedSubsystem) {
            conditions.push(`subsystem = '${lazosTableSqlSelectedSubsystem}'`);
        }

        if (lazosTableSqlSelectedArea) {
            conditions.push(`area_tlp = '${lazosTableSqlSelectedArea}'`);
        }

        // Progress filter (from GlobalMetricsDisplay buttons)
        if (progressFilter) {
            switch (progressFilter) {
                case 'LOOP (Signal) DONE':
                    conditions.push('ok100_tlp = 1.0');
                    break;
                case 'LOOP (Signal) PENDING':
                    conditions.push('ok100_tlp < 1.0');
                    break;
                case 'DOSSIER COMPLETED':
                    conditions.push("dossier_tlp IS NOT NULL AND dossier_tlp != ''");
                    break;
                // TOTAL LOOP (Signal) shows all records, no filter needed
            }
        }

        // Subsystem completion filter (from SubsystemCompletionChart buttons)
        if (lazosTableSqlSubsystemCompletionFilter) {
            switch (lazosTableSqlSubsystemCompletionFilter) {
                case 'DONE':
                    conditions.push(`subsystem IN (
                        SELECT subsystem
                        FROM master_subsystem
                        WHERE tag_loop_tlp IS NOT NULL
                        GROUP BY subsystem
                        HAVING MIN(ok100_tlp) = 1.0
                    )`);
                    break;
                case 'PENDING':
                    conditions.push(`subsystem IN (
                        SELECT subsystem
                        FROM master_subsystem
                        WHERE tag_loop_tlp IS NOT NULL
                        GROUP BY subsystem
                        HAVING MIN(ok100_tlp) < 1.0
                    )`);
                    break;
                case 'TOTAL':
                    // Show all records, no additional filter needed
                    break;
            }
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
        console.log('All conditions:', conditions);
        return finalClause;
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