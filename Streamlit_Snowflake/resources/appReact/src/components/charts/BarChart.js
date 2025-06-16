import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { useCrossFilter } from '../context/CrossFilterContext';

const BarChart = ({ data, title, xKey, yKey, colorScale, filterType }) => {
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
      .domain(data.map(d => d[xKey]))
      .range([0, width])
      .padding(0.2);
    
    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d[yKey]) * 1.1])
      .range([height, 0]);
    
    // Add axes
    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .attr('transform', 'rotate(-45)')
      .style('text-anchor', 'end');
    
    svg.append('g')
      .call(d3.axisLeft(y).ticks(5));
    
    // Add bars
    svg.selectAll('.bar')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', d => x(d[xKey]))
      .attr('y', d => y(d[yKey]))
      .attr('width', x.bandwidth())
      .attr('height', d => height - y(d[yKey]))
      .attr('fill', d => d[xKey] === filters[filterType] ? '#FF5733' : colorScale(d[xKey]))
      .on('click', (event, d) => {
        updateFilter(filterType, d[xKey]);
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

export default BarChart;