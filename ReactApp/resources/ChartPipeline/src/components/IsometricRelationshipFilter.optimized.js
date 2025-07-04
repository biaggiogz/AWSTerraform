import React, { useMemo, useCallback, useState } from 'react';

/**
 * Split test pack string into array of test packs
 * @param {string} testPackStr - Test pack string (e.g., "1|2|3")
 * @returns {Array} Array of test pack values
 */
function splitTestPack(testPackStr) {
  if (!testPackStr) return [];
  return testPackStr.toString().split("|").map(v => v.trim()).filter(v => v);
}

/**
 * Filter control table by isometric ID
 * @param {Array} controlTable - Control instruments data
 * @param {string} isoId - Isometric ID
 * @returns {Array} Filtered control records
 */
function filterByIsometric(controlTable, isoId) {
  return controlTable.filter(row => row.ISOMETRIC === isoId);
}

/**
 * Filter detail table by mounting location
 * @param {Array} detailTable - Details instruments data
 * @param {string} isoId - Isometric ID
 * @returns {Array} Filtered detail records
 */
function filterByMountingLocation(detailTable, isoId) {
  return detailTable.filter(row => row['MOUNTING ON ISO/EQUI/PACK'] === isoId);
}

/**
 * Find matching chains between control and detail tables
 * @param {Array} controlTable - Control instruments data
 * @param {Array} detailTable - Details instruments data
 * @returns {Array} Array of matching chains
 */
function findMatchingChains(controlTable, detailTable) {
  const visitedIsometrics = new Set();
  const matchingChains = [];

  for (const record of controlTable) {
    const isoId = record.ISOMETRIC;
    if (!isoId || visitedIsometrics.has(isoId)) continue;

    const currentChain = [];
    const stack = [isoId];

    while (stack.length > 0) {
      const currentIso = stack.pop();
      if (visitedIsometrics.has(currentIso)) continue;
      visitedIsometrics.add(currentIso);

      const isoRecords = filterByIsometric(controlTable, currentIso);

      for (const isoRec of isoRecords) {
        const testPacks = splitTestPack(isoRec['TEST PACK']);
        const subsystemControl = isoRec.SUBSYSTEM || isoRec.SUSSYTEM;
        const mountedDetails = filterByMountingLocation(detailTable, currentIso);
        
        for (const detailRec of mountedDetails) {
          const subsystemDetail = detailRec.SUBSYSTEM;
          const detailTestPacks = splitTestPack(detailRec['TEST PACK']);

          // RED CONDITION: subsystem must match
          if (subsystemControl === subsystemDetail) {
            const hasMatchingTestPack = testPacks.some(tp => 
              detailTestPacks.includes(tp)
            );
            
            if (hasMatchingTestPack) {
              currentChain.push({ 
                control: isoRec, 
                detail: detailRec,
                matchingTestPacks: testPacks.filter(tp => detailTestPacks.includes(tp))
              });
            }
          }
        }
      }
    }

    if (currentChain.length > 0) {
      matchingChains.push(currentChain);
    }
  }

  return matchingChains;
}

/**
 * Custom hook for isometric relationship filtering
 * @param {Array} controlData - Control instruments data
 * @param {Array} detailData - Details instruments data
 * @returns {Object} Filter state and handlers
 */
