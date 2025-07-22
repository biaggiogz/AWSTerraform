import React, { useState } from 'react';
import { Box, VStack } from '@chakra-ui/react';
import InstrumentsReportSQLPanel from './InstrumentsReportSQLPanel';
import InstrumentsStatusChart from '../../charts/InstrumentsStatusChart';

const InstrumentsReportContainer = ({ controlData, detailsData, filteredControlData, filteredDetailsData, filters }) => {
  // State for filter visibility and propagation
  const [filteredData, setFilteredData] = useState(detailsData);
  const [filteredControlData, setFilteredControlData] = useState(controlData);
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
      <VStack spacing={4} align="stretch">
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
        
        {/* Add InstrumentsStatusChart here */}
        <InstrumentsStatusChart />
      </VStack>
    </Box>
  );
};

export default InstrumentsReportContainer;