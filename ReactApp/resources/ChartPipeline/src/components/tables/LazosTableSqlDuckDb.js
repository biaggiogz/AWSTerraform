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
    Button,
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
import { useLazosTableSqlFilterContext } from '../filters/LazosTableFilter';

// Performance measurement component
const LazosTableSqlPerformanceMetric = React.memo(({ label, value, description }) => (
    <Tooltip label={description} placement="top">
        <Badge colorScheme="blue" fontSize="xs" px={2} py={1} mr={2} cursor="help">
            {label}: {value}
        </Badge>
    </Tooltip>
));

// Subsystem Cell Component
const LazosTableSqlSubsystemCell = React.memo(({ subsystem, onSubsystemSelect, selectedSubsystem }) => {
    if (!subsystem || subsystem === '') {
        return <Text fontSize="xs" color="gray.500">-</Text>;
    }

    return (
        <Button
            size="xs"
            variant={selectedSubsystem === subsystem ? "solid" : "outline"}
            onClick={() => onSubsystemSelect && onSubsystemSelect(subsystem)}
            _hover={{ bg: selectedSubsystem === subsystem ? "green.200" : "blue.200" }}
            fontSize="10px"
            fontWeight="medium"
            color={selectedSubsystem === subsystem ? "white" : "blue.600"}
            bg={selectedSubsystem === subsystem ? "green.500" : "white"}
            borderColor={selectedSubsystem === subsystem ? "green.500" : "blue.500"}
            minWidth="30px"
            height="18px"
            px={2}
            borderRadius="sm"
        >
            {subsystem}
        </Button>
    );
});

