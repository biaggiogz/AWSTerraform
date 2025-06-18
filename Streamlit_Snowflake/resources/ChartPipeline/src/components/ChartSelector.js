import React, { useEffect } from 'react';
import { 
  Box, 
  Tabs, 
  TabList, 
  TabPanels, 
  Tab, 
  TabPanel 
} from '@chakra-ui/react';
import LoopTestProgressChart from '../charts/LoopTestProgressChart.optimized';
import SubsystemComparisonChart from '../charts/SubsystemComparisonChart';
import TestPackProgressChart from '../charts/TestPackProgressChart';

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
        index={activeIndex !== -1 ? activeIndex : 2} // Default to Test Pack Progress if not found
        onChange={handleTabChange}
      >
        <TabList mb="1em">
          <Tab>LOOP TEST PROGRESS</Tab>
          <Tab>Support vs Welding by Subsystem</Tab>
          <Tab>Test Pack Progress</Tab>
        </TabList>
        <TabPanels>
          <TabPanel p={0}>
            <LoopTestProgressChart data={data} />
          </TabPanel>
          <TabPanel p={0}>
            <SubsystemComparisonChart data={data} />
          </TabPanel>
          <TabPanel p={0}>
            <TestPackProgressChart data={data} />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
};

export default ChartSelector;