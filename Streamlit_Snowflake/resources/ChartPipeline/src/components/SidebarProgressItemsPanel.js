import React, { useMemo } from 'react';
import { Box, VStack, Text, HStack, SimpleGrid } from '@chakra-ui/react';

/**
 * Calculate total items by subsystem from data
 * @param {Array} data - Dataset to calculate from
 * @returns {Object} Object with subsystem as key and total items as value
 */
export const calculateSubsystemTotalItems = (data) => {
  if (!data || data.length === 0) {
    return {};
  }

  const subsystemGroups = data.reduce((acc, row) => {
    const subsystem = row['SUBSYSTEM'] || row['Subsistema'] || row['SUBS_PRE'] || row['subsystem'] || 'Unknown';
    if (!acc[subsystem]) {
      acc[subsystem] = 0;
    }
    acc[subsystem]++;
    return acc;
  }, {});

  return subsystemGroups;
};

/**
 * SidebarProgressItemsPanel component for displaying progress items by subsystem
 * @param {Object} props - Component props
 * @param {Array} props.data - Filtered dataset to calculate progress items
 */
const SidebarProgressItemsPanel = ({ data }) => {
  // Calculate progress items for each metric by subsystem
  const progressItems = useMemo(() => {
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

    // Calculate progress items for each metric
    const calculateProgressItems = (metricField) => {
      const progressData = [];
      
      Object.keys(subsystemGroups).forEach(subsystem => {
        const subsystemData = subsystemGroups[subsystem];
        
        // Total items for this subsystem
        const totalItems = subsystemData.length;
        
        // Items done (where metric value equals 1)
        const itemsDone = subsystemData.filter(row => {
          const metricValue = parseFloat(row[metricField]) || 0;
          return metricValue === 1;
        }).length;
        
        // Items pending (where metric value is less than 1)
        const itemsPending = subsystemData.filter(row => {
          const metricValue = parseFloat(row[metricField]) || 0;
          return metricValue < 1;
        }).length;
        
        if (totalItems > 0) {
          progressData.push({
            subsystem,
            totalItems,
            itemsDone,
            itemsPending,
            donePercentage: (itemsDone / totalItems) * 100,
            pendingPercentage: (itemsPending / totalItems) * 100
          });
        }
      });
      
      // Sort by total items (largest first)
      return progressData.sort((a, b) => b.totalItems - a.totalItems);
    };

    return {
      spacer: calculateProgressItems('Avance Distanciadores'),
      insulation: calculateProgressItems('Avance Aislamiento'),
      sheetMetal: calculateProgressItems('Avance Chapa'),
      boxes: calculateProgressItems('Avance Cajas'),
      finish: calculateProgressItems('Avance Rematar'),
      mleqTotal: calculateProgressItems('Avance Mleq totales')
    };
  }, [data]);

  // Mini bar component for subsystem progress items
  const SubsystemProgressBar = ({ subsystem, totalItems, itemsDone, itemsPending, donePercentage, pendingPercentage }) => {
    const safeDonePercentage = Math.max(0, Math.min(100, donePercentage || 0));
    const safePendingPercentage = Math.max(0, Math.min(100, pendingPercentage || 0));
    
    return (
      <Box mb={1}>
        <Text fontSize="10px" fontWeight="bold" mb={1} color="gray.600" noOfLines={1} title={`${subsystem}: ${totalItems} total items`}>
          {subsystem.length > 18 ? subsystem.substring(0, 18) + '...' : subsystem}: {totalItems}
        </Text>
        <Box position="relative" height="22px" width="100%">
          <HStack spacing={0} height="100%" border="1px solid #000" borderRadius="sm" overflow="hidden">
            {/* Done segment */}
            {safeDonePercentage > 0 && (
              <Box
                bg="#1DE9B6"
                height="100%"
                width={`${safeDonePercentage}%`}
                display="flex"
                alignItems="center"
                justifyContent="center"
                position="relative"
              >
                {safeDonePercentage > 20 && (
                  <Text fontSize="8px" fontWeight="bold" color="#000">
                    {itemsDone}
                  </Text>
                )}
              </Box>
            )}
            {/* Pending segment */}
            {safePendingPercentage > 0 && (
              <Box
                bg="#FF168B"
                height="100%"
                width={`${safePendingPercentage}%`}
                display="flex"
                alignItems="center"
                justifyContent="center"
                position="relative"
              >
                {safePendingPercentage > 20 && (
                  <Text fontSize="8px" fontWeight="bold" color="#000">
                    {itemsPending}
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
  const MetricBlock = ({ title, progressData }) => {
    if (!progressData || progressData.length === 0) {
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
          {progressData.map((item, index) => (
            <SubsystemProgressBar
              key={index}
              subsystem={item.subsystem}
              totalItems={item.totalItems}
              itemsDone={item.itemsDone}
              itemsPending={item.itemsPending}
              donePercentage={item.donePercentage}
              pendingPercentage={item.pendingPercentage}
            />
          ))}
        </SimpleGrid>
      </Box>
    );
  };

  return (
    <>
      <Text fontSize="md" fontWeight="bold" mb={2} textAlign="center" color="gray.700">
        Progress Items
      </Text>
      <VStack spacing={0} align="stretch">
        <MetricBlock title="Spacer" progressData={progressItems.spacer} />
        <MetricBlock title="Insulation" progressData={progressItems.insulation} />
        <MetricBlock title="Sheet Metal" progressData={progressItems.sheetMetal} />
        <MetricBlock title="Boxes" progressData={progressItems.boxes} />
        <MetricBlock title="Finish" progressData={progressItems.finish} />
        <MetricBlock title="Mleq Total" progressData={progressItems.mleqTotal} />
      </VStack>
    </>
  );
};

export default React.memo(SidebarProgressItemsPanel);