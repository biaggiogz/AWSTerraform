import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { useCrossFilter } from '../context/CrossFilterContext';

const ScatterPlot = ({ data, title, xKey, yKey, groupKey, colorScale, filterType }) => {
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
    
    // Get unique groups
    const groups = [...new Set(data.map(item => item[groupKey]))];
    
    // Set up dimensions
    const margin = { top: 20, right: 100, bottom: 60, left: 60 };
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
    const x = d3.scaleLinear()
      .domain([0, d3.max(data, d => parseFloat(d[xKey] || 0)) * 1.1])
      .range([0, width]);
    
    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => parseFloat(d[yKey] || 0)) * 1.1])
      .range([height, 0]);
    
    // Add axes
    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x));
    
    svg.append('g')
      .call(d3.axisLeft(y));
    
    // Add diagonal reference line (perfect correlation)
    const maxVal = Math.max(
      d3.max(data, d => parseFloat(d[xKey] || 0)),
      d3.max(data, d => parseFloat(d[yKey] || 0))
    );
    
    svg.append('line')
      .attr('x1', x(0))
      .attr('y1', y(0))
      .attr('x2', x(maxVal))
      .attr('y2', y(maxVal))
      .attr('stroke', '#ccc')
      .attr('stroke-dasharray', '5,5');
    
    // Add scatter points
    groups.forEach(group => {
      const groupData = data.filter(d => d[groupKey] === group);
      
      svg.selectAll(`.dot-${group.replace(/[^a-zA-Z0-9]/g, '')}`)
        .data(groupData)
        .enter()
        .append('circle')
        .attr('class', `dot-${group.replace(/[^a-zA-Z0-9]/g, '')}`)
        .attr('cx', d => x(parseFloat(d[xKey] || 0)))
        .attr('cy', d => y(parseFloat(d[yKey] || 0)))
        .attr('r', 5)
        .attr('fill', colorScale(group))
        .attr('stroke', group === filters[filterType] ? 'black' : 'none')
        .attr('stroke-width', group === filters[filterType] ? 2 : 0)
        .on('click', (event, d) => {
          updateFilter(filterType, d[groupKey]);
        });
    });
    
    // Add legend
    const legend = svg.append('g')
      .attr('transform', `translate(${width + 10}, 0)`);
    
    groups.forEach((group, i) => {
      legend.append('circle')
        .attr('cx', 5)
        .attr('cy', i * 20 + 10)
        .attr('r', 5)
        .attr('fill', colorScale(group));
      
      legend.append('text')
        .attr('x', 15)
        .attr('y', i * 20 + 15)
        .text(group)
        .style('font-size', '12px');
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

export default ScatterPlot;