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
import useInstrumentsDataLoader from './hooks/useInstrumentsDataLoader.optimized';
import useDashboardConfig from './hooks/useDashboardConfig.optimized';
import useMultiValueFilter from './hooks/useMultiValueFilter';
import useInstrumentsFilter from './hooks/useInstrumentsFilter';
import WasmPerformanceMonitor, { usePerformanceMonitor } from './components/ui/WasmPerformanceMonitor';
// Import DuckDB initialization for INSTRUMENTS REPORT tab
import './hooks/initDuckDB';

// Lazy load chart components
const ChartSelector = lazy(() => import('./components/ui/ChartSelector.optimized'));

function App() {
  // State for active dashboard
  const [activeDashboard, setActiveDashboard] = useState('LOOP SIGNAL PROGRESS REPORT');
  
  // WASM performance monitoring
  const showPerformanceMonitor = usePerformanceMonitor();
  
  // Get dashboard configuration based on active dashboard
  const { datasetPath, filterMappings } = useDashboardConfig(activeDashboard);
  
  // Use specialized data loader for INSTRUMENTS REPORT
  const isInstrumentsReport = activeDashboard === 'INSTRUMENTS REPORT';
  
  // Load data using appropriate hook
  const regularDataLoader = useDataLoader(isInstrumentsReport ? null : datasetPath, filterMappings);
  const instrumentsDataLoader = useInstrumentsDataLoader(filterMappings);
  
  // Select the appropriate data loader results
  const { 
    data, 
    loading, 
    error, 
    areas, 
    subsystems, 
    testPacks,
    controlData,
    detailsData,
    isometrics
  } = isInstrumentsReport ? {
    data: instrumentsDataLoader.controlData,
    loading: instrumentsDataLoader.loading,
    error: instrumentsDataLoader.error,
    areas: instrumentsDataLoader.isometrics,
    subsystems: instrumentsDataLoader.subsystems,
    testPacks: [],
    controlData: instrumentsDataLoader.controlData,
    detailsData: instrumentsDataLoader.detailsData,
    isometrics: instrumentsDataLoader.isometrics
  } : {
    ...regularDataLoader,
    controlData: null,
    detailsData: null,
    isometrics: null
  };
  
  // Use appropriate filter hook
  const regularFilter = useMultiValueFilter(isInstrumentsReport ? null : data, filterMappings);
  const instrumentsFilter = useInstrumentsFilter(controlData, detailsData, filterMappings);
  
  // Select the appropriate filter results
  const {
    filteredData,
    metadata,
    filterOptions,
    relationshipMaps,
    multiFilters,
    progressFilter,
    handleFilterChange,
    handleProgressFilter,
    resetAllFilters,
    filteredControlData,
    filteredDetailsData
  } = isInstrumentsReport ? {
    filteredData: instrumentsFilter.filteredControlData,
    metadata: instrumentsFilter.controlMetadata,
    filterOptions: instrumentsFilter.filterOptions,
    relationshipMaps: instrumentsFilter.relationshipMaps,
    multiFilters: instrumentsFilter.multiFilters,
    progressFilter: instrumentsFilter.progressFilter,
    handleFilterChange: instrumentsFilter.handleFilterChange,
    handleProgressFilter: instrumentsFilter.handleProgressFilter,
    resetAllFilters: instrumentsFilter.resetAllFilters,
    filteredControlData: instrumentsFilter.filteredControlData,
    filteredDetailsData: instrumentsFilter.filteredDetailsData
  } : {
    ...regularFilter,
    filteredControlData: null,
    filteredDetailsData: null
  };
  
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
        {activeDashboard === 'SUMMARY SUBSYSTEMS' ? (
          <Box>
            <Suspense fallback={<Center p={4}><Spinner /></Center>}>
              <ChartSelector 
                data={filteredData} 
                rawData={data}
                controlData={filteredControlData || controlData}
                detailsData={filteredDetailsData || detailsData}
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
                  controlData={filteredControlData || controlData}
                  detailsData={filteredDetailsData || detailsData}
                  activeDashboard={activeDashboard}
                  onDashboardChange={handleDashboardChange}
                  onProgressFilter={handleProgressFilter}
                  progressFilter={progressFilter}
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