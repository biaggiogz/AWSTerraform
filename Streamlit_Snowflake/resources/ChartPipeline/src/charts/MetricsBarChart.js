import React, { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import { Box, Heading } from '@chakra-ui/react';

/**
 * Bar Chart showing TAG_LOOP metrics
 * @param {Object} props - Component props
 * @param {Array} props.data - Dataset from CSV
 */
const MetricsBarChart = ({ data }) => {
  // Calculate metrics based on the requirements
  const metrics = useMemo(() => {
    if (!data || data.length === 0) return {};
    
    const totalTagLoops = new Set(data.map(item => item['TAG LOOP'])).size;
    
    // TAG_LOOPs with OK=100%
    const completedTagLoops = new Set(
      data.filter(item => {
        const okValue = item['OK=100%']?.toString().replace('%', '').trim();
        return parseFloat(okValue) === 100;
      }).map(item => item['TAG LOOP'])
    ).size;
    
    // TAG_LOOPs with all construction steps complete
    const allStepsCompleteTagLoops = new Set(
      data.filter(item => 
        item['INSTALLED'] && 
        item['WIRED'] && 
        item['CONNECTED'] && 
        item['CABLE TEST']
      ).map(item => item['TAG LOOP'])
    ).size;
    
    // TAG_LOOPs with Pre-Commissioning Dates
    const preCommissioningTagLoops = new Set(
      data.filter(item => 
        item['DOSSIER'] || item['TEST LOOP']
      ).map(item => item['TAG LOOP'])
    ).size;
    
    // TAG_LOOPs with incomplete construction
    const incompleteConstructionTagLoops = new Set(
      data.filter(item => 
        !item['INSTALLED'] || 
        !item['WIRED'] || 
        !item['CONNECTED'] || 
        !item['CABLE TEST']
      ).map(item => item['TAG LOOP'])
    ).size;
    
    return {
      'Unique TAG_LOOPs': totalTagLoops,
      'TAG_LOOPs with OK=100%': completedTagLoops,
      'TAG_LOOPs with all construction steps complete': allStepsCompleteTagLoops,
      'TAG_LOOPs with Pre-Commissioning Dates': preCommissioningTagLoops,
      'TAG_LOOPs with incomplete construction': incompleteConstructionTagLoops
    };
  }, [data]);
  
  // Prepare chart data
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
  
  // Chart options
  const options = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false, // Hide legend as we don't need it for a single dataset
        },
        tooltip: {
          callbacks: {
            label: (context) => `Count: ${context.raw}`
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
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

export default React.memo(MetricsBarChart);