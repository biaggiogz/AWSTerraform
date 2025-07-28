import { useCallback, useMemo } from 'react';

/**
 * Generic event bus for panel communication
 * @param {Object} eventHandlers - Map of event names to handler functions
 * @param {Object} config - Configuration options
 */
export const usePanelEventBus = (eventHandlers = {}, config = {}) => {
  const { 
    enableLogging = false,
    eventPrefix = '',
    defaultHandler = null 
  } = config;

  const emit = useCallback((eventName, payload = null, options = {}) => {
    const fullEventName = eventPrefix ? `${eventPrefix}:${eventName}` : eventName;
    
    if (enableLogging) {
      console.log(`Panel Event: ${fullEventName}`, payload);
    }

    const handler = eventHandlers[eventName] || eventHandlers[fullEventName] || defaultHandler;
    
    if (handler && typeof handler === 'function') {
      try {
        return handler(payload, options, eventName);
      } catch (error) {
        console.error(`Error in panel event handler for ${fullEventName}:`, error);
        return null;
      }
    } else if (enableLogging) {
      console.warn(`No handler found for panel event: ${fullEventName}`);
    }
    
    return null;
  }, [eventHandlers, eventPrefix, enableLogging, defaultHandler]);

  const createEventHandler = useCallback((eventName) => {
    return (payload, options) => emit(eventName, payload, options);
  }, [emit]);

  const eventHelpers = useMemo(() => {
    const helpers = {};
    Object.keys(eventHandlers).forEach(eventName => {
      const camelCaseName = eventName.replace(/[-_](.)/g, (_, char) => char.toUpperCase());
      helpers[`on${camelCaseName.charAt(0).toUpperCase() + camelCaseName.slice(1)}`] = createEventHandler(eventName);
    });
    return helpers;
  }, [eventHandlers, createEventHandler]);

  return {
    emit,
    createEventHandler,
    ...eventHelpers
  };
};