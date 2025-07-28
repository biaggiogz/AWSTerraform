import React, { useMemo } from 'react';
import { Box, Text, HStack } from '@chakra-ui/react';
import BaseSidebarPanel from './base/BaseSidebarPanel';

/**
 * SidebarMetricContributionPanel component for displaying Subsystem Progress by metric
 * @param {Object} props - Component props
 * @param {Array} props.data - Filtered dataset to calculate Subsystem Progresss
 */
const SidebarMetricContributionPanel = ({ data }) => {
  // Data processor function
  const dataProcessor = useMemo(() => (data) => {
    return data.reduce((acc, row) => {
      const subsystem = row['SUBSYSTEM'] || row['Subsistema'] || row['SUBS_PRE'] || row['subsystem'] || 'Unknown';
      if (!acc[subsystem]) {
        acc[subsystem] = [];
      }
      acc[subsystem].push(row);
      return acc;
    }, {});
  }, []);

  // Metric calculator function
  const metricCalculator = useMemo(() => (subsystemGroups, metric) => {
    const subsystemContribs = [];
    
    Object.keys(subsystemGroups).forEach(subsystem => {
      const subsystemData = subsystemGroups[subsystem];
      const totalMleq = subsystemData.reduce((sum, row) => sum + (parseFloat(row['Mleq']) || 0), 0);
      
      if (totalMleq > 0) {
        const DonedMleq = subsystemData.reduce((sum, row) => {
          const mleq = parseFloat(row['Mleq']) || 0;
          const progress = parseFloat(row[metric.field]) || 0;
          return sum + (mleq * progress);
        }, 0);
        
        const DonedPercent = (DonedMleq / totalMleq) * 100;
        const PendingPercent = 100 - DonedPercent;
        
        subsystemContribs.push({
          subsystem,
          Doned: DonedPercent,
          Pending: PendingPercent,
          totalMleq
        });
      } else if (subsystemData.length > 0) {
        const avgProgress = subsystemData.reduce((sum, row) => {
          return sum + (parseFloat(row[metric.field]) || 0);
        }, 0) / subsystemData.length;
        
        subsystemContribs.push({
          subsystem,
          Doned: avgProgress * 100,
          Pending: (1 - avgProgress) * 100,
          totalMleq: 0
        });
      }
    });
    
    return subsystemContribs.sort((a, b) => b.totalMleq - a.totalMleq);
  }, []);

  // Metrics configuration
  const metrics = [
    { key: 'spacer', title: 'Spacer Advance', field: 'Avance Distanciadores' },
    { key: 'insulation', title: 'Insulation Advance', field: 'Avance Aislamiento' },
    { key: 'sheetMetal', title: 'Sheet Metal Advance', field: 'Avance Chapa' },
    { key: 'boxes', title: 'Boxes Advance', field: 'Avance Cajas' },
    { key: 'finish', title: 'Finish Advance', field: 'Avance Rematar' },
    { key: 'mleqTotal', title: 'Mleq Total Advance', field: 'Avance Mleq totales' }
  ];

// Mini bar component for Subsystem Progress
const SubsystemContributionBar = ({ subsystem, Doned, Pending }) => {
  const safeDoned = Math.max(0, Math.min(100, Doned || 0));
  const safePending = Math.max(0, Math.min(100, Pending || 0));
  
  return (
    <Box mb={1}>
      <Text fontSize="10px" fontWeight="bold" mb={1} color="gray.600" noOfLines={1} title={subsystem}>
        {subsystem.length > 18 ? subsystem.substring(0, 18) + '...' : subsystem}
      </Text>
      <Box position="relative" height="22px" width="100%">
        <HStack spacing={0} height="100%" border="1px solid #000" borderRadius="sm" overflow="hidden">
          {/* Done segment */}
          {safeDoned > 0 && (
            <Box
              bg="#1DE9B6"
              height="100%"
              width={`${safeDoned}%`}
              display="flex"
              alignItems="center"
              justifyContent="center"
              position="relative"
            >
              {safeDoned > 25 && (
                <Text fontSize="8px" fontWeight="bold" color="#000">
                  {safeDoned.toFixed(0)}%
                </Text>
              )}
            </Box>
          )}
          {/* Pending segment */}
          {safePending > 0 && (
            <Box
              bg="#FF168B"
              height="100%"
              width={`${safePending}%`}
              display="flex"
              alignItems="center"
              justifyContent="center"
              position="relative"
            >
              {safePending > 25 && (
                <Text fontSize="8px" fontWeight="bold" color="#000">
                  {safePending.toFixed(0)}%
                </Text>
              )}
            </Box>
          )}
        </HStack>
      </Box>
    </Box>
  );
};

  return (
    <BaseSidebarPanel
      data={data}
      title="Subsystem Progress by Advance"
      metrics={metrics}
      dataProcessor={dataProcessor}
      metricCalculator={metricCalculator}
      itemComponent={SubsystemContributionBar}
      gridColumns={3}
    />
  );
};

export default React.memo(SidebarMetricContributionPanel);