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

// Flatten hierarchical data for chart display - only process top level nodes
const flattenData = (data, labelField, numericFields) => {
  const result = [];

  // Only process top-level nodes, ignoring children
  data.forEach(node => {
    const entry = {
      category: node[labelField] || 'N/A'
    };

    numericFields.forEach(field => {
      entry[field] = node[field] || 0;
    });

    result.push(entry);
  });

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
    'DONE',
  ];

  // Flatten hierarchical data accordingly
  const flatData = flattenData(data, labelField, numericFields);

  // Sort by TOTAL INST ascending to put smaller values at the top
  flatData.sort((a, b) => a['TOTAL INST'] - b['TOTAL INST']);

  const categories = flatData.map(item => item.category);

  // Map series data dynamically from numericFields
  const seriesData = {};
  numericFields.forEach(field => {
    if (field === 'DONE') {
      // Calculate DONE values - when total equals sum of installed
      seriesData[field] = flatData.map(item => {
        const total = item['TOTAL INST'] || 0;
        const teiga = item['INSTALLED BY TEIGA-TMI'] || 0;
        const siemsa = item['INSTALLED BY SIEMSA'] || 0;
        const installed = teiga + siemsa;
        
        // Only show DONE when fully installed (total = installed)
        return Math.abs(total - installed) < 0.01 ? total : 0;
      });
    } else {
      seriesData[field] = flatData.map(item => {
        if (field === 'PENDING') return -Math.abs(item[field]); // Pending negative
        return item[field];
      });
    }
  });
  
  // Create z-index map for each category based on actual values
  const zIndexMap = flatData.map(item => {
    const teigaValue = item['INSTALLED BY TEIGA-TMI'] || 0;
    const siemsaValue = item['INSTALLED BY SIEMSA'] || 0;
    const total = item['TOTAL INST'] || 0;
    const installed = teigaValue + siemsaValue;
    const isDone = Math.abs(total - installed) < 0.01 && total > 0;
    
    return {
      'TOTAL INST': 1,
      'INSTALLED BY TEIGA-TMI': isDone ? 2 : (teigaValue >= siemsaValue ? 3 : 2),
      'INSTALLED BY SIEMSA': isDone ? 2 : (siemsaValue > teigaValue ? 3 : 2),
      'PENDING': 0,
      'DONE': 4 // Highest z-index to appear on top
    };
  });

  return {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: {
      data: numericFields,
      selected: hiddenSeries.reduce((acc, s) => { acc[s] = false; return acc; }, {})
    },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    dataZoom: [
      { type: 'slider', yAxisIndex: 0, zoomLock: true, start: 0, end: 16 }
    ],
    xAxis: { type: 'value' },
    yAxis: { type: 'category', axisTick: { show: false }, data: categories },
    series: numericFields.map((field) => ({
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
          'DONE': '#4CAF50', // Green color for DONE
        }[field] || '#000'
      },
      label: {
        show: field !== 'DONE' ? true : false, // Hide label for DONE to avoid clutter
        position: field === 'PENDING' ? 'insideLeft' : 'insideRight'
      },
      data: seriesData[field].map((value, index) => value),
      // Use dynamic z-index based on actual values for each category
      renderItem: function(params, api) {
        const value = api.value(0);
        const categoryIndex = params.dataIndex;
        const zIndex = zIndexMap[categoryIndex][field];
        
        const coordSys = api.coordinateSystem();
        const width = api.size([0, 1])[0];
        
        const point = api.coord([value, api.value(1)]);
        
        return {
          type: 'rect',
          shape: {
            x: field === 'PENDING' ? point[0] : coordSys.x,
            y: point[1] - 15,
            width: Math.abs(point[0] - coordSys.x),
            height: 30
          },
          style: api.style(),
          z: zIndex
        };
      },
      encode: {
        x: 0,
        y: 1
      }
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

    // Always use only the first groupBy field
    const field = groupBy.length > 0 ? groupBy[0] : 'SUBSYSTEM';
    
    // Use only top-level data, ignoring any hierarchical structure
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