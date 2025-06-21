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
import FilterPanel from './components/FilterPanel.optimized';
import useDataLoader from './hooks/useDataLoader.optimized';
import useDashboardConfig from './hooks/useDashboardConfig.optimized';
import { filterData } from './utils/dataProcessor.optimized';

// Lazy load chart components
const ChartSelector = lazy(() => import('./components/ChartSelector.optimized'));

function App() {
  // State for active dashboard
  const [activeDashboard, setActiveDashboard] = useState('LOOP TEST PROGRESS');
  
  // Get dashboard configuration based on active dashboard
  const { datasetPath, filterMappings } = useDashboardConfig(activeDashboard);
  
  // Load data using custom hook with the appropriate dataset path and filter mappings
  const { data, loading, error, areas, subsystems, testPacks } = useDataLoader(datasetPath, filterMappings);
  
  // State for filters
  const [filters, setFilters] = useState({});
  
  // State for progress filter from chart
  const [progressFilter, setProgressFilter] = useState(null);
  
  // Handle filter changes
  const handleFilterChange = (filterName, value) => {
    const filterKey = filterName === 'area' ? filterMappings.area : 
                     filterName === 'subsystem' ? filterMappings.subsystem : filterName;
    setFilters(prev => ({
      ...prev,
      [filterKey]: value === '' ? '' : value
    }));
  };
  
  // Handle progress filter from chart
  const handleProgressFilter = (filterType) => {
    setProgressFilter(filterType);
  };
  
  // Handle dashboard change
  const handleDashboardChange = (dashboard) => {
    setActiveDashboard(dashboard);
    setFilters({}); // Reset filters when changing dashboards
    setProgressFilter(null); // Reset progress filter when changing dashboards
  };
  
  // Filter data based on selected filters and progress filter
  const filteredData = useMemo(() => {
    if (data.length === 0) return [];
    
    let result = filterData(data, filters);
    
    // Apply progress filter if active
    if (progressFilter) {
      result = result.filter(item => {
        const progressStr = item['OK=100%']?.toString().replace('%', '').trim();
        const progress = parseFloat(progressStr) || 0;
        
        switch (progressFilter) {
          case 'LOOP (Signal) DONE':
            return progress === 100;
          case 'LOOP (Signal) PENDING':
            return progress < 100;
          case 'DOSSIER COMPLETED':
            return item['DOSSIER'] && item['DOSSIER'].toString().trim() !== '';
          default:
            return true;
        }
      });
    }
    
    return result;
  }, [data, filters, progressFilter]);

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
              areas={areas}
              subsystems={subsystems}
              testPacks={testPacks}
              filters={{
                area: filters[filterMappings.area] || '',
                subsystem: filters[filterMappings.subsystem] || ''
              }}
              onFilterChange={handleFilterChange}
              data={data}
              filterMappings={filterMappings}
              progressFilter={progressFilter}
              onResetAll={() => {
                setFilters({});
                setProgressFilter(null);
              }}
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