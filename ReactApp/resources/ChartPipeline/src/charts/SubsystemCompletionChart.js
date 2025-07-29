import React, { useEffect, useState, useMemo } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { 
  Box, 
  Heading, 
  HStack, 
  Text, 
  VStack, 
  Badge,
  SimpleGrid,
  Button
} from '@chakra-ui/react';
import Chart from 'chart.js/auto';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import useDuckDB from '../hooks/useDuckDB3';
import { useLazosTableSqlFilterContext } from '../components/filters/LazosTableFilter';
import { buildSubsystemCompletionQueries } from '../utils/sqlOptimizer';

// Register the plugin
Chart.register(ChartDataLabels);

const SubsystemCompletionChart = () => {
  const { createTableFromParquet, executeQuery, loading: dbLoading, error: dbError } = useDuckDB();
  const { subsystemCompletionFilter, handleSubsystemCompletionFilter } = useLazosTableSqlFilterContext();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [completionData, setCompletionData] = useState({
    fullyCompleted: [],
    fullyPending: [],
    completedCount: 0,
    pendingCount: 0
  });
  const [parquetLoaded, setParquetLoaded] = useState(false);

  // Load parquet file once
  const loadParquetFile = async () => {
    if (parquetLoaded || dbLoading || dbError) return;
    
    try {
      const res = await fetch('/data/master_subsystem.parquet');
      if (!res.ok) throw new Error(`Failed to fetch Parquet: ${res.status}`);
      
      const parquetBuffer = await res.arrayBuffer();
      await createTableFromParquet('master_subsystem', parquetBuffer);
      setParquetLoaded(true);
    } catch (err) {
      console.error('Error loading Parquet:', err);
      setError('Failed to load data source');
    }
  };

  // Execute all queries
  const fetchCompletionData = async () => {
    if (!parquetLoaded) return;
    
    try {
      setLoading(true);
      
      // Execute optimized queries
      const queries = buildSubsystemCompletionQueries();
      
      const [fullyCompleted, fullyPending, completedCountResult, pendingCountResult] = await Promise.all([
        executeQuery(queries.fullyCompleted, { useCache: true, cacheKey: 'subsystem_completed' }),
        executeQuery(queries.fullyPending, { useCache: true, cacheKey: 'subsystem_pending' }),
        executeQuery(queries.completedCount, { useCache: true, cacheKey: 'completed_count' }),
        executeQuery(queries.pendingCount, { useCache: true, cacheKey: 'pending_count' })
      ]);

      setCompletionData({
        fullyCompleted: fullyCompleted || [],
        fullyPending: fullyPending || [],
        completedCount: Number(completedCountResult?.[0]?.done_subsystem_count || 0),
        pendingCount: Number(pendingCountResult?.[0]?.pending_subsystem_count || 0)
      });
    } catch (err) {
      console.error('Error fetching completion data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Load parquet on mount
  useEffect(() => {
    loadParquetFile();
  }, [createTableFromParquet, dbLoading, dbError]);

  // Fetch data when parquet is loaded
  useEffect(() => {
    if (parquetLoaded) {
      fetchCompletionData();
    }
  }, [parquetLoaded]);

  // Prepare chart data
  const chartData = useMemo(() => ({
    labels: ['Fully Completed', 'Fully Pending'],
    datasets: [{
      data: [completionData.completedCount, completionData.pendingCount],
      backgroundColor: ['#1DE9B6', '#FF168B'],
      borderColor: ['#1DE9B6', '#FF168B'],
      borderWidth: 2
    }]
  }), [completionData]);

  // Chart options
  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          font: { size: 12 }
        }
      },
      datalabels: {
        color: 'white',
        font: { weight: 'bold', size: 14 },
        formatter: (value, context) => {
          const total = context.dataset.data.reduce((a, b) => a + b, 0);
          const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
          return `${value}\n(${percentage}%)`;
        },
        textAlign: 'center'
      }
    }
  }), []);

  if (loading) return <Box p={4}><Text>Loading...</Text></Box>;
  if (error) return <Box p={4}><Text color="red.500">Error: {error}</Text></Box>;

  const totalSubsystems = completionData.completedCount + completionData.pendingCount;

  return (
    <Box p={4} borderWidth="1px" borderRadius="lg" bg="white">
      <Heading size="md" mb={4} textAlign="center">
        SUBSYSTEM COMPLETION STATUS
      </Heading>
      
      {/* Filter Buttons */}
      <HStack justify="center" mb={4} spacing={2}>
        <Button
          size="sm"
          colorScheme={subsystemCompletionFilter === 'DONE' ? 'green' : 'gray'}
          variant={subsystemCompletionFilter === 'DONE' ? 'solid' : 'outline'}
          onClick={() => {
            console.log('DONE button clicked, current filter:', subsystemCompletionFilter);
            handleSubsystemCompletionFilter('DONE');
          }}
        >
          DONE ({completionData.completedCount})
        </Button>
        <Button
          size="sm"
          colorScheme={subsystemCompletionFilter === 'PENDING' ? 'red' : 'gray'}
          variant={subsystemCompletionFilter === 'PENDING' ? 'solid' : 'outline'}
          onClick={() => handleSubsystemCompletionFilter('PENDING')}
        >
          PENDING ({completionData.pendingCount})
        </Button>
        <Button
          size="sm"
          colorScheme={subsystemCompletionFilter === 'TOTAL' ? 'blue' : 'gray'}
          variant={subsystemCompletionFilter === 'TOTAL' ? 'solid' : 'outline'}
          onClick={() => handleSubsystemCompletionFilter('TOTAL')}
        >
          TOTAL ({totalSubsystems})
        </Button>
      </HStack>
      
      <SimpleGrid columns={1} spacing={4}>
        {/* Chart */}
        <Box height="250px">
          <Doughnut data={chartData} options={options} />
        </Box>
        
        {/* Completion Rate */}
        <Text fontSize="md" fontWeight="bold" color="green.600" textAlign="center">
          Completion Rate: {totalSubsystems > 0 ? ((completionData.completedCount / totalSubsystems) * 100).toFixed(1) : 0}%
        </Text>
      </SimpleGrid>
      

    </Box>
  );
};

export default SubsystemCompletionChart;