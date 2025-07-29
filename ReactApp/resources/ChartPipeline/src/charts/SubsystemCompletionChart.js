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

  if (loading) return <Box><Box p={4} borderWidth="1px" borderRadius="lg" bg="white" mt={4}><Text>Loading...</Text></Box></Box>;
  if (error) return <Box><Box p={4} borderWidth="1px" borderRadius="lg" bg="white" mt={4}><Text color="red.500">Error: {error}</Text></Box></Box>;

  const totalSubsystems = completionData.completedCount + completionData.pendingCount;

  return (
    <Box>
      {/* Chart container - matching LoopTestProgressChart structure exactly */}
      <Box p={4} borderWidth="1px" borderRadius="lg" bg="white"  mt={4}>
        <Heading size="md" mb={2}>
          SUBSYSTEM COMPLETION STATUS
        </Heading>
        
        {/* Summary statistics - matching LoopTestProgressChart */}
        <VStack mb={4} align="flex-start">
          <Text fontSize="sm">
            <Badge colorScheme="blue" mr={2}>Total Subsystems:</Badge> {totalSubsystems}
            <Badge ml={2} colorScheme="green">Completion Rate: {totalSubsystems > 0 ? ((completionData.completedCount / totalSubsystems) * 100).toFixed(1) : 0}%</Badge>
          </Text>
        </VStack>
        
        {/* Filter Buttons - matching GlobalMetricsDisplay position */}
        <HStack justify="center" mb={4} spacing={2}>
          <Button
            size="sm"
            colorScheme={subsystemCompletionFilter === 'DONE' ? 'green' : 'gray'}
            variant={subsystemCompletionFilter === 'DONE' ? 'solid' : 'outline'}
            onClick={() => handleSubsystemCompletionFilter('DONE')}
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
        
        {/* Chart container - matching LoopTestProgressChart structure */}
        <Box position="relative">
          <Box 
            height="460px"
            border="1px solid"
            borderColor="gray.200"
            borderRadius="md"
            position="relative"
            p={4}
          >
            <Box height="100%">
              <Doughnut data={chartData} options={options} />
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default SubsystemCompletionChart;