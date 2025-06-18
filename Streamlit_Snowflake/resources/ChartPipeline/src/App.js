import React, { useState } from 'react';
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
import FilterPanel from './components/FilterPanel';
import ChartSelector from './components/ChartSelector';
import useDataLoader from './hooks/useDataLoader';
import useDashboardConfig from './hooks/useDashboardConfig';
import { filterData } from './utils/dataProcessor';

function App() {
  // State for active dashboard
  const [activeDashboard, setActiveDashboard] = useState('LOOP TEST PROGRESS');
  
  // Get dashboard configuration based on active dashboard
  const { datasetPath, filterMappings } = useDashboardConfig(activeDashboard);
  
  // Load data using custom hook with the appropriate dataset path and filter mappings
  const { data, loading, error, areas, subsystems, testPacks } = useDataLoader(datasetPath, filterMappings);
  
  // State for filters
  const [filters, setFilters] = useState({});
  
  // Handle filter changes
  const handleFilterChange = (filterName, value) => {
    const filterKey = filterName === 'area' ? filterMappings.area : 
                     filterName === 'subsystem' ? filterMappings.subsystem : filterName;
    setFilters(prev => ({
      ...prev,
      [filterKey]: value === '' ? '' : value
    }));
  };
  
  // Handle dashboard change
  const handleDashboardChange = (dashboard) => {
    setActiveDashboard(dashboard);
    setFilters({}); // Reset filters when changing dashboards
  };
  
  // Filter data based on selected filters
  const filteredData = data.length > 0 ? filterData(data, filters) : [];

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
            />
          </GridItem>

          {/* Chart area - right side */}
          <GridItem>
            <ChartSelector 
              data={filteredData} 
              activeDashboard={activeDashboard}
              onDashboardChange={handleDashboardChange}
            />
          </GridItem>
        </Grid>
      </Box>
    </ChakraProvider>
  );
}

export default App;