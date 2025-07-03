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
import FilterPanel from './components/FilterPanel.optimized';
import useDataLoader from './hooks/useDataLoader.optimized';
import useDashboardConfig from './hooks/useDashboardConfig.optimized';
import useMultiValueFilter from './hooks/useMultiValueFilter';

// Lazy load chart components
const ChartSelector = lazy(() => import('./components/ChartSelector.optimized'));

function App() {
  // State for active dashboard
  const [activeDashboard, setActiveDashboard] = useState('LOOP TESTING PROGRESS REPORT');
  
  // Get dashboard configuration based on active dashboard
  const { datasetPath, filterMappings } = useDashboardConfig(activeDashboard);
  
  // Load data using custom hook with the appropriate dataset path and filter mappings
  const { data, loading, error, areas, subsystems, testPacks } = useDataLoader(datasetPath, filterMappings);
  
  // Use the multi-value filter hook
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
              />
            </Suspense>
          </GridItem>
        </Grid>
      </Box>
    </ChakraProvider>
  );
}

export default App;