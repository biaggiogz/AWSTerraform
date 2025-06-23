import React from 'react';
import { createRoot } from 'react-dom/client';
import { Chart, registerables } from 'chart.js';
import { lazy, Suspense } from 'react';

// Register Chart.js components
Chart.register(...registerables);

// Lazy load the App component
const App = lazy(() => import('./App.optimized'));

// Loading component
const LoadingFallback = () => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    height: '100vh',
    flexDirection: 'column',
    backgroundColor: '#f5f5f5'
  }}>
    <div style={{ 
      width: '50px', 
      height: '50px', 
      border: '5px solid #e0e0e0',
      borderTopColor: '#3182ce',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
      marginBottom: '20px'
    }} />
    <p style={{ color: '#333', fontFamily: 'sans-serif' }}>Loading Dashboard...</p>
    <style>{`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);

// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => console.log('SW registered:', registration))
      .catch(error => console.log('SW registration failed:', error));
  });
}

// Create root and render app with Suspense
const container = document.getElementById('root');
const root = createRoot(container);

// Render with error boundary
root.render(
  <React.StrictMode>
    <Suspense fallback={<LoadingFallback />}>
      <App />
    </Suspense>
  </React.StrictMode>
);