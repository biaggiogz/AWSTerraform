import React, { useMemo } from 'react';
import {
  Box,
  Text,
  Badge,
  Heading,
  HStack,
  Button,
} from '@chakra-ui/react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';

// Import WASM processor for data optimization
import { processTableData, createVirtualizedView } from '../../wasm/table-processor.wasm.js';

const columnHelper = createColumnHelper();

// Subsystem Cell Component - Optimized with memoization
const SubsystemCell = React.memo(({ subsystems, onSubsystemSelect, selectedSubsystem }) => {
  if (!subsystems || subsystems.length === 0) {
    return null;
  }
  
  if (subsystems.length === 1) {
    return (
      <Box 
        width="100%" 
        height="100%" 
        display="flex" 
        alignItems="center" 
        justifyContent="center"
        border="1px solid"
        borderColor="gray.300"
        borderRadius="md"
        p={1}
      >
        <Button
          size="xs"
          variant={selectedSubsystem === subsystems[0] ? "solid" : "outline"}
          onClick={() => onSubsystemSelect && onSubsystemSelect(subsystems[0])}
          fontSize="10px"
          fontWeight="medium"
          color={selectedSubsystem === subsystems[0] ? "white" : "blue.600"}
          bg={selectedSubsystem === subsystems[0] ? "green.500" : "white"}
          borderColor={selectedSubsystem === subsystems[0] ? "green.500" : "blue.500"}
          minWidth="30px"
          height="18px"
          px={2}
          borderRadius="sm"
          _hover={{ bg: selectedSubsystem === subsystems[0] ? "green.200" : "blue.200" }}
        >
          {subsystems[0]}
        </Button>
      </Box>
    );
  }
  
  return (
    <Box 
      width="100%" 
      height="100%" 
      display="flex" 
      alignItems="center" 
      justifyContent="center"
      border="1px solid"
      borderColor="gray.300"
      borderRadius="md"
      p={1}
    >
      <HStack spacing={1} wrap="wrap" justify="center">
        {subsystems.map((subsystem, index) => (
          <Button
            key={`${subsystem}-${index}`}
            size="xs"
            variant={selectedSubsystem === subsystem ? "solid" : "outline"}
            onClick={() => onSubsystemSelect && onSubsystemSelect(subsystem)}
            fontSize="10px"
            fontWeight="medium"
            color={selectedSubsystem === subsystem ? "white" : "blue.600"}
            bg={selectedSubsystem === subsystem ? "green.500" : "white"}
            borderColor={selectedSubsystem === subsystem ? "green.500" : "blue.500"}
            minWidth="30px"
            height="18px"
            px={2}
            borderRadius="sm"
            _hover={{ bg: selectedSubsystem === subsystem ? "green.200" : "blue.200" }}
          >
            {subsystem}
          </Button>
        ))}
      </HStack>
    </Box>
  );
});

// Mounting Cell Component - Optimized with memoization
const MountingCell = React.memo(({ mountingValue, onMountingSelect, selectedMounting, isHighlighted }) => {
  const pattern = /^(?:[^-]*-){5}[^-]*$/;
  const matchesPattern = pattern.test(mountingValue);
  
  if (!mountingValue || !matchesPattern) {
    const isSelected = selectedMounting === mountingValue;
    return (
      <Text 
        fontSize="xs" 
        textAlign="left"
        noOfLines={2}
        cursor="pointer"
        color={isSelected ? 'blue.600' : 'inherit'}
        fontWeight={isSelected || isHighlighted ? 'bold' : 'normal'}
        bg={isSelected ? 'blue.50' : isHighlighted ? 'yellow.50' : 'transparent'}
        px={1}
        py={1}
        borderRadius="sm"
        wordBreak="break-word"
        _hover={{ bg: 'blue.100', color: 'blue.700' }}
        onClick={() => onMountingSelect && onMountingSelect(mountingValue)}
      >
        {mountingValue}
      </Text>
    );
  }
  
  return (
    <Box 
      width="100%" 
      height="100%" 
      display="flex" 
      alignItems="center" 
      justifyContent="center"
      border="1px solid"
      borderColor="gray.300"
      borderRadius="md"
      p={1}
    >
      <Button
        size="xs"
        variant={selectedMounting === mountingValue ? "solid" : "outline"}
        onClick={() => onMountingSelect && onMountingSelect(mountingValue)}
        fontSize="10px"
        fontWeight="medium"
        color={selectedMounting === mountingValue ? "white" : "blue.600"}
        bg={selectedMounting === mountingValue ? "green.500" : "white"}
        borderColor={selectedMounting === mountingValue ? "green.500" : "blue.500"}
        minWidth="30px"
        height="18px"
        px={2}
        borderRadius="sm"
        _hover={{ bg: selectedMounting === mountingValue ? "green.200" : "blue.200" }}
      >
        {mountingValue}
      </Button>
    </Box>
  );
});

