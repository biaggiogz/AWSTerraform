import React, { useState } from 'react';
import { Box, VStack } from '@chakra-ui/react';
import InstrumentsReportSQLPanel from './InstrumentsReportSQLPanel';
import InstrumentsStatusChart from '../../charts/InstrumentsStatusChart';
import InstrumentsReportMetricCards from '../ui/InstrumentsReportMetricCards';
import InstrumentsReportStateNotification from '../ui/InstrumentsReportStateNotification';
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
        <InstrumentsReportMetricCards />
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
        
        {/* Wrap InstrumentsStatusChart with InstrumentsTableFilterProvider */}
        <InstrumentsTableFilterProvider>
          <FilterStatusBar />
          <InstrumentsStatusChart />
        </InstrumentsTableFilterProvider>
      </VStack>
    </Box>
  );
};

export default InstrumentsReportContainer;