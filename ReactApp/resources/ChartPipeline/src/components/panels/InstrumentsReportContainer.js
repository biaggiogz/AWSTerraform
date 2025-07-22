import React, { useState, useEffect, useRef } from 'react';
import { Box, VStack, Tabs, TabList, TabPanels, Tab, TabPanel } from '@chakra-ui/react';
import InstrumentsReportSQLPanel from './InstrumentsReportSQLPanel';
import InstrumentsStatusChart from '../../charts/InstrumentsStatusChart';
import InstrumentsReportStateNotification from '../ui/InstrumentsReportStateNotification';
import { InstrumentsTableFilterProvider } from '../filters/InstrumentsTableFilter';
import FilterStatusBar from '../filters/FilterStatusBar';

const InstrumentsReportContainer = ({ controlData, detailsData, filteredControlData: initialFilteredControlData, filteredDetailsData: initialFilteredDetailsData, filters }) => {
  // State for filter visibility and propagation
  const [filteredData, setFilteredData] = useState(initialFilteredDetailsData || detailsData);
  const [filteredControlData, setFilteredControlData] = useState(initialFilteredControlData || controlData);
  const [loopFilteredControlData, setLoopFilteredControlData] = useState(controlData);
  const [dynamicFilteredData, setDynamicFilteredData] = useState(controlData); // For dynamic table
  const [progressFilterVisible, setProgressFilterVisible] = useState(false);
  const [itemsFilterVisible, setItemsFilterVisible] = useState(false);
  const [loopFilterVisible, setLoopFilterVisible] = useState(false);
  const [hitoFilterVisible, setHitoFilterVisible] = useState(false);
  const [progressPropagation, setProgressPropagation] = useState({ ids: [], type: 'nothing' });
  const [itemsPropagation, setItemsPropagation] = useState({ ids: [], type: 'nothing' });
  const [loopPropagation, setLoopPropagation] = useState({ ids: [], type: 'nothing' });
  const [hitoPropagation, setHitoPropagation] = useState({ ids: [], type: 'nothing' });
  const [frontFilter, setFrontFilter] = useState(null);
  
  // Track data changes to update DuckDB tables
  const dataRef = useRef({
    controlData,
    detailsData,
    filteredControlData: initialFilteredControlData,
    filteredDetailsData: initialFilteredDetailsData
  });
  
  // Update dynamic filtered data when control data changes
  useEffect(() => {
    setDynamicFilteredData(loopFilteredControlData || filteredControlData || controlData);
  }, [loopFilteredControlData, filteredControlData, controlData]);

  // Handle bringing a filter to front
  const handleBringToFront = (filterName) => {
    setFrontFilter(filterName);
  };

  return (
    <Box width="100%">
      <InstrumentsReportStateNotification />
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
        {/* Filters will be shown when activated from any tab */}
      </VStack>
    </Box>
  );
};

export default InstrumentsReportContainer;