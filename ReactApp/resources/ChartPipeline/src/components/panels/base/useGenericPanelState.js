import { useState, useCallback, useMemo } from 'react';

/**
 * Generic hook for panel state management
 * @param {Object} config - Configuration object
 * @param {Object} config.initialState - Initial state values
 * @param {Function} config.onStateChange - Callback when state changes
 * @param {Array} config.stateKeys - Keys to track in state
 */
export const useGenericPanelState = ({
  initialState = {},
  onStateChange = null,
  stateKeys = []
}) => {
  const [state, setState] = useState(initialState);

  const updateState = useCallback((key, value) => {
    setState(prev => {
      const newState = { ...prev, [key]: value };
      if (onStateChange) {
        onStateChange(key, value, newState);
      }
      return newState;
    });
  }, [onStateChange]);

  const updateMultipleState = useCallback((updates) => {
    setState(prev => {
      const newState = { ...prev, ...updates };
      if (onStateChange) {
        onStateChange(null, updates, newState);
      }
      return newState;
    });
  }, [onStateChange]);

  const resetState = useCallback(() => {
    setState(initialState);
    if (onStateChange) {
      onStateChange('reset', initialState, initialState);
    }
  }, [initialState, onStateChange]);

  const getStateValue = useCallback((key, defaultValue = null) => {
    return state[key] !== undefined ? state[key] : defaultValue;
  }, [state]);

  const stateHelpers = useMemo(() => {
    const helpers = {};
    stateKeys.forEach(key => {
      helpers[`${key}State`] = state[key];
      helpers[`set${key.charAt(0).toUpperCase() + key.slice(1)}`] = (value) => updateState(key, value);
    });
    return helpers;
  }, [state, stateKeys, updateState]);

  return {
    state,
    updateState,
    updateMultipleState,
    resetState,
    getStateValue,
    ...stateHelpers
  };
};