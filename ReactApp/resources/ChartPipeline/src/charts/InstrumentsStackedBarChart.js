import React, { useMemo, useState } from 'react';
import { Box, Heading, Select, Flex } from '@chakra-ui/react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { useInstrumentsTableFilterContext } from '../components/filters/InstrumentsTableFilter';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const InstrumentsStackedBarChart = ({ tableData }) => {
  const { handleSubsystemClick, handleTestPackClick } = useInstrumentsTableFilterContext();
  const [groupByField, setGroupByField] = useState('SUBSYSTEM');
  const [maxBars, setMaxBars] = useState(10);

  // Process data for stacked bar chart
  const chartData = useMemo(() => {
    if (!tableData || tableData.length === 0) return null;

    // Flatten the hierarchical data to get all nodes
    const flattenData = (nodes) => {
      let result = [];
      nodes.forEach(node => {
        result.push(node);
        if (node.children && node.children.length > 0) {
          result = [...result, ...flattenData(node.children)];
        }
      });
      return result;
    };

    const flatData = flattenData(tableData);
    
    // Filter nodes that have the selected grouping field
    const filteredNodes = flatData.filter(node => node[groupByField] !== undefined);
    
    // Group by the selected field and aggregate values
    const groupedData = {};
    filteredNodes.forEach(node => {
      const key = node[groupByField];
      if (!groupedData[key]) {
        groupedData[key] = {
          teiga: 0,
          siemsa: 0,
          pending: 0
        };
      }
      
      groupedData[key].teiga += (node['INSTALLED BY TEIGA-TMI'] || 0);
      groupedData[key].siemsa += (node['INSTALLED BY SIEMSA'] || 0);
      groupedData[key].pending += (node['PENDING'] || 0);
    });
    
    // Sort by total and take top N
    const sortedEntries = Object.entries(groupedData)
      .map(([key, values]) => ({
        key,
        total: values.teiga + values.siemsa + values.pending,
        ...values
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, maxBars);
    
    return {
      labels: sortedEntries.map(entry => entry.key),
      datasets: [
        {
          label: 'TEIGA-TMI',
          data: sortedEntries.map(entry => entry.teiga),
          backgroundColor: 'rgba(54, 162, 235, 0.8)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1,
        },
        {
          label: 'SIEMSA',
          data: sortedEntries.map(entry => entry.siemsa),
          backgroundColor: 'rgba(75, 192, 192, 0.8)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1,
        },
        {
          label: 'PENDING',
          data: sortedEntries.map(entry => entry.pending),
          backgroundColor: 'rgba(255, 99, 132, 0.8)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1,
        }
      ]
    };
  }, [tableData, groupByField, maxBars]);

  // Chart options
  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        stacked: true,
        ticks: {
          autoSkip: false,
          maxRotation: 90,
          minRotation: 45
        }
      },
      y: {
        stacked: true,
        title: {
          display: true,
          text: 'Number of Instruments'
        }
      }
    },
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: `Instrument Installation Status by ${groupByField}`
      },
      tooltip: {
        callbacks: {
          footer: (tooltipItems) => {
            // Calculate total for this bar
            const total = tooltipItems.reduce((sum, item) => sum + item.parsed.y, 0);
            return `Total: ${total}`;
          }
        }
      }
    },
    onClick: (event, elements) => {
      if (elements.length > 0) {
        const index = elements[0].index;
        const label = chartData.labels[index];
        
        if (groupByField === 'SUBSYSTEM') {
          handleSubsystemClick(label);
        } else if (groupByField === 'TP') {
          handleTestPackClick(label);
        }
      }
    }
  }), [groupByField, chartData, handleSubsystemClick, handleTestPackClick]);

  return (
    <Box height="300px" borderWidth="1px" borderRadius="lg" bg="white" p={3} mt={4}>
      <Flex justify="space-between" align="center" mb={2}>
        <Heading size="sm">Installation Status</Heading>
        <Flex>
          <Select 
            size="sm" 
            value={groupByField} 
            onChange={(e) => setGroupByField(e.target.value)}
            mr={2}
            width="120px"
          >
            <option value="SUBSYSTEM">Subsystem</option>
            <option value="HITO">Hito</option>
            <option value="TP">Test Pack</option>
          </Select>
          <Select 
            size="sm" 
            value={maxBars} 
            onChange={(e) => setMaxBars(Number(e.target.value))}
            width="80px"
          >
            <option value="5">Top 5</option>
            <option value="10">Top 10</option>
            <option value="15">Top 15</option>
            <option value="20">Top 20</option>
          </Select>
        </Flex>
      </Flex>
      <Box height="calc(100% - 40px)">
        {chartData && <Bar data={chartData} options={options} />}
      </Box>
    </Box>
  );
};

export default InstrumentsStackedBarChart;