import React, { useMemo, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Badge,
  Grid,
  GridItem,

} from '@chakra-ui/react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import SidebarMetricContributionPanel from '../components/SidebarMetricContributionPanel';
import SidebarProgressItemsPanel from '../components/SidebarProgressItemsPanel';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels
);

/**
 * IsolationProgressControlChart component for displaying isolation progress metrics
 * @param {Object} props - Component props
 * @param {Array} props.data - Filtered dataset
 */
const IsolationProgressControlChart = ({ data }) => {
  // State for toggling between different panel views (0: Subsystem, 1: Progress Items)
  const [panelView, setPanelView] = useState(0);
  // Calculate metrics based on the requirements
  const metrics = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        C_Mleq: 0,
        advance_spacer: 0,
        advance_insolation: 25,
        advance_sheet_metal: 40,
        advance_boxes: 25,
        advance_to_finish: 10,
        m_advance_mleq_total: 0,
        a_advance_mleq_total: 0
      };
    }

    // Constants (not responsive to filters)
    const C_Mleq = data.reduce((sum, row) => sum + (parseFloat(row['Mleq']) || 0), 0);

    // Weighted averages (responsive to filters)
    const advance_spacer = C_Mleq > 0 ? 
      data.reduce((sum, row) => sum + ((parseFloat(row['Mleq']) || 0) * (parseFloat(row['Avance Distanciadores']) || 0)), 0) / C_Mleq * 100 : 0;
    
    const advance_insolation = C_Mleq > 0 ? 
      data.reduce((sum, row) => sum + ((parseFloat(row['Mleq']) || 0) * (parseFloat(row['Avance Aislamiento']) || 0)), 0) / C_Mleq * 100 : 0;
    
    const advance_sheet_metal = C_Mleq > 0 ? 
      data.reduce((sum, row) => sum + ((parseFloat(row['Mleq']) || 0) * (parseFloat(row['Avance Chapa']) || 0)), 0) / C_Mleq * 100 : 0;
    
    const advance_boxes = C_Mleq > 0 ? 
      data.reduce((sum, row) => sum + ((parseFloat(row['Mleq']) || 0) * (parseFloat(row['Avance Cajas']) || 0)), 0) / C_Mleq * 100 : 0;
    
    const advance_to_finish = C_Mleq > 0 ? 
      data.reduce((sum, row) => sum + ((parseFloat(row['Mleq']) || 0) * (parseFloat(row['Avance Rematar']) || 0)), 0) / C_Mleq * 100 : 0;

    // Metric in custom "m" format
    const m_advance_mleq_total = data.reduce((sum, row) => sum + (parseFloat(row['Avance Mleq totales']) || 0), 0);
    
    // Percentage of total
    const a_advance_mleq_total = C_Mleq > 0 ? (m_advance_mleq_total / C_Mleq) * 100 : 0;

    return {
      C_Mleq,
      advance_spacer,
      advance_insolation,
      advance_sheet_metal,
      advance_boxes,
      advance_to_finish,
      m_advance_mleq_total,
      a_advance_mleq_total
    };
  }, [data]);

  // Prepare chart data
  const chartData = useMemo(() => {
    const categories = [
      'Spacer Advance',
      'Insulation Advance', 
      'Sheet Metal Advance',
      'Boxes Advance',
      'Finish Advance',
      'Mleq Total Advance'
    ];

    const completedValues = [
      metrics.advance_spacer,
      metrics.advance_insolation,
      metrics.advance_sheet_metal,
      metrics.advance_boxes,
      metrics.advance_to_finish,
      metrics.a_advance_mleq_total
    ];

    const incompleteValues = completedValues.map(val => 100 - val);

    return {
      labels: categories,
      datasets: [
        {
          label: 'Complete',
          data: completedValues,
          backgroundColor: '#1DE9B6',
          borderColor: '#000',
          borderWidth: 2,
          stack: 'stack1'
        },
        {
          label: 'Incomplete',
          data: incompleteValues,
          backgroundColor: '#FF168B',
          borderColor: '#000',
          borderWidth: 2,
          stack: 'stack1'
        }
      ]
    };
  }, [metrics]);

  // Chart options
  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'x',
    scales: {
      x: {
        stacked: true,
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: 11,
            weight: 'bold'
          }
        }
      },
      y: {
        stacked: true,
        beginAtZero: true,
        max: 100,
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.1)'
        },
        ticks: {
          callback: function(value) {
            return value + '%';
          }
        }
      }
    },
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
            weight: 'bold'
          }
        }
      },
      tooltip: {
        enabled: true,
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${context.parsed.y.toFixed(1)}%`;
          }
        }
      },
      datalabels: {
        display: true,
        color: '#000',
        font: {
          size: 12,
          weight: 'bold'
        },
        formatter: function(value, context) {
          return value > 5 ? `${value.toFixed(0)}%` : '';
        },
        anchor: 'center',
        align: 'center'
      }
    },
    layout: {
      padding: {
        top: 20,
        bottom: 20,
        left: 10,
        right: 10
      }
    }
  }), []);

  // Metrics header display
  const metricsHeader = useMemo(() => [
    { label: 'Spacer', value: metrics.advance_spacer.toFixed(1) + '%' },
    { label: 'Insulation', value: metrics.advance_insolation.toFixed(1) + '%' },
    { label: 'Sheet Metal', value: metrics.advance_sheet_metal.toFixed(1) + '%' },
    { label: 'Boxes', value: metrics.advance_boxes.toFixed(1) + '%' },
    { label: 'Finish', value: metrics.advance_to_finish.toFixed(1) + '%' },
    { label: 'Mleq Total', value: metrics.m_advance_mleq_total.toFixed(2) + ' m' }
  ], [metrics]);

  return (
    <Grid templateColumns={{ base: "1fr", lg: "1fr 300px" }} gap={4}>
      {/* Left column with header and chart */}
      <GridItem>
        <VStack spacing={4}>
          {/* Header with metric values */}
          <Box bg="white" p={0.5} borderRadius="lg" borderWidth="1px" w="full">
            <Heading size="10px" mb={4} textAlign="center">
              Advance
            </Heading>
            
            <HStack spacing={0} justify="space-between" mb={4} px={10}>
              {metricsHeader.map((metric, index) => (
                <VStack key={index} spacing={1} flex={1}>
                  <Text fontSize="xs" fontWeight="bold" textAlign="center" color="gray.600">
                    {metric.label}
                  </Text>
                  <Badge 
                    colorScheme="blue" 
                    fontSize="sm" 
                    p={2} 
                    borderRadius="md"
                    textAlign="center"
                    minW="60px"
                  >
                    {metric.value}
                  </Badge>
                </VStack>
              ))}
            </HStack>
          </Box>

          {/* Main chart */}
          <Box bg="white" p={4} borderRadius="lg" borderWidth="1px" w="full">
            <Box height="400px" position="relative">
              <Bar data={chartData} options={options} />
            </Box>
            
            {/* Summary info */}
            <HStack justify="space-between" mt={4} pt={4} borderTopWidth="1px">
              <Text fontSize="sm" color="gray.600">
                Total Mleq: {metrics.C_Mleq.toFixed(2)} m
              </Text>
              {/*<Text fontSize="sm" color="gray.600">*/}
              {/*  Records: {data.length}*/}
              {/*</Text>*/}
            </HStack>
          </Box>
        </VStack>
      </GridItem>

      {/* Sidebar with contribution panels - right side */}
      <GridItem>
        <Box 
          bg="white" 
          p={2}
          borderRadius="lg" 
          borderWidth="1px" 
          minW={{ base: "100%", lg: "320px" }}
          maxW="360px"
          maxH="622px"
          overflowY="auto"
        >
          {/* Panel selector buttons */}
          <HStack spacing={1} mb={4} justify="center">
            <Box
              as="button"
              px={2}
              py={1}
              fontSize="xs"
              fontWeight="bold"
              bg={panelView === 0 ? "blue.500" : "gray.200"}
              color={panelView === 0 ? "white" : "gray.700"}
              borderRadius="md"
              onClick={() => setPanelView(0)}
              _hover={{ bg: panelView === 0 ? "blue.600" : "gray.300" }}
            >
              Subsystem
            </Box>
            <Box
              as="button"
              px={2}
              py={1}
              fontSize="xs"
              fontWeight="bold"
              bg={panelView === 1 ? "blue.500" : "gray.200"}
              color={panelView === 1 ? "white" : "gray.700"}
              borderRadius="md"
              onClick={() => setPanelView(1)}
              _hover={{ bg: panelView === 1 ? "blue.600" : "gray.300" }}
            >
              Items
            </Box>
          </HStack>
          
          {/* Conditional panel rendering */}
          {panelView === 0 && (
            <SidebarMetricContributionPanel data={data} />
          )}
          {panelView === 1 && (
            <SidebarProgressItemsPanel data={data} />
          )}
        </Box>
      </GridItem>
    </Grid>
  );
};

export default React.memo(IsolationProgressControlChart);