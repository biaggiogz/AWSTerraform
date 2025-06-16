import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { useCrossFilter } from '../context/CrossFilterContext';

const BoxPlot = ({ data, title, groupKey, valueKey, colorScale, filterType }) => {
  const chartRef = useRef(null);
  const { filters, updateFilter } = useCrossFilter();
  
  useEffect(() => {
    if (data && data.length > 0) {
      renderChart();
    }
  }, [data, filters]);
  
  const renderChart = () => {
    const container = chartRef.current;
    if (!container) return;
    
    // Clear previous chart
    d3.select(container).selectAll('*').remove();
    
    // Prepare data
    const groupedData = {};
    
    data.forEach(item => {
      const group = item[groupKey] || 'Unknown';
      const value = parseFloat(item[valueKey] || 0);
      
      if (!groupedData[group]) {
        groupedData[group] = [];
      }
      
      if (!isNaN(value)) {
        groupedData[group].push(value);
      }
    });
    
    const chartData = Object.keys(groupedData)
      .filter(group => groupedData[group].length > 0)
      .map(group => {
        const values = groupedData[group].sort((a, b) => a - b);
        
        return {
          group,
          min: d3.min(values),
          q1: d3.quantile(values, 0.25),
          median: d3.quantile(values, 0.5),
          q3: d3.quantile(values, 0.75),
          max: d3.max(values),
          values
        };
      });
    
    // Set up dimensions
    const margin = { top: 20, right: 30, bottom: 60, left: 60 };
    const width = container.clientWidth - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;
    
    // Create SVG
    const svg = d3.select(container)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Set up scales
    const x = d3.scaleBand()
      .domain(chartData.map(d => d.group))
      .range([0, width])
      .padding(0.4);
    
    const y = d3.scaleLinear()
      .domain([0, 100])
      .range([height, 0]);
    
    // Add axes
    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x));
    
    svg.append('g')
      .call(d3.axisLeft(y).ticks(5).tickFormat(d => d + '%'));
    
    // Add box plots
    chartData.forEach(d => {
      const boxWidth = x.bandwidth();
      const xPos = x(d.group);
      
      // Box
      svg.append('rect')
        .attr('x', xPos)
        .attr('y', y(d.q3))
        .attr('width', boxWidth)
        .attr('height', y(d.q1) - y(d.q3))
        .attr('fill', d.group === filters[filterType] ? '#FF5733' : colorScale(d.group))
        .attr('stroke', 'black')
        .attr('stroke-width', 1)
        .on('click', () => {
          updateFilter(filterType, d.group);
        });
      
      // Median line
      svg.append('line')
        .attr('x1', xPos)
        .attr('x2', xPos + boxWidth)
        .attr('y1', y(d.median))
        .attr('y2', y(d.median))
        .attr('stroke', 'black')
        .attr('stroke-width', 2);
      
      // Min line
      svg.append('line')
        .attr('x1', xPos + boxWidth / 2)
        .attr('x2', xPos + boxWidth / 2)
        .attr('y1', y(d.q1))
        .attr('y2', y(d.min))
        .attr('stroke', 'black')
        .attr('stroke-width', 1);
      
      // Min cap
      svg.append('line')
        .attr('x1', xPos + boxWidth / 4)
        .attr('x2', xPos + boxWidth * 3 / 4)
        .attr('y1', y(d.min))
        .attr('y2', y(d.min))
        .attr('stroke', 'black')
        .attr('stroke-width', 1);
      
      // Max line
      svg.append('line')
        .attr('x1', xPos + boxWidth / 2)
        .attr('x2', xPos + boxWidth / 2)
        .attr('y1', y(d.q3))
        .attr('y2', y(d.max))
        .attr('stroke', 'black')
        .attr('stroke-width', 1);
      
      // Max cap
      svg.append('line')
        .attr('x1', xPos + boxWidth / 4)
        .attr('x2', xPos + boxWidth * 3 / 4)
        .attr('y1', y(d.max))
        .attr('y2', y(d.max))
        .attr('stroke', 'black')
        .attr('stroke-width', 1);
    });
    
    // Add title
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', -5)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .text(title);
  };

  return <div ref={chartRef} className="chart"></div>;
};

export default BoxPlot;