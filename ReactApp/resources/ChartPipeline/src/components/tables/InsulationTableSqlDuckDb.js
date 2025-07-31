import React, { useEffect, useState, useMemo, useRef } from 'react';
import {
    Box,
    Text,
    Badge,
    Heading,
    HStack,
    Spinner,
    Center,
    Tooltip,
} from '@chakra-ui/react';
import {
    createColumnHelper,
    flexRender,
    getCoreRowModel,
    useReactTable,
    getSortedRowModel,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import useDuckDB from '../../hooks/useDuckDB3';

// Performance measurement component
const InsulationTableSqlPerformanceMetric = React.memo(({ label, value, description }) => (
    <Tooltip label={description} placement="top">
        <Badge colorScheme="blue" fontSize="xs" px={2} py={1} mr={2} cursor="help">
            {label}: {value}
        </Badge>
    </Tooltip>
));

const InsulationTableSqlDuckDb = () => {
    const {
        createTableFromParquet,
        executeQuery,
        loading: dbLoading,
        error: dbError,
    } = useDuckDB();

    // State declarations
    const [insulationTableSqlData, setInsulationTableSqlData] = useState([]);
    const [insulationTableSqlLoading, setInsulationTableSqlLoading] = useState(true);
    const [insulationTableSqlError, setInsulationTableSqlError] = useState(null);

    // Performance metrics
    const [insulationTableSqlLoadTime, setInsulationTableSqlLoadTime] = useState(null);
    const [insulationTableSqlQueryTime, setInsulationTableSqlQueryTime] = useState(null);
    const insulationTableSqlContainerRef = useRef(null);

    // State to track if parquet is loaded
    const [parquetLoaded, setParquetLoaded] = useState(false);

    // Define columns using TanStack's column helper
    const insulationTableSqlColumnHelper = createColumnHelper();

    const insulationTableSqlColumns = useMemo(() => [
        insulationTableSqlColumnHelper.accessor('ISO', {
            header: 'ISO',
            size: 120,
            cell: info => <Text fontSize="xs">{info.getValue() || '-'}</Text>
        }),
        insulationTableSqlColumnHelper.accessor('SUBSYSTEM', {
            header: 'SUBSYSTEM',
            size: 120,
            cell: info => <Text fontSize="xs">{info.getValue() || '-'}</Text>
        }),
        insulationTableSqlColumnHelper.accessor('Mleq', {
            header: 'Mleq',
            size: 100,
            cell: info => <Text fontSize="xs" textAlign="right">{parseFloat(info.getValue() || 0).toFixed(2)}</Text>
        }),
        insulationTableSqlColumnHelper.accessor('M2eq', {
            header: 'M2eq',
            size: 100,
            cell: info => <Text fontSize="xs" textAlign="right">{parseFloat(info.getValue() || 0).toFixed(2)}</Text>
        }),
        insulationTableSqlColumnHelper.accessor('TOTAL M ADVANCE', {
            header: 'TOTAL M ADVANCE',
            size: 150,
            cell: info => <Text fontSize="xs" textAlign="right">{parseFloat(info.getValue() || 0).toFixed(2)}</Text>
        }),
    ], []);

    // Load parquet file once
    const loadParquetFile = async () => {
        if (parquetLoaded || dbLoading || dbError) return;

        try {
            const startLoadTime = performance.now();
            const res = await fetch('/data/master_subsystem.parquet');

            if (!res.ok) throw new Error(`Failed to fetch Parquet: ${res.status}`);

            const parquetBuffer = await res.arrayBuffer();
            await createTableFromParquet('master_subsystem', parquetBuffer);

            const endLoadTime = performance.now();
            setInsulationTableSqlLoadTime(Math.round(endLoadTime - startLoadTime));
            setParquetLoaded(true);
        } catch (parquetError) {
            console.error('Error loading Parquet:', parquetError);
            setInsulationTableSqlError('Failed to load data source');
        }
    };

    // Query data with insulation SQL
    const queryData = async () => {
        if (!parquetLoaded) return;

        try {
            setInsulationTableSqlLoading(true);
            const startQueryTime = performance.now();

            const insulationQuery = `
                SELECT 
                    iso_insulation AS 'ISO',
                    MAX(subsystem) AS 'SUBSYSTEM', 
                    SUM(mleq_insulation)::FLOAT AS 'Mleq',
                    SUM(m2eq_insulation)::FLOAT AS 'M2eq',
                    SUM(total_m_avance_insulation)::FLOAT AS 'TOTAL M ADVANCE'
                FROM master_subsystem
                WHERE iso_insulation IS NOT NULL
                GROUP BY iso_insulation
                ORDER BY iso_insulation
            `;

            console.log('Insulation SQL query:', insulationQuery);
            const result = await executeQuery(insulationQuery);

            const endQueryTime = performance.now();
            setInsulationTableSqlQueryTime(Math.round(endQueryTime - startQueryTime));
            console.log('Insulation query result count:', result?.length || 0);
            setInsulationTableSqlData(result || []);

        } catch (err) {
            console.error('Error querying insulation data:', err);
            setInsulationTableSqlError(err.message);
        } finally {
            setInsulationTableSqlLoading(false);
        }
    };

    // Load parquet file once on mount
    useEffect(() => {
        loadParquetFile();
    }, [createTableFromParquet, dbLoading, dbError]);

    // Query data when parquet is loaded
    useEffect(() => {
        if (parquetLoaded) {
            queryData();
        }
    }, [parquetLoaded]);

    // Create table instance
    const insulationTableSqlTable = useReactTable({
        data: insulationTableSqlData,
        columns: insulationTableSqlColumns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
    });

    // Virtualization setup
    const insulationTableSqlVirtualizer = useVirtualizer({
        count: insulationTableSqlTable.getRowModel().rows.length,
        getScrollElement: () => insulationTableSqlContainerRef.current,
        estimateSize: () => 50,
        measureElement: (element) => element?.getBoundingClientRect().height,
        overscan: 10,
    });

    if (insulationTableSqlLoading) {
        return (
            <Center h="400px">
                <Spinner size="lg" />
            </Center>
        );
    }

    if (insulationTableSqlError) {
        return (
            <Center h="400px">
                <Text color="red.500">Error: {insulationTableSqlError}</Text>
            </Center>
        );
    }

    return (
        <Box>
            <HStack mb={4} justify="space-between" align="center">
                <Heading size="md">Insulation Progress Report</Heading>
                <HStack>
                    {insulationTableSqlLoadTime && (
                        <InsulationTableSqlPerformanceMetric
                            label="Load"
                            value={`${insulationTableSqlLoadTime}ms`}
                            description="Time to load parquet file into DuckDB"
                        />
                    )}
                    {insulationTableSqlQueryTime && (
                        <InsulationTableSqlPerformanceMetric
                            label="Query"
                            value={`${insulationTableSqlQueryTime}ms`}
                            description="Time to execute SQL query"
                        />
                    )}
                    <Badge colorScheme="green" fontSize="xs" px={2} py={1}>
                        Rows: {insulationTableSqlData.length}
                    </Badge>
                </HStack>
            </HStack>

            <Box
                ref={insulationTableSqlContainerRef}
                height="600px"
                overflowY="auto"
                border="1px solid"
                borderColor="gray.200"
                borderRadius="md"
            >
                <Box height={`${insulationTableSqlVirtualizer.getTotalSize()}px`} position="relative">
                    {/* Table Header */}
                    <Box
                        borderBottom="1px solid"
                        borderColor="gray.200"
                        bg="gray.50"
                        position="sticky"
                        top={0}
                        zIndex={1}
                    >
                        <Box display="flex" width={`${insulationTableSqlTable.getHeaderGroups()[0].headers.reduce((sum, col) => sum + col.getSize(), 0)}px`} minWidth="fit-content">
                            {insulationTableSqlTable.getHeaderGroups()[0].headers.map((header) => (
                                <Box
                                    key={header.id}
                                    width={`${header.getSize()}px`}
                                    minWidth={`${header.getSize()}px`}
                                    maxWidth={`${header.getSize()}px`}
                                    textAlign="center"
                                    fontSize="xs"
                                    textTransform="uppercase"
                                    letterSpacing="wide"
                                    color="white"
                                    py={2}
                                    px={1}
                                    borderRight="1px solid"
                                    borderColor="gray.100"
                                    display="flex"
                                    alignItems="center"
                                    justifyContent="center"
                                    cursor={header.column.getCanSort() ? 'pointer' : 'default'}
                                    onClick={header.column.getToggleSortingHandler()}
                                    _hover={header.column.getCanSort() ? { opacity: 0.8 } : {}}
                                    minHeight="45px"
                                    position="relative"
                                    bg="#0082A9"
                                >
                                    <HStack spacing={1}>
                                        <Text fontSize="xs" noOfLines={2} textAlign="center">
                                            {flexRender(header.column.columnDef.header, header.getContext())}
                                        </Text>
                                        {header.column.getIsSorted() && (
                                            <Text fontSize="xs">{header.column.getIsSorted() === 'desc' ? '↓' : '↑'}</Text>
                                        )}
                                    </HStack>
                                </Box>
                            ))}
                        </Box>
                    </Box>

                    {/* Virtual rows */}
                    {insulationTableSqlVirtualizer.getVirtualItems().map(virtualRow => {
                        const row = insulationTableSqlTable.getRowModel().rows[virtualRow.index];
                        return (
                            <Box
                                key={row.id}
                                data-index={virtualRow.index}
                                ref={insulationTableSqlVirtualizer.measureElement}
                                position="absolute"
                                top={0}
                                left={0}
                                width="100%"
                                minHeight={`${virtualRow.size}px`}
                                transform={`translateY(${virtualRow.start + 45}px)`}
                                borderBottom="1px solid"
                                borderColor="gray.100"
                                _hover={{ bg: 'blue.50' }}
                            >
                                <HStack spacing={0} height="100%">
                                    {row.getVisibleCells().map(cell => (
                                        <Box
                                            key={cell.id}
                                            width={`${cell.column.columnDef.size || 80}px`}
                                            flexShrink={0}
                                            px={2}
                                            py={1}
                                            borderRight="1px solid"
                                            borderColor="gray.100"
                                            display="flex"
                                            alignItems="center"
                                            justifyContent={cell.column.id === 'Mleq' || cell.column.id === 'M2eq' || cell.column.id === 'TOTAL M ADVANCE' ? 'flex-end' : 'flex-start'}
                                            height="100%"
                                        >
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </Box>
                                    ))}
                                </HStack>
                            </Box>
                        );
                    })}
                </Box>
            </Box>
        </Box>
    );
};

export default InsulationTableSqlDuckDb;