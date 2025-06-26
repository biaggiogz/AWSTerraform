// Web Worker for heavy data processing operations
// This prevents UI blocking during large dataset calculations

self.onmessage = function(e) {
  const { type, data, taskId } = e.data;
  
  try {
    let result;
    
    switch (type) {
      case 'PROCESS_SUBSYSTEM_DATA':
        result = processSubsystemData(data);
        break;
      case 'CALCULATE_METRICS':
        result = calculateMetrics(data);
        break;
      case 'SORT_LARGE_DATASET':
        result = sortLargeDataset(data);
        break;
      default:
        throw new Error(`Unknown task type: ${type}`);
    }
    
    self.postMessage({
      taskId,
      success: true,
      result
    });
  } catch (error) {
    self.postMessage({
      taskId,
      success: false,
      error: error.message
    });
  }
};

// Optimized subsystem data processing
function processSubsystemData({ mainData, testPackData, aislData, loopData }) {
  // Process aislamientos data with optimized algorithm
  const aislStats = new Map();
  for (let i = 0; i < aislData.length; i++) {
    const item = aislData[i];
    const subsystem = item['SUBSYSTEM'];
    if (!subsystem) continue;
    
    const stats = aislStats.get(subsystem) || { totalItems: 0, doneItems: 0 };
    stats.totalItems += 1;
    if (item['DONE'] === 'YES') stats.doneItems += 1;
    aislStats.set(subsystem, stats);
  }
  
  // Process loop data with optimized algorithm
  const loopStats = new Map();
  for (let i = 0; i < loopData.length; i++) {
    const item = loopData[i];
    const subsystem = item['SUBS_PRE'];
    if (!subsystem) continue;
    
    const stats = loopStats.get(subsystem) || { totalLoops: 0, doneLoops: 0, pendingLoops: 0 };
    stats.totalLoops += 1;
    if (item['OK=100%'] === '100.00%') {
      stats.doneLoops += 1;
    } else {
      stats.pendingLoops += 1;
    }
    loopStats.set(subsystem, stats);
  }
  
  return {
    aislStats: Object.fromEntries(aislStats),
    loopStats: Object.fromEntries(loopStats)
  };
}

// Calculate summary metrics efficiently
function calculateMetrics(data) {
  const metrics = {
    totalRecords: data.length,
    uniqueTestPacks: new Set(),
    uniqueSubsystems: new Set(),
    uniqueDesignAreas: new Set(),
    testPackCounts: {},
    subsystemCounts: {}
  };
  
  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    
    if (item['TEST PACK']) {
      metrics.uniqueTestPacks.add(item['TEST PACK']);
      metrics.testPackCounts[item['TEST PACK']] = (metrics.testPackCounts[item['TEST PACK']] || 0) + 1;
    }
    
    if (item['SUBSYSTEM']) {
      metrics.uniqueSubsystems.add(item['SUBSYSTEM']);
      metrics.subsystemCounts[item['SUBSYSTEM']] = (metrics.subsystemCounts[item['SUBSYSTEM']] || 0) + 1;
    }
    
    if (item['Design Area']) {
      metrics.uniqueDesignAreas.add(item['Design Area']);
    }
  }
  
  return {
    ...metrics,
    uniqueTestPacks: metrics.uniqueTestPacks.size,
    uniqueSubsystems: metrics.uniqueSubsystems.size,
    uniqueDesignAreas: metrics.uniqueDesignAreas.size
  };
}

// Optimized sorting for large datasets
function sortLargeDataset({ data, sortKey, direction = 'desc' }) {
  return data.sort((a, b) => {
    const aVal = a[sortKey] || 0;
    const bVal = b[sortKey] || 0;
    return direction === 'desc' ? bVal - aVal : aVal - bVal;
  });
}