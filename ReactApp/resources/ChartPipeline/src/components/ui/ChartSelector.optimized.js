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

import { InstrumentsTableFilterProvider } from '../filters/InstrumentsTableFilter';
import { LazosTableSqlFilterProvider } from '../filters/LazosTableFilter';
import FilterStatusBar from '../filters/FilterStatusBar';

// Lazy load chart components
const LoopTestProgressChart = lazy(() => import('../../charts/LazosTestProgressChart.optimized'));
const SubsystemCompletionChart = lazy(() => import('../../charts/SubsystemCompletionChart'));

const IsolationProgressControlChart = lazy(() => import('../../charts/IsolationProgressControlChart.optimized'));
const TestPackProgressChart = lazy(() => import('../../charts/TestPackProgressChart.optimized'));
const LazosTableSql = lazy(() => import('../tables/LazosTableSqlDuckDb'));
const InsulationProgressTable = lazy(() => import('../tables/InsulationProgressTable.optimized'));
const ControlInstrumentsByIsometric = lazy(() => import('../tables/ControlInstrumentsByIsometric.optimized'));
const DynamicInstrumentsTable = lazy(() => import('../tables/DynamicInstrumentsTable.optimized'));
const DetailsInstrumentsTable = lazy(() => import('../tables/DetailsInstrumentsTable.superoptimized'));
const DynamicCalculationPanel = lazy(() => import('../panels/DynamicCalculationPanel'));
const SummarySubsystems = lazy(() => import('../panels/SummarySubsystems'));
const FileUploadSection = lazy(() => import('./FileUploadSection'));

/**
 * ChartSelector component to switch between different charts
 * @param {Object} props - Component props
 * @param {Array} props.data - Filtered dataset
 * @param {Array} props.rawData - Raw unfiltered dataset for global metrics

 * @param {string} props.activeDashboard - Currently active dashboard
 * @param {Function} props.onDashboardChange - Function to call when dashboard changes
 * @param {Function} props.onProgressFilter - Function to handle progress filtering
 * @param {string} props.progressFilter - Current progress filter
 * @param {Object} props.multiFilters - External filters from main filter panel
 */
const ChartSelector = ({ data, rawData, activeDashboard, onDashboardChange, onProgressFilter, progressFilter, multiFilters = {} }) => {

  // Map tab index to dashboard name
  const dashboardNames = [
    'SUMMARY SUBSYSTEMS',
    'LOOP SIGNAL PROGRESS REPORT',
    'TEST PACK PROGRESS',
    'INSTRUMENTS REPORT',
    'INSULATION PROGRESS REPORT',
    'UPDATE DATASET'
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
            <Tab>UPDATE DATASET</Tab>
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
                      <Box flex="2">
                        <LoopTestProgressChart
                            data={data}
                            rawData={rawData}
                            onProgressFilter={onProgressFilter}
                            progressFilter={progressFilter}
                            filterMappings={{ area: 'area_tlp', subsystem: 'subsystem' }}
                        />
                      </Box>
                      <Box flex="1">
                        <SubsystemCompletionChart />
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
                  <DynamicCalculationPanel />
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

            <TabPanel p={0}>
              <Suspense fallback={<Center height="300px"><Spinner /></Center>}>
                <FileUploadSection />
              </Suspense>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
  );
};

export default ChartSelector;