export const useIsometricRelationshipFilter = (controlData, detailData) => {
  const [selectedIsometric, setSelectedIsometric] = useState(null);
  const [selectedChainIndex, setSelectedChainIndex] = useState(null);

  // Memoize matching chains calculation
  const matchingChains = useMemo(() => {
    if (!controlData || !detailData) return [];
    return findMatchingChains(controlData, detailData);
  }, [controlData, detailData]);

  // Memoize filtered control data
  const filteredControlData = useMemo(() => {
    if (!controlData) return [];
    if (!selectedIsometric) return controlData;
    
    return controlData.filter(row => row.ISOMETRIC === selectedIsometric);
  }, [controlData, selectedIsometric]);

  // Memoize filtered detail data
  const filteredDetailData = useMemo(() => {
    if (!detailData) return [];
    if (!selectedIsometric) return detailData;
    
    return detailData.filter(row => 
      row['MOUNTING ON ISO/EQUI/PACK'] === selectedIsometric
    );
  }, [detailData, selectedIsometric]);

  // Memoize highlighted control records
  const highlightedControlRecords = useMemo(() => {
    if (!selectedIsometric || !matchingChains.length) return new Set();
    
    const highlighted = new Set();
    matchingChains.forEach(chain => {
      chain.forEach(match => {
        if (match.control.ISOMETRIC === selectedIsometric) {
          highlighted.add(match.control);
        }
      });
    });
    
    return highlighted;
  }, [selectedIsometric, matchingChains]);

  // Memoize highlighted detail records
  const highlightedDetailRecords = useMemo(() => {
    if (!selectedIsometric || !matchingChains.length) return new Set();
    
    const highlighted = new Set();
    matchingChains.forEach(chain => {
      chain.forEach(match => {
        if (match.detail['MOUNTING ON ISO/EQUI/PACK'] === selectedIsometric) {
          highlighted.add(match.detail);
        }
      });
    });
    
    return highlighted;
  }, [selectedIsometric, matchingChains]);

  // Handle isometric selection
  const onIsometricSelect = useCallback((isoId) => {
    setSelectedIsometric(prev => prev === isoId ? null : isoId);
    setSelectedChainIndex(null);
  }, []);

  // Handle clear filter
  const onClearFilter = useCallback(() => {
    setSelectedIsometric(null);
    setSelectedChainIndex(null);
  }, []);

  // Handle chain selection
  const onChainSelect = useCallback((chainIndex) => {
    setSelectedChainIndex(prev => prev === chainIndex ? null : chainIndex);
    
    if (chainIndex !== null && matchingChains[chainIndex]) {
      const firstMatch = matchingChains[chainIndex][0];
      if (firstMatch) {
        setSelectedIsometric(firstMatch.control.ISOMETRIC);
      }
    }
  }, [matchingChains]);

  // Get relationship statistics
  const relationshipStats = useMemo(() => {
    const totalChains = matchingChains.length;
    const totalMatches = matchingChains.reduce((sum, chain) => sum + chain.length, 0);
    const uniqueIsometrics = new Set();
    
    matchingChains.forEach(chain => {
      chain.forEach(match => {
        uniqueIsometrics.add(match.control.ISOMETRIC);
      });
    });

    return {
      totalChains,
      totalMatches,
      uniqueIsometrics: uniqueIsometrics.size
    };
  }, [matchingChains]);

  return {
    selectedIsometric,
    selectedChainIndex,
    matchingChains,
    filteredControlData,
    filteredDetailData,
    highlightedControlRecords,
    highlightedDetailRecords,
    relationshipStats,
    onIsometricSelect,
    onClearFilter,
    onChainSelect
  };
};

/**
 * IsometricRelationshipFilter Context Provider
 */
export const IsometricRelationshipContext = React.createContext();

export const IsometricRelationshipProvider = ({ children, controlData, detailData }) => {
  const filterState = useIsometricRelationshipFilter(controlData, detailData);
  
  return (
    <IsometricRelationshipContext.Provider value={filterState}>
      {children}
    </IsometricRelationshipContext.Provider>
  );
};

/**
 * Hook to use isometric relationship context
 */
export const useIsometricRelationshipContext = () => {
  const context = React.useContext(IsometricRelationshipContext);
  if (!context) {
    throw new Error('useIsometricRelationshipContext must be used within IsometricRelationshipProvider');
  }
  return context;
};

export default {
  useIsometricRelationshipFilter,
  IsometricRelationshipProvider,
  useIsometricRelationshipContext,
  splitTestPack,
  filterByIsometric,
  filterByMountingLocation,
  findMatchingChains
};