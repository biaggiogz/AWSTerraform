import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';

// Create context
const InstrumentsTableFilterContext = createContext();

// Split test pack string into array
function splitTestPack(testPackStr) {
    if (!testPackStr || testPackStr === '' || testPackStr === 'NOT_APPLY') return [];
    return testPackStr.toString().split("|").map(v => v.trim()).filter(v => v !== '');
}

// Provider component
export const InstrumentsTableFilterProvider = ({ children }) => {
    // Filter state
    const [selectedIsometric, setSelectedIsometric] = useState(null);
    const [selectedTestPack, setSelectedTestPack] = useState(null);
    const [selectedSubsystem, setSelectedSubsystem] = useState(null);

    // Table data for chart visualization
    const [tableData, setTableData] = useState([]);
    const [groupBy, setGroupBy] = useState(['SUBSYSTEM', 'HITO']);

    // Handle isometric selection
    const onIsometricSelect = useCallback((isoId) => {
        setSelectedIsometric(prev => prev === isoId ? null : isoId);
    }, []);

    // Handle test pack selection
    const handleTestPackClick = useCallback((testPack) => {
        setSelectedTestPack(prev => prev === testPack ? null : testPack);
    }, []);

    // Handle subsystem selection
    const handleSubsystemClick = useCallback((subsystem) => {
        setSelectedSubsystem(prev => prev === subsystem ? null : subsystem);
    }, []);

    // Clear all filters
    const clearAllFilters = useCallback(() => {
        setSelectedIsometric(null);
        setSelectedTestPack(null);
        setSelectedSubsystem(null);
    }, []);

    // Filter functions for each table type
    const filterDetailsTable = useCallback((data) => {
        if (!data || !data.length) return [];
        if (!selectedIsometric && !selectedTestPack && !selectedSubsystem) return data;

        return data.filter(row => {
            // Filter by isometric
            if (selectedIsometric && row['MOUNTING ON ISO/EQUI/PACK'] !== selectedIsometric) {
                return false;
            }

            // Filter by test pack
            if (selectedTestPack) {
                const testPacks = splitTestPack(row['TPs']);
                if (!testPacks.includes(selectedTestPack)) {
                    return false;
                }
            }

            // Filter by subsystem
            if (selectedSubsystem && row['SUBSYSTEM'] !== selectedSubsystem) {
                return false;
            }

            return true;
        });
    }, [selectedIsometric, selectedTestPack, selectedSubsystem]);

    const filterControlTable = useCallback((data) => {
        if (!data || !data.length) return [];
        if (!selectedIsometric && !selectedTestPack && !selectedSubsystem) return data;

        return data.filter(row => {
            // Filter by isometric
            if (selectedIsometric && row['ISOMETRIC'] !== selectedIsometric) {
                return false;
            }

            // Filter by test pack
            if (selectedTestPack) {
                const testPacks = splitTestPack(row['TPs']);
                if (!testPacks.includes(selectedTestPack)) {
                    return false;
                }
            }

            // Filter by subsystem
            if (selectedSubsystem && row['SUBSYSTEM'] !== selectedSubsystem) {
                return false;
            }

            return true;
        });
    }, [selectedIsometric, selectedTestPack, selectedSubsystem]);

    const filterDynamicTable = useCallback((data) => {
        if (!data || !data.length) return [];
        if (!selectedTestPack && !selectedSubsystem) return data;

        return data.filter(row => {
            // Filter by test pack
            if (selectedTestPack && row['TP'] !== selectedTestPack) {
                return false;
            }

            // Filter by subsystem
            if (selectedSubsystem && row['SUBSYSTEM'] !== selectedSubsystem) {
                return false;
            }

            return true;
        });
    }, [selectedTestPack, selectedSubsystem]);

    // Create SQL WHERE clauses for direct filtering in queries
    const getSqlWhereClause = useCallback((tableType) => {
        const conditions = [];

        if (selectedIsometric) {
            if (tableType === 'details') {
                conditions.push(`mounting_on_isoequipack_isoinst = '${selectedIsometric}'`);
            } else if (tableType === 'control') {
                conditions.push(`mounting_on_isoequipack_isoinst = '${selectedIsometric}'`);
            }
        }

        if (selectedSubsystem) {
            conditions.push(`subsystem = '${selectedSubsystem}'`);
        }

        if (selectedTestPack) {
            conditions.push(`tp_include_isoinst LIKE '%${selectedTestPack}%'`);
        }

        return conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    }, [selectedIsometric, selectedTestPack, selectedSubsystem]);

    // Context value
    const value = useMemo(() => ({
        // Filter state
        selectedIsometric,
        selectedTestPack,
        selectedSubsystem,

        // Filter handlers
        onIsometricSelect,
        handleTestPackClick,
        handleSubsystemClick,
        clearAllFilters,

        // Filter functions
        filterDetailsTable,
        filterControlTable,
        filterDynamicTable,

        // SQL helpers
        getSqlWhereClause,

        // Table data for chart visualization
        tableData,
        setTableData,
        groupBy,
        setGroupBy
    }), [
        selectedIsometric,
        selectedTestPack,
        selectedSubsystem,
        onIsometricSelect,
        handleTestPackClick,
        handleSubsystemClick,
        clearAllFilters,
        filterDetailsTable,
        filterControlTable,
        filterDynamicTable,
        getSqlWhereClause,
        tableData,
        setTableData,
        groupBy,
        setGroupBy
    ]);

    return (
        <InstrumentsTableFilterContext.Provider value={value}>
            {children}
        </InstrumentsTableFilterContext.Provider>
    );
};

