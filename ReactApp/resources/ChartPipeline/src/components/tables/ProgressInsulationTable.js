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
    Progress,
    VStack,
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

const ProgressInsulationTable = () => {
    const {
        createTableFromParquet,
        executeQuery,
        loading: dbLoading,
        error: dbError,
    } = useDuckDB();

    const [progressData, setProgressData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [loadTime, setLoadTime] = useState(null);
    const [queryTime, setQueryTime] = useState(null);
    const containerRef = useRef(null);
    const [parquetLoaded, setParquetLoaded] = useState(false);

    const columnHelper = createColumnHelper();

    const columns = useMemo(() => [
        columnHelper.accessor('week', {
            header: '',
            size: 120,
            cell: info => (
                <VStack spacing={1} align="center">
                    <Text fontSize="sm" fontWeight="bold">w31</Text>
                    <Text fontSize="xs">07/31/2025</Text>
                </VStack>
            )
        }),
        columnHelper.accessor('metric_type', {
            header: '',
            size: 80,
            cell: info => (
                <VStack spacing={1} align="center">
                    <Text fontSize="xs">mleq</Text>
                    <Text fontSize="xs">%</Text>
                </VStack>
            )
        }),
        columnHelper.accessor('avance', {
            header: 'Avance',
            size: 120,
            cell: info => {
                const data = info.row.original;
                return (
                    <VStack spacing={1} align="center">
                        <Text fontSize="xs">{parseFloat(data['TOTAL M ADVANCE'] || 0).toFixed(2)}</Text>
                        <Box width="100%" px={1}>
                            <Progress 
                                value={Math.round(parseFloat(data['% TOTAL M ADVANCE'] || 0) * 100)} 
                                size="sm" 
                                colorScheme="blue"
                                bg="gray.200"
                            />
                            <Text fontSize="xs" textAlign="center">
                                {Math.round(parseFloat(data['% TOTAL M ADVANCE'] || 0) * 100)}%
                            </Text>
                        </Box>
                    </VStack>
                );
            }
        }),
        columnHelper.accessor('liberado', {
            header: 'Liberado',
            size: 120,
            cell: info => {
                const data = info.row.original;
                return (
                    <VStack spacing={1} align="center">
                        <Text fontSize="xs">{parseFloat(data['LIBERADO'] || 0).toFixed(2)}</Text>
                        <Box width="100%" px={1}>
                            <Progress 
                                value={Math.round(parseFloat(data['% LIBERADO'] || 0) * 100)} 
                                size="sm" 
                                colorScheme="green"
                                bg="gray.200"
                            />
                            <Text fontSize="xs" textAlign="center">
                                {Math.round(parseFloat(data['% LIBERADO'] || 0) * 100)}%
                            </Text>
                        </Box>
                    </VStack>
                );
            }
        }),
        columnHelper.accessor('liberado_disponible', {
            header: 'Liberado Disponible',
            size: 150,
            cell: info => {
                const data = info.row.original;
                return (
                    <VStack spacing={1} align="center">
                        <Text fontSize="xs">{parseFloat(data['LIBERADO DISPONIBLE'] || 0).toFixed(2)}</Text>
                        <Box width="100%" px={1}>
                            <Progress 
                                value={Math.round(parseFloat(data['% LIBERADO DISPONIBLE'] || 0) * 100)} 
                                size="sm" 
                                colorScheme="yellow"
                                bg="gray.200"
                            />
                            <Text fontSize="xs" textAlign="center">
                                {Math.round(parseFloat(data['% LIBERADO DISPONIBLE'] || 0) * 100)}%
                            </Text>
                        </Box>
                    </VStack>
                );
            }
        }),
        columnHelper.accessor('inspecciones', {
            header: 'Inspecciones',
            size: 120,
            cell: info => {
                const data = info.row.original;
                return (
                    <VStack spacing={1} align="center">
                        <Text fontSize="xs">{parseFloat(data['INSPECCIONES'] || 0).toFixed(2)}</Text>
                        <Text fontSize="xs">-</Text>
                    </VStack>
                );
            }
        }),
    ], []);

    const loadParquetFile = async () => {
        if (parquetLoaded || dbLoading || dbError) return;

        try {
            const startLoadTime = performance.now();
            const res = await fetch('/data/master_subsystem.parquet');
            if (!res.ok) throw new Error(`Failed to fetch Parquet: ${res.status}`);
            const parquetBuffer = await res.arrayBuffer();
            await createTableFromParquet('master_subsystem', parquetBuffer);
            const endLoadTime = performance.now();
            setLoadTime(Math.round(endLoadTime - startLoadTime));
            setParquetLoaded(true);
        } catch (parquetError) {
            console.error('Error loading Parquet:', parquetError);
            setError('Failed to load data source');
        }
    };

    const queryData = async () => {
        if (!parquetLoaded) return;

        try {
            setLoading(true);
            const startQueryTime = performance.now();

            const progressQuery = `
                SELECT 
                    SUM(liberado_insulation * mleq_insulation)/sum(mleq_insulation) AS '% LIBERADO',
                    SUM(liberado_insulation * mleq_insulation) AS 'LIBERADO',
                    SUM(liberado_efectivo_insulation * mleq_insulation)/sum(mleq_insulation) AS '% LIBERADO DISPONIBLE',
                    SUM(liberado_efectivo_insulation * mleq_insulation) AS 'LIBERADO DISPONIBLE',
                    SUM(total_m_avance_insulation) FILTER(WHERE fecha_inspeccion_insulation IS NOT NULL) as 'INSPECCIONES',
                    SUM(total_m_avance_insulation) AS 'TOTAL M ADVANCE',
                    SUM(total_m_avance_insulation)/SUM(mleq_insulation) AS '% TOTAL M ADVANCE'
                FROM master_subsystem
                WHERE iso_insulation IS NOT NULL
            `;

            const result = await executeQuery(progressQuery);
            const endQueryTime = performance.now();
            setQueryTime(Math.round(endQueryTime - startQueryTime));
            setProgressData(result || []);
        } catch (err) {
            console.error('Error querying progress data:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadParquetFile();
    }, [createTableFromParquet, dbLoading, dbError]);

    useEffect(() => {
        if (parquetLoaded) {
            queryData();
        }
    }, [parquetLoaded]);

    const table = useReactTable({
        data: progressData,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
    });

    const virtualizer = useVirtualizer({
        count: table.getRowModel().rows.length,
        getScrollElement: () => containerRef.current,
        estimateSize: () => 80,
        overscan: 5,
    });

    if (loading) {
        return (
            <Center h="400px">
                <Spinner size="lg" />
            </Center>
        );
    }

    if (error) {
        return (
            <Center h="400px">
                <Text color="red.500">Error: {error}</Text>
            </Center>
        );
    }

    return (
        <Box>
            <HStack mb={4} justify="space-between" align="center">
                <Heading size="md">Progress Insulation</Heading>
                <HStack>
                    {loadTime && (
                        <Badge colorScheme="blue" fontSize="xs" px={2} py={1}>
                            Load: {loadTime}ms
                        </Badge>
                    )}
                    {queryTime && (
                        <Badge colorScheme="blue" fontSize="xs" px={2} py={1}>
                            Query: {queryTime}ms
                        </Badge>
                    )}
                    <Badge colorScheme="green" fontSize="xs" px={2} py={1}>
                        Rows: {progressData.length}
                    </Badge>
                </HStack>
            </HStack>

            <Box
                ref={containerRef}
                height="400px"
                overflowY="auto"
                border="1px solid"
                borderColor="gray.200"
                borderRadius="md"
            >
                <Box height={`${virtualizer.getTotalSize()}px`} position="relative">
                    {/* Table Header */}
                    <Box
                        borderBottom="1px solid"
                        borderColor="gray.200"
                        bg="#0082A9"
                        position="sticky"
                        top={0}
                        zIndex={1}
                    >
                        <Box display="flex" minWidth="fit-content">
                            {table.getHeaderGroups()[0].headers.map((header) => (
                                <Box
                                    key={header.id}
                                    width={`${header.getSize()}px`}
                                    textAlign="center"
                                    fontSize="xs"
                                    color="white"
                                    py={3}
                                    px={2}
                                    borderRight="1px solid"
                                    borderColor="gray.100"
                                    display="flex"
                                    alignItems="center"
                                    justifyContent="center"
                                    minHeight="60px"
                                >
                                    <Text fontSize="xs" textAlign="center">
                                        {flexRender(header.column.columnDef.header, header.getContext())}
                                    </Text>
                                </Box>
                            ))}
                        </Box>
                    </Box>

                    {/* Virtual rows */}
                    {virtualizer.getVirtualItems().map(virtualRow => {
                        const row = table.getRowModel().rows[virtualRow.index];
                        return (
                            <Box
                                key={row.id}
                                position="absolute"
                                top={0}
                                left={0}
                                width="100%"
                                minHeight={`${virtualRow.size}px`}
                                transform={`translateY(${virtualRow.start + 60}px)`}
                                borderBottom="1px solid"
                                borderColor="gray.100"
                                _hover={{ bg: 'blue.50' }}
                            >
                                <HStack spacing={0} height="100%">
                                    {row.getVisibleCells().map(cell => (
                                        <Box
                                            key={cell.id}
                                            width={`${cell.column.columnDef.size}px`}
                                            px={2}
                                            py={2}
                                            borderRight="1px solid"
                                            borderColor="gray.100"
                                            display="flex"
                                            alignItems="center"
                                            justifyContent="center"
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

export default ProgressInsulationTable;