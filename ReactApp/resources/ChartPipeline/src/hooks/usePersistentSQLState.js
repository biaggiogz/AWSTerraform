import { useState, useEffect, useCallback } from 'react';

export const usePersistentSQLState = (tabName = 'default') => {
  const STORAGE_KEY = `${tabName}_sqlState`;
  const VERSION_KEY = `${tabName}_dataVersion`;
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  
  const [sqlState, setSqlState] = useState({
    query: '',
    result: null,
    metricCards: [],
    timestamp: null,
    dataVersion: null
  });

  // Load state from localStorage on mount with cache validation
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const now = Date.now();
        
        // Check if cache is expired
        if (parsed.timestamp && (now - parsed.timestamp) > CACHE_DURATION) {
          console.log('Cache expired, clearing stale data');
          localStorage.removeItem(STORAGE_KEY);
          return;
        }
        
        setSqlState(parsed);
      }
    } catch (error) {
      console.warn('Failed to load SQL state:', error);
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  // Save state to localStorage
  const saveState = useCallback((newState) => {
    const stateToSave = {
      ...newState,
      timestamp: Date.now()
    };
    
    setSqlState(stateToSave);
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (error) {
      console.warn('Failed to save SQL state:', error);
    }
  }, []);

  // Update query and result (result can be metric cards array)
  const updateQuery = useCallback((query, result = null) => {
    saveState({
      ...sqlState,
      query,
      result
    });
  }, [sqlState, saveState]);

  // Add metric card from SQL result
  const addMetricCard = useCallback((title, value, query) => {
    const newCard = {
      id: Date.now(),
      title,
      value,
      query,
      timestamp: Date.now()
    };
    
    saveState({
      ...sqlState,
      metricCards: [...sqlState.metricCards, newCard]
    });
  }, [sqlState, saveState]);

  // Remove metric card
  const removeMetricCard = useCallback((cardId) => {
    saveState({
      ...sqlState,
      metricCards: sqlState.metricCards.filter(card => card.id !== cardId)
    });
  }, [sqlState, saveState]);

  // Clear all state
  const clearState = useCallback(() => {
    const emptyState = {
      query: '',
      result: null,
      metricCards: [],
      timestamp: null,
      dataVersion: null
    };
    
    setSqlState(emptyState);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(VERSION_KEY);
  }, []);

  // Invalidate cache when data changes
  const invalidateCache = useCallback(() => {
    const newVersion = Date.now().toString();
    localStorage.setItem(VERSION_KEY, newVersion);
    clearState();
  }, [clearState]);

  // Check if cache should be invalidated
  const shouldInvalidateCache = useCallback((currentDataHash) => {
    const savedVersion = localStorage.getItem(VERSION_KEY);
    return !savedVersion || savedVersion !== currentDataHash;
  }, []);

  // Get age of saved state in minutes
  const getStateAge = useCallback(() => {
    if (!sqlState.timestamp) return null;
    return Math.floor((Date.now() - sqlState.timestamp) / (1000 * 60));
  }, [sqlState.timestamp]);

  return {
    sqlState,
    updateQuery,
    addMetricCard,
    removeMetricCard,
    clearState,
    getStateAge,
    invalidateCache,
    shouldInvalidateCache
  };
};