// Hook to use the filter context
export const useInstrumentsTableFilterContext = () => {
    const context = useContext(InstrumentsTableFilterContext);
    if (!context) {
        throw new Error('useInstrumentsTableFilterContext must be used within InstrumentsTableFilterProvider');
    }
    return context;
};

// Custom hook for filter state
export const useInstrumentsTableFilter = () => {
    const [selectedIsometric, setSelectedIsometric] = useState(null);
    const [selectedTestPack, setSelectedTestPack] = useState(null);
    const [selectedSubsystem, setSelectedSubsystem] = useState(null);

    // Handle isometric selection
    const onIsometricSelect = useCallback((isoId) => {
        setSelectedIsometric(prev => prev === isoId ? null : isoId);
    }, []);

    // Handle test pack selection
    const handleTestPackClick = useCallback((testPack) => {
        setSelectedTestPack(prev => prev === testPack ? null : testPack);
    }, []);

    // Handle subsystem selection
    const handleSubsystemClick = useCallback((subsystem) => {
        setSelectedSubsystem(prev => prev === subsystem ? null : subsystem);
    }, []);

    // Clear all filters
    const clearAllFilters = useCallback(() => {
        setSelectedIsometric(null);
        setSelectedTestPack(null);
        setSelectedSubsystem(null);
    }, []);

    // Filter functions
    const filterDetailsTable = useCallback((data) => {
        if (!data) return [];

        let filteredData = [...data];

        // Filter by isometric
        if (selectedIsometric) {
            filteredData = filteredData.filter(row =>
                row['MOUNTING ON ISO/EQUI/PACK'] === selectedIsometric
            );
        }

        // Filter by test pack
        if (selectedTestPack) {
            filteredData = filteredData.filter(row => {
                const testPacks = splitTestPack(row['TPs']);
                return testPacks.includes(selectedTestPack);
            });
        }

        // Filter by subsystem
        if (selectedSubsystem) {
            filteredData = filteredData.filter(row =>
                row['SUBSYSTEM'] === selectedSubsystem
            );
        }

        return filteredData;
    }, [selectedIsometric, selectedTestPack, selectedSubsystem]);

    const filterControlData = useCallback((data) => {
        if (!data) return [];

        let filteredData = [...data];

        // Filter by isometric
        if (selectedIsometric) {
            filteredData = filteredData.filter(row =>
                row['ISOMETRIC'] === selectedIsometric
            );
        }

        // Filter by test pack
        if (selectedTestPack) {
            filteredData = filteredData.filter(row => {
                const testPacks = splitTestPack(row['TPs']);
                return testPacks.includes(selectedTestPack);
            });
        }

        // Filter by subsystem
        if (selectedSubsystem) {
            filteredData = filteredData.filter(row =>
                row['SUBSYSTEM'] === selectedSubsystem
            );
        }

        return filteredData;
    }, [selectedIsometric, selectedTestPack, selectedSubsystem]);

    return {
        selectedIsometric,
        selectedTestPack,
        selectedSubsystem,
        onIsometricSelect,
        handleTestPackClick,
        handleSubsystemClick,
        clearAllFilters,
        filterDetailData: filterDetailsTable,
        filterControlData
    };
};

export default {
    InstrumentsTableFilterProvider,
    useInstrumentsTableFilterContext,
    useInstrumentsTableFilter
};