import React, { lazy, Suspense } from 'react';
import { 
  Box, 
  Tabs, 
  TabList, 
  TabPanels, 
  Tab, 
  TabPanel,
  Center,
  Spinner
} from '@chakra-ui/react';

// Lazy load chart components
const LoopTestProgressChart = lazy(() => import('../charts/LoopTestProgressChart.optimized'));
const SubsystemComparisonChart = lazy(() => import('../charts/SubsystemComparisonChart'));
const TestPackProgressChart = lazy(() => import('../charts/TestPackProgressChart'));

/**
 * ChartSelector component to switch between different charts
 * @param {Object} props - Component props
 * @param {Array} props.data - Filtered dataset
 * @param {string} props.activeDashboard - Currently active dashboard
 * @param {Function} props.onDashboardChange - Function to call when dashboard changes
 */
const ChartSelector = ({ data, activeDashboard, onDashboardChange }) => {
  // Map tab index to dashboard name
  const dashboardNames = [
    'LOOP TEST PROGRESS',
    'Support vs Welding by Subsystem',
    'Test Pack Progress'
  ];
  
  // Find the index of the active dashboard
  const activeIndex = dashboardNames.indexOf(activeDashboard);
  
  // Handle tab change
  const handleTabChange = (index) => {
    onDashboardChange(dashboardNames[index]);
  };
  
  return (
    <Box width="100%" mt="5px">
      <Tabs 
        isFitted 
        variant="enclosed" 
        colorScheme="blue" 
        lazyBehavior="keepMounted"
        index={activeIndex !== -1 ? activeIndex : 0} // Default to LOOP TEST PROGRESS if not found
        onChange={handleTabChange}
      >
        <TabList mb="1em">
          <Tab>LOOP TEST PROGRESS</Tab>
          <Tab>Support vs Welding by Subsystem</Tab>
          <Tab>Test Pack Progress</Tab>
        </TabList>
        <TabPanels>
          <TabPanel p={0}>
            <Suspense fallback={<Center height="300px"><Spinner /></Center>}>
              <LoopTestProgressChart data={data} />
            </Suspense>
          </TabPanel>
          <TabPanel p={0}>
            <Suspense fallback={<Center height="300px"><Spinner /></Center>}>
              <SubsystemComparisonChart data={data} />
            </Suspense>
          </TabPanel>
          <TabPanel p={0}>
            <Suspense fallback={<Center height="300px"><Spinner /></Center>}>
              <TestPackProgressChart data={data} />
            </Suspense>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
};

export default ChartSelector;