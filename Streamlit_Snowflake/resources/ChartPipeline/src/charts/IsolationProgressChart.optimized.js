import React, { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import { Box, Heading, Grid, GridItem, Text, VStack } from '@chakra-ui/react';

/**
 * Isolation Progress Monitoring Chart - displays progress across different isolation phases
 * @param {Object} props - Component props
 * @param {Array} props.data - Raw dataset from aislamientos.csv
 */
const IsolationProgressChart = ({ data }) => {
  // Calculate global isolation metrics with memoization
  const isolationMetrics = useMemo(() => {
    if (!data || data.length === 0) return {};
    
    const metrics = {
      distanciadores: 0,
      aislamiento: 0,
      chapa: 0,
      cajas: 0,
      rematar: 0,
      totalRecords: data.length
    };
    
    let validDistanciadores = 0;
    let validAislamiento = 0;
    let validChapa = 0;
    let validCajas = 0;
    let validRematar = 0;
    
    data.forEach(item => {
      // Parse progress values, handling different formats
      const distanciadores = parseFloat(item['%Avance Distanciadores']) || 0;
      const aislamiento = parseFloat(item['% Avance Aislamiento']) || 0;
      const chapa = parseFloat(item['% Avance Chapa']) || 0;
      const cajas = parseFloat(item['% Avance Cajas']) || 0;
      const rematar = parseFloat(item['% Avance Rematar']) || 0;
      
      if (distanciadores > 0) {
        metrics.distanciadores += distanciadores;
        validDistanciadores++;
      }
      if (aislamiento > 0) {
        metrics.aislamiento += aislamiento;
        validAislamiento++;
      }
      if (chapa > 0) {
        metrics.chapa += chapa;
        validChapa++;
      }
      if (cajas > 0) {
        metrics.cajas += cajas;
        validCajas++;
      }
      if (rematar > 0) {
        metrics.rematar += rematar;
        validRematar++;
      }
    });
    
    // Calculate averages
    return {
      distanciadores: validDistanciadores > 0 ? (metrics.distanciadores / validDistanciadores) * 100 : 0,
      aislamiento: validAislamiento > 0 ? (metrics.aislamiento / validAislamiento) * 100 : 0,
      chapa: validChapa > 0 ? (metrics.chapa / validChapa) * 100 : 0,
      cajas: validCajas > 0 ? (metrics.cajas / validCajas) * 100 : 0,
      rematar: validRematar > 0 ? (metrics.rematar / validRematar) * 100 : 0,
      totalRecords: data.length,
      validCounts: {
        distanciadores: validDistanciadores,
        aislamiento: validAislamiento,
        chapa: validChapa,
        cajas: validCajas,
        rematar: validRematar
      }
    };
  }, [data]);
  
  // Prepare chart data
  const chartData = useMemo(() => {
    const phases = ['Distanciadores', 'Aislamiento', 'Chapa', 'Cajas', 'Rematar'];
    const values = [
      isolationMetrics.distanciadores || 0,
      isolationMetrics.aislamiento || 0,
      isolationMetrics.chapa || 0,
      isolationMetrics.cajas || 0,
      isolationMetrics.rematar || 0
    ];
    
    return {
      labels: phases,
      datasets: [{
        label: 'Progress (%)',
        data: values,
        backgroundColor: [
          'rgba(54, 162, 235, 0.6)',   // Blue
          'rgba(255, 99, 132, 0.6)',   // Red
          'rgba(255, 205, 86, 0.6)',   // Yellow
          'rgba(75, 192, 192, 0.6)',   // Teal
          'rgba(153, 102, 255, 0.6)'   // Purple
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(255, 99, 132, 1)',
          'rgba(255, 205, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)'
        ],
        borderWidth: 2
      }]
    };
  }, [isolationMetrics]);
  
  // Chart options
  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 300
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: (context) => {
            const phase = context.label;
            const value = context.raw.toFixed(1);
            const validCount = isolationMetrics.validCounts?.[phase.toLowerCase()] || 0;
            return [
              `${phase}: ${value}%`,
              `Valid records: ${validCount}`
            ];
          }
        }
      },
      legend: {
        display: false
      },
      title: {
        display: false
      }
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
          callback: (value) => `${value}%`
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Isolation Phase'
        },
        grid: {
          display: false
        }
      }
    }
  }), [isolationMetrics.validCounts]);
  
  // Calculate overall progress
  const overallProgress = useMemo(() => {
    const values = [
      isolationMetrics.distanciadores || 0,
      isolationMetrics.aislamiento || 0,
      isolationMetrics.chapa || 0,
      isolationMetrics.cajas || 0,
      isolationMetrics.rematar || 0
    ];
    const validValues = values.filter(v => v > 0);
    return validValues.length > 0 ? validValues.reduce((a, b) => a + b, 0) / validValues.length : 0;
  }, [isolationMetrics]);

  return (
    <VStack spacing={4} align="stretch">
      {/* Header with overall metrics */}
      <Box p={4} borderWidth="1px" borderRadius="lg" bg="blue.50">
        <Heading size="md" mb={3} color="blue.700">
          Isolation Progress Monitoring
        </Heading>
        <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={4}>
          <GridItem>
            <Text fontSize="sm" color="gray.600">Overall Progress</Text>
            <Text fontSize="2xl" fontWeight="bold" color="blue.600">
              {overallProgress.toFixed(1)}%
            </Text>
          </GridItem>
          <GridItem>
            <Text fontSize="sm" color="gray.600">Total Records</Text>
            <Text fontSize="2xl" fontWeight="bold" color="gray.700">
              {isolationMetrics.totalRecords || 0}
            </Text>
          </GridItem>
        </Grid>
      </Box>
      
      {/* Progress Chart */}
      <Box p={4} borderWidth="1px" borderRadius="lg" bg="white" height="400px">
        <Bar data={chartData} options={options} />
      </Box>
      
      {/* Detailed Metrics */}
      <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={4}>
        {[
          { key: 'distanciadores', label: 'Distanciadores', color: 'blue' },
          { key: 'aislamiento', label: 'Aislamiento', color: 'red' },
          { key: 'chapa', label: 'Chapa', color: 'yellow' },
          { key: 'cajas', label: 'Cajas', color: 'teal' },
          { key: 'rematar', label: 'Rematar', color: 'purple' }
        ].map(({ key, label, color }) => (
          <GridItem key={key}>
            <Box p={3} borderWidth="1px" borderRadius="md" bg={`${color}.50`}>
              <Text fontSize="sm" color={`${color}.700`} fontWeight="medium">
                {label}
              </Text>
              <Text fontSize="xl" fontWeight="bold" color={`${color}.600`}>
                {(isolationMetrics[key] || 0).toFixed(1)}%
              </Text>
              <Text fontSize="xs" color="gray.600">
                {isolationMetrics.validCounts?.[key] || 0} records
              </Text>
            </Box>
          </GridItem>
        ))}
      </Grid>
    </VStack>
  );
};

export default React.memo(IsolationProgressChart);