const LazosTableSqlLoopTestControl = () => {
    // Get filter context
    const {
        selectedSubsystem,
        handleSubsystemClick,
        getSqlWhereClause
    } = useLazosTableSqlFilterContext();

    const {
        createTableFromParquet,
        executeQuery,
        loading: dbLoading,
        error: dbError,
    } = useDuckDB();

    // State declarations
    const [lazosTableSqlData, setLazosTableSqlData] = useState([]);
    const [lazosTableSqlLoading, setLazosTableSqlLoading] = useState(true);
    const [lazosTableSqlError, setLazosTableSqlError] = useState(null);

    // Performance metrics
    const [lazosTableSqlLoadTime, setLazosTableSqlLoadTime] = useState(null);
    const [lazosTableSqlQueryTime, setLazosTableSqlQueryTime] = useState(null);
    const lazosTableSqlContainerRef = useRef(null);

    // Define columns using TanStack's column helper
    const lazosTableSqlColumnHelper = createColumnHelper();

    const lazosTableSqlColumns = useMemo(() => [
        lazosTableSqlColumnHelper.accessor('CODE', {
            header: 'CODE',
            cell: info => <Text fontSize="xs">{info.getValue() || '-'}</Text>
        }),
        lazosTableSqlColumnHelper.accessor('SUBSYSTEM', {
            header: 'SUBSYSTEM',
            cell: info => (
                <LazosTableSqlSubsystemCell
                    subsystem={info.getValue()}
                    onSubsystemSelect={handleSubsystemClick}
                    selectedSubsystem={selectedSubsystem}
                />
            )
        }),
        lazosTableSqlColumnHelper.accessor('TAG LOOP', {
            header: 'TAG LOOP',
            cell: info => <Text fontSize="xs">{info.getValue() || '-'}</Text>
        }),
        lazosTableSqlColumnHelper.accessor('AREA', {
            header: 'AREA',
            cell: info => <Text fontSize="xs">{info.getValue() || '-'}</Text>
        }),
        lazosTableSqlColumnHelper.accessor('PRIORITY', {
            header: 'PRIORITY',
            cell: info => <Text fontSize="xs">{info.getValue() || '-'}</Text>
        }),
        lazosTableSqlColumnHelper.accessor('HITO_TLP', {
            header: 'HITO_TLP',
            cell: info => <Text fontSize="xs">{info.getValue() || '-'}</Text>
        }),
        lazosTableSqlColumnHelper.accessor('SIEMSA', {
            header: 'SIEMSA',
            cell: info => <Text fontSize="xs">{info.getValue() || '-'}</Text>
        }),
        lazosTableSqlColumnHelper.accessor('LOOP', {
            header: 'LOOP',
            cell: info => <Text fontSize="xs">{info.getValue() || '-'}</Text>
        }),
        lazosTableSqlColumnHelper.accessor('TAGs', {
            header: 'TAGs',
            cell: info => <Text fontSize="xs">{info.getValue() || '-'}</Text>
        }),
        lazosTableSqlColumnHelper.accessor('Service', {
            header: 'Service',
            cell: info => <Text fontSize="xs">{info.getValue() || '-'}</Text>
        }),
        lazosTableSqlColumnHelper.accessor('Installed', {
            header: 'Installed',
            cell: info => <Text fontSize="xs">{info.getValue() || '-'}</Text>
        }),
        lazosTableSqlColumnHelper.accessor('WIRED', {
            header: 'WIRED',
            cell: info => <Text fontSize="xs">{info.getValue() || '-'}</Text>
        }),
        lazosTableSqlColumnHelper.accessor('CONNECTED', {
            header: 'CONNECTED',
            cell: info => <Text fontSize="xs">{info.getValue() || '-'}</Text>
        }),
        lazosTableSqlColumnHelper.accessor('CABLE TEST', {
            header: 'CABLE TEST',
            cell: info => <Text fontSize="xs">{info.getValue() || '-'}</Text>
        }),
        lazosTableSqlColumnHelper.accessor('QCF', {
            header: 'QCF',
            cell: info => <Text fontSize="xs">{info.getValue() || '-'}</Text>
        }),
        lazosTableSqlColumnHelper.accessor('OK=100&', {
            header: 'OK=100&',
            cell: info => <Text fontSize="xs">{info.getValue() || '-'}</Text>
        }),
        lazosTableSqlColumnHelper.accessor('DOSSIER', {
            header: 'DOSSIER',
            cell: info => <Text fontSize="xs">{info.getValue() || '-'}</Text>
        }),
        lazosTableSqlColumnHelper.accessor('TEST LOOP', {
            header: 'TEST LOOP',
            cell: info => <Text fontSize="xs">{info.getValue() || '-'}</Text>
        }),
        lazosTableSqlColumnHelper.accessor('ACTION', {
            header: 'ACTION',
            cell: info => <Text fontSize="xs">{info.getValue() || '-'}</Text>
        }),
        lazosTableSqlColumnHelper.accessor('BY', {
            header: 'BY',
            cell: info => <Text fontSize="xs">{info.getValue() || '-'}</Text>
        }),
        lazosTableSqlColumnHelper.accessor('Status Closed&Open (C/O)', {
            header: 'Status Closed&Open (C/O)',
            cell: info => <Text fontSize="xs">{info.getValue() || '-'}</Text>
        })
    ], [selectedSubsystem, handleSubsystemClick]);

    // Load data function
    const lazosTableSqlLoadData = async () => {
        const startTime = performance.now();
        setLazosTableSqlLoading(true);
        setLazosTableSqlError(null);

        try {
            // Create table from parquet
            await createTableFromParquet('master_subsystem', '/data/master_subsystem.parquet');
            const loadEndTime = performance.now();
            setLazosTableSqlLoadTime(Math.round(loadEndTime - startTime));

            // Execute query
            const queryStartTime = performance.now();
            const whereClause = getSqlWhereClause();
            const query = `
                SELECT code_tlp AS "CODE",
                subsystem AS "SUBSYSTEM",
                tag_loop_tlp AS "TAG LOOP",
                area_tlp AS "AREA",
                priority_tlp AS "PRIORITY",
                hito_tlp AS "HITO_TLP",
                siemsa_tlp AS "SIEMSA",
                loop_tlp AS "LOOP",
                tags_tlp AS "TAGs",
                service_tlp AS "Service",
                installed_tlp AS "Installed",
                wired_tlp AS "WIRED",
                connected_tlp AS "CONNECTED",
                cable_test_tlp AS "CABLE TEST",
                qcf_tlp AS "QCF",
                ok100_tlp AS "OK=100&",
                dossier_tlp AS "DOSSIER",
                test_loop_tlp AS "TEST LOOP",
                action_tlp AS "ACTION",
                by_tlp AS "BY",
                status_closedopen_co_tlp AS "Status Closed&Open (C/O)"
                FROM master_subsystem
                WHERE tag_loop_tlp is not null
                ${whereClause ? ` AND ${whereClause}` : ''}
            `;

            const result = await executeQuery(query);
            const queryEndTime = performance.now();
            setLazosTableSqlQueryTime(Math.round(queryEndTime - queryStartTime));

            setLazosTableSqlData(result || []);
        } catch (err) {
            console.error('Error loading Loop Test Control data:', err);
            setLazosTableSqlError(err.message);
        } finally {
            setLazosTableSqlLoading(false);
        }
    };

    // Load data on component mount and when filters change
    useEffect(() => {
        lazosTableSqlLoadData();
    }, [selectedSubsystem]);

    // Create table instance
    const lazosTableSqlTable = useReactTable({
        data: lazosTableSqlData,
        columns: lazosTableSqlColumns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
    });

    // Virtualization setup
    const lazosTableSqlVirtualizer = useVirtualizer({
        count: lazosTableSqlTable.getRowModel().rows.length,
        getScrollElement: () => lazosTableSqlContainerRef.current,
        estimateSize: () => 35,
        overscan: 10,
    });

    if (lazosTableSqlLoading) {
        return (
            <Center h="400px">
                <Spinner size="lg" />
            </Center>
        );
    }

    if (lazosTableSqlError) {
        return (
            <Center h="400px">
                <Text color="red.500">Error: {lazosTableSqlError}</Text>
            </Center>
        );
    }

    return (
        <Box>
            <HStack mb={4} justify="space-between" align="center">
                <Heading size="md">Loop Test Control-Precommissioning</Heading>
                <HStack>
                    {lazosTableSqlLoadTime && (
                        <LazosTableSqlPerformanceMetric
                            label="Load"
                            value={`${lazosTableSqlLoadTime}ms`}
                            description="Time to load parquet file into DuckDB"
                        />
                    )}
                    {lazosTableSqlQueryTime && (
                        <LazosTableSqlPerformanceMetric
                            label="Query"
                            value={`${lazosTableSqlQueryTime}ms`}
                            description="Time to execute SQL query"
                        />
                    )}
                    <Badge colorScheme="green" fontSize="xs" px={2} py={1}>
                        Rows: {lazosTableSqlData.length}
                    </Badge>
                </HStack>
            </HStack>

            <Box
                ref={lazosTableSqlContainerRef}
                height="600px"
                overflowY="auto"
                border="1px solid"
                borderColor="gray.200"
                borderRadius="md"
            >
                <Box height={`${lazosTableSqlVirtualizer.getTotalSize()}px`} position="relative">
                    {/* Header */}
                    <Box
                        position="sticky"
                        top={0}
                        bg="gray.50"
                        zIndex={1}
                        borderBottom="1px solid"
                        borderColor="gray.200"
                    >
                        {lazosTableSqlTable.getHeaderGroups().map(headerGroup => (
                            <HStack key={headerGroup.id} spacing={0}>
                                {headerGroup.headers.map(header => (
                                    <Box
                                        key={header.id}
                                        minWidth="120px"
                                        maxWidth="200px"
                                        px={2}
                                        py={2}
                                        borderRight="1px solid"
                                        borderColor="gray.200"
                                        cursor={header.column.getCanSort() ? 'pointer' : 'default'}
                                        onClick={header.column.getToggleSortingHandler()}
                                        _hover={{
                                            bg: header.column.getCanSort() ? 'gray.100' : 'gray.50'
                                        }}
                                    >
                                        <Text fontSize="xs" fontWeight="bold" noOfLines={2}>
                                            {flexRender(header.column.columnDef.header, header.getContext())}
                                        </Text>
                                    </Box>
                                ))}
                            </HStack>
                        ))}
                    </Box>

                    {/* Virtual rows */}
                    {lazosTableSqlVirtualizer.getVirtualItems().map(virtualRow => {
                        const row = lazosTableSqlTable.getRowModel().rows[virtualRow.index];
                        return (
                            <Box
                                key={row.id}
                                position="absolute"
                                top={0}
                                left={0}
                                width="100%"
                                height={`${virtualRow.size}px`}
                                transform={`translateY(${virtualRow.start}px)`}
                                borderBottom="1px solid"
                                borderColor="gray.100"
                                _hover={{ bg: 'blue.50' }}
                            >
                                <HStack spacing={0} height="100%">
                                    {row.getVisibleCells().map(cell => (
                                        <Box
                                            key={cell.id}
                                            minWidth="120px"
                                            maxWidth="200px"
                                            px={2}
                                            py={1}
                                            borderRight="1px solid"
                                            borderColor="gray.100"
                                            display="flex"
                                            alignItems="center"
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

export default LazosTableSqlLoopTestControl;
