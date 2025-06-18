import React, { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import { Box, Heading } from '@chakra-ui/react';

/**
 * Optimized Bar Chart showing TAG_LOOP metrics
 * @param {Object} props - Component props
 * @param {Array} props.data - Dataset from CSV
 */
const MetricsBarChart = ({ data }) => {
  // Calculate metrics with memoization for performance
  const metrics = useMemo(() => {
    if (!data || data.length === 0) return {};
    
    // Pre-process data for faster lookups
    const tagLoops = new Set();
    const completedTagLoops = new Set();
    const allStepsCompleteTagLoops = new Set();
    const preCommissioningTagLoops = new Set();
    const incompleteConstructionTagLoops = new Set();
    
    // Single pass through data for all metrics
    data.forEach(item => {
      const tagLoop = item['TAG LOOP'];
      if (!tagLoop) return;
      
      // Add to unique tag loops
      tagLoops.add(tagLoop);
      
      // Check OK=100%
      const okValue = item['OK=100%']?.toString().replace('%', '').trim();
      if (parseFloat(okValue) === 100) {
        completedTagLoops.add(tagLoop);
      }
      
      // Check construction steps
      const hasAllSteps = item['INSTALLED'] && 
                          item['WIRED'] && 
                          item['CONNECTED'] && 
                          item['CABLE TEST'];
      
      if (hasAllSteps) {
        allStepsCompleteTagLoops.add(tagLoop);
      } else {
        incompleteConstructionTagLoops.add(tagLoop);
      }
      
      // Check pre-commissioning dates
      if (item['DOSSIER'] || item['TEST LOOP']) {
        preCommissioningTagLoops.add(tagLoop);
      }
    });
    
    return {
      'Unique TAG_LOOPs': tagLoops.size,
      'TAG_LOOPs with OK=100%': completedTagLoops.size,
      'TAG_LOOPs with all construction steps complete': allStepsCompleteTagLoops.size,
      'TAG_LOOPs with Pre-Commissioning Dates': preCommissioningTagLoops.size,
      'TAG_LOOPs with incomplete construction': incompleteConstructionTagLoops.size
    };
  }, [data]);
  
  // Prepare chart data with memoization
  const chartData = useMemo(() => {
    return {
      labels: Object.keys(metrics),
      datasets: [
        {
          data: Object.values(metrics),
          backgroundColor: 'rgba(54, 162, 235, 0.7)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1,
        }
      ]
    };
  }, [metrics]);
  
  // Chart options with memoization
  const options = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 500 // Reduced animation time for better performance
      },
      plugins: {
        legend: {
          display: false, // Hide legend as we don't need it for a single dataset
        },
        tooltip: {
          callbacks: {
            label: (context) => `Count: ${context.raw}`
          },
          enabled: true,
          mode: 'index',
          intersect: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            maxTicksLimit: 5 // Limit the number of ticks for better performance
          },
          title: {
            display: true,
            text: 'Count'
          }
        },
        x: {
          title: {
            display: true,
            text: 'Metrics'
          }
        }
      },
      // Display the value inside each bar
      plugins: [{
        id: 'valueLabels',
        afterDatasetsDraw(chart) {
          const { ctx } = chart;
          ctx.save();
          ctx.font = 'bold 12px Arial';
          ctx.fillStyle = 'white';
          ctx.textAlign = 'center';
          
          chart.data.datasets[0].data.forEach((value, index) => {
            const meta = chart.getDatasetMeta(0);
            const bar = meta.data[index];
            
            // Only show text if bar is tall enough
            if (bar.height > 20) {
              ctx.fillText(
                value,
                bar.x,
                bar.y + (bar.height / 2) + 5
              );
            }
          });
          
          ctx.restore();
        }
      }]
    };
  }, []);

  return (
    <Box p={4} borderWidth="1px" borderRadius="lg" bg="white" height="400px">
      <Heading size="md" mb={4}>TAG_LOOP Metrics</Heading>
      <Bar data={chartData} options={options} />
    </Box>
  );
};

// Use React.memo to prevent unnecessary re-renders
export default React.memo(MetricsBarChart);