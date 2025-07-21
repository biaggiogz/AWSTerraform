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
  VStack,
  HStack,
  Badge
} from '@chakra-ui/react';
import { useIsometricRelationshipFilter } from '../filters/IsometricRelationshipFilter.wasm';
import { useTestPackFilter } from '../filters/TestPackRelationshipFilter.optimized';
import { useSubsystemFilter } from '../filters/SubsystemRelationshipFilter.optimized';
import { InstrumentsTableFilterProvider } from '../filters/InstrumentsTableFilter';
import FilterStatusBar from '../filters/FilterStatusBar';

// Lazy load chart components
const LoopTestProgressChart = lazy(() => import('../../charts/LoopTestProgressChart.optimized'));
const IsolationProgressControlChart = lazy(() => import('../../charts/IsolationProgressControlChart.optimized'));
const TestPackProgressChart = lazy(() => import('../../charts/TestPackProgressChart.optimized'));
const LazosTable = lazy(() => import('../tables/LazosTable.optimized'));
const InsulationProgressTable = lazy(() => import('../tables/InsulationProgressTable.optimized'));
const ControlInstrumentsByIsometric = lazy(() => import('../tables/ControlInstrumentsByIsometric'));
const DynamicInstrumentsTable = lazy(() => import('../tables/DynamicInstrumentsTable'));
const DetailsInstrumentsTable = lazy(() => import('../tables/./DetailsInstrumentsTable.optimized'));
const IsometricRelationshipPanel = lazy(() => import('../panels/IsometricRelationshipPanel.optimized'));
const DynamicCalculationPanel = lazy(() => import('../panels/DynamicCalculationPanel'));
const SummarySubsystems = lazy(() => import('../panels/SummarySubsystems'));

/**
 * ChartSelector component to switch between different charts
 * @param {Object} props - Component props
 * @param {Array} props.data - Filtered dataset
 * @param {Array} props.rawData - Raw unfiltered dataset for global metrics
 * @param {Array} props.controlData - Control instruments data for INSTRUMENTS REPORT
 * @param {Array} props.detailsData - Details instruments data for INSTRUMENTS REPORT
 * @param {string} props.activeDashboard - Currently active dashboard
 * @param {Function} props.onDashboardChange - Function to call when dashboard changes
 * @param {Function} props.onProgressFilter - Function to handle progress filtering
 * @param {string} props.progressFilter - Current progress filter
 */
