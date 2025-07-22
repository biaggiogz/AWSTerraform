import React, { useState } from 'react';
import { Box, VStack, Tabs, TabList, TabPanels, Tab, TabPanel } from '@chakra-ui/react';
import InstrumentsReportSQLPanel from './InstrumentsReportSQLPanel';
import InstrumentsStatusChart from '../../charts/InstrumentsStatusChart';
import InstrumentsReportStateNotification from '../ui/InstrumentsReportStateNotification';
import InstrumentsReportMetrics from '../metrics/InstrumentsReportMetrics';
import { InstrumentsTableFilterProvider } from '../filters/InstrumentsTableFilter';
import FilterStatusBar from '../filters/FilterStatusBar';

const InstrumentsReportContainer = ({ controlData, detailsData, filteredControlData: initialFilteredControlData, filteredDetailsData: initialFilteredDetailsData, filters }) => {
  // State for filter visibility and propagation
  const [filteredData, setFilteredData] = useState(initialFilteredDetailsData || detailsData);
  const [filteredControlData, setFilteredControlData] = useState(initialFilteredControlData || controlData);
  const [loopFilteredControlData, setLoopFilteredControlData] = useState(controlData);
  const [progressFilterVisible, setProgressFilterVisible] = useState(false);
  const [itemsFilterVisible, setItemsFilterVisible] = useState(false);
  const [loopFilterVisible, setLoopFilterVisible] = useState(false);
  const [hitoFilterVisible, setHitoFilterVisible] = useState(false);
  const [progressPropagation, setProgressPropagation] = useState({ ids: [], type: 'nothing' });
  const [itemsPropagation, setItemsPropagation] = useState({ ids: [], type: 'nothing' });
  const [loopPropagation, setLoopPropagation] = useState({ ids: [], type: 'nothing' });
  const [hitoPropagation, setHitoPropagation] = useState({ ids: [], type: 'nothing' });
  const [frontFilter, setFrontFilter] = useState(null);

  // Handle bringing a filter to front
  const handleBringToFront = (filterName) => {
    setFrontFilter(filterName);
  };

  return (
    <Box width="100%">
      <InstrumentsReportStateNotification />
      <VStack spacing={4} align="stretch">
        <Tabs variant="enclosed" colorScheme="blue">
          <TabList>
            <Tab>SQL Interface</Tab>
            <Tab>Metrics Dashboard</Tab>
            <Tab>Charts</Tab>
          </TabList>
          <TabPanels>
            <TabPanel p={0} pt={4}>
              <InstrumentsReportSQLPanel
                controlData={controlData}
                detailsData={detailsData}
                filteredControlData={filteredControlData}
                filteredDetailsData={filteredData}
                filters={filters}
                onFilteredDataChange={setFilteredData}
                onFilteredControlDataChange={setFilteredControlData}
                onLoopFilteredControlDataChange={setLoopFilteredControlData}
                onProgressFilterVisibilityChange={setProgressFilterVisible}
                onItemsFilterVisibilityChange={setItemsFilterVisible}
                onLoopFilterVisibilityChange={setLoopFilterVisible}
                onHitoFilterVisibilityChange={setHitoFilterVisible}
                onProgressPropagationChange={(ids, type) => setProgressPropagation({ ids, type })}
                onItemsPropagationChange={(ids, type) => setItemsPropagation({ ids, type })}
                onLoopPropagationChange={(ids, type) => setLoopPropagation({ ids, type })}
                onHitoPropagationChange={(ids, type) => setHitoPropagation({ ids, type })}
                onBringToFront={handleBringToFront}
              />
            </TabPanel>
            <TabPanel>
              <InstrumentsReportMetrics
                controlData={controlData}
                detailsData={detailsData}
                filteredControlData={filteredControlData}
                filteredDetailsData={filteredData}
                filters={filters}
              />
            </TabPanel>
            <TabPanel>
              <InstrumentsTableFilterProvider>
                <FilterStatusBar />
                <InstrumentsStatusChart />
              </InstrumentsTableFilterProvider>
            </TabPanel>
          </TabPanels>
        </Tabs>
        {/* Filters will be shown when activated from any tab */}
      </VStack>
    </Box>
  );
};

export default InstrumentsReportContainer;