// Test Pack Cell Component - Optimized with memoization
const TestPackCell = React.memo(({ testPacks, onTestPackSelect, selectedTestPack }) => {
  if (!testPacks || testPacks.length === 0) {
    return (
      <Box width="100%" height="100%" display="flex" alignItems="center" justifyContent="center">
        <Text fontSize="xs" color="gray.500">NOT APPLY</Text>
      </Box>
    );
  }
  
  if (testPacks.length === 1) {
    return (
      <Box 
        width="100%" 
        height="100%" 
        display="flex" 
        alignItems="center" 
        justifyContent="center"
        border="1px solid"
        borderColor="gray.300"
        borderRadius="md"
        p={1}
      >
        <Button
          size="xs"
          variant={selectedTestPack === testPacks[0] ? "solid" : "outline"}
          onClick={() => onTestPackSelect && onTestPackSelect(testPacks[0])}
          fontSize="10px"
          fontWeight="medium"
          color={selectedTestPack === testPacks[0] ? "white" : "blue.600"}
          bg={selectedTestPack === testPacks[0] ? "green.500" : "white"}
          borderColor={selectedTestPack === testPacks[0] ? "green.500" : "blue.500"}
          minWidth="30px"
          height="18px"
          px={2}
          borderRadius="sm"
          _hover={{ bg: selectedTestPack === testPacks[0] ? "green.200" : "blue.200" }}
        >
          {testPacks[0]}
        </Button>
      </Box>
    );
  }
  
  return (
    <Box 
      width="100%" 
      height="100%" 
      display="flex" 
      alignItems="center" 
      justifyContent="center"
      border="1px solid"
      borderColor="gray.300"
      borderRadius="md"
      p={1}
    >
      <HStack spacing={1} wrap="wrap" justify="center">
        {testPacks.map((testPack, index) => (
          <Button
            key={`${testPack}-${index}`}
            size="xs"
            variant={selectedTestPack === testPack ? "solid" : "outline"}
            onClick={() => onTestPackSelect && onTestPackSelect(testPack)}
            fontSize="10px"
            fontWeight="medium"
            color={selectedTestPack === testPack ? "white" : "blue.600"}
            bg={selectedTestPack === testPack ? "green.500" : "white"}
            borderColor={selectedTestPack === testPack ? "green.500" : "blue.500"}
            minWidth="30px"
            height="18px"
            px={2}
            borderRadius="sm"
            _hover={{ bg: selectedTestPack === testPack ? "green.200" : "blue.200" }}
          >
            {testPack}
          </Button>
        ))}
      </HStack>
    </Box>
  );
});

/**
 * DetailsInstrumentsTable component - WASM-optimized virtualized table for details instruments data
 * @param {Object} props - Component props
 * @param {Array} props.data - Filtered dataset from details_inst.csv
 * @param {string} props.selectedIsometric - Currently selected isometric ID
 * @param {Function} props.onMountingLocationClick - Handler for mounting location selection
 * @param {Set} props.highlightedRecords - Set of highlighted records
 */
