/**
 * WASM Performance Monitor Component
 * Displays performance metrics and WASM module status
 */

import React, { useState, useEffect } from 'react';
import { wasmLoader } from '../../wasm/wasm-loader.js';

const WasmPerformanceMonitor = ({ isVisible = false }) => {
  const [metrics, setMetrics] = useState({});
  const [performanceData, setPerformanceData] = useState([]);

  useEffect(() => {
    if (!isVisible) return;

    const updateMetrics = () => {
      const wasmMetrics = wasmLoader.getMetrics();
      setMetrics(wasmMetrics);
    };

    // Update metrics every 2 seconds when visible
    const interval = setInterval(updateMetrics, 2000);
    updateMetrics(); // Initial update

    return () => clearInterval(interval);
  }, [isVisible]);

  const getModuleStatus = (moduleName) => {
    const module = metrics[moduleName];
    if (!module) return { status: 'Not Loaded', color: '#gray' };
    
    return {
      status: module.type === 'wasm' ? 'WASM Active' : 'JS Fallback',
      color: module.type === 'wasm' ? '#4CAF50' : '#FF9800'
    };
  };

  const modules = [
    { name: 'data-processor', label: 'Data Processor' },
    { name: 'multi-filter', label: 'Multi-Value Filter' },
    { name: 'relationship-engine', label: 'Relationship Engine' },
    { name: 'sql-engine', label: 'SQL Engine' }
  ];

  if (!isVisible) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      zIndex: 10000,
      minWidth: '200px'
    }}>
      <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
        🚀 WASM Performance Monitor
      </div>
      
      {modules.map(module => {
        const status = getModuleStatus(module.name);
        return (
          <div key={module.name} style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            marginBottom: '4px',
            padding: '2px 0'
          }}>
            <span>{module.label}:</span>
            <span style={{ color: status.color, fontWeight: 'bold' }}>
              {status.status}
            </span>
          </div>
        );
      })}
      
      <div style={{ 
        marginTop: '8px', 
        paddingTop: '8px', 
        borderTop: '1px solid #444',
        fontSize: '10px',
        color: '#ccc'
      }}>
        Press Ctrl+Shift+W to toggle
      </div>
    </div>
  );
};

// Global performance monitor controller
class PerformanceMonitorController {
  constructor() {
    this.isVisible = false;
    this.listeners = new Set();
    this.setupKeyboardShortcut();
  }

  setupKeyboardShortcut() {
    document.addEventListener('keydown', (event) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'W') {
        event.preventDefault();
        this.toggle();
      }
    });
  }

  toggle() {
    this.isVisible = !this.isVisible;
    this.notifyListeners();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notifyListeners() {
    this.listeners.forEach(listener => listener(this.isVisible));
  }
}

export const performanceMonitorController = new PerformanceMonitorController();

// Hook for using the performance monitor
export const usePerformanceMonitor = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    return performanceMonitorController.subscribe(setIsVisible);
  }, []);

  return isVisible;
};

export default WasmPerformanceMonitor;