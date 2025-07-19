import React, { useState, useEffect } from 'react';
import { Box, Text, Spinner } from '@chakra-ui/react';
import { SolidInReact } from '../../solid/bridge/ReactSolidBridge';

/**
 * Bridge component to integrate SolidJS DetailsInstrumentsTable with React
 * Provides seamless integration with fallback to React implementation
 */
const DetailsInstrumentsTableBridge = (props) => {
  const [isSolidJSLoaded, setIsSolidJSLoaded] = useState(false);
  const [SolidTable, setSolidTable] = useState(null);
  const [error, setError] = useState(null);
  
  // Check if SolidJS should be used
  const useSolidJS = localStorage.getItem('use-solidjs') === 'true' && 
                     localStorage.getItem('use-solidjs-tables') === 'true';
  
  // Load SolidJS component dynamically
  useEffect(() => {
    if (!useSolidJS) return;
    
    const loadSolidComponent = async () => {
      try {
        // Dynamic import of SolidJS component
        const module = await import('../../solid/components/DetailsInstrumentsTable.solid.jsx');
        setSolidTable(module.default);
        setIsSolidJSLoaded(true);
      } catch (err) {
        console.error('Failed to load SolidJS DetailsInstrumentsTable:', err);
        setError(err.message);
      }
    };
    
    loadSolidComponent();
  }, [useSolidJS]);
  
  // Load React fallback component
  const loadReactComponent = async () => {
    try {
      const module = await import('./DetailsInstrumentsTable.optimized.js');
      return module.default;
    } catch (err) {
      console.error('Failed to load React DetailsInstrumentsTable:', err);
      setError(err.message);
      return null;
    }
  };
  
  // If SolidJS is not enabled, use React implementation
  if (!useSolidJS) {
    const ReactTable = React.lazy(() => loadReactComponent());
    
    return (
      <React.Suspense fallback={
        <Box p={6} textAlign="center">
          <Spinner size="xl" color="blue.500" />
          <Text mt={4} color="gray.600">Loading table...</Text>
        </Box>
      }>
        <ReactTable {...props} />
      </React.Suspense>
    );
  }
  
  // If SolidJS is enabled but not loaded yet, show loading
  if (useSolidJS && !isSolidJSLoaded) {
    return (
      <Box p={6} textAlign="center">
        <Spinner size="xl" color="blue.500" />
        <Text mt={4} color="gray.600">Loading SolidJS table...</Text>
      </Box>
    );
  }
  
  // If there was an error loading SolidJS, show error and fallback to React
  if (error) {
    console.warn('SolidJS component failed to load, using React fallback:', error);
    const ReactTable = React.lazy(() => loadReactComponent());
    
    return (
      <React.Suspense fallback={
        <Box p={6} textAlign="center">
          <Spinner size="xl" color="blue.500" />
          <Text mt={4} color="gray.600">Loading table...</Text>
        </Box>
      }>
        <ReactTable {...props} />
      </React.Suspense>
    );
  }
  
  // Render SolidJS component
  return (
    <SolidInReact
      component={SolidTable}
      props={props}
      className="solidjs-details-instruments-table"
    />
  );
};

export default DetailsInstrumentsTableBridge;