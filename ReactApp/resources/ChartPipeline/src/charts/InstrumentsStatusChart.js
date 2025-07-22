import React, { useMemo, useState, useRef, useEffect } from 'react';
import {
  Box,
  Text,
  Heading,
  useColorModeValue,
  Flex
} from '@chakra-ui/react';
import ReactECharts from 'echarts-for-react';
import { useInstrumentsTableFilterContext } from '../components/filters/InstrumentsTableFilter';

// Custom legend component is not needed as ECharts handles it internally

// Prepare chart options for ECharts
const getEChartsOption = (data, labelField, hiddenSeries = []) => {
  if (!data || data.length === 0) {
    return {};
  }

  // Extract labels (Y-axis categories)
  const categories = data.map(item => item[labelField] || 'N/A');

  // Extract data for each series
  const totalInstData = data.map(item => item['TOTAL INST'] || 0);
  const installedTeigaData = data.map(item => item['INSTALLED BY TEIGA-TMI'] || 0);
  const installedSiemsaData = data.map(item => item['INSTALLED BY SIEMSA'] || 0);
  const pendingData = data.map(item => item['PENDING'] || 0).map(val => -Math.abs(val)); // Make pending negative for left side display

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    legend: {
      data: ['PENDING', 'TOTAL INST', 'INSTALLED BY TEIGA-TMI', 'INSTALLED BY SIEMSA'],
      selected: hiddenSeries.reduce((acc, series) => {
        acc[series] = false;
        return acc;
      }, {})
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    dataZoom: [
      {
        type: 'slider',
        yAxisIndex: 0,     // Enable vertical scroll
        zoomLock: false,   // Prevent zoom interaction, scroll only
        start: 0,          // Show from top
        end: 40            // Show ~40% of items initially
      }
    ],
    xAxis: {
      type: 'value'
    },
    yAxis: {
      type: 'category',
      axisTick: { show: false },
      data: categories
    },
    series: [
      {
        name: 'TOTAL INST',
        type: 'bar',
        barWidth: 30,
        barGap: '0%',
        itemStyle: {
          color: '#FFE9D6'
        },
        label: {
          show: true,
          position: 'insideRight'
        },
        data: totalInstData,
        z: 1
      },
      {
        name: 'INSTALLED BY TEIGA-TMI',
        type: 'bar',
        barWidth: 30,
        barGap: '-100%',
        itemStyle: {
          color: '#A55B4B'
        },
        label: {
          show: true,
          position: 'insideRight'
        },
        data: installedTeigaData,
        z: 2
      },
      {
        name: 'INSTALLED BY SIEMSA',
        type: 'bar',
        barWidth: 30,
        barGap: '-100%',
        itemStyle: {
          color: '#6C5F5B'
        },
        label: {
          show: true,
          position: 'insideRight'
        },
        data: installedSiemsaData,
        z: 3
      },
      {
        name: 'PENDING',
        type: 'bar',
        barWidth: 30,
        barGap: '-100%',
        itemStyle: {
          color: '#ED7D31'
        },
        label: {
          show: true,
          position: 'insideLeft'
        },
        data: pendingData,
        z: 0
      }
    ]
  };
};




// Custom style for ECharts container
const chartContainerStyle = `
  .echarts-container {
    height: 100%;
    width: 100%;
  }
`;

const InstrumentsStatusChart = () => {
  const {
    tableData,
    groupBy,
    selectedSubsystem,
    selectedTestPack
  } = useInstrumentsTableFilterContext();
  
  // State to track hidden series
  const [hiddenSeries, setHiddenSeries] = useState([]);
  const chartRef = useRef(null);

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

    // Get the field to use as labels (first groupBy field)
    const field = groupBy[0] || 'SUBSYSTEM';

    return { processedData: filtered, labelField: field };
  }, [tableData, groupBy, selectedSubsystem, selectedTestPack]);

  // Get ECharts options
  const chartOptions = useMemo(() => {
    return getEChartsOption(processedData, labelField, hiddenSeries);
  }, [processedData, labelField, hiddenSeries]);

  // Handle events from ECharts
  const onChartEvents = {
    'legendselectchanged': (params) => {
      const newHiddenSeries = [];
      Object.keys(params.selected).forEach(seriesName => {
        if (!params.selected[seriesName]) {
          newHiddenSeries.push(seriesName);
        }
      });
      setHiddenSeries(newHiddenSeries);
    }
  };

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
      height="680px"
      width="100%"
      maxWidth="100%"
      overflow="hidden"
    >
      <style>{chartContainerStyle}</style>
      <Box className="echarts-container">
        <ReactECharts
          ref={chartRef}
          option={chartOptions}
          style={{ height: '100%', width: '100%' }}
          opts={{ renderer: 'canvas' }}
          onEvents={onChartEvents}
          notMerge={true}
          lazyUpdate={true}
        />
      </Box>
    </Box>
  );
};

export default InstrumentsStatusChart;