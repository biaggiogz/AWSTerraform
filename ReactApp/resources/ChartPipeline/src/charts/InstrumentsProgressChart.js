import React, { useEffect, useState, useMemo } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { 
  Box, 
  Heading, 
  HStack, 
  Text, 
  VStack, 
  Badge,
  Button
} from '@chakra-ui/react';
import Chart from 'chart.js/auto';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { useInstrumentsTableFilterContext } from '../components/filters/InstrumentsTableFilter';

Chart.register(ChartDataLabels);

const InstrumentsProgressChart = () => {
  const { 
    instrumentsProgressFilter, 
    handleInstrumentsProgressFilter, 
    tableData 
  } = useInstrumentsTableFilterContext();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Calculate progress data from filtered table data
  const calculateProgressData = useMemo(() => {
    if (!tableData || tableData.length === 0) {
      return {
        totalInst: 0,
        qfcRelease: 0,
        pendingQfcToRelease: 0,
        totalSiemsa: 0,
        installedSiemsa: 0,
        pendingSiemsa: 0,
        totalTeiga: 0,
        installedTeiga: 0,
        pendingTeiga: 0
      };
    }

    const totals = tableData.reduce((acc, row) => {
      acc.totalInst += Number(row['TOTAL INST']) || 0;
      acc.qfcRelease += Number(row['QFC RELEASE']) || 0;
      acc.totalSiemsa += Number(row['TOTAL SIEMSA']) || 0;
      acc.installedSiemsa += Number(row['INSTALLED SIEMSA']) || 0;
      acc.pendingSiemsa += Number(row['PENDING SIEMSA']) || 0;
      acc.totalTeiga += Number(row['TOTAL TEIGA']) || 0;
      acc.installedTeiga += Number(row['INSTALLED TEIGA']) || 0;
      acc.pendingTeiga += Number(row['PENDING TEIGA']) || 0;
      return acc;
    }, {
      totalInst: 0,
      qfcRelease: 0,
      totalSiemsa: 0,
      installedSiemsa: 0,
      pendingSiemsa: 0,
      totalTeiga: 0,
      installedTeiga: 0,
      pendingTeiga: 0
    });

    return {
      ...totals,
      pendingQfcToRelease: totals.totalInst - totals.qfcRelease
    };
  }, [tableData]);

  useEffect(() => {
    setLoading(false);
  }, [calculateProgressData]);

  // Prepare chart data with 3 concentric rings
  const chartData = useMemo(() => ({
    datasets: [
      // Outer Ring - Global QFC
      {
        label: 'Global',
        data: [calculateProgressData.qfcRelease, calculateProgressData.pendingQfcToRelease],
        backgroundColor: ['#386641', '#F97A00'],
        borderColor: ['#386641', '#F97A00'],
        borderWidth: 2,
        weight: 1
      },
      // Middle Ring - SIEMSA
      {
        label: 'SIEMSA',
        data: [calculateProgressData.installedSiemsa, calculateProgressData.pendingSiemsa],
        backgroundColor: ['#015551', '#57B4BA'],
        borderColor: ['#015551', '#57B4BA'],
        borderWidth: 2,
        weight: 0.7
      },
      // Inner Ring - TEIGA
      {
        label: 'TEIGA',
        data: [calculateProgressData.installedTeiga, calculateProgressData.pendingTeiga],
        backgroundColor: ['#57564F', '#DDDAD0'],
        borderColor: ['#57564F', '#DDDAD0'],
        borderWidth: 2,
        weight: 0.4
      }
    ]
  }), [calculateProgressData]);

  // Chart options
  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 10,
          font: { size: 9 },
          generateLabels: () => [
            { text: 'INSTALLED SIEMSA', fillStyle: '#015551' },
            { text: 'PENDING SIEMSA', fillStyle: '#57B4BA' },
            { text: 'INSTALLED TEIGA', fillStyle: '#57564F' },
            { text: 'PENDING TEIGA', fillStyle: '#DDDAD0' }
          ]
        }
      },
      datalabels: {
        color: 'white',
        font: { weight: 'bold', size: 10 },
        formatter: (value, context) => {
          if (value === 0) return '';
          const percentage = context.dataset.data.reduce((a, b) => a + b, 0) > 0 
            ? ((value / context.dataset.data.reduce((a, b) => a + b, 0)) * 100).toFixed(0) 
            : 0;
          return `${value}\n(${percentage}%)`;
        },
        textAlign: 'center'
      }
    }
  }), []);

  if (loading) return <Box><Box p={4} borderWidth="1px" borderRadius="lg" bg="white" mt={4}><Text>Loading...</Text></Box></Box>;
  if (error) return <Box><Box p={4} borderWidth="1px" borderRadius="lg" bg="white" mt={4}><Text color="red.500">Error: {error}</Text></Box></Box>;

  return (
    <Box>
      <Box p={4} borderWidth="1px" borderRadius="lg" bg="white" mt={4}>
        <Heading size="md" mb={2} textAlign="center">
          INSTRUMENTS PROGRESS STATUS ACROSS ALL SUBSYSTEMS
        </Heading>
        
        <VStack mb={4} align="center">
          <Text fontSize="sm">
            <Badge colorScheme="blue" mr={2}>Total Instruments:</Badge> {calculateProgressData.totalInst}
            <Badge ml={2} colorScheme="green">QFC Release Rate: {calculateProgressData.totalInst > 0 ? ((calculateProgressData.qfcRelease / calculateProgressData.totalInst) * 100).toFixed(1) : 0}%</Badge>
          </Text>
        </VStack>
        
        <HStack justify="center" mb={4} spacing={2}>
          <Button
            size="sm"
            colorScheme={instrumentsProgressFilter === 'DONE' ? 'green' : 'gray'}
            variant={instrumentsProgressFilter === 'DONE' ? 'solid' : 'outline'}
            onClick={() => handleInstrumentsProgressFilter('DONE')}
          >
            QFC RELEASED ({calculateProgressData.qfcRelease})
          </Button>
          <Button
            size="sm"
            colorScheme={instrumentsProgressFilter === 'PENDING' ? 'red' : 'gray'}
            variant={instrumentsProgressFilter === 'PENDING' ? 'solid' : 'outline'}
            onClick={() => handleInstrumentsProgressFilter('PENDING')}
          >
            PENDING QFC ({calculateProgressData.pendingQfcToRelease})
          </Button>
          <Button
            size="sm"
            colorScheme={instrumentsProgressFilter === 'TOTAL' ? 'blue' : 'gray'}
            variant={instrumentsProgressFilter === 'TOTAL' ? 'solid' : 'outline'}
            onClick={() => handleInstrumentsProgressFilter('TOTAL')}
          >
            TOTAL ({calculateProgressData.totalInst})
          </Button>
        </HStack>
        
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

        <VStack mt={3} spacing={1}>
          <HStack spacing={4} fontSize="xs">
            <Text><Badge colorScheme="blue">SIEMSA:</Badge> {calculateProgressData.installedSiemsa}/{calculateProgressData.totalSiemsa}</Text>
            <Text><Badge colorScheme="teal">TEIGA:</Badge> {calculateProgressData.installedTeiga}/{calculateProgressData.totalTeiga}</Text>
          </HStack>
          <Text fontSize="xs" color="gray.600">
            Global: {calculateProgressData.qfcRelease} QFC Released, {calculateProgressData.pendingQfcToRelease} Pending QFC
          </Text>
        </VStack>
      </Box>
    </Box>
  );
};

export default InstrumentsProgressChart;