const DetailsInstrumentsTable = React.memo(({ 
  data, 
  selectedIsometric, 
  onMountingLocationClick, 
  highlightedRecords = new Set(),
  selectedTestPack,
  onTestPackClick,
  selectedSubsystem,
  onSubsystemClick
}) => {
  // Use WASM to process data with optimized performance
  const processedData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    try {
      // Use WASM processor for data transformation
      return processTableData(data, {
        filterCondition: row => row.pid_isoinst,
        fieldMappings: {
          id: 'index',
          item: 'item_isoinst',
          tagInstE3d: 'tag_inst_e3d_isoinst',
          tagInst: 'tag_inst_isoinst',
          pid: 'pid_isoinst',
          instrumentType: 'instrument_type_isoinst',
          subsystem: 'subsystem',
          tpInclude: 'tp_include_isoinst',
          tp: 'tp_isoinst',
          progressTp: 'progress_tp_isoinst',
          hito: 'hito_isoinst',
          teigaReinstatement: 'teiga_reinstatement_isoinst',
          teigaInsulation: 'teiga_insulation_isoinst',
          siemsa: 'siemsa_isoinst',
          ten: 'ten_isoinst',
          mountingOnIsoEquiPack: 'mounting_on_isoequipack_isoinst',
          on: 'on_isoinst',
          scopeBy: 'scope__by_isoinst',
          teigaTmi: 'teigatmi_isoinst',
          installedTeigaTmi: 'installed_teigatmi_isoinst',
          siemsa1: 'siemsa1_isoinst',
          installed: 'installed_isoinst',
          wired: 'wired_isoinst',
          connected: 'connected_isoinst',
          cableTest: 'cable_test_isoinst',
          qcf: 'qcf_isoinst',
          ok100: 'ok100_isoinst',
          withWithoutSignal: 'with__without_signal_isoinst',
          warehouseCode: 'warehouse_code_isoinst',
          delivery: 'delivery_isoinst',
          date: 'date_isoinst',
          vendor: 'vendor_isoinst',
          comments: 'comments_isoinst'
        }
      });
    } catch (error) {
      console.error('WASM processing failed, using fallback:', error);
      
      // Fallback to standard JS processing if WASM fails
      const filteredData = data.filter(row => row.pid_isoinst);
      
      return filteredData.map((row, index) => ({
        id: index,
        item: row.item_isoinst || '',
        tagInstE3d: row.tag_inst_e3d_isoinst || '',
        tagInst: row.tag_inst_isoinst || '',
        pid: row.pid_isoinst || '',
        instrumentType: row.instrument_type_isoinst || '',
        subsystem: row.subsystem || '',
        tpInclude: row.tp_include_isoinst || '',
        tp: row.tp_isoinst || '',
        progressTp: row.progress_tp_isoinst || '',
        hito: row.hito_isoinst || '',
        teigaReinstatement: row.teiga_reinstatement_isoinst || '',
        teigaInsulation: row.teiga_insulation_isoinst || '',
        siemsa: row.siemsa_isoinst || '',
        ten: row.ten_isoinst || '',
        mountingOnIsoEquiPack: row.mounting_on_isoequipack_isoinst || '',
        on: row.on_isoinst || '',
        scopeBy: row.scope__by_isoinst || '',
        teigaTmi: row.teigatmi_isoinst || '',
        installedTeigaTmi: row.installed_teigatmi_isoinst || '',
        siemsa1: row.siemsa1_isoinst || '',
        installed: row.installed_isoinst || '',
        wired: row.wired_isoinst || '',
        connected: row.connected_isoinst || '',
        cableTest: row.cable_test_isoinst || '',
        qcf: row.qcf_isoinst || '',
        ok100: row.ok100_isoinst || '',
        withWithoutSignal: row.with__without_signal_isoinst || '',
        warehouseCode: row.warehouse_code_isoinst || '',
        delivery: row.delivery_isoinst || '',
        date: row.date_isoinst || '',
        vendor: row.vendor_isoinst || '',
        comments: row.comments_isoinst || ''
      }));
    }
  }, [data]);

  // Define table columns with optimized sizing for viewport fit
  const columns = useMemo(() => [
    columnHelper.accessor('item', {
      header: 'ITEM',
      minSize: 70,
      maxSize: 150,
      size: 80,
      enableResizing: true,
      cell: ({ getValue }) => (
        <Text fontSize="xs" textAlign="center" wordBreak="break-word">
          {getValue()}
        </Text>
      )
    }),
    columnHelper.accessor('tagInstE3d', {
      header: 'TAG INST E3D',
      minSize: 100,
      maxSize: 200,
      size: 120,
      enableResizing: true,
      cell: ({ getValue }) => (
        <Text fontSize="xs" fontFamily="mono" textAlign="center" wordBreak="break-word">
          {getValue()}
        </Text>
      )
    }),
    columnHelper.accessor('tagInst', {
      header: 'TAG INST',
      minSize: 80,
      maxSize: 200,
      size: 120,
      enableResizing: true,
      cell: ({ getValue }) => (
        <Text fontSize="xs" fontFamily="mono" textAlign="center" wordBreak="break-word">
          {getValue()}
        </Text>
      )
    }),
    columnHelper.accessor('pid', {
      header: 'P&ID',
      minSize: 70,
      maxSize: 150,
      size: 80,
      enableResizing: true,
      cell: ({ getValue }) => (
        <Text fontSize="xs" textAlign="center" wordBreak="break-word">
          {getValue()}
        </Text>
      )
    }),
    columnHelper.accessor('instrumentType', {
      header: 'INSTRUMENT TYPE',
      minSize: 100,
      maxSize: 250,
      size: 150,
      enableResizing: true,
      cell: ({ getValue }) => (
        <Text fontSize="xs" textAlign="center" noOfLines={2} wordBreak="break-word">
          {getValue()}
        </Text>
      )
    }),
    columnHelper.accessor('subsystem', {
      header: 'SUBSYSTEM',
      minSize: 80,
      maxSize: 200,
      size: 100,
      enableResizing: true,
      cell: ({ getValue }) => {
        const subsystemValue = getValue();
        const subsystems = subsystemValue ? [subsystemValue] : []; // Single value, no splitting
        
        return (
          <SubsystemCell 
            subsystems={subsystems}
            onSubsystemSelect={onSubsystemClick}
            selectedSubsystem={selectedSubsystem}
          />
        );
      }
    }),
    columnHelper.accessor('tpInclude', {
      header: 'TP INCLUDE',
      minSize: 70,
      maxSize: 150,
      size: 80,
      enableResizing: true,
      cell: ({ getValue }) => (
        <Text fontSize="xs" textAlign="center" wordBreak="break-word">
          {getValue()}
        </Text>
      )
    }),
    columnHelper.accessor('tp', {
      header: 'TP',
      minSize: 70,
      maxSize: 180,
      size: 90,
      enableResizing: true,
      cell: ({ getValue }) => {
        const testPackValue = getValue();
        const testPacks = testPackValue ? 
          testPackValue.toString().split("|").map(v => v.trim()).filter(v => v !== '' && v !== '0' && v !== 'NOT_APPLY') : [];
        
        return (
          <TestPackCell 
            testPacks={testPacks}
            onTestPackSelect={onTestPackClick}
            selectedTestPack={selectedTestPack}
          />
        );
      }
    }),
    columnHelper.accessor('progressTp', {
      header: 'PROGRESS TP',
      minSize: 80,
      maxSize: 150,
      size: 90,
      enableResizing: true,
      cell: ({ getValue }) => (
        <Text fontSize="xs" textAlign="center" wordBreak="break-word">
          {getValue()}
        </Text>
      )
    }),
    columnHelper.accessor('hito', {
      header: 'HITO',
      minSize: 70,
      maxSize: 150,
      size: 80,
      enableResizing: true,
      cell: ({ getValue }) => (
        <Text fontSize="xs" textAlign="center" wordBreak="break-word">
          {getValue()}
        </Text>
      )
    }),
    columnHelper.accessor('teigaReinstatement', {
      header: 'TEIGA REINSTATEMENT',
      minSize: 120,
      maxSize: 200,
      size: 150,
      enableResizing: true,
      cell: ({ getValue }) => (
        <Text fontSize="xs" textAlign="center" wordBreak="break-word">
          {getValue()}
        </Text>
      )
    }),
    columnHelper.accessor('teigaInsulation', {
      header: 'TEIGA INSULATION',
      minSize: 120,
      maxSize: 200,
      size: 150,
      enableResizing: true,
      cell: ({ getValue }) => (
        <Text fontSize="xs" textAlign="center" wordBreak="break-word">
          {getValue()}
        </Text>
      )
    }),
    columnHelper.accessor('siemsa', {
      header: 'SIEMSA',
      minSize: 60,
      maxSize: 150,
      size: 80,
      enableResizing: true,
      cell: ({ getValue }) => (
        <Text fontSize="xs" textAlign="center" wordBreak="break-word">
          {getValue()}
        </Text>
      )
    }),
    columnHelper.accessor('ten', {
      header: 'TEN',
      minSize: 60,
      maxSize: 150,
      size: 80,
      enableResizing: true,
      cell: ({ getValue }) => (
        <Text fontSize="xs" textAlign="center" wordBreak="break-word">
          {getValue()}
        </Text>
      )
    }),
    columnHelper.accessor('mountingOnIsoEquiPack', {
      header: 'MOUNTING ON ISOEQUIPACK',
      minSize: 270,
      maxSize: 300,
      size: 180,
      enableResizing: true,
      cell: ({ getValue, row }) => {
        const mountingValue = getValue();
        const isHighlighted = highlightedRecords.has(row.original);
        
        return (
          <MountingCell 
            mountingValue={mountingValue}
            onMountingSelect={onMountingLocationClick}
            selectedMounting={selectedIsometric}
            isHighlighted={isHighlighted}
          />
        );
      }
    }),
    columnHelper.accessor('on', {
      header: 'ON',
      minSize: 50,
      maxSize: 120,
      size: 60,
      enableResizing: true,
      cell: ({ getValue }) => (
        <Text fontSize="xs" textAlign="center" fontWeight="medium" wordBreak="break-word">
          {getValue()}
        </Text>
      )
    }),
    columnHelper.accessor('scopeBy', {
      header: 'SCOPE BY',
      minSize: 70,
      maxSize: 150,
      size: 90,
      enableResizing: true,
      cell: ({ getValue }) => (
        <Text fontSize="xs" textAlign="center" fontWeight="medium" wordBreak="break-word">
          {getValue()}
        </Text>
      )
    }),
    columnHelper.accessor('teigaTmi', {
      header: 'TEIGATMI',
      minSize: 80,
      maxSize: 180,
      size: 100,
      enableResizing: true,
      cell: ({ getValue }) => (
        <Text fontSize="xs" textAlign="center" wordBreak="break-word">
          {getValue()}
        </Text>
      )
    }),
    columnHelper.accessor('installedTeigaTmi', {
      header: 'INSTALLED TEIGATMI',
      minSize: 100,
      maxSize: 220,
      size: 140,
      enableResizing: true,
      cell: ({ getValue }) => {
        const value = getValue();
        const colorScheme = value === 'YES' ? 'green' : value === 'NOT' ? 'red' : 'gray';
        return (
          <Badge colorScheme={colorScheme} fontSize="xs">
            {value}
          </Badge>
        );
      }
    }),
    columnHelper.accessor('siemsa1', {
      header: 'SIEMSA 1',
      minSize: 70,
      maxSize: 150,
      size: 80,
      enableResizing: true,
      cell: ({ getValue }) => (
        <Text fontSize="xs" textAlign="center" wordBreak="break-word">
          {getValue()}
        </Text>
      )
    }),
    columnHelper.accessor('installed', {
      header: 'INSTALLED',
      minSize: 80,
      maxSize: 150,
      size: 90,
      enableResizing: true,
      cell: ({ getValue }) => {
        const value = getValue();
        const colorScheme = value === 'YES' ? 'green' : value === 'NOT' ? 'red' : 'gray';
        return (
          <Badge colorScheme={colorScheme} fontSize="xs">
            {value}
          </Badge>
        );
      }
    }),
    columnHelper.accessor('wired', {
      header: 'WIRED',
      minSize: 70,
      maxSize: 150,
      size: 80,
      enableResizing: true,
      cell: ({ getValue }) => {
        const value = getValue();
        const colorScheme = value === 'YES' ? 'green' : value === 'NOT' ? 'red' : 'gray';
        return (
          <Badge colorScheme={colorScheme} fontSize="xs">
            {value}
          </Badge>
        );
      }
    }),
    columnHelper.accessor('connected', {
      header: 'CONNECTED',
      minSize: 80,
      maxSize: 150,
      size: 90,
      enableResizing: true,
      cell: ({ getValue }) => {
        const value = getValue();
        const colorScheme = value === 'YES' ? 'green' : value === 'NOT' ? 'red' : 'gray';
        return (
          <Badge colorScheme={colorScheme} fontSize="xs">
            {value}
          </Badge>
        );
      }
    }),
    columnHelper.accessor('cableTest', {
      header: 'CABLE TEST',
      minSize: 80,
      maxSize: 150,
      size: 90,
      enableResizing: true,
      cell: ({ getValue }) => {
        const value = getValue();
        const colorScheme = value === 'YES' ? 'green' : value === 'NOT' ? 'red' : 'gray';
        return (
          <Badge colorScheme={colorScheme} fontSize="xs">
            {value}
          </Badge>
        );
      }
    }),
    columnHelper.accessor('qcf', {
      header: 'QCF',
      minSize: 60,
      maxSize: 120,
      size: 70,
      enableResizing: true,
      cell: ({ getValue }) => (
        <Text fontSize="xs" textAlign="center" wordBreak="break-word">
          {getValue()}
        </Text>
      )
    }),
    columnHelper.accessor('ok100', {
      header: 'OK100',
      minSize: 60,
      maxSize: 120,
      size: 70,
      enableResizing: true,
      cell: ({ getValue }) => {
        const value = getValue();
        return (
            <Text fontSize="xs" textAlign="center" wordBreak="break-word">
              {value != null ? Number(value).toFixed(2) : ''}
            </Text>
        );
      }
    }),
    columnHelper.accessor('withWithoutSignal', {
      header: 'WITH/WITHOUT SIGNAL',
      minSize: 120,
      maxSize: 180,
      size: 150,
      enableResizing: true,
      cell: ({ getValue }) => {
        const value = getValue();
        const colorScheme = value === 'YES' ? 'green' : value === 'NOT' ? 'red' : 'gray';
        return (
          <Badge colorScheme={colorScheme} fontSize="xs">
            {value}
          </Badge>
        );
      }
    }),
    columnHelper.accessor('warehouseCode', {
      header: 'WAREHOUSE CODE',
      minSize: 100,
      maxSize: 180,
      size: 120,
      enableResizing: true,
      cell: ({ getValue }) => (
        <Text fontSize="xs" textAlign="center" wordBreak="break-word">
          {getValue()}
        </Text>
      )
    }),
    columnHelper.accessor('delivery', {
      header: 'DELIVERY',
      minSize: 70,
      maxSize: 150,
      size: 90,
      enableResizing: true,
      cell: ({ getValue }) => (
        <Text fontSize="xs" textAlign="center" wordBreak="break-word">
          {getValue()}
        </Text>
      )
    }),
    columnHelper.accessor('date', {
      header: 'DATE',
      minSize: 70,
      maxSize: 150,
      size: 80,
      enableResizing: true,
      cell: ({ getValue }) => (
        <Text fontSize="xs" textAlign="center" wordBreak="break-word">
          {getValue()}
        </Text>
      )
    }),
    columnHelper.accessor('vendor', {
      header: 'VENDOR',
      minSize: 70,
      maxSize: 180,
      size: 100,
      enableResizing: true,
      cell: ({ getValue }) => (
        <Text fontSize="xs" textAlign="center" wordBreak="break-word">
          {getValue()}
        </Text>
      )
    }),
    columnHelper.accessor('comments', {
      header: 'COMMENTS',
      minSize: 100,
      maxSize: 300,
      size: 150,
      enableResizing: true,
      cell: ({ getValue }) => (
        <Text fontSize="xs" textAlign="left" noOfLines={2} wordBreak="break-word">
          {getValue()}
        </Text>
      )
    })
  ], [onMountingLocationClick, onSubsystemClick, onTestPackClick, selectedIsometric, selectedSubsystem, selectedTestPack, highlightedRecords]);

  // Create table instance with memoization
  const table = useReactTable({
    data: processedData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    enableColumnResizing: true,
    columnResizeMode: 'onChange',
    debugTable: false,
    defaultColumn: {
      minSize: 60,
      size: 100,
      maxSize: 400,
    },
  });

  // Get table rows
  const { rows } = table.getRowModel();

  // Create refs for virtualization
  const parentRef = React.useRef();
  const headerRef = React.useRef();

  // Create virtualized view with WASM optimization
  const virtualRows = useMemo(() => {
    try {
      return createVirtualizedView(rows, {
        estimateSize: 50,
        overscan: 10
      });
    } catch (error) {
      console.error('WASM virtualization failed, using fallback:', error);
      return [];
    }
  }, [rows]);

  // Create virtualizer
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
    overscan: 10,
  });

  // Memoize header rendering
  const headerGroups = useMemo(() => table.getHeaderGroups(), [table]);

  if (!data || data.length === 0) {
    return (
      <Box p={6} textAlign="center">
        <Text color="gray.500">No details instruments data available</Text>
      </Box>
    );
  }

  return (
    <Box mt={6}>
      <HStack justify="space-between" align="center" mb={4}>
        <Heading size="md" color="gray.700">
          Details Instruments
        </Heading>
        <Badge colorScheme="blue" fontSize="sm" px={3} py={1}>
          {processedData.length} Instruments
        </Badge>
      </HStack>

      <Box
        border="1px solid"
        borderColor="gray.200"
        borderRadius="lg"
        overflow="hidden"
        bg="white"
        boxShadow="sm"
        width="100%"
        height="auto"
        maxWidth="100%"
        position="relative"
      >
        {/* Table Header */}
        <Box
          ref={headerRef}
          overflowX="auto"
          borderBottom="1px solid"
          borderColor="gray.200"
          bg="gray.50"
        >
          <Box display="flex" width="100%" minWidth="fit-content">
            {headerGroups[0].headers.map((header) => (
              <Box
                key={header.id}
                width={`${header.getSize()}px`}
                minWidth={`${header.getSize()}px`}
                maxWidth={`${header.getSize()}px`}
                textAlign="center"
                fontSize="xs"
                fontWeight="bold"
                textTransform="uppercase"
                letterSpacing="wide"
                color="white"
                py={3}
                px={2}
                borderRight="1px solid"
                borderColor="gray.100"
                display="flex"
                alignItems="center"
                justifyContent="center"
                cursor={header.column.getCanSort() ? 'pointer' : 'default'}
                onClick={header.column.getToggleSortingHandler()}
                _hover={header.column.getCanSort() ? { opacity: 0.8 } : {}}
                minHeight="50px"
                position="relative"
                bg={header.column.columnDef.header === 'SUBSYSTEM' ? '#CEC19B' : header.column.columnDef.header === 'TP' ? '#7CA2C5'
                    : header.column.columnDef.header === 'MOUNTING ON ISOEQUIPACK' ? '#007598'
                    : header.column.columnDef.header === 'TAG INST' ? '#B3CDDF'
                    : header.column.columnDef.header === 'SCOPE BY' ? '#B3CDDF'
                    : '#BFB6B4'}
              >
                <HStack spacing={1}>
                  <Text fontSize="xs" noOfLines={3} textAlign="center">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </Text>
                  {header.column.getIsSorted() && (
                    <Text fontSize="xs">{header.column.getIsSorted() === 'desc' ? '↓' : '↑'}</Text>
                  )}
                </HStack>
                {header.column.getCanResize() && (
                  <Box
                    position="absolute"
                    right="0"
                    top="0"
                    height="100%"
                    width="4px"
                    cursor="col-resize"
                    bg="transparent"
                    _hover={{ bg: 'blue.200' }}
                    onMouseDown={header.getResizeHandler()}
                    onTouchStart={header.getResizeHandler()}
                  />
                )}
              </Box>
            ))}
          </Box>
        </Box>

        {/* Virtualized Table Body */}
        <Box
          ref={parentRef}
          height="500px"
          overflowY="auto"
          overflowX="hidden"
          maxWidth="100%"
          onScroll={(e) => {
            if (headerRef.current) {
              headerRef.current.scrollLeft = e.target.scrollLeft;
            }
          }}
          borderTop="none"
        >
          <Box
            height={`${virtualizer.getTotalSize()}px`}
            position="relative"
          >
            {virtualizer.getVirtualItems().map(virtualRow => {
              const row = rows[virtualRow.index];
              return (
                <Box
                  key={row.id}
                  position="absolute"
                  top={0}
                  left={0}
                  width="100%"
                  height={`${virtualRow.size}px`}
                  transform={`translateY(${virtualRow.start}px)`}
                >
                  <Box
                    as="div"
                    display="flex"
                    width="100%"
                    height="100%"
                    _hover={{ bg: 'gray.50' }}
                    borderBottom="1px solid"
                    borderColor="gray.100"
                    bg={highlightedRecords.has(row.original) ? 'yellow.50' : 'transparent'}
                  >
                    {row.getVisibleCells().map(cell => (
                      <Box
                        key={cell.id}
                        width={`${cell.column.getSize()}px`}
                        minWidth={`${cell.column.getSize()}px`}
                        maxWidth={`${cell.column.getSize()}px`}
                        borderRight="1px solid"
                        borderColor="gray.100"
                        py={2}
                        px={2}
                        textAlign="center"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </Box>
                    ))}
                  </Box>
                </Box>
              );
            })}
          </Box>
        </Box>
      </Box>
    </Box>
  );
});

DetailsInstrumentsTable.displayName = 'DetailsInstrumentsTable';

export default DetailsInstrumentsTable;