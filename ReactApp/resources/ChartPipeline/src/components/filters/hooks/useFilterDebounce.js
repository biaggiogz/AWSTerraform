import { useRef, useCallback } from 'react';

export const useFilterDebounce = (callback, delay = 100) => {
  const timeoutRef = useRef(null);
  const lastCallRef = useRef(null);

  const debouncedCallback = useCallback((...args) => {
    const now = Date.now();
    
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Prevent multiple calls within the delay period
    if (lastCallRef.current && (now - lastCallRef.current) < delay) {
      timeoutRef.current = setTimeout(() => {
        lastCallRef.current = Date.now();
        callback(...args);
      }, delay);
      return;
    }

    // Execute immediately if enough time has passed
    lastCallRef.current = now;
    callback(...args);
  }, [callback, delay]);

  return debouncedCallback;
};