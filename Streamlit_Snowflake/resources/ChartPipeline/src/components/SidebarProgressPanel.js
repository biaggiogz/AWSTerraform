import React, { useMemo } from 'react';
import { Box, VStack, Text, HStack, SimpleGrid } from '@chakra-ui/react';

/**
 * SidebarProgressPanel component for displaying area contribution by metric
 * @param {Object} props - Component props
 * @param {Array} props.data - Filtered dataset to calculate area contributions
 */
const SidebarProgressPanel = ({ data }) => {
  // Calculate area contributions for each metric
  const areaContributions = useMemo(() => {
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

    // Group data by area
    const areaGroups = data.reduce((acc, row) => {
      const area = row['Area'] || 'Unknown';
      if (!acc[area]) {
        acc[area] = [];
      }
      acc[area].push(row);
      return acc;
    }, {});

    // Calculate contributions for each metric
    const calculateAreaContribution = (metricField) => {
      const areaContribs = [];
      
      Object.keys(areaGroups).forEach(area => {
        const areaData = areaGroups[area];
        const totalMleq = areaData.reduce((sum, row) => sum + (parseFloat(row['Mleq']) || 0), 0);
        
        if (totalMleq > 0) {
          const completedMleq = areaData.reduce((sum, row) => {
            const mleq = parseFloat(row['Mleq']) || 0;
            const progress = parseFloat(row[metricField]) || 0;
            return sum + (mleq * progress);
          }, 0);
          
          const completedPercent = (completedMleq / totalMleq) * 100;
          const incompletePercent = 100 - completedPercent;
          
          areaContribs.push({
            area,
            completed: completedPercent,
            incomplete: incompletePercent,
            totalMleq
          });
        }
      });
      
      // Sort by total Mleq (largest contribution first)
      return areaContribs.sort((a, b) => b.totalMleq - a.totalMleq);
    };

    return {
      spacer: calculateAreaContribution('Avance Distanciadores'),
      insulation: calculateAreaContribution('Avance Aislamiento'),
      sheetMetal: calculateAreaContribution('Avance Chapa'),
      boxes: calculateAreaContribution('Avance Cajas'),
      finish: calculateAreaContribution('Avance Rematar'),
      mleqTotal: calculateAreaContribution('Avance Mleq totales')
    };
  }, [data]);

  // Mini bar component for area contribution
  const AreaContributionBar = ({ area, completed, incomplete }) => {
    const safeCompleted = Math.max(0, Math.min(100, completed || 0));
    const safeIncomplete = Math.max(0, Math.min(100, incomplete || 0));
    
    return (
      <Box mb={2}>
        <Text fontSize="xs" fontWeight="bold" mb={1} color="gray.600">
          {area}
        </Text>
        <Box position="relative" height="20px" width="100%">
          <HStack spacing={0} height="100%" border="1.5px solid #000" borderRadius="sm" overflow="hidden">
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
                {safeCompleted > 15 && (
                  <Text fontSize="10px" fontWeight="bold" color="#000">
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
                {safeIncomplete > 15 && (
                  <Text fontSize="10px" fontWeight="bold" color="#000">
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
  const MetricBlock = ({ title, areaData }) => {
    if (!areaData || areaData.length === 0) {
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
          {areaData.map((item, index) => (
            <AreaContributionBar
              key={index}
              area={item.area}
              completed={item.completed}
              incomplete={item.incomplete}
            />
          ))}
        </SimpleGrid>
      </Box>
    );
  };

  return (
    <VStack spacing={0} align="stretch">
      <MetricBlock title="Spacer Advance" areaData={areaContributions.spacer} />
      <MetricBlock title="Insulation Advance" areaData={areaContributions.insulation} />
      <MetricBlock title="Sheet Metal Advance" areaData={areaContributions.sheetMetal} />
      <MetricBlock title="Boxes Advance" areaData={areaContributions.boxes} />
      <MetricBlock title="Finish Advance" areaData={areaContributions.finish} />
      <MetricBlock title="Mleq Total Advance" areaData={areaContributions.mleqTotal} />
    </VStack>
  );
};

export default React.memo(SidebarProgressPanel);