import React from 'react';
import { 
  Box, 
  Tabs, 
  TabList, 
  TabPanels, 
  Tab, 
  TabPanel 
} from '@chakra-ui/react';
import WeldingProgressChart from '../charts/WeldingProgressChart';
import SubsystemComparisonChart from '../charts/SubsystemComparisonChart';
import TestPackProgressChart from '../charts/TestPackProgressChart';

/**
 * ChartSelector component to switch between different charts
 * @param {Object} props - Component props
 * @param {Array} props.data - Filtered dataset
 */
const ChartSelector = ({ data }) => {
  return (
    <Box width="100%" mt="5px">
      <Tabs isFitted variant="enclosed" colorScheme="blue">
        <TabList mb="1em">
          <Tab>Welding Progress by Area</Tab>
          <Tab>Support vs Welding by Subsystem</Tab>
          <Tab>Test Pack Progress</Tab>
        </TabList>
        <TabPanels>
          <TabPanel p={0}>
            <WeldingProgressChart data={data} />
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