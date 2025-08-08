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
        insulationTableSqlColumnHelper.accessor('ISOMETRIC', {
            header: 'ISOMETRIC',
            size: 260,
            cell: info => <Text fontSize="xs">{info.getValue() || '-'}</Text>
        }),
        insulationTableSqlColumnHelper.accessor('SUBSYSTEM', {
            header: 'SUBSYSTEM',
            size: 120,
            cell: info => <Text fontSize="xs" textAlign="center">{info.getValue() || '-'}</Text>
        }),
        insulationTableSqlColumnHelper.accessor('MLEQ', {
            header: 'MLEQ',
            size: 100,
            cell: info => <Text fontSize="xs" textAlign="center">{parseFloat(info.getValue() || 0).toFixed(2)}</Text>
        }),
        insulationTableSqlColumnHelper.accessor('M2EQ', {
            header: 'M2EQ',
            size: 100,
            cell: info => <Text fontSize="xs" textAlign="center">{parseFloat(info.getValue() || 0).toFixed(2)}</Text>
        }),
        insulationTableSqlColumnHelper.accessor('TOTAL M ADVANCE', {
            header: 'TOTAL M ADVANCE',
            size: 80,
            cell: info => <Text fontSize="xs" textAlign="center">{parseFloat(info.getValue() || 0).toFixed(2)}</Text>
        }),
        insulationTableSqlColumnHelper.accessor('HITO', {
            header: 'HITO',
            size: 100,
            cell: info => <Text fontSize="xs" textAlign="center">{info.getValue() || '-'}</Text>
        }),
        insulationTableSqlColumnHelper.accessor('TEIGA REINSTATEMENT', {
            header: 'TEIGA REINSTATEMENT',
            size: 110,
            cell: info => <Text fontSize="xs" textAlign="center">{info.getValue() ? new Date(info.getValue()).toLocaleDateString() : '-'}</Text>
        }),
        insulationTableSqlColumnHelper.accessor('TEIGA INSULATION', {
            header: 'TEIGA INSULATION',
            size: 100,
            cell: info => <Text fontSize="xs" textAlign="center">{info.getValue() ? new Date(info.getValue()).toLocaleDateString() : '-'}</Text>
        }),
        insulationTableSqlColumnHelper.accessor('SIEMSA', {
            header: 'SIEMSA',
            size: 100,
            cell: info => <Text fontSize="xs" textAlign="center">{info.getValue() ? new Date(info.getValue()).toLocaleDateString() : '-'}</Text>
        }),
        insulationTableSqlColumnHelper.accessor('TEN', {
            header: 'TEN',
            size: 100,
            cell: info => <Text fontSize="xs" textAlign="center">{info.getValue() ? new Date(info.getValue()).toLocaleDateString() : '-'}</Text>
        }),
        insulationTableSqlColumnHelper.accessor('TPs', {
            header: 'TPs',
            size: 120,
            cell: info => {
                const tps = info.getValue();
                const progress = info.row.original['TP_PROGRESS'];
                if (!tps) return <Text fontSize="xs">-</Text>;
                
                const tpArray = tps.split('|').filter(tp => tp.trim());
                const progressArray = progress ? progress.split('|').filter(p => p.trim()) : [];
                
                return (
                    <Box>
                        {tpArray.map((tp, index) => (
                            <HStack key={index} spacing={2} justify="space-between">
                                <Text fontSize="xs">{tp}</Text>
                                <Text fontSize="xs" color="blue.500">
                                    {progressArray[index] ? `${(parseFloat(progressArray[index]) * 100).toFixed(0)}%` : '-'}
                                </Text>
                            </HStack>
                        ))}
                    </Box>
                );
            }
        }),
    ], []);

    // Load parquet files once
    const loadParquetFile = async () => {
        if (parquetLoaded || dbLoading || dbError) return;

        try {
            const startLoadTime = performance.now();
            
            // Load master_subsystem.parquet
            const res1 = await fetch('/data/master_subsystem.parquet');
            if (!res1.ok) throw new Error(`Failed to fetch master_subsystem: ${res1.status}`);
            const parquetBuffer1 = await res1.arrayBuffer();
            await createTableFromParquet('master_subsystem', parquetBuffer1);
            
            // Load MASTER_DATASET_df_tp_full.parquet
            const res2 = await fetch('/data/MASTER_DATASET_df_tp_full.parquet');
            if (!res2.ok) throw new Error(`Failed to fetch tp_full: ${res2.status}`);
            const parquetBuffer2 = await res2.arrayBuffer();
            await createTableFromParquet('MASTER_DATASET_df_tp_full', parquetBuffer2);

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
                WITH s1 AS (
                    SELECT 
                        iso_insulation AS iso_insulation,
                        MAX(subsystem) AS subsystem, 
                        SUM(mleq_insulation)::FLOAT AS mleq,
                        SUM(m2eq_insulation)::FLOAT AS m2eq,
                        SUM(total_m_avance_insulation)::FLOAT AS total_m_advance
                    FROM master_subsystem
                    WHERE iso_insulation IS NOT NULL
                    GROUP BY iso_insulation
                    ORDER BY iso_insulation
                ),
                s2 AS (
                    SELECT 
                        isometricos_ifc3_isos as isometricos_isos,
                        hito_isos,
                        teiga_reinstatement_isos,
                        teiga_insulation_isos,
                        siemsa_isos,
                        ten_isos,
                        tpvt_isos
                    FROM master_subsystem
                    WHERE isometricos_ifc3_isos IS NOT NULL
                    ORDER BY isometricos_ifc3_isos
                ),
                tp_progress AS (
                    SELECT 
                        dossier_id_tp,
                        "1_tp" as progress_tp
                    FROM MASTER_DATASET_df_tp_full
                    WHERE dossier_id_tp IS NOT NULL
                ),
                tp_expanded AS (
                    SELECT 
                        s2.isometricos_isos,
                        s2.tpvt_isos,
                        UNNEST(string_split(s2.tpvt_isos, '|')) as tp_id
                    FROM s2
                    WHERE s2.tpvt_isos IS NOT NULL
                )
                SELECT 
                    s1.iso_insulation AS 'ISOMETRIC',
                    s1.subsystem AS 'SUBSYSTEM', 
                    s1.mleq AS 'MLEQ',
                    s1.m2eq AS 'M2EQ',
                    s1.total_m_advance AS 'TOTAL M ADVANCE',
                    s2.hito_isos AS 'HITO',
                    s2.teiga_reinstatement_isos AS 'TEIGA REINSTATEMENT',
                    s2.teiga_insulation_isos AS 'TEIGA INSULATION',
                    s2.siemsa_isos AS 'SIEMSA',
                    s2.ten_isos AS 'TEN',
                    s2.tpvt_isos AS 'TPs',
                    string_agg(tp_progress.progress_tp::VARCHAR, '|') AS 'TP_PROGRESS'
                FROM s1 
                LEFT JOIN s2 ON s1.iso_insulation = s2.isometricos_isos
                LEFT JOIN tp_expanded ON s2.isometricos_isos = tp_expanded.isometricos_isos
                LEFT JOIN tp_progress ON tp_expanded.tp_id = tp_progress.dossier_id_tp
                GROUP BY s1.iso_insulation, s1.subsystem, s1.mleq, s1.m2eq, s1.total_m_advance, 
                         s2.hito_isos, s2.teiga_reinstatement_isos, s2.teiga_insulation_isos, 
                         s2.siemsa_isos, s2.ten_isos, s2.tpvt_isos
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
                                            justifyContent={
                                                cell.column.id === 'SUBSYSTEM' || 
                                                cell.column.id === 'MLEQ' || 
                                                cell.column.id === 'M2EQ' || 
                                                cell.column.id === 'TOTAL M ADVANCE' || 
                                                cell.column.id === 'HITO' || 
                                                cell.column.id === 'TEIGA REINSTATEMENT' || 
                                                cell.column.id === 'TEIGA INSULATION' || 
                                                cell.column.id === 'SIEMSA' || 
                                                cell.column.id === 'TEN' 
                                                ? 'center' : 'flex-start'
                                            }
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