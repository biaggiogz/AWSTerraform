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
  Tooltip,
  Legend,
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
    Tooltip,
    Legend,
    ChartDataLabels
);
const ChartLegend = ({ datasets }) => (
    <Flex
        className="chart-js-legend"
        position="sticky"
        top="0"
        zIndex="10"
        background="inherit"
        py={1}
        mb={2}
        gap={3}
    >
      {datasets.map((ds) =>
          ds.label ? (
              <Flex align="center" key={ds.label}>
                <Box
                    width="14px"
                    height="14px"
                    borderRadius="2"
                    mr={2}
                    background={ds.backgroundColor || ds.borderColor}
                    border="1px solid #eee"
                />
                <Text fontSize="sm" color="gray.700" mr={2}>
                  {ds.label}
                </Text>
              </Flex>
          ) : null
      )}
    </Flex>
);

// Prepare chart data for Chart.js
const prepareChartData = (data, labelField) => {
  // Limit to 15 items for better visualization
  data = data.slice(0, 25);
  if (!data || data.length === 0) {
    return { labels: [], datasets: [] };
  }

  // Create the sticky legend (replace/remix as needed)

  // Extract labels (Y-axis categories)
  const labels = data.map(item => item[labelField] || 'N/A');

  // Extract data for each series
  const totalInstData = data.map(item => item['TOTAL INST'] || 0);
  const installedTeigaData = data.map(item => item['INSTALLED BY TEIGA-TMI'] || 0);
  const installedSiemsaData = data.map(item => item['INSTALLED BY SIEMSA'] || 0);
  const pendingData = data.map(item => item['PENDING'] || 0);

  // Determine if we should show labels based on data density
  // Always show labels when there are filters applied
  const showLabels = true;

  return {
    labels,
    datasets: [
      // PENDING
      {
        label: 'PENDING',
        data: pendingData,
        backgroundColor: '#ED7D31', // Orange
        borderColor: '#D35400',
        borderWidth: 1,
        stack: 'pending',
        datalabels: {
          display: showLabels,
          color: 'white',
          font: { weight: 'bold', size: 11 },
          formatter: (value) => value > 0 ? value.toString() : ''
        }
      },
      // INSTALLED BY TEIGA-TMI
      {
        label: 'INSTALLED BY TEIGA-TMI',
        data: installedTeigaData,
        backgroundColor: '#A55B4B', // Reddish brown
        borderColor: '#8B4513',
        borderWidth: 1,
        stack: 'installed',
        datalabels: {
          display: showLabels,
          color: 'white',
          font: { weight: 'bold', size: 11 },
          formatter: (value) => value > 0 ? value.toString() : ''
        }
      },
      // INSTALLED BY SIEMSA
      {
        label: 'INSTALLED BY SIEMSA',
        data: installedSiemsaData,
        backgroundColor: '#6C5F5B', // Dark gray
        borderColor: '#4A4A4A',
        borderWidth: 1,
        stack: 'installed',
        datalabels: {
          display: showLabels,
          color: 'white',
          font: { weight: 'bold', size: 11 },
          formatter: (value) => value > 0 ? value.toString() : ''
        }
      },
      // TOTAL INST - as a line to show the total
      {
        type: 'line',
        label: 'TOTAL INST',
        data: totalInstData,
        backgroundColor: '#FFE9D6', // Light beige
        borderColor: '#FFD8A8',
        borderWidth: 2,
        pointBackgroundColor: '#FFE9D6',
        pointRadius: 5,
        pointHoverRadius: 7,
        fill: false,
        datalabels: {
          display: showLabels,
          color: '#000',
          backgroundColor: '#FFE9D6',
          borderRadius: 4,
          padding: 4,
          font: { weight: 'bold', size: 11 },
          formatter: (value) => value > 0 ? value.toString() : ''
        }
      }
    ]
  };
};

