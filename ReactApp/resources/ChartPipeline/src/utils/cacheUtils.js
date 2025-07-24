// Cache utilities for managing data freshness
export const CACHE_VERSION = process.env.REACT_APP_CACHE_VERSION || Date.now().toString();

export const generateCacheKey = (key, version = CACHE_VERSION) => {
  return `${key}_v${version}`;
};

export const clearStaleCache = () => {
  const keys = Object.keys(localStorage);
  const currentVersion = CACHE_VERSION;
  
  keys.forEach(key => {
    if (key.includes('_sqlState') || key.includes('_dataVersion')) {
      const parts = key.split('_v');
      if (parts.length > 1 && parts[1] !== currentVersion) {
        localStorage.removeItem(key);
        console.log(`Cleared stale cache: ${key}`);
      }
    }
  });
};

export const addCacheBuster = (url) => {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}v=${CACHE_VERSION}`;
};