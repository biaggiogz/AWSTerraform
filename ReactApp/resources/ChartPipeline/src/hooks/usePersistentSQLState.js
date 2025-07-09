import { useState, useEffect, useCallback } from 'react';

export const usePersistentSQLState = (tabName = 'default') => {
  const STORAGE_KEY = `${tabName}_sqlState`;
  const [sqlState, setSqlState] = useState({
    query: '',
    result: null,
    metricCards: [],
    timestamp: null
  });

  // Load state from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setSqlState(parsed);
      }
    } catch (error) {
      console.warn('Failed to load SQL state:', error);
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
      timestamp: null
    };
    
    setSqlState(emptyState);
    localStorage.removeItem(STORAGE_KEY);
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
    getStateAge
  };
};