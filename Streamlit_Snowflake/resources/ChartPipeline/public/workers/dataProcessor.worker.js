// Web worker for CPU-intensive data processing
self.onmessage = function(e) {
  const { type, data, options } = e.data;
  
  try {
    switch (type) {
      case 'PROCESS_METRICS':
        const metrics = processMetrics(data);
        self.postMessage({ type: 'METRICS_PROCESSED', result: metrics });
        break;
        
      case 'FILTER_DATA':
        const filtered = filterLargeDataset(data, options.filters);
        self.postMessage({ type: 'DATA_FILTERED', result: filtered });
        break;
        
      case 'CALCULATE_GLOBAL_METRICS':
        const globalMetrics = calculateGlobalMetrics(data);
        self.postMessage({ type: 'GLOBAL_METRICS_CALCULATED', result: globalMetrics });
        break;
        
      default:
        self.postMessage({ type: 'ERROR', error: 'Unknown task type' });
    }
  } catch (error) {
    self.postMessage({ type: 'ERROR', error: error.message });
  }
};

// Process metrics for chart data
function processMetrics(data) {
  const groupedData = {};
  
  data.forEach(item => {
    const subsPre = item['SUBS_PRE'];
    if (!subsPre) return;
    
    if (!groupedData[subsPre]) {
      groupedData[subsPre] = {
        totalLoops: 0,
        loopSignalDone: 0,
        dossierCompleted: 0,
        loopsSignalPending: 0
      };
    }
    
    groupedData[subsPre].totalLoops++;
    
    const okValue = item['OK=100%']?.toString().replace('%', '').trim();
    const okPercent = parseFloat(okValue) || 0;
    
    if (okPercent === 100) {
      groupedData[subsPre].loopSignalDone++;
    }
    
    if (item['DOSSIER']) {
      groupedData[subsPre].dossierCompleted++;
    }
    
    if (okPercent < 100) {
      groupedData[subsPre].loopsSignalPending++;
    }
  });
  
  return Object.entries(groupedData).map(([subsPre, values]) => ({
    subsPre,
    ...values
  }));
}

// Filter large datasets
function filterLargeDataset(data, filters) {
  if (!filters || Object.values(filters).every(v => !v)) {
    return data;
  }
  
  const activeFilters = Object.entries(filters).filter(([_, value]) => value);
  
  return data.filter(item => {
    for (const [key, value] of activeFilters) {
      if (item[key] !== value) {
        return false;
      }
    }
    return true;
  });
}

// Calculate global metrics
function calculateGlobalMetrics(data) {
  let totalLoopSignal = 0;
  let loopSignalDone = 0;
  let loopSignalPending = 0;
  let dossierCompleted = 0;
  
  data.forEach(item => {
    totalLoopSignal++;
    
    const okValue = item['OK=100%']?.toString().replace('%', '').trim();
    const okPercent = parseFloat(okValue) || 0;
    
    if (okPercent === 100) {
      loopSignalDone++;
    }
    
    if (okPercent < 100) {
      loopSignalPending++;
    }
    
    if (item['DOSSIER'] && item['DOSSIER'].toString().trim() !== '') {
      dossierCompleted++;
    }
  });
  
  return {
    totalLoopSignal,
    loopSignalDone,
    loopSignalPending,
    dossierCompleted
  };
}