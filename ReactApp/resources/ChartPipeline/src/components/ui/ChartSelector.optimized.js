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
import { useIsometricRelationshipFilter } from '../filters/IsometricRelationshipFilter.optimized';
import { useTestPackFilter } from '../filters/TestPackRelationshipFilter.optimized';
import { useSubsystemFilter } from '../filters/SubsystemRelationshipFilter.optimized';
import { InstrumentsTableFilterProvider } from '../filters/InstrumentsTableFilter';
import { LazosTableSqlFilterProvider } from '../filters/LazosTableFilter';
import FilterStatusBar from '../filters/FilterStatusBar';

// Lazy load chart components
const LoopTestProgressChart = lazy(() => import('../../charts/LazosTestProgressChart.optimized'));
const SubsystemDonutChart = lazy(() => import('../../charts/SubsystemDonutChart'));
const IsolationProgressControlChart = lazy(() => import('../../charts/IsolationProgressControlChart.optimized'));
const TestPackProgressChart = lazy(() => import('../../charts/TestPackProgressChart.optimized'));
const LazosTableSql = lazy(() => import('../tables/LazosTableSqlDuckDb'));
const InsulationProgressTable = lazy(() => import('../tables/InsulationProgressTable.optimized'));
const ControlInstrumentsByIsometric = lazy(() => import('../tables/ControlInstrumentsByIsometric.optimized'));
const DynamicInstrumentsTable = lazy(() => import('../tables/DynamicInstrumentsTable.optimized'));
const DetailsInstrumentsTable = lazy(() => import('../tables/DetailsInstrumentsTable.superoptimized'));
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
 * @param {Object} props.multiFilters - External filters from main filter panel
 */
const ChartSelector = ({ data, rawData, controlData, detailsData, activeDashboard, onDashboardChange, onProgressFilter, progressFilter, multiFilters = {} }) => {
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
    'SUMMARY SUBSYSTEMS',
    'LOOP SIGNAL PROGRESS REPORT',
    'TEST PACK PROGRESS',
    'INSTRUMENTS REPORT',
    'INSULATION PROGRESS REPORT'
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
            index={activeIndex !== -1 ? activeIndex : 0} // Default to SUMMARY SUBSYSTEMS if not found
            onChange={handleTabChange}
        >
          <TabList mb="1em">
            <Tab>SUMMARY SUBSYSTEMS</Tab>
            <Tab>LOOP SIGNAL PROGRESS REPORT</Tab>
            <Tab>TEST PACK PROGRESS</Tab>
            <Tab>INSTRUMENTS REPORT</Tab>
            <Tab>INSULATION PROGRESS REPORT</Tab>
          </TabList>
          <TabPanels>
            <TabPanel p={0}>
              <Suspense fallback={<Center height="300px"><Spinner /></Center>}>
                <SummarySubsystems data={data} />
              </Suspense>
            </TabPanel>
            <TabPanel p={0}>
              <Suspense fallback={<Center height="300px"><Spinner /></Center>}>
                <LazosTableSqlFilterProvider externalFilters={multiFilters} progressFilter={progressFilter}>
                  <VStack spacing={4} align="stretch">
                    <HStack spacing={4} align="flex-start">
                      <Box flex={2}>
                        <LoopTestProgressChart
                            data={data}
                            rawData={rawData}
                            onProgressFilter={onProgressFilter}
                            progressFilter={progressFilter}
                            filterMappings={{ area: 'area_tlp', subsystem: 'subsystem' }}
                        />
                      </Box>
                      <Box flex={1}>
                        <SubsystemDonutChart />
                      </Box>
                    </HStack>
                    <LazosTableSql />
                  </VStack>
                </LazosTableSqlFilterProvider>
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
                <VStack spacing={0} align="stretch">
                  <IsolationProgressControlChart data={data} />
                  <InsulationProgressTable data={data} />
                </VStack>
              </Suspense>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
  );
};

export default ChartSelector;