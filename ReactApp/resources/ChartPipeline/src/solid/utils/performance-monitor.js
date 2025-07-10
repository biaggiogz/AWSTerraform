/**
 * Performance monitoring utilities for SolidJS migration
 * Tracks performance improvements and memory usage
 */

export class PerformanceMonitor {
  static measurements = new Map();
  static isEnabled = process.env.REACT_APP_ENABLE_PERFORMANCE_MONITORING === 'true';
  
  static startMeasurement(name) {
    if (!this.isEnabled) return;
    
    this.measurements.set(name, {
      start: performance.now(),
      memory: this.getMemoryUsage()
    });
  }
  
  static endMeasurement(name) {
    if (!this.isEnabled) return;
    
    const measurement = this.measurements.get(name);
    if (!measurement) return;
    
    const duration = performance.now() - measurement.start;
    const currentMemory = this.getMemoryUsage();
    
    const result = {
      name,
      duration: Math.round(duration * 100) / 100,
      memoryBefore: measurement.memory,
      memoryAfter: currentMemory,
      memoryDelta: currentMemory ? currentMemory.used - measurement.memory?.used : null
    };
    
    this.logMeasurement(result);
    this.measurements.delete(name);
    
    return result;
  }
  
  static getMemoryUsage() {
    if (performance.memory) {
      return {
        used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
        total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
        limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
      };
    }
    return null;
  }
  
  static logMeasurement(result) {
    const { name, duration, memoryBefore, memoryAfter, memoryDelta } = result;
    
    console.group(`🚀 Performance: ${name}`);
    console.log(`⏱️  Duration: ${duration}ms`);
    
    if (memoryBefore && memoryAfter) {
      console.log(`💾 Memory: ${memoryBefore.used}MB → ${memoryAfter.used}MB (${memoryDelta > 0 ? '+' : ''}${memoryDelta}MB)`);
    }
    
    // Performance thresholds
    const threshold = parseInt(process.env.REACT_APP_PERFORMANCE_THRESHOLD_MS) || 16;
    if (duration > threshold) {
      console.warn(`⚠️  Performance warning: ${duration}ms > ${threshold}ms threshold`);
    } else {
      console.log(`✅ Performance good: ${duration}ms < ${threshold}ms threshold`);
    }
    
    console.groupEnd();
  }
  
  static compareFrameworks(reactTime, solidTime, operation) {
    if (!this.isEnabled) return;
    
    const improvement = reactTime / solidTime;
    const savings = reactTime - solidTime;
    
    console.group(`📊 Framework Comparison: ${operation}`);
    console.log(`React:   ${reactTime}ms`);
    console.log(`SolidJS: ${solidTime}ms`);
    console.log(`Improvement: ${improvement.toFixed(1)}x faster`);
    console.log(`Time saved: ${savings.toFixed(1)}ms`);
    
    if (improvement >= 2) {
      console.log(`🎉 Excellent improvement: ${improvement.toFixed(1)}x faster!`);
    } else if (improvement >= 1.5) {
      console.log(`✅ Good improvement: ${improvement.toFixed(1)}x faster`);
    } else {
      console.log(`📈 Modest improvement: ${improvement.toFixed(1)}x faster`);
    }
    
    console.groupEnd();
  }
  
  static trackComponentRender(componentName, framework = 'Unknown') {
    const measurementName = `${componentName}-${framework}`;
    
    return {
      start: () => this.startMeasurement(measurementName),
      end: () => this.endMeasurement(measurementName)
    };
  }
  
  static showSummary() {
    if (!this.isEnabled) return;
    
    const memory = this.getMemoryUsage();
    
    console.group('📊 Performance Summary');
    console.log(`Framework: SolidJS Migration Active`);
    console.log(`Memory Usage: ${memory?.used}MB / ${memory?.total}MB`);
    console.log(`Memory Limit: ${memory?.limit}MB`);
    console.log(`Active Measurements: ${this.measurements.size}`);
    console.groupEnd();
  }
  
  // Automatic performance monitoring for SolidJS components
  static wrapComponent(Component, name) {
    return (props) => {
      const tracker = this.trackComponentRender(name, 'SolidJS');
      
      // Start measurement
      tracker.start();
      
      // Render component
      const result = Component(props);
      
      // End measurement after next tick
      setTimeout(() => tracker.end(), 0);
      
      return result;
    };
  }
}

// Auto-enable in development
if (process.env.NODE_ENV === 'development') {
  PerformanceMonitor.isEnabled = true;
  
  // Show summary every 30 seconds
  setInterval(() => {
    PerformanceMonitor.showSummary();
  }, 30000);
}

export default PerformanceMonitor;