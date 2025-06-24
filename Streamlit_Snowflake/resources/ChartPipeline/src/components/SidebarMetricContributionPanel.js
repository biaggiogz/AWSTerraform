import React, { useMemo } from 'react';
import { Box, VStack, Text, HStack, SimpleGrid } from '@chakra-ui/react';

/**
 * SidebarMetricContributionPanel component for displaying Subsystem Progress by metric
 * @param {Object} props - Component props
 * @param {Array} props.data - Filtered dataset to calculate Subsystem Progresss
 */
const SidebarMetricContributionPanel = ({ data }) => {
  // Calculate Subsystem Progresss for each metric
  const subsystemContributions = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        spacer: [],
        insulation: [],
        sheetMetal: [],
        boxes: [],
        finish: [],
        mleqTotal: []
      };
    }

    // Group data by subsystem - check all possible column names
    const subsystemGroups = data.reduce((acc, row) => {
      const subsystem = row['SUBSYSTEM'] || row['Subsistema'] || row['SUBS_PRE'] || row['subsystem'] || 'Unknown';
      if (!acc[subsystem]) {
        acc[subsystem] = [];
      }
      acc[subsystem].push(row);
      return acc;
    }, {});



    // Calculate contributions for each metric
    const calculateSubsystemContribution = (metricField) => {
      const subsystemContribs = [];
      
      Object.keys(subsystemGroups).forEach(subsystem => {
        const subsystemData = subsystemGroups[subsystem];
        const totalMleq = subsystemData.reduce((sum, row) => sum + (parseFloat(row['Mleq']) || 0), 0);
        
        if (totalMleq > 0) {
          const completedMleq = subsystemData.reduce((sum, row) => {
            const mleq = parseFloat(row['Mleq']) || 0;
            const progress = parseFloat(row[metricField]) || 0;
            return sum + (mleq * progress);
          }, 0);
          
          const completedPercent = (completedMleq / totalMleq) * 100;
          const incompletePercent = 100 - completedPercent;
          
          subsystemContribs.push({
            subsystem,
            completed: completedPercent,
            incomplete: incompletePercent,
            totalMleq
          });
        } else if (subsystemData.length > 0) {
          // Handle cases where Mleq might be 0 but we still want to show the subsystem
          const avgProgress = subsystemData.reduce((sum, row) => {
            return sum + (parseFloat(row[metricField]) || 0);
          }, 0) / subsystemData.length;
          
          subsystemContribs.push({
            subsystem,
            completed: avgProgress * 100,
            incomplete: (1 - avgProgress) * 100,
            totalMleq: 0
          });
        }
      });
      
      // Sort by total Mleq (largest contribution first)
      return subsystemContribs.sort((a, b) => b.totalMleq - a.totalMleq);
    };

    return {
      spacer: calculateSubsystemContribution('Avance Distanciadores'),
      insulation: calculateSubsystemContribution('Avance Aislamiento'),
      sheetMetal: calculateSubsystemContribution('Avance Chapa'),
      boxes: calculateSubsystemContribution('Avance Cajas'),
      finish: calculateSubsystemContribution('Avance Rematar'),
      mleqTotal: calculateSubsystemContribution('Avance Mleq totales')
    };
  }, [data]);

  // Mini bar component for Subsystem Progress
  const SubsystemContributionBar = ({ subsystem, completed, incomplete }) => {
    const safeCompleted = Math.max(0, Math.min(100, completed || 0));
    const safeIncomplete = Math.max(0, Math.min(100, incomplete || 0));
    
    return (
      <Box mb={1}>
        <Text fontSize="10px" fontWeight="bold" mb={1} color="gray.600" noOfLines={1} title={subsystem}>
          {subsystem.length > 15 ? subsystem.substring(0, 15) + '...' : subsystem}
        </Text>
        <Box position="relative" height="22px" width="100%">
          <HStack spacing={0} height="100%" border="1px solid #000" borderRadius="sm" overflow="hidden">
            {/* Complete segment */}
            {safeCompleted > 0 && (
              <Box
                bg="#1DE9B6"
                height="100%"
                width={`${safeCompleted}%`}
                display="flex"
                alignItems="center"
                justifyContent="center"
                position="relative"
              >
                {safeCompleted > 25 && (
                  <Text fontSize="8px" fontWeight="bold" color="#000">
                    {safeCompleted.toFixed(0)}%
                  </Text>
                )}
              </Box>
            )}
            {/* Incomplete segment */}
            {safeIncomplete > 0 && (
              <Box
                bg="#FF168B"
                height="100%"
                width={`${safeIncomplete}%`}
                display="flex"
                alignItems="center"
                justifyContent="center"
                position="relative"
              >
                {safeIncomplete > 25 && (
                  <Text fontSize="8px" fontWeight="bold" color="#000">
                    {safeIncomplete.toFixed(0)}%
                  </Text>
                )}
              </Box>
            )}
          </HStack>
        </Box>
      </Box>
    );
  };

  // Metric block component with three-column layout
  const MetricBlock = ({ title, subsystemData }) => {
    if (!subsystemData || subsystemData.length === 0) {
      return (
        <Box mb={4} p={3} bg="gray.50" borderRadius="md">
          <Text fontSize="sm" fontWeight="bold" mb={2} textAlign="center" color="gray.700">
            {title}
          </Text>
          <Text fontSize="xs" color="gray.500" textAlign="center">
            No data available
          </Text>
        </Box>
      );
    }

    return (
      <Box mb={2} p={1} bg="gray.50" borderRadius="md">
        <Text fontSize="sm" fontWeight="bold" mb={3} textAlign="center" color="gray.700">
          {title}
        </Text>
        <SimpleGrid columns={3} spacing={1}>
          {subsystemData.map((item, index) => (
            <SubsystemContributionBar
              key={index}
              subsystem={item.subsystem}
              completed={item.completed}
              incomplete={item.incomplete}
            />
          ))}
        </SimpleGrid>
      </Box>
    );
  };

  return (
    <>
      <Text fontSize="md" fontWeight="bold" mb={2} textAlign="center" color="gray.700">
        Subsystem Progress by Advance
      </Text>
      <VStack spacing={0} align="stretch">
        <MetricBlock title="Spacer Advance" subsystemData={subsystemContributions.spacer} />
        <MetricBlock title="Insulation Advance" subsystemData={subsystemContributions.insulation} />
        <MetricBlock title="Sheet Metal Advance" subsystemData={subsystemContributions.sheetMetal} />
        <MetricBlock title="Boxes Advance" subsystemData={subsystemContributions.boxes} />
        <MetricBlock title="Finish Advance" subsystemData={subsystemContributions.finish} />
        <MetricBlock title="Mleq Total Advance" subsystemData={subsystemContributions.mleqTotal} />
      </VStack>
    </>
  );
};

export default React.memo(SidebarMetricContributionPanel);