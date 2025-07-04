import React, { useMemo, useCallback, useState } from 'react';

/**
 * Split test pack string into array of test packs
 * @param {string} testPackStr - Test pack string (e.g., "1|2|3")
 * @returns {Array} Array of test pack values
 */
function splitTestPack(testPackStr) {
  if (!testPackStr || testPackStr === '' || testPackStr === '0') return [];
  return testPackStr.toString().split("|").map(v => v.trim()).filter(v => v !== '' && v !== '0');
}

/**
 * Custom hook for TEST PACK cross-dataset filtering
 * @param {Array} controlData - Control instruments data
 * @param {Array} detailData - Details instruments data
 * @returns {Object} Filter state and handlers
 */
export const useTestPackFilter = () => {
  const [selectedTestPack, setSelectedTestPack] = useState(null);

  // Handle test pack selection
  const handleTestPackClick = useCallback((testPackValue) => {
    setSelectedTestPack(prev => prev === testPackValue ? null : testPackValue);
  }, []);

  // Filter control data by selected test pack
  const filterControlData = useCallback((data) => {
    if (!selectedTestPack || !data) return data;
    
    return data.filter(row => {
      const testPacks = row.testPacks || splitTestPack(row.TESTPACK || row.testPack || '');
      return testPacks.includes(selectedTestPack);
    });
  }, [selectedTestPack]);

  // Filter detail data by selected test pack
  const filterDetailData = useCallback((data) => {
    if (!selectedTestPack || !data) return data;
    
    return data.filter(row => {
      const testPacks = splitTestPack(row.TESTPACK || row.testPack || '');
      return testPacks.includes(selectedTestPack);
    });
  }, [selectedTestPack]);

  // Clear filter
  const clearTestPackFilter = useCallback(() => {
    setSelectedTestPack(null);
  }, []);

  return {
    selectedTestPack,
    handleTestPackClick,
    filterControlData,
    filterDetailData,
    clearTestPackFilter
  };
};

/**
 * TestPackRelationshipFilter Context Provider
 */
export const TestPackRelationshipContext = React.createContext();

export const TestPackRelationshipProvider = ({ children }) => {
  const filterState = useTestPackFilter();
  
  return (
    <TestPackRelationshipContext.Provider value={filterState}>
      {children}
    </TestPackRelationshipContext.Provider>
  );
};

/**
 * Hook to use test pack relationship context
 */
export const useTestPackRelationshipContext = () => {
  const context = React.useContext(TestPackRelationshipContext);
  if (!context) {
    throw new Error('useTestPackRelationshipContext must be used within TestPackRelationshipProvider');
  }
  return context;
};

export default {
  useTestPackFilter,
  TestPackRelationshipProvider,
  useTestPackRelationshipContext,
  splitTestPack
};