const ChartSelector = ({ data, rawData, controlData, detailsData, activeDashboard, onDashboardChange, onProgressFilter, progressFilter }) => {
  // Initialize isometric relationship filter for INSTRUMENTS REPORT
  const isometricFilter = useIsometricRelationshipFilter(
    activeDashboard === 'INSTRUMENTS REPORT' ? controlData : null,
    activeDashboard === 'INSTRUMENTS REPORT' ? detailsData : null
  );
  
  // Initialize test pack filter for INSTRUMENTS REPORT
  const testPackFilter = useTestPackFilter();
  
  // Initialize subsystem filter for INSTRUMENTS REPORT
  const subsystemFilter = useSubsystemFilter();
  
  // Combine all three filters - chain them together
  const finalControlData = React.useMemo(() => {
    if (activeDashboard !== 'INSTRUMENTS REPORT') return controlData;
    let data = isometricFilter.filteredControlData || controlData;
    data = testPackFilter.filterControlData(data);
    data = subsystemFilter.filterControlData(data);
    return data;
  }, [activeDashboard, isometricFilter.filteredControlData, controlData, testPackFilter.filterControlData, subsystemFilter.filterControlData]);
  
  const finalDetailData = React.useMemo(() => {
    if (activeDashboard !== 'INSTRUMENTS REPORT') return detailsData;
    let data = isometricFilter.filteredDetailData || detailsData;
    data = testPackFilter.filterDetailData(data);
    data = subsystemFilter.filterDetailData(data);
    return data;
  }, [activeDashboard, isometricFilter.filteredDetailData, detailsData, testPackFilter.filterDetailData, subsystemFilter.filterDetailData]);
  // Map tab index to dashboard name
  const dashboardNames = [
    'LOOP SIGNAL PROGRESS REPORT',
    'INSULATION PROGRESS REPORT',
    'TEST PACK PROGRESS',
    'INSTRUMENTS REPORT',
    'SUMMARY SUBSYSTEMS'
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
            index={activeIndex !== -1 ? activeIndex : 0} // Default to LOOP SIGNAL PROGRESS REPORT if not found
            onChange={handleTabChange}
        >
          <TabList mb="1em">
            <Tab>LOOP SIGNAL PROGRESS REPORT</Tab>
            <Tab>INSULATION PROGRESS REPORT</Tab>
            <Tab>TEST PACK PROGRESS REPORT</Tab>
            <Tab>INSTRUMENTS REPORT</Tab>
            <Tab>SUMMARY SUBSYSTEMS</Tab>
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
                <VStack spacing={0} align="stretch">
                  <IsolationProgressControlChart data={data} />
                  <InsulationProgressTable data={data} />
                </VStack>
              </Suspense>
            </TabPanel>

            <TabPanel p={0}>
              <Suspense fallback={<Center height="300px"><Spinner /></Center>}>
                <TestPackProgressChart data={data} />
              </Suspense>
            </TabPanel>

            <TabPanel p={0}>
              <Suspense fallback={<Center height="300px"><Spinner /></Center>}>
                <VStack spacing={4} align="stretch">
                  {/* Triple Filter Status */}
                  <HStack spacing={4} justify="center">
                    {isometricFilter.selectedIsometric && (
                      <Badge colorScheme="purple" fontSize="sm" px={3} py={1}>
                        ISOMETRIC: {isometricFilter.selectedIsometric}
                      </Badge>
                    )}
                    {subsystemFilter.selectedSubsystem && (
                      <Badge colorScheme="orange" fontSize="sm" px={3} py={1}>
                        SUBSYSTEM: {subsystemFilter.selectedSubsystem}
                      </Badge>
                    )}
                  </HStack>
                  <IsometricRelationshipPanel
                    selectedIsometric={isometricFilter.selectedIsometric}
                    matchingChains={isometricFilter.matchingChains}
                    relationshipStats={isometricFilter.relationshipStats}
                    onClearFilter={isometricFilter.onClearFilter}
                    onChainSelect={isometricFilter.onChainSelect}
                    selectedChainIndex={isometricFilter.selectedChainIndex}
                  />
                  <DynamicCalculationPanel
                    controlData={controlData}
                    detailsData={detailsData}
                    filteredControlData={finalControlData}
                    filteredDetailsData={finalDetailData}
                    filters={{
                      selectedIsometric: isometricFilter.selectedIsometric,
                      selectedTestPack: testPackFilter.selectedTestPack,
                      selectedSubsystem: subsystemFilter.selectedSubsystem
                    }}
                  />
                  {/*<DetailsInstrumentsTable */}
                  {/*  data={finalDetailData || detailsData || data}*/}
                  {/*  selectedIsometric={isometricFilter.selectedIsometric}*/}
                  {/*  onMountingLocationClick={isometricFilter.onIsometricSelect}*/}
                  {/*  highlightedRecords={isometricFilter.highlightedDetailRecords}*/}
                  {/*  selectedTestPack={testPackFilter.selectedTestPack}*/}
                  {/*  onTestPackClick={testPackFilter.handleTestPackClick}*/}
                  {/*  selectedSubsystem={subsystemFilter.selectedSubsystem}*/}
                  {/*  onSubsystemClick={subsystemFilter.handleSubsystemClick}*/}
                  {/*/>*/}
                  <InstrumentsTableFilterProvider>
                    <FilterStatusBar />
                    <DynamicInstrumentsTable/>
                    <DetailsInstrumentsTable/>
                    <ControlInstrumentsByIsometric/>
                  </InstrumentsTableFilterProvider>
                </VStack>
              </Suspense>
            </TabPanel>

            <TabPanel p={0}>
              <Suspense fallback={<Center height="300px"><Spinner /></Center>}>
                <SummarySubsystems data={data} />
              </Suspense>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
  );
};

export default ChartSelector;