import React, { useMemo, useRef, useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { Box, Heading } from '@chakra-ui/react';
import { calculateMetricsByGroup } from '../utils/dataProcessor.optimized';

/**
 * Chart B: Side-by-Side Bar Chart comparing support installation and welding progress
 * @param {Object} props - Component props
 * @param {Array} props.data - Filtered dataset
 */
const SubsystemComparisonChart = ({ data }) => {
  // Reference to chart container for layout recalculation
  const chartRef = useRef(null);
  
  // Force chart re-render when data changes significantly
  const [chartKey, setChartKey] = useState(0);
  
  // Calculate metrics by subsystem with memoization
  const subsystemMetrics = useMemo(() => {
    if (!data || data.length === 0) return {};
    return calculateMetricsByGroup(data, 'SUBSYSTEM');
  }, [data]);
  
  // Get sorted subsystem names for consistent ordering
  const sortedSubsystems = useMemo(() => {
    return Object.keys(subsystemMetrics).sort();
  }, [subsystemMetrics]);
  
  // Calculate optimal bar width based on number of subsystems
  const getOptimalBarWidth = (count) => {
    if (count <= 3) return 0.3;
    if (count <= 5) return 0.4;
    if (count <= 10) return 0.6;
    return 0.8;
  };
  
  // Prepare chart data with memoization
  const chartData = useMemo(() => {
    return {
      labels: sortedSubsystems,
      datasets: [
        {
          label: 'Support Installation Progress (%)',
          data: sortedSubsystems.map(subsystem => subsystemMetrics[subsystem].supportInstallationProgress),
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1,
        },
        {
          label: 'Welding Progress (%)',
          data: sortedSubsystems.map(subsystem => subsystemMetrics[subsystem].avgRatioDoneDiainch),
          backgroundColor: 'rgba(153, 102, 255, 0.6)',
          borderColor: 'rgba(153, 102, 255, 1)',
          borderWidth: 1,
        }
      ]
    };
  }, [sortedSubsystems, subsystemMetrics]);
  
  // Chart options with memoization
  const options = useMemo(() => {
    const barPercentage = getOptimalBarWidth(sortedSubsystems.length);
    
    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: sortedSubsystems.length <= 5 ? 0 : 300
      },
      plugins: {
        tooltip: {
          enabled: false, // Disable tooltips for better performance
          callbacks: {
            label: (context) => {
              const label = context.dataset.label || '';
              return `${label}: ${context.raw.toFixed(2)}%`;
            }
          }
        },
        legend: {
          position: 'top',
          labels: {
            boxWidth: 15, // Smaller legend items
            padding: 10
          }
        },
        title: {
          display: false,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          title: {
            display: true,
            text: 'Progress (%)'
          },
          ticks: {
            maxTicksLimit: 6 // Limit the number of ticks for better performance
          },
          grid: {
            display: true,
            color: 'rgba(0, 0, 0, 0.1)' // Light grid lines
          }
        },
        x: {
          title: {
            display: true,
            text: 'Subsystem'
          },
          barPercentage,
          grid: {
            display: false // Hide vertical grid lines
          }
        }
      }
    };
  }, [sortedSubsystems.length]);

  // Update chart when data changes significantly
  useEffect(() => {
    // Force re-render when subsystem count changes
    setChartKey(prev => prev + 1);
    
    // Trigger resize to recalculate layout
    if (chartRef.current) {
      setTimeout(() => window.dispatchEvent(new Event('resize')), 50);
    }
  }, [sortedSubsystems.length]);

  // Calculate optimal chart height based on number of subsystems
  const chartHeight = useMemo(() => {
    const baseHeight = 400;
    const minHeight = 300;
    const maxHeight = 600;
    
    // Add height for each subsystem beyond 5
    const additionalHeight = Math.max(0, sortedSubsystems.length - 5) * 20;
    
    return Math.min(maxHeight, Math.max(minHeight, baseHeight + additionalHeight));
  }, [sortedSubsystems.length]);

  return (
    <Box 
      p={4} 
      borderWidth="1px" 
      borderRadius="lg" 
      bg="white" 
      height={`${chartHeight}px`}
      ref={chartRef}
    >
      <Heading size="md" mb={4}>Support Installation vs Welding Progress by Subsystem</Heading>
      <Box key={chartKey} height="calc(100% - 40px)">
        <Bar data={chartData} options={options} />
      </Box>
    </Box>
  );
};

// Use React.memo to prevent unnecessary re-renders
export default React.memo(SubsystemComparisonChart);