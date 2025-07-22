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

  // Calculate stack positions for each category
  const stackData = flatData.map(item => {
    const total = item['TOTAL INST'] || 0;
    const pending = item['PENDING'] || 0;
    const teiga = item['INSTALLED BY TEIGA-TMI'] || 0;
    const siemsa = item['INSTALLED BY SIEMSA'] || 0;
    
    return {
      total,
      pending,
      teiga,
      siemsa,
      // Calculate positions for stacked layout
      pendingStart: 0,
      pendingEnd: pending,
      teigaStart: pending,
      teigaEnd: pending + teiga,
      siemsaStart: pending + teiga,
      siemsaEnd: pending + teiga + siemsa
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
    series: [
      // TOTAL INST as background bar - hide when equals DONE
      {
        name: 'TOTAL INST',
        type: 'bar',
        barWidth: 30,
        z: 1,
        itemStyle: { color: '#FFE9D6' },
        data: flatData.map((item, index) => {
          const total = item['TOTAL INST'] || 0;
          const teiga = item['INSTALLED BY TEIGA-TMI'] || 0;
          const siemsa = item['INSTALLED BY SIEMSA'] || 0;
          const installed = teiga + siemsa;
          
          // Hide TOTAL INST when fully installed (total = installed)
          return Math.abs(total - installed) < 0.01 ? '-' : total;
        })
      },
      // PENDING on the left side - hide when any installer equals TOTAL INST
      {
        name: 'PENDING',
        type: 'bar',
        stack: 'stack',
        barWidth: 30,
        z: 2,
        itemStyle: { color: '#ED7D31' },
        label: {
          show: true,
          position: 'insideLeft',
          color:'#FFFFFF',
          formatter: function(params) {
            return params.value === 0 ? '' : params.value;
          }
        },
        data: flatData.map((item, index) => {
          const value = item['PENDING'] || 0;
          const total = item['TOTAL INST'] || 0;
          const teiga = item['INSTALLED BY TEIGA-TMI'] || 0;
          const siemsa = item['INSTALLED BY SIEMSA'] || 0;
          
          // Hide PENDING when either installer equals TOTAL INST
          if (Math.abs(teiga - total) < 0.01 && total > 0) return '-';
          if (Math.abs(siemsa - total) < 0.01 && total > 0) return '-';
          
          return value === 0 ? '-' : value;
        })
      },
      // TEIGA-TMI in the middle - hide when equals TOTAL INST
      {
        name: 'INSTALLED BY TEIGA-TMI',
        type: 'bar',
        stack: 'stack',
        barWidth: 30,
        z: 2,
        itemStyle: { color: '#A55B4B' },
        label: {
          show: true,
          position: 'inside',
          formatter: function(params) {
            return params.value === 0 ? '' : params.value;
          }
        },
        data: flatData.map((item, index) => {
          const value = item['INSTALLED BY TEIGA-TMI'] || 0;
          const total = item['TOTAL INST'] || 0;
          
          // Hide TEIGA-TMI when it equals TOTAL INST
          return Math.abs(value - total) < 0.01 && total > 0 ? '-' : value;
        })
      },
      // SIEMSA on the right side - hide when equals TOTAL INST
      {
        name: 'INSTALLED BY SIEMSA',
        type: 'bar',
        stack: 'stack',
        barWidth: 30,
        z: 2,
        itemStyle: { color: '#6C5F5B' },
        label: {
          show: true,
          position: 'insideRight',
          formatter: function(params) {
            return params.value === 0 ? '' : params.value;
          }
        },
        data: flatData.map((item, index) => {
          const value = item['INSTALLED BY SIEMSA'] || 0;
          const total = item['TOTAL INST'] || 0;
          
          // Hide SIEMSA when it equals TOTAL INST
          return Math.abs(value - total) < 0.01 && total > 0 ? '-' : value;
        })
      },
      // DONE indicator
      {
        name: 'DONE',
        type: 'bar',
        barWidth: 30,
        barGap: '-100%',
        z: 3,
        itemStyle: {
          color: '#4CAF50',
          opacity: 1
        },
        label: {
          show: true,
          position: 'insideRight',
          color: '#FFFFFF',
          formatter: function(params) {
            return params.value === '-' ? '' : params.value;
          }
        },
        data: seriesData['DONE'].map(value => value === 0 ? '-' : value)
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