/**
 * Performance monitoring utility for WASM optimizations
 * Compatible with AWS CloudFront deployment
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.enabled = process.env.NODE_ENV === 'development';
  }

  startTimer(operation) {
    if (!this.enabled) return null;
    
    const startTime = performance.now();
    return {
      operation,
      startTime,
      end: () => {
        const endTime = performance.now();
        const duration = endTime - startTime;
        this.recordMetric(operation, duration);
        return duration;
      }
    };
  }

  recordMetric(operation, duration) {
    if (!this.enabled) return;
    
    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, {
        count: 0,
        totalTime: 0,
        minTime: Infinity,
        maxTime: 0,
        avgTime: 0
      });
    }

    const metric = this.metrics.get(operation);
    metric.count++;
    metric.totalTime += duration;
    metric.minTime = Math.min(metric.minTime, duration);
    metric.maxTime = Math.max(metric.maxTime, duration);
    metric.avgTime = metric.totalTime / metric.count;
  }

  getMetrics() {
    if (!this.enabled) return {};
    
    const result = {};
    for (const [operation, metric] of this.metrics) {
      result[operation] = {
        ...metric,
        avgTime: Math.round(metric.avgTime * 100) / 100,
        minTime: Math.round(metric.minTime * 100) / 100,
        maxTime: Math.round(metric.maxTime * 100) / 100
      };
    }
    return result;
  }

  logMetrics() {
    if (!this.enabled) return;
    
    console.group('🚀 WASM Performance Metrics');
    const metrics = this.getMetrics();
    
    for (const [operation, metric] of Object.entries(metrics)) {
      console.log(`${operation}:`, {
        calls: metric.count,
        avg: `${metric.avgTime}ms`,
        min: `${metric.minTime}ms`,
        max: `${metric.maxTime}ms`
      });
    }
    console.groupEnd();
  }

  reset() {
    this.metrics.clear();
  }
}

// Singleton instance
const performanceMonitor = new PerformanceMonitor();

// Export convenience functions
export const startTimer = (operation) => performanceMonitor.startTimer(operation);
export const recordMetric = (operation, duration) => performanceMonitor.recordMetric(operation, duration);
export const getMetrics = () => performanceMonitor.getMetrics();
export const logMetrics = () => performanceMonitor.logMetrics();
export const resetMetrics = () => performanceMonitor.reset();

export default performanceMonitor;