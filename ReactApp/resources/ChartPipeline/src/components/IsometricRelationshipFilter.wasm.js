/**
 * WASM-enhanced isometric relationship filter with fallback to original implementation
 * Maintains API compatibility while providing performance improvements
 */

import React, { useMemo, useCallback, useState } from 'react';
import { 
  findMatchingChains as wasmFindMatchingChains,
  splitTestPack as wasmSplitTestPack,
  filterByIsometric as wasmFilterByIsometric,
  filterByMountingLocation as wasmFilterByMountingLocation
} from '../wasm/relationship-engine.wasm.js';

/**
 * WASM-enhanced hook for isometric relationship filtering
 * @param {Array} controlData - Control instruments data
 * @param {Array} detailData - Details instruments data
 * @returns {Object} Filter state and handlers
 */
export const useIsometricRelationshipFilter = (controlData, detailData) => {
  const [selectedIsometric, setSelectedIsometric] = useState(null);
  const [selectedChainIndex, setSelectedChainIndex] = useState(null);

  // Memoize matching chains calculation with WASM optimization
  const matchingChains = useMemo(() => {
    if (!controlData || !detailData) return [];
    
    const calculateChains = async () => {
      try {
        return await wasmFindMatchingChains(controlData, detailData);
      } catch (error) {
        console.error('WASM matching chains calculation failed, using fallback:', error);
        // Fallback to original implementation
        const { findMatchingChains } = await import('./IsometricRelationshipFilter.optimized.js');
        return findMatchingChains(controlData, detailData);
      }
    };

    // Import the function directly from the optimized module
    const optimizedModule = require('./IsometricRelationshipFilter.optimized.js');
    const findMatchingChains = optimizedModule.default.findMatchingChains;
    return findMatchingChains(controlData, detailData);
  }, [controlData, detailData]);

  // Memoize filtered control data with WASM optimization
  const filteredControlData = useMemo(() => {
    if (!controlData) return [];
    if (!selectedIsometric) return controlData;
    
    const filterData = async () => {
      try {
        return await wasmFilterByIsometric(controlData, selectedIsometric);
      } catch (error) {
        console.error('WASM control data filtering failed, using fallback:', error);
        return controlData.filter(row => row.ISOMETRIC === selectedIsometric);
      }
    };

    // Synchronous fallback for useMemo
    return controlData.filter(row => row.ISOMETRIC === selectedIsometric);
  }, [controlData, selectedIsometric]);

  // Memoize filtered detail data with WASM optimization
  const filteredDetailData = useMemo(() => {
    if (!detailData) return [];
    if (!selectedIsometric) return detailData;
    
    const filterData = async () => {
      try {
        return await wasmFilterByMountingLocation(detailData, selectedIsometric);
      } catch (error) {
        console.error('WASM detail data filtering failed, using fallback:', error);
        return detailData.filter(row => row['MOUNTING ON ISO/EQUI/PACK'] === selectedIsometric);
      }
    };

    // Synchronous fallback for useMemo
    return detailData.filter(row => row['MOUNTING ON ISO/EQUI/PACK'] === selectedIsometric);
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
 * WASM-enhanced split test pack function
 * @param {string} testPackStr - Test pack string (e.g., "1|2|3")
 * @returns {Promise<Array>} Array of test pack values
 */
export const splitTestPack = async (testPackStr) => {
  try {
    return await wasmSplitTestPack(testPackStr);
  } catch (error) {
    console.error('WASM test pack splitting failed, using fallback:', error);
    // Fallback to original implementation
    if (!testPackStr || testPackStr === '' || testPackStr === '0') return [];
    return testPackStr.toString().split("|").map(v => v.trim()).filter(v => v !== '' && v !== '0');
  }
};

/**
 * WASM-enhanced filter by isometric function
 * @param {Array} controlTable - Control instruments data
 * @param {string} isoId - Isometric ID
 * @returns {Promise<Array>} Filtered control records
 */
export const filterByIsometric = async (controlTable, isoId) => {
  try {
    return await wasmFilterByIsometric(controlTable, isoId);
  } catch (error) {
    console.error('WASM isometric filtering failed, using fallback:', error);
    return controlTable.filter(row => row.ISOMETRIC === isoId);
  }
};

/**
 * WASM-enhanced filter by mounting location function
 * @param {Array} detailTable - Details instruments data
 * @param {string} isoId - Isometric ID
 * @returns {Promise<Array>} Filtered detail records
 */
export const filterByMountingLocation = async (detailTable, isoId) => {
  try {
    return await wasmFilterByMountingLocation(detailTable, isoId);
  } catch (error) {
    console.error('WASM mounting location filtering failed, using fallback:', error);
    return detailTable.filter(row => row['MOUNTING ON ISO/EQUI/PACK'] === isoId);
  }
};

/**
 * WASM-enhanced find matching chains function
 * @param {Array} controlTable - Control instruments data
 * @param {Array} detailTable - Details instruments data
 * @returns {Promise<Array>} Array of matching chains
 */
export const findMatchingChains = async (controlTable, detailTable) => {
  try {
    return await wasmFindMatchingChains(controlTable, detailTable);
  } catch (error) {
    console.error('WASM matching chains finding failed, using fallback:', error);
    // Fallback to original implementation
    const { findMatchingChains: originalFindMatchingChains } = await import('./IsometricRelationshipFilter.optimized.js');
    return originalFindMatchingChains(controlTable, detailTable);
  }
};

// Re-export context components from original implementation
export { 
  IsometricRelationshipContext, 
  IsometricRelationshipProvider, 
  useIsometricRelationshipContext 
} from './IsometricRelationshipFilter.optimized.js';

// Performance monitoring
export const getPerformanceMetrics = () => {
  const { relationshipEngineWasm } = require('../wasm/relationship-engine.wasm.js');
  return {
    usingWasm: relationshipEngineWasm.isUsingWasm(),
    module: 'relationship-engine'
  };
};

export default {
  useIsometricRelationshipFilter,
  splitTestPack,
  filterByIsometric,
  filterByMountingLocation,
  findMatchingChains,
  getPerformanceMetrics
};