import React, { useMemo } from 'react';
import { Box, VStack, Text, HStack, SimpleGrid } from '@chakra-ui/react';

/**
 * SidebarProgressItemsPanel component for displaying progress items by subsystem
 * @param {Object} props - Component props
 * @param {Array} props.data - Filtered dataset to calculate subsystem progress items
 */
const SidebarProgressItemsPanel = ({ data }) => {
  // Calculate subsystem progress items for each metric
  const subsystemProgressItems = useMemo(() => {
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

    // Group data by subsystem
    const subsystemGroups = data.reduce((acc, row) => {
      const subsystem = row['SUBSYSTEM'] || row['Subsistema'] || row['SUBS_PRE'] || row['subsystem'] || 'Unknown';
      if (!acc[subsystem]) {
        acc[subsystem] = [];
      }
      acc[subsystem].push(row);
      return acc;
    }, {});

    // Calculate progress items for each metric
    const calculateSubsystemProgressItems = (metricField) => {
      const subsystemItems = [];
      
      Object.keys(subsystemGroups).forEach(subsystem => {
        const subsystemData = subsystemGroups[subsystem];
        
        // Total items for this subsystem
        const totalItems = subsystemData.length;
        
        let itemsDone, itemsPending;
        
        if (metricField === 'Avance Mleq totales') {
          // For Mleq Total Advance, consider done if value > 0
          itemsDone = subsystemData.filter(row => {
            const metricValue = parseFloat(row[metricField]) || 0;
            return metricValue > 0;
          }).length;
          
          itemsPending = subsystemData.filter(row => {
            const metricValue = parseFloat(row[metricField]) || 0;
            return metricValue <= 0;
          }).length;
        } else {
          // For other metrics, use the original logic (value equals 1 for done)
          itemsDone = subsystemData.filter(row => {
            const metricValue = parseFloat(row[metricField]) || 0;
            return metricValue === 1;
          }).length;
          
          itemsPending = subsystemData.filter(row => {
            const metricValue = parseFloat(row[metricField]) || 0;
            return metricValue < 1;
          }).length;
        }
        
        subsystemItems.push({
          subsystem,
          totalItems,
          itemsDone,
          itemsPending
        });
      });
      
      // Sort by total items (largest first)
      return subsystemItems.sort((a, b) => b.totalItems - a.totalItems);
    };

    return {
      spacer: calculateSubsystemProgressItems('Avance Distanciadores'),
      insulation: calculateSubsystemProgressItems('Avance Aislamiento'),
      sheetMetal: calculateSubsystemProgressItems('Avance Chapa'),
      boxes: calculateSubsystemProgressItems('Avance Cajas'),
      finish: calculateSubsystemProgressItems('Avance Rematar'),
      mleqTotal: calculateSubsystemProgressItems('Avance Mleq totales')
    };
  }, [data]);

  // Mini bar component for subsystem progress items
  const SubsystemProgressItemsBar = ({ subsystem, totalItems, itemsDone, itemsPending }) => {
    const donePercent = totalItems > 0 ? (itemsDone / totalItems) * 100 : 0;
    const pendingPercent = totalItems > 0 ? (itemsPending / totalItems) * 100 : 0;
    
    return (
      <Box mb={1}>
        <Text fontSize="10px" fontWeight="bold" mb={1} color="gray.600" noOfLines={1} title={`${subsystem}: ${totalItems} items`}>
          {subsystem.length > 20 ? subsystem.substring(0, 20) + '...' : subsystem}: {totalItems}
        </Text>
        <Box position="relative" height="22px" width="100%">
          <HStack spacing={0} height="100%" border="1px solid #000" borderRadius="sm" overflow="hidden">
            {/* Done segment */}
            {donePercent > 0 && (
              <Box
                bg="#1DE9B6"
                height="100%"
                width={`${donePercent}%`}
                display="flex"
                alignItems="center"
                justifyContent="center"
                position="relative"
              >
                {donePercent > 20 && (
                  <Text fontSize="8px" fontWeight="bold" color="#000">
                    {itemsDone}
                  </Text>
                )}
              </Box>
            )}
            {/* Pending segment */}
            {pendingPercent > 0 && (
              <Box
                bg="#FF168B"
                height="100%"
                width={`${pendingPercent}%`}
                display="flex"
                alignItems="center"
                justifyContent="center"
                position="relative"
              >
                {pendingPercent > 20 && (
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
            <SubsystemProgressItemsBar
              key={index}
              subsystem={item.subsystem}
              totalItems={item.totalItems}
              itemsDone={item.itemsDone}
              itemsPending={item.itemsPending}
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
        <MetricBlock title="Spacer Advance" subsystemData={subsystemProgressItems.spacer} />
        <MetricBlock title="Insulation Advance" subsystemData={subsystemProgressItems.insulation} />
        <MetricBlock title="Sheet Metal Advance" subsystemData={subsystemProgressItems.sheetMetal} />
        <MetricBlock title="Boxes Advance" subsystemData={subsystemProgressItems.boxes} />
        <MetricBlock title="Finish Advance" subsystemData={subsystemProgressItems.finish} />
        <MetricBlock title="Mleq Total Advance" subsystemData={subsystemProgressItems.mleqTotal} />
      </VStack>
    </>
  );
};

export default React.memo(SidebarProgressItemsPanel);