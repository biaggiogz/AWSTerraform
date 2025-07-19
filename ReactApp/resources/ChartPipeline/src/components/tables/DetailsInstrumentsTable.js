import React, { useState, useEffect } from 'react';
import { Box, Text, Spinner, Alert, AlertIcon, AlertTitle, AlertDescription, CloseButton } from '@chakra-ui/react';

/**
 * DetailsInstrumentsTable - Main entry point with feature flag system
 * Supports multiple implementations: React, WASM, DuckDB, and SolidJS
 * DuckDB is enabled by default for the INSTRUMENTS REPORT tab
 */
const DetailsInstrumentsTable = (props) => {
  const [implementation, setImplementation] = useState('wasm'); // Default to DuckDB
  const [Component, setComponent] = useState(null);
  const [error, setError] = useState(null);
  const [showAlert, setShowAlert] = useState(false);
  
  // Determine which implementation to use based on feature flags
  useEffect(() => {
    const determineImplementation = () => {
      // Check feature flags in localStorage
      const useSolidJS = localStorage.getItem('use-solidjs') === 'true' && 
                         localStorage.getItem('use-solidjs-tables') === 'true';
      const useWASM = localStorage.getItem('use-wasm') === 'true';
      const disableDuckDB = localStorage.getItem('disable-duckdb') === 'true';
      
      // Priority: SolidJS > WASM > DuckDB (default) > React
      if (useSolidJS) return 'solidjs';
      if (useWASM) return 'wasm';
      if (disableDuckDB) return 'react';
      return 'duckdb'; // DuckDB is now the default
    };
    
    setImplementation(determineImplementation());
  }, []);
  
  // Load the appropriate implementation
  useEffect(() => {
    const loadComponent = async () => {
      try {
        let module;
        
        switch (implementation) {
          case 'solidjs':
            module = await import('./DetailsInstrumentsTable.bridge.js');
            setShowAlert(true);
            break;
          case 'wasm':
            module = await import('./DetailsInstrumentsTable.wasm.js');
            setShowAlert(true);
            break;
          case 'duckdb':
            // Use the DuckDB implementation with SQL-powered filtering
            const { default: DuckDBTable } = await import('../../hooks/useDetailsInstrumentsTable.duck.js');
            // Wrap the hook in a component
            const DuckDBComponent = async (props) => {
              const {data, loading, error, tableInfo} = DuckDBTable(props.data, {
                isometric: props.selectedIsometric,
                subsystem: props.selectedSubsystem,
                testPack: props.selectedTestPack
              });

              // Use the optimized table with the processed data
              const {default: OptimizedTable} = await import('./DetailsInstrumentsTable.optimized.js');
              return <OptimizedTable {...props} data={data}/>;
            };
            
            module = { default: DuckDBComponent };
            setShowAlert(true);
            break;
          case 'react':
          default:
            module = await import('./DetailsInstrumentsTable.optimized.js');
            break;
        }
        
        setComponent(() => module.default);
      } catch (err) {
        console.error(`Failed to load ${implementation} implementation:`, err);
        setError(err.message);
        
        // Fallback to React implementation
        try {
          const fallbackModule = await import('./DetailsInstrumentsTable.optimized.js');
          setComponent(() => fallbackModule.default);
        } catch (fallbackErr) {
          console.error('Failed to load fallback implementation:', fallbackErr);
          setError(`${err.message}. Fallback also failed: ${fallbackErr.message}`);
        }
      }
    };
    
    loadComponent();
  }, [implementation]);
  
  // Show loading state while component is loading
  if (!Component) {
    return (
      <Box p={6} textAlign="center">
        <Spinner size="xl" color="blue.500" />
        <Text mt={4} color="gray.600">Loading {implementation} table implementation...</Text>
      </Box>
    );
  }
  
  // Show error if loading failed
  if (error) {
    return (
      <Box p={6}>
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          <AlertTitle mr={2}>Failed to load table!</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </Box>
    );
  }
  
  return (
    <>
      {showAlert && (
        <Alert status="info" mb={4} borderRadius="md">
          <AlertIcon />
          <Box flex="1">
            <AlertTitle>Using {implementation.toUpperCase()} implementation</AlertTitle>
            <AlertDescription display="block">
              This table is using the {implementation.toUpperCase()} implementation for improved performance.
            </AlertDescription>
          </Box>
          <CloseButton position="absolute" right="8px" top="8px" onClick={() => setShowAlert(false)} />
        </Alert>
      )}
      <Component {...props} />
    </>
  );
};

export default DetailsInstrumentsTable;