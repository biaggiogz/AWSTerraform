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

// Flatten hierarchical data for chart display
const flattenData = (data, labelField, numericFields) => {
  const result = [];

  const processNode = (node) => {
    // Flatten this node, mapping labelField and numericFields
    const entry = {
      category: node[labelField] || 'N/A'
    };

    numericFields.forEach(field => {
      entry[field] = node[field] || 0;
    });

    result.push(entry);

    // Recursively process children if exist
    if (node.children && node.children.length > 0) {
      node.children.forEach(child => processNode(child));
    }
  };

  data.forEach(node => processNode(node));
  return result;
};
// Prepare chart options for ECharts
const getEChartsOption = (data, labelField, hiddenSeries = []) => {
  if (!data || data.length === 0) return {};

  // Define numeric fields
  const numericFields = [
    'TOTAL INST',
    'INSTALLED BY TEIGA-TMI',
    'INSTALLED BY SIEMSA',
    'PENDING',
  ];

  // Flatten hierarchical data accordingly
  const flatData = flattenData(data, labelField, numericFields);

  // Sort by TOTAL INST descending for clarity
  flatData.sort((a, b) => b['TOTAL INST'] - a['TOTAL INST']);

  const categories = flatData.map(item => item.category);

  // Map series data dynamically from numericFields
  const seriesData = {};
  numericFields.forEach(field => {
    seriesData[field] = flatData.map(item => {
      if (field === 'PENDING') return -Math.abs(item[field]); // Pending negative
      return item[field];
    });
  });

  return {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: {
      data: numericFields,
      selected: hiddenSeries.reduce((acc, s) => { acc[s] = false; return acc; }, {})
    },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    dataZoom: [
      { type: 'slider', yAxisIndex: 0, zoomLock: false, start: 0, end: 40 }
    ],
    xAxis: { type: 'value' },
    yAxis: { type: 'category', axisTick: { show: false }, data: categories },
    series: numericFields.map((field, i) => ({
      name: field,
      type: 'bar',
      barWidth: 30,
      barGap: field === 'TOTAL INST' ? '0%' : '-100%',
      itemStyle: {
        color: {
          'TOTAL INST': '#FFE9D6',
          'INSTALLED BY TEIGA-TMI': '#A55B4B',
          'INSTALLED BY SIEMSA': '#6C5F5B',
          'PENDING': '#ED7D31',
        }[field] || '#000'
      },
      label: {
        show: true,
        position: field === 'PENDING' ? 'insideLeft' : 'insideRight'
      },
      data: seriesData[field],
      z: numericFields.length - i
    }))
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

    // Get the field to use as labels (first groupBy field)
    const field = groupBy[0] || 'SUBSYSTEM';

    // We'll use the raw data as is - the flattening happens in getEChartsOption
    return { processedData: tableData, labelField: field };
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