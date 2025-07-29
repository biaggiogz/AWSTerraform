// Add this to your data loading functions in React
const CACHE_BUSTER = Date.now();

// When loading data files, append cache buster:
const dataUrl = `/data/yourfile.csv?v=${CACHE_BUSTER}`;

// Or use this utility function:
export const getCacheBustedUrl = (path) => {
  const timestamp = new Date().getTime();
  return `${path}?v=${timestamp}`;
};

// Usage:
// fetch(getCacheBustedUrl('/data/yourfile.csv'))