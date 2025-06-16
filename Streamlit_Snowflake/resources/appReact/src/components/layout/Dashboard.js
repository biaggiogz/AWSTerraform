import React from 'react';
import FilterControls from './FilterControls';
import BarChart from '../charts/BarChart';
import StackedBarChart from '../charts/StackedBarChart';
import ScatterPlot from '../charts/ScatterPlot';
import BoxPlot from '../charts/BoxPlot';
import { useCrossFilter } from '../context/CrossFilterContext';
import { useDataProcessor } from '../hooks/useDataProcessor';

const Dashboard = ({ data }) => {
  const { filters } = useCrossFilter();
  const { 
    getFilteredData, 
    getDesignAreaProgressData,
    getLineIdWeldsData,
    getTrainProgressData
  } = useDataProcessor(data);
  
  // Color scale for charts
  const colorScale = (value) => {
    const colors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
    const hash = value.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    return colors[Math.abs(hash) % colors.length];
  };

  const filteredData = getFilteredData();
  const designAreaData = getDesignAreaProgressData();
  const lineIdData = getLineIdWeldsData();
  const trainData = getTrainProgressData();

  return (
    <div className="dashboard">
      <h1>Pipeline Construction Progress Dashboard</h1>
      
      <FilterControls />

      <div className="charts-grid">
        <div className="chart-container">
          <h2>Average Progress SW+FW (%) per Design Area</h2>
          <BarChart 
            data={designAreaData} 
            title="Average Progress SW+FW (%) per Design Area"
            xKey="name"
            yKey="value"
            colorScale={colorScale}
            filterType="designArea"
          />
        </div>
        
        <div className="chart-container">
          <h2>Shop vs. Field Welds for Top 10 Line IDs</h2>
          <StackedBarChart 
            data={lineIdData} 
            title="Shop vs. Field Welds for Top 10 Line IDs"
            xKey="name"
            yKeys={['shopWelds', 'fieldWelds']}
            colorScale={() => ['#8884d8', '#82ca9d']}
            filterType="lineId"
          />
        </div>
        
        <div className="chart-container">
          <h2>Total vs. Done Diameter Inches by Design Area</h2>
          <ScatterPlot 
            data={filteredData} 
            title="Total vs. Done Diameter Inches by Design Area"
            xKey='TOTAL DIAINCH ("")'
            yKey='TOTAL DONE DIAINCH ("")'
            groupKey="Design Area"
            colorScale={colorScale}
            filterType="designArea"
          />
        </div>
        
        <div className="chart-container">
          <h2>Progress Erected (%) by Train</h2>
          <BoxPlot 
            data={filteredData} 
            title="Progress Erected (%) by Train"
            groupKey="TRAIN"
            valueKey="% PROGRESS ERECTED"
            colorScale={colorScale}
            filterType="train"
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;