// Chart.js options configuration
const getChartOptions = (data, labelField) => {
  // Find max value for scaling
  const maxValue = data.length > 0 ?
      Math.max(...data.map(item => item['TOTAL INST'] || 0)) : 0;

  return {
    indexAxis: 'y', // Horizontal bar chart
    responsive: true,
    responsiveAnimationDuration: 0,
    maintainAspectRatio: false,
    // Set a fixed height per bar to enable scrolling
    barThickness: 25,
    barPercentage: 0.6,
    categoryPercentage: 0.8,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          padding: 10,
          boxWidth: 15,
          font: { size: 11 }
        }
      },
      tooltip: {
        callbacks: {
          title: (context) => {
            return context[0].label;
          },
          afterBody: (context) => {
            const index = context[0].dataIndex;
            const item = data[index];
            return `TOTAL INST: ${item['TOTAL INST'] || 0}`;
          }
        }
      },
      title: {
        display: false
      },
      datalabels: {
        // Global datalabels options are set per dataset
      }
    },
    scales: {
      x: {
        stacked: true,
        grid: {
          display: true,
          drawBorder: true,
        },
        ticks: {
          font: { size: 11 }
        },
        suggestedMax: maxValue * 1.1 // Add some padding
      },
      y: {
        stacked: true,
        grid: {
          display: false,
          drawBorder: true,
        },
        ticks: {
          font: { size: 12 }
        },
        title: {
          display: true,
          text: labelField,
          font: { size: 12, weight: 'bold' }
        },
        // Remove the afterFit function as we're handling scrolling differently
      }
    }
  };
};


// Custom style to ensure proper chart rendering with scrolling and proper width constraints
const chartContainerStyle = `
  .chart-container canvas {
    height: 100% !important;
    max-width: 100% !important;
  }
  .chart-container {
    max-width: 100%;
    overflow-x: hidden;
  }
  .chart-js-legend {
    position: sticky;
    top: 0;
    background-color: white;
    z-index: 10;
    padding-bottom: 8px;
  }
`;

const InstrumentsStatusChart = () => {
  const {
    tableData,
    groupBy,
    selectedSubsystem,
    selectedTestPack
  } = useInstrumentsTableFilterContext();

  // Call hooks at the top level, before any conditional returns
  const bgColor = useColorModeValue('white', 'gray.800');

  // Process data for the chart
  const { processedData, labelField } = useMemo(() => {
    if (!tableData || tableData.length === 0) {
      return { processedData: [], labelField: 'SUBSYSTEM' };
    }

    // Filter items with non-zero totals
    let filtered = tableData.filter(item => (item['TOTAL INST'] || 0) > 0);

    // Sort by total for better visualization
    filtered = filtered.sort((a, b) => (b['TOTAL INST'] || 0) - (a['TOTAL INST'] || 0));

    // Don't limit the number of items - we'll use scrolling instead
    // filtered = filtered.slice(0, 12);

    // Get the field to use as labels (first groupBy field)
    const field = groupBy[0] || 'SUBSYSTEM';

    return { processedData: filtered, labelField: field };
  }, [tableData, groupBy, selectedSubsystem, selectedTestPack]); // Add dependencies to trigger re-render

  // Prepare chart data and options
  const chartData = useMemo(() => {
    return prepareChartData(processedData, labelField);
  }, [processedData, labelField]);

  const chartOptions = useMemo(() => {
    return getChartOptions(processedData, labelField);
  }, [processedData, labelField]);

  if (!processedData.length) {
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
          height="100%"
          width="100%"
          maxWidth="100%"
          overflow="hidden"
      >
        <style>{chartContainerStyle}</style>
        <Flex direction="column" height="450px">
          <Box
              flex="1"
              width="100%"
              overflowY="auto"
              overflowX="hidden"
              className="chart-container"
              position="relative"
          >
            <ChartLegend datasets={chartData.datasets} />
            <Box
                height={`${Math.max(400, processedData.length * 30)}px`}
                width="100%"
                maxWidth="100%"
            >
              <Bar
                  data={chartData}
                  options={chartOptions}
                  key={`chart-${selectedSubsystem || 'none'}-${selectedTestPack || 'none'}-${processedData.length}`}
              />
            </Box>
          </Box>
        </Flex>
      </Box>
  );
};

export default InstrumentsStatusChart;