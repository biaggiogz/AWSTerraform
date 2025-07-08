import React, { useState, lazy, Suspense, useMemo } from 'react';
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
import useDataLoader from './hooks/useDataLoader.optimized';
import useDashboardConfig from './hooks/useDashboardConfig.optimized';
import { createVirtualDataset } from './utils/multiValueFilter';

// Lazy load chart components
const ChartSelector = lazy(() => import('./components/ui/ChartSelector.optimized'));

function App() {
  // State for active dashboard
  const [activeDashboard, setActiveDashboard] = useState('LOOP SIGNAL PROGRESS REPORT');
  
  // Get dashboard configuration based on active dashboard
  const { datasetPath, filterMappings } = useDashboardConfig(activeDashboard);
  
  // Load data using custom hook with the appropriate dataset path and filter mappings
  const { data, loading, error } = useDataLoader(datasetPath, filterMappings);
  
  // State for multi-value filters
  const [multiFilters, setMultiFilters] = useState({});
  
  // State for progress filter from chart
  const [progressFilter, setProgressFilter] = useState(null);
  
  // Handle multi-value filter changes
  const handleMultiFilterChange = (filterName, values) => {
    const filterKey = filterName === 'area' ? filterMappings.area : 
                     filterName === 'subsystem' ? filterMappings.subsystem : filterName;
    
    setMultiFilters(prev => ({
      ...prev,
      [filterKey]: values
    }));
  };
  
  // Handle progress filter from chart
  const handleProgressFilter = (filterType) => {
    setProgressFilter(filterType);
  };
  
  // Handle dashboard change
  const handleDashboardChange = (dashboard) => {
    setActiveDashboard(dashboard);
    setMultiFilters({}); // Reset filters when changing dashboards
    setProgressFilter(null); // Reset progress filter when changing dashboards
  };
  
  // Create virtual dataset based on multi-value filters
  const virtualDataset = useMemo(() => {
    if (!data || data.length === 0) return { data: [], metadata: { totalCount: 0, filteredCount: 0 } };
    
    return createVirtualDataset(
      data, 
      multiFilters, 
      { progressFilter }
    );
  }, [data, multiFilters, progressFilter]);

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

        {/* Main layout with charts */}
        <Box>
          {/* Chart area */}
          <Box>
            <Suspense fallback={<Center p={4}><Spinner /></Center>}>
              <ChartSelector 
                data={virtualDataset.data} 
                rawData={data}
                activeDashboard={activeDashboard}
                onDashboardChange={handleDashboardChange}
                onProgressFilter={handleProgressFilter}
                progressFilter={progressFilter}
                filterMappings={filterMappings}
                multiFilters={multiFilters}
                onMultiFilterChange={handleMultiFilterChange}
                metadata={virtualDataset.metadata}
              />
            </Suspense>
          </Box>
        </Box>
      </Box>
    </ChakraProvider>
  );
}

export default App;