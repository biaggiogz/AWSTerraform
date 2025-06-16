import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { useCrossFilter } from '../context/CrossFilterContext';

const StackedBarChart = ({ data, title, xKey, yKeys, colorScale, filterType }) => {
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
    const x = d3.scaleBand()
      .domain(data.map(d => d[xKey]))
      .range([0, width])
      .padding(0.2);
    
    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.total)])
      .range([height, 0]);
    
    // Add axes
    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .attr('transform', 'rotate(-45)')
      .style('text-anchor', 'end');
    
    svg.append('g')
      .call(d3.axisLeft(y));
    
    // Add stacked bars
    yKeys.forEach((key, index) => {
      const prevKey = index > 0 ? yKeys[index - 1] : null;
      
      svg.selectAll(`.bar-${key}`)
        .data(data)
        .enter()
        .append('rect')
        .attr('class', `bar-${key}`)
        .attr('x', d => x(d[xKey]))
        .attr('y', d => {
          if (prevKey) {
            return y(d[prevKey] + d[key]);
          }
          return y(d[key]);
        })
        .attr('width', x.bandwidth())
        .attr('height', d => {
          if (prevKey) {
            return y(d[prevKey]) - y(d[prevKey] + d[key]);
          }
          return height - y(d[key]);
        })
        .attr('fill', colorScale(key))
        .attr('stroke', d => d[xKey] === filters[filterType] ? 'black' : 'none')
        .attr('stroke-width', d => d[xKey] === filters[filterType] ? 2 : 0)
        .on('click', (event, d) => {
          updateFilter(filterType, d[xKey]);
        });
    });
    
    // Add legend
    const legend = svg.append('g')
      .attr('transform', `translate(${width + 10}, 0)`);
    
    yKeys.forEach((key, i) => {
      legend.append('rect')
        .attr('x', 0)
        .attr('y', i * 20)
        .attr('width', 15)
        .attr('height', 15)
        .attr('fill', colorScale(key));
      
      legend.append('text')
        .attr('x', 20)
        .attr('y', i * 20 + 12)
        .text(key);
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

export default StackedBarChart;