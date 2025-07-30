import { useInstrumentsTableFilterContext } from '../components/filters/InstrumentsTableFilter';
import useInstrumentsDataLoader from './useInstrumentsDataLoader';

const useInstrumentsTableData = (tableType) => {
  // Get filter context
  const {
    selectedIsometric,
    selectedTestPack,
    selectedSubsystem,
    handleTestPackClick,
    handleSubsystemClick,
    getSqlWhereClause,
    setTableData: setContextTableData,
    setGroupBy: setContextGroupBy,
    onIsometricSelect
  } = useInstrumentsTableFilterContext();

  // Data loading
  const whereClause = getSqlWhereClause(tableType);
  const cacheKey = `${tableType}_${selectedIsometric || 'all'}_${selectedSubsystem || 'all'}_${selectedTestPack || 'all'}`;
  const {
    data,
    loading,
    error,
    loadTime,
    queryTime
  } = useInstrumentsDataLoader(tableType, whereClause, cacheKey);

  return {
    // Data
    data,
    loading,
    error,
    loadTime,
    queryTime,
    
    // Filter state
    selectedIsometric,
    selectedTestPack,
    selectedSubsystem,
    
    // Filter handlers
    handleTestPackClick,
    handleSubsystemClick,
    onIsometricSelect,
    
    // Context setters (for DynamicInstrumentsTable)
    setContextTableData,
    setContextGroupBy
  };
};

export default useInstrumentsTableData;