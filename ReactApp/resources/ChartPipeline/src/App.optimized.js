import React, { useState, lazy, Suspense } from 'react';
import { 
  ChakraProvider, 
  Box, 
  Grid, 
  GridItem, 
  Heading, 
  Spinner, 
  Center,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription
} from '@chakra-ui/react';
import FilterPanel from './components/filters/FilterPanel.optimized';
import useDataLoader from './hooks/useDataLoader.optimized';
import useDashboardConfig from './hooks/useDashboardConfig.optimized';
import useMultiValueFilter from './hooks/useMultiValueFilter';
import WasmPerformanceMonitor, { usePerformanceMonitor } from './components/ui/WasmPerformanceMonitor';

// Lazy load chart components
const ChartSelector = lazy(() => import('./components/ui/ChartSelector.optimized'));

function App() {
  // State for active dashboard
  const [activeDashboard, setActiveDashboard] = useState('SUMMARY SUBSYSTEMS');
  
  // WASM performance monitoring
  const showPerformanceMonitor = usePerformanceMonitor();
  
  // Get dashboard configuration based on active dashboard
  const { datasetPath, filterMappings } = useDashboardConfig(activeDashboard);
  
  // Load data using data loader
  const { 
    data, 
    loading, 
    error, 
    areas, 
    subsystems, 
    testPacks
  } = useDataLoader(datasetPath, filterMappings);
  
  // Use filter hook
  const {
    filteredData,
    metadata,
    filterOptions,
    relationshipMaps,
    multiFilters,
    progressFilter,
    handleFilterChange,
    handleProgressFilter,
    resetAllFilters
  } = useMultiValueFilter(data, filterMappings);
  
  // Handle dashboard change
  const handleDashboardChange = (dashboard) => {
    setActiveDashboard(dashboard);
    resetAllFilters(); // Reset filters when changing dashboards
  };

  // Show loading spinner while data is being fetched
  if (loading) {
    return (
      <ChakraProvider>
        <Center height="100vh">
          <Spinner size="xl" />
        </Center>
      </ChakraProvider>
    );
  }

  // Show error message if data loading failed
  if (error) {
    return (
      <ChakraProvider>
        <Center height="100vh">
          <Alert status="error">
            <AlertIcon />
            <AlertTitle>Error loading data!</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </Center>
      </ChakraProvider>
    );
  }

  return (
    <ChakraProvider>
      <Box p={4}>
        <Heading mb={2} fontSize="16px">Pipeline Construction Dashboard</Heading>

        {/* Main layout with filter panel on left and charts on right */}
        {activeDashboard === 'SUMMARY SUBSYSTEMS' || activeDashboard === 'INSTRUMENTS REPORT' || activeDashboard === 'LOOP SIGNAL PROGRESS REPORT' ? (
          <Box>
            <Suspense fallback={<Center p={4}><Spinner /></Center>}>
              <ChartSelector 
                data={filteredData} 
                rawData={data}
                activeDashboard={activeDashboard}
                onDashboardChange={handleDashboardChange}
                onProgressFilter={handleProgressFilter}
                progressFilter={progressFilter}
              />
            </Suspense>
          </Box>
        ) : (
          <Grid templateColumns="250px 1fr" gap={6}>
            {/* Filter panel - left side */}
            <GridItem>
              <FilterPanel
                areas={filterOptions[filterMappings.area || filterMappings.isometric] || []}
                subsystems={filterOptions[filterMappings.subsystem] || []}
                multiFilters={multiFilters}
                onFilterChange={handleFilterChange}
                filterMappings={filterMappings}
                progressFilter={progressFilter}
                onResetAll={resetAllFilters}
                metadata={metadata}
                relationshipMaps={relationshipMaps}
              />
            </GridItem>

            {/* Chart area - right side */}
            <GridItem>
              <Suspense fallback={<Center p={4}><Spinner /></Center>}>
                <ChartSelector 
                  data={filteredData} 
                  rawData={data}
                  activeDashboard={activeDashboard}
                  onDashboardChange={handleDashboardChange}
                  onProgressFilter={handleProgressFilter}
                  progressFilter={progressFilter}
                  multiFilters={multiFilters}
                />
              </Suspense>
            </GridItem>
          </Grid>
        )}
        
        {/* WASM Performance Monitor Overlay */}
        <WasmPerformanceMonitor isVisible={showPerformanceMonitor} />
      </Box>
    </ChakraProvider>
  );
}

export default App;