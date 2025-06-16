import React, { useState, useEffect, useRef } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, ReferenceLine, ComposedChart, Area
} from 'recharts';

const ProgressTracker = ({ data, onWeekClick, activeFilters }) => {
  const [chartType, setChartType] = useState('line');
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const containerRef = useRef(null);
  
  // Track window resize for responsive behavior
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };
    
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    
    return () => {
      window.removeEventListener('resize', updateDimensions);
    };
  }, []);

  // Group data by week with cumulative totals
  const weeklyProgress = data.reduce((acc, item) => {
    const week = item['ISO SW END BY WEEK'] || 'Unknown';
    if (!acc[week]) {
      acc[week] = {
        week,
        shopWelds: 0,
        fieldWelds: 0,
        totalWelds: 0,
        completionRate: 0,
        count: 0
      };
    }
    
    acc[week].shopWelds += parseInt(item['QTY Welds Shop (SW)'] || 0);
    acc[week].fieldWelds += parseInt(item['QTY Welds Field (FW)'] || 0);
    acc[week].totalWelds += parseInt(item['Total Welds'] || 0);
    
    // Calculate completion rate if available
    const progressPercent = parseFloat(item['PROGRESS SW+FW (%)'] || 0);
    if (progressPercent > 0) {
      acc[week].completionRate += progressPercent;
      acc[week].count += 1;
    }
    
    return acc;
  }, {});

  // Calculate average completion rate
  Object.values(weeklyProgress).forEach(week => {
    if (week.count > 0) {
      week.completionRate = (week.completionRate / week.count).toFixed(2);
    }
  });

  // Convert to array and sort by week
  const chartData = Object.values(weeklyProgress)
    .filter(item => item.week !== 'Unknown' && !isNaN(parseInt(item.week)))
    .sort((a, b) => parseInt(a.week) - parseInt(b.week));
    
  // Calculate cumulative data for trend analysis
  let cumulativeShop = 0;
  let cumulativeField = 0;
  let cumulativeTotal = 0;
  
  chartData.forEach(item => {
    cumulativeShop += item.shopWelds;
    cumulativeField += item.fieldWelds;
    cumulativeTotal += item.totalWelds;
    
    item.cumulativeShop = cumulativeShop;
    item.cumulativeField = cumulativeField;
    item.cumulativeTotal = cumulativeTotal;
  });

  // Handle week click for cross-filtering
  const handleWeekClick = (data) => {
    if (onWeekClick && data && data.activeLabel) {
      onWeekClick(data.activeLabel);
    }
  };
  
  // Calculate average values for reference lines
  const avgShopWelds = chartData.length > 0 
    ? chartData.reduce((sum, item) => sum + item.shopWelds, 0) / chartData.length 
    : 0;
  
  const avgFieldWelds = chartData.length > 0 
    ? chartData.reduce((sum, item) => sum + item.fieldWelds, 0) / chartData.length 
    : 0;

  // Toggle between chart types
  const toggleChartType = () => {
    setChartType(prev => {
      const types = ['line', 'bar', 'composed', 'area'];
      const currentIndex = types.indexOf(prev);
      return types[(currentIndex + 1) % types.length];
    });
  };

  // Render appropriate chart based on selected type
  const renderChart = () => {
    switch(chartType) {
      case 'bar':
        return (
          <BarChart data={chartData} onClick={handleWeekClick}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="week" label={{ value: 'Week', position: 'insideBottom', offset: -5 }} />
            <YAxis label={{ value: 'Weld Count', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Legend onClick={(entry) => onWeekClick && onWeekClick(entry.dataKey)} />
            <ReferenceLine y={avgShopWelds} stroke="#8884d8" strokeDasharray="3 3" label="Avg Shop" />
            <ReferenceLine y={avgFieldWelds} stroke="#82ca9d" strokeDasharray="3 3" label="Avg Field" />
            <Bar dataKey="shopWelds" name="Shop Welds" fill="#8884d8" />
            <Bar dataKey="fieldWelds" name="Field Welds" fill="#82ca9d" />
            <Bar dataKey="totalWelds" name="Total Welds" fill="#ff7300" />
          </BarChart>
        );
      
      case 'composed':
        return (
          <ComposedChart data={chartData} onClick={handleWeekClick}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="week" label={{ value: 'Week', position: 'insideBottom', offset: -5 }} />
            <YAxis yAxisId="left" label={{ value: 'Weld Count', angle: -90, position: 'insideLeft' }} />
            <YAxis yAxisId="right" orientation="right" label={{ value: 'Completion %', angle: 90, position: 'insideRight' }} domain={[0, 100]} />
            <Tooltip />
            <Legend onClick={(entry) => onWeekClick && onWeekClick(entry.dataKey)} />
            <Bar yAxisId="left" dataKey="shopWelds" name="Shop Welds" fill="#8884d8" />
            <Bar yAxisId="left" dataKey="fieldWelds" name="Field Welds" fill="#82ca9d" />
            <Line yAxisId="right" type="monotone" dataKey="completionRate" name="Completion %" stroke="#ff7300" strokeWidth={2} />
          </ComposedChart>
        );
        
      case 'area':
        return (
          <ComposedChart data={chartData} onClick={handleWeekClick}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="week" label={{ value: 'Week', position: 'insideBottom', offset: -5 }} />
            <YAxis label={{ value: 'Cumulative Welds', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Legend onClick={(entry) => onWeekClick && onWeekClick(entry.dataKey)} />
            <Area type="monotone" dataKey="cumulativeShop" name="Cumulative Shop" fill="#8884d8" stroke="#8884d8" fillOpacity={0.3} />
            <Area type="monotone" dataKey="cumulativeField" name="Cumulative Field" fill="#82ca9d" stroke="#82ca9d" fillOpacity={0.3} />
            <Area type="monotone" dataKey="cumulativeTotal" name="Cumulative Total" fill="#ff7300" stroke="#ff7300" fillOpacity={0.3} />
          </ComposedChart>
        );
        
      default: // line chart
        return (
          <LineChart data={chartData} onClick={handleWeekClick}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="week" 
              label={{ value: 'Week', position: 'insideBottom', offset: -5 }} 
            />
            <YAxis label={{ value: 'Weld Count', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Legend onClick={(entry) => onWeekClick && onWeekClick(entry.dataKey)} />
            <Line 
              type="monotone" 
              dataKey="shopWelds" 
              stroke="#8884d8" 
              name="Shop Welds" 
              strokeWidth={activeFilters && activeFilters.week !== 'all' ? 3 : 1}
              dot={{ 
                stroke: '#8884d8', 
                strokeWidth: 2, 
                r: (entry) => activeFilters && entry.week === activeFilters.week ? 6 : 4 
              }}
              activeDot={{ r: 8 }}
            />
            <Line 
              type="monotone" 
              dataKey="fieldWelds" 
              stroke="#82ca9d" 
              name="Field Welds" 
              strokeWidth={activeFilters && activeFilters.week !== 'all' ? 3 : 1}
              dot={{ 
                stroke: '#82ca9d', 
                strokeWidth: 2, 
                r: (entry) => activeFilters && entry.week === activeFilters.week ? 6 : 4 
              }}
              activeDot={{ r: 8 }}
            />
            <Line 
              type="monotone" 
              dataKey="totalWelds" 
              stroke="#ff7300" 
              name="Total Welds" 
              strokeWidth={activeFilters && activeFilters.week !== 'all' ? 3 : 1}
              dot={{ 
                stroke: '#ff7300', 
                strokeWidth: 2, 
                r: (entry) => activeFilters && entry.week === activeFilters.week ? 6 : 4 
              }}
              activeDot={{ r: 8 }}
            />
          </LineChart>
        );
    }
  };

  return (
    <div className="progress-tracker" ref={containerRef}>
      <div className="chart-header">
        <h3>Weekly Progress Tracking {activeFilters && activeFilters.week !== 'all' && `(Filtered: Week ${activeFilters.week})`}</h3>
        <div className="chart-controls">
          <button onClick={toggleChartType} className="chart-type-toggle">
            {chartType === 'line' ? 'Line Chart' : 
             chartType === 'bar' ? 'Bar Chart' : 
             chartType === 'composed' ? 'Composed Chart' : 'Area Chart'} ▼
          </button>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={400}>
        {renderChart()}
      </ResponsiveContainer>
    </div>
  );
};

export default ProgressTracker;