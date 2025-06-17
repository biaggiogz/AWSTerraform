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
const WeldingProgressChart = lazy(() => import('../charts/WeldingProgressChart'));
const SubsystemComparisonChart = lazy(() => import('../charts/SubsystemComparisonChart'));
const TestPackProgressChart = lazy(() => import('../charts/TestPackProgressChart'));

/**
 * ChartSelector component to switch between different charts
 * @param {Object} props - Component props
 * @param {Array} props.data - Filtered dataset
 */
const ChartSelector = ({ data }) => {
  return (
    <Box width="100%" mt="5px">
      <Tabs isFitted variant="enclosed" colorScheme="blue" lazyBehavior="keepMounted">
        <TabList mb="1em">
          <Tab>Welding Progress by Area</Tab>
          <Tab>Support vs Welding by Subsystem</Tab>
          <Tab>Test Pack Progress</Tab>
        </TabList>
        <TabPanels>
          <TabPanel p={0}>
            <Suspense fallback={<Center height="300px"><Spinner /></Center>}>
              <WeldingProgressChart data={data} />
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