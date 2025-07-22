import React, { useMemo } from 'react';
import {
  Box,
  Text,
  Heading,
  useColorModeValue,
  Flex
} from '@chakra-ui/react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Bar } from 'react-chartjs-2';
import { useInstrumentsTableFilterContext } from '../components/filters/InstrumentsTableFilter';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  ChartTooltip,
  Legend,
  ChartDataLabels
);

// Chart options configuration
const getChartOptions = (groupByField) => ({
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: 'y',
  scales: {
    x: {
      stacked: true,
      title: {
        display: true,
        text: 'Number of Instruments'
      }
    },
    y: {
      stacked: true,
      title: {
        display: true,
        text: groupByField
      }
    }
  },
  plugins: {
    tooltip: {
      callbacks: {
        footer: (tooltipItems) => {
          const item = tooltipItems[0];
          const dataIndex = item.dataIndex;
          const dataset = item.chart.data.datasets;
          
          // Calculate total for this item
          let total = 0;
          dataset.forEach(ds => {
            total += ds.data[dataIndex] || 0;
          });
          
          return `Total: ${total}`;
        }
      }
    },
    legend: {
      position: 'bottom',
    },
    title: {
      display: true,
      text: 'Instruments Installation Status',
      font: {
        size: 16,
        weight: 'bold'
      }
    },
    datalabels: {
      color: 'white',
      font: {
        weight: 'bold'
      },
      formatter: (value) => value > 0 ? value : ''
    }
  }
});

const InstrumentsStatusChart = () => {
  const {
    tableData,
    groupBy
  } = useInstrumentsTableFilterContext();
  
  // Call hooks at the top level, before any conditional returns
  const bgColor = useColorModeValue('white', 'gray.800');
  
  // Filter out items with zero total and prepare chart data
  const chartData = useMemo(() => {
    if (!tableData || tableData.length === 0) return { labels: [], datasets: [] };
    
    // Filter items with non-zero totals
    const filteredData = tableData.filter(item => (item['TOTAL INST'] || 0) > 0);
    if (filteredData.length === 0) return { labels: [], datasets: [] };
    
    // Get the field to use as labels (first groupBy field)
    const labelField = groupBy[0] || 'SUBSYSTEM';
    
    // Extract labels and data
    const labels = filteredData.map(item => item[labelField] || 'N/A');
    
    // Create datasets
    const datasets = [
      {
        label: 'PENDING',
        data: filteredData.map(item => item['PENDING'] || 0),
        backgroundColor: 'rgba(245, 158, 11, 0.8)', // orange
        borderColor: 'rgba(245, 158, 11, 1)',
        borderWidth: 1,
      },
      {
        label: 'INSTALLED BY TEIGA-TMI',
        data: filteredData.map(item => item['INSTALLED BY TEIGA-TMI'] || 0),
        backgroundColor: 'rgba(59, 130, 246, 0.8)', // blue
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
      },
      {
        label: 'INSTALLED BY SIEMSA',
        data: filteredData.map(item => item['INSTALLED BY SIEMSA'] || 0),
        backgroundColor: 'rgba(34, 197, 94, 0.8)', // green
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 1,
      },
    ];
    
    return { labels, datasets };
  }, [tableData, groupBy]);
  
  // Get chart options
  const chartOptions = useMemo(() => {
    const labelField = groupBy[0] || 'SUBSYSTEM';
    return getChartOptions(labelField);
  }, [groupBy]);

  if (!chartData.labels.length) {
    return (
      <Box p={4} borderWidth="1px" borderRadius="md">
        <Text>No data available for chart visualization.</Text>
      </Box>
    );
  }

  return (
    <Box 
      p={4} 
      borderWidth="1px" 
      borderRadius="md" 
      bg={bgColor}
    >
      <Flex direction="column">
        <Heading size="md" mb={4}>Instruments Installation Status</Heading>
        <Text fontSize="sm" mb={2} color="gray.500">
          X represents: {groupBy.join(', ')}
        </Text>
        <Box height="500px">
          <Bar data={chartData} options={chartOptions} />
        </Box>
      </Flex>
    </Box>
  );
};

export default InstrumentsStatusChart;