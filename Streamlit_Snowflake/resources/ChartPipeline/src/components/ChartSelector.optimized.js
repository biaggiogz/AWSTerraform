import React, { lazy, Suspense } from 'react';
import {
  Box,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Center,
  Spinner,
  VStack
} from '@chakra-ui/react';

// Lazy load chart components
const LoopTestProgressChart = lazy(() => import('../charts/LoopTestProgressChart.optimized'));
const IsolationProgressChart = lazy(() => import('../charts/IsolationProgressControlChart.optimized'));
const TestPackProgressChart = lazy(() => import('../charts/TestPackProgressChart.optimized'));
const LazosTable = lazy(() => import('./LazosTable.optimized'));

/**
 * ChartSelector component to switch between different charts
 * @param {Object} props - Component props
 * @param {Array} props.data - Filtered dataset
 * @param {Array} props.rawData - Raw unfiltered dataset for global metrics
 * @param {string} props.activeDashboard - Currently active dashboard
 * @param {Function} props.onDashboardChange - Function to call when dashboard changes
 * @param {Function} props.onProgressFilter - Function to handle progress filtering
 * @param {string} props.progressFilter - Current progress filter
 */
const ChartSelector = ({ data, rawData, activeDashboard, onDashboardChange, onProgressFilter, progressFilter }) => {
  // Map tab index to dashboard name
  const dashboardNames = [
    'LOOP TESTING PROGRESS REPORT',
    'ISOLATION PROGRESS CONTROL',
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
            index={activeIndex !== -1 ? activeIndex : 0} // Default to LOOP TESTING PROGRESS REPORT if not found
            onChange={handleTabChange}
        >
          <TabList mb="1em">
            <Tab>LOOP TESTING PROGRESS REPORT</Tab>
            <Tab>ISOLATION PROGRESS CONTROL</Tab>
            <Tab>Test Pack Progress</Tab>
          </TabList>
          <TabPanels>
            <TabPanel p={0}>
              <Suspense fallback={<Center height="300px"><Spinner /></Center>}>
                <VStack spacing={0} align="stretch">
                  <LoopTestProgressChart
                      data={data}
                      rawData={rawData}
                      onProgressFilter={onProgressFilter}
                      progressFilter={progressFilter}
                  />
                  <LazosTable data={data} />
                </VStack>
              </Suspense>
            </TabPanel>
            <TabPanel p={0}>
              <Suspense fallback={<Center height="300px"><Spinner /></Center>}>
                <IsolationProgressChart data={data} />
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