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
import { filterData } from './utils/dataProcessor';

// Path to the CSV file
const CSV_PATH = '/data/pipelinedata.csv';

function App() {
  // Load data using custom hook
  const { data, loading, error, areas, subsystems, testPacks } = useDataLoader(CSV_PATH);
  
  // State for filters
  const [filters, setFilters] = useState({
    'Design Area': '',
    'SUBSYSTEM': '',
  });
  
  // Handle filter changes
  const handleFilterChange = (filterName, value) => {
    const filterKey = filterName === 'area' ? 'Design Area' : 
                     filterName === 'subsystem' ? 'SUBSYSTEM' : filterName
    setFilters(prev => ({
      ...prev,
      [filterKey]: value === '' ? '' : value
    }));
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
                area: filters['Design Area'],
                subsystem: filters['SUBSYSTEM']
              }}
              onFilterChange={handleFilterChange}
              data={data}
            />
          </GridItem>

          {/* Chart area - right side */}
          <GridItem>
            <ChartSelector data={filteredData} />
          </GridItem>
        </Grid>
      </Box>
    </ChakraProvider>
  );
}

export default App;