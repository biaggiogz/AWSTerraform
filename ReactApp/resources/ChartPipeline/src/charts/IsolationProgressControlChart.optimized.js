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
  Switch,
  FormControl,
  FormLabel
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
import SidebarMetricContributionPanel from '../components/panels/SidebarMetricContributionPanel';
import SidebarProgressItemsPanel from '../components/panels/SidebarProgressItemsPanel';

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
  // State for toggling between different panel types
  const [panelType, setPanelType] = useState('subsystem'); // 'subsystem', 'progress'
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
        a_advance_mleq_total: 0,
        doneItems: [0, 0, 0, 0, 0, 0],
        pendingItems: [0, 0, 0, 0, 0, 0]
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

    // Calculate DONE and Pending Insul for each category
    const categoryColumns = ['Avance Distanciadores', 'Avance Aislamiento', 'Avance Chapa', 'Avance Cajas', 'Avance Rematar'];
    
    const doneItems = categoryColumns.map(col => 
      data.filter(row => parseFloat(row[col]) === 1).length
    );
    
    const pendingItems = categoryColumns.map(col => 
      data.filter(row => {
        const val = parseFloat(row[col]);
        return val < 1 || isNaN(val) || row[col] === "" || row[col] == null;
      }).length
    );
    
    // Special case for Mleq Total Advance
    const mleqTotalDone = m_advance_mleq_total;
    const mleqTotalPending = C_Mleq - m_advance_mleq_total;
    
    doneItems.push(mleqTotalDone);
    pendingItems.push(mleqTotalPending);

    return {
      C_Mleq,
      advance_spacer,
      advance_insolation,
      advance_sheet_metal,
      advance_boxes,
      advance_to_finish,
      m_advance_mleq_total,
      a_advance_mleq_total,
      doneItems,
      pendingItems
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

    const DonedValues = [
      metrics.advance_spacer,
      metrics.advance_insolation,
      metrics.advance_sheet_metal,
      metrics.advance_boxes,
      metrics.advance_to_finish,
      metrics.a_advance_mleq_total
    ];

    const PendingValues = DonedValues.map(val => 100 - val);

    return {
      labels: categories,
      datasets: [
        {
          label: 'Done',
          data: DonedValues,
          backgroundColor: '#1DE9B6',
          borderColor: '#000',
          borderWidth: 2,
          stack: 'stack1'
        },
        {
          label: 'Pending',
          data: PendingValues,
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
        position: 'top',
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
    { label: 'Mleq Total', value: metrics.a_advance_mleq_total.toFixed(1) + '%' }
  ], [metrics]);

  return (
    <Grid templateColumns={{ base: "1fr", lg: "1fr 350px" }} gap={4}>
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
            
            {/* Done Insul and Pending Insul metrics below chart */}
            <VStack spacing={2} mt={4} ml="auto">
              {/* Done Insul Row */}
              <HStack spacing={0} w="full" justify="space-between">
                <Text fontSize="xs" fontWeight="bold" minW="80px">DONE</Text>
                {metrics.doneItems.map((value, index) => (
                  <Box key={index} flex={1} textAlign="center">
                    <Box 
                      border="1px solid" 
                      borderColor="gray.300" 
                      p={1} 
                      fontSize="xs" 
                      fontWeight="bold"
                      bg="gray.50"
                      backgroundColor="#1DE9B6"
                    >
                      {index === 5 ? `${value.toFixed(2)}m` : value.toLocaleString()}
                    </Box>
                  </Box>
                ))}
              </HStack>
              
              {/* Pending Insul Row */}
              <HStack spacing={0} w="full" justify="space-between">
                <Text fontSize="xs" fontWeight="bold" minW="80px">PENDING</Text>
                {metrics.pendingItems.map((value, index) => (
                  <Box key={index} flex={1} textAlign="center">
                    <Box 
                      border="1px solid" 
                      borderColor="gray.300" 
                      p={1} 
                      fontSize="xs" 
                      fontWeight="bold"
                      bg="gray.50"
                      backgroundColor="#FF168B"
                    >
                      {index === 5 ? `${value.toFixed(2)}m` : value.toLocaleString()}
                    </Box>
                  </Box>
                ))}
              </HStack>
            </VStack>
            
            {/* Summary info */}
            <HStack justify="space-between" mt={4} pt={2} borderTopWidth="1px">
              <Text fontSize="sm" color="gray.600">
                Total Mleq: {metrics.C_Mleq.toFixed(2)} m
              </Text>
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
          {/* Toggle switches */}
          <VStack spacing={2} mb={4}>
            <FormControl display="flex" alignItems="center">
              <FormLabel htmlFor="subsystem-toggle" mb="0" fontSize="xs" fontWeight="bold" flex={1}>
                Subsystem Progress
              </FormLabel>
              <Switch 
                id="subsystem-toggle"
                isChecked={panelType === 'subsystem'}
                onChange={() => setPanelType('subsystem')}
                colorScheme="blue"
                size="sm"
              />
            </FormControl>
            <FormControl display="flex" alignItems="center">
              <FormLabel htmlFor="progress-toggle" mb="0" fontSize="xs" fontWeight="bold" flex={1}>
                Progress Items
              </FormLabel>
              <Switch 
                id="progress-toggle"
                isChecked={panelType === 'progress'}
                onChange={() => setPanelType('progress')}
                colorScheme="blue"
                size="sm"
              />
            </FormControl>
          </VStack>
          
          {/* Conditional panel rendering */}
          {panelType === 'subsystem' ? (
            <SidebarMetricContributionPanel data={data} />
          ) : (
            <SidebarProgressItemsPanel data={data} />
          )}
        </Box>
      </GridItem>
    </Grid>
  );
};

export default React.memo(IsolationProgressControlChart);