import React, { useMemo } from 'react';
import { Box, Heading, Spinner, Center, Text } from '@chakra-ui/react';
import { Treemap } from 'react-chartjs-2';
import { Chart as ChartJS, TreemapController, TreemapElement, Tooltip, Legend } from 'chart.js';
import { useInstrumentsTableFilterContext } from '../components/filters/InstrumentsTableFilter';

// Register the treemap components
ChartJS.register(TreemapController, TreemapElement, Tooltip, Legend);

const InstrumentsTreemapChart = ({ tableData, loading, error }) => {
  const { selectedSubsystem, selectedTestPack, handleSubsystemClick, handleTestPackClick } = useInstrumentsTableFilterContext();

  // Process data for treemap visualization
  const chartData = useMemo(() => {
    if (!tableData || tableData.length === 0) return null;

    // Create hierarchical data structure for treemap
    const processData = (nodes, parentLabel = '') => {
      return nodes.flatMap(node => {
        // Get the current node's label based on available properties
        const nodeLabel = node.SUBSYSTEM || node.HITO || node.TP || 'Unknown';
        const fullLabel = parentLabel ? `${parentLabel} > ${nodeLabel}` : nodeLabel;
        
        // Calculate values for this node
        const value = node['TOTAL INST'] || 0;
        const installedTeiga = node['INSTALLED BY TEIGA-TMI'] || 0;
        const installedSiemsa = node['INSTALLED BY SIEMSA'] || 0;
        const pending = node['PENDING'] || 0;
        
        // Calculate completion percentage
        const completionPercentage = value > 0 
          ? Math.round(((installedTeiga + installedSiemsa) / value) * 100) 
          : 0;
        
        // Create the node object
        const result = [{
          label: nodeLabel,
          fullLabel,
          value,
          installedTeiga,
          installedSiemsa,
          pending,
          completionPercentage,
          backgroundColor: getColorByCompletion(completionPercentage),
          hoverBackgroundColor: getColorByCompletion(completionPercentage, true)
        }];
        
        // Process children if they exist
        if (node.children && node.children.length > 0) {
          const childrenData = processData(node.children, fullLabel);
          return [...result, ...childrenData];
        }
        
        return result;
      });
    };
    
    return {
      datasets: [{
        tree: processData(tableData),
        key: 'value',
        groups: ['fullLabel'],
        spacing: 1,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.5)',
        captions: {
          display: true,
          color: 'white',
          font: {
            weight: 'bold'
          }
        }
      }]
    };
  }, [tableData]);

  // Color function based on completion percentage
  const getColorByCompletion = (percentage, isHover = false) => {
    if (percentage >= 90) {
      return isHover ? 'rgba(39, 174, 96, 1.0)' : 'rgba(39, 174, 96, 0.8)';
    } else if (percentage >= 70) {
      return isHover ? 'rgba(241, 196, 15, 1.0)' : 'rgba(241, 196, 15, 0.8)';
    } else {
      return isHover ? 'rgba(231, 76, 60, 1.0)' : 'rgba(231, 76, 60, 0.8)';
    }
  };

  // Chart options
  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      tooltip: {
        callbacks: {
          title: (context) => {
            return context[0].raw.fullLabel || '';
          },
          label: (context) => {
            const item = context.raw;
            return [
              `Total: ${item.value}`,
              `Installed by TEIGA-TMI: ${item.installedTeiga}`,
              `Installed by SIEMSA: ${item.installedSiemsa}`,
              `Pending: ${item.pending}`,
              `Completion: ${item.completionPercentage}%`
            ];
          }
        }
      },
      legend: {
        display: false
      }
    }
  }), []);

  if (loading) {
    return (
      <Box height="500px" borderWidth="1px" borderRadius="lg" bg="white">
        <Center height="100%">
          <Spinner size="sm" mr={2} />
          <Text>Loading treemap data...</Text>
        </Center>
      </Box>
    );
  }

  if (error) {
    return (
      <Box height="500px" borderWidth="1px" borderRadius="lg" bg="white" p={4}>
        <Heading size="sm" mb={2} color="red.500">Error Loading Treemap</Heading>
        <Text>{error}</Text>
      </Box>
    );
  }

  if (!chartData) {
    return (
      <Box height="500px" borderWidth="1px" borderRadius="lg" bg="white">
        <Center height="100%">
          <Text>No data available for treemap visualization</Text>
        </Center>
      </Box>
    );
  }

  return (
    <Box height="500px" borderWidth="1px" borderRadius="lg" bg="white" p={2}>
      <Heading size="md" mb={4} textAlign="center">Instruments Installation Status</Heading>
      <Box height="calc(100% - 40px)">
        <Treemap data={chartData} options={options} />
      </Box>
    </Box>
  );
};

export default InstrumentsTreemapChart;