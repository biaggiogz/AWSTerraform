import { useEffect } from 'react';
import { clearStaleCache, CACHE_VERSION } from '../utils/cacheUtils';

export const useCacheManager = () => {
  useEffect(() => {
    // Clear stale cache on app initialization
    clearStaleCache();
    
    // Set current cache version
    localStorage.setItem('app_cache_version', CACHE_VERSION);
    
    // Listen for storage events from other tabs
    const handleStorageChange = (e) => {
      if (e.key === 'app_cache_version' && e.newValue !== CACHE_VERSION) {
        console.log('Cache version mismatch detected, reloading...');
        window.location.reload();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);
  
  const forceRefresh = () => {
    localStorage.clear();
    window.location.reload();
  };
  
  return { forceRefresh };
};