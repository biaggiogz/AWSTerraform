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
    IconButton,
} from '@chakra-ui/react';
import { MdCategory, MdLoop } from 'react-icons/md';
import { createColumnHelper } from '@tanstack/react-table';
import useDuckDB from '../../hooks/useDuckDB3';
import { useLazosTableSqlFilterContext } from '../filters/LazosTableFilter';
import { buildLoopTestProgressQuery } from '../../utils/sqlOptimizer';
import LazosSubsystemFilter from '../filters/LazosSubsystemFilter';
import LazosTagLoopFilter from '../filters/LazosTagLoopFilter';
import VirtualizedTableWasm from '../shared/VirtualizedTableWasm';

// Performance measurement component
const LazosTableSqlPerformanceMetric = React.memo(({ label, value, description }) => (
    <Tooltip label={description} placement="top">
        <Badge colorScheme="blue" fontSize="xs" px={2} py={1} mr={2} cursor="help">
            {label}: {value}
        </Badge>
    </Tooltip>
));



const LazosTableSqlLoopTestControl = () => {
    // Get filter context
    const {
        getSqlWhereClause,
        setTableData
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
    const [frozenInstalledCount, setFrozenInstalledCount] = useState(null);

    // Performance metrics
    const [lazosTableSqlLoadTime, setLazosTableSqlLoadTime] = useState(null);
    const [lazosTableSqlQueryTime, setLazosTableSqlQueryTime] = useState(null);


    // Filter state
    const [isLazosSubsystemFilterVisible, setIsLazosSubsystemFilterVisible] = useState(false);
    const [lazosSubsystemFilteredData, setLazosSubsystemFilteredData] = useState([]);
    const [isLazosTagLoopFilterVisible, setIsLazosTagLoopFilterVisible] = useState(false);
    const [lazosTagLoopFilteredData, setLazosTagLoopFilteredData] = useState([]);

    // Optimized filter logic using Set for O(1) lookups
    const displayData = useMemo(() => {
        const hasSubsystemFilter = lazosSubsystemFilteredData.length > 0;
        const hasTagLoopFilter = lazosTagLoopFilteredData.length > 0;

        if (!hasSubsystemFilter && !hasTagLoopFilter) {
            return lazosTableSqlData;
        }

        // Create Sets for O(1) lookup performance
        const subsystemSet = hasSubsystemFilter ?
            new Set(lazosSubsystemFilteredData.map(row => row.SUBSYSTEM)) : null;
        const tagLoopSet = hasTagLoopFilter ?
            new Set(lazosTagLoopFilteredData.map(row => row['TAG LOOP'])) : null;

        // Single pass filter with O(1) lookups
        return lazosTableSqlData.filter(row => {
            const matchesSubsystem = !subsystemSet || subsystemSet.has(row.SUBSYSTEM);
            const matchesTagLoop = !tagLoopSet || tagLoopSet.has(row['TAG LOOP']);
            return matchesSubsystem && matchesTagLoop;
        });
    }, [lazosSubsystemFilteredData, lazosTagLoopFilteredData, lazosTableSqlData]);

    // Propagate filtered data to context for charts
    useEffect(() => {
        if (setTableData) {
            setTableData(displayData);
        }
    }, [displayData, setTableData]);

    // Helper function to format timestamp to date
    const formatDate = (timestamp) => {
        if (!timestamp) return '';
        // Convert timestamp to milliseconds if it's in seconds
        const ts = timestamp > 9999999999 ? timestamp : timestamp * 1000;
        try {
            return new Date(ts).toLocaleDateString();
        } catch (e) {
            return 'Invalid date';
        }
    };
    // Define columns using TanStack's column helper
    const lazosTableSqlColumnHelper = createColumnHelper();

    const lazosTableSqlColumns = useMemo(() => [
        lazosTableSqlColumnHelper.accessor('CODE', {
            header: 'CODE',
            size: 60,
            cell: info => <Text fontSize="xs">{info.getValue() || '-'}</Text>
        }),
        lazosTableSqlColumnHelper.accessor('SUBSYSTEM', {
            header: 'SUBSYSTEM',
            size: 105,
            cell: info => <Text fontSize="xs" textAlign="center">{info.getValue() || '-'}</Text>
        }),
        lazosTableSqlColumnHelper.accessor('TAG LOOP', {
            header: 'TAG LOOP',
            size: 95,
            cell: info => <Text fontSize="xs" textAlign="center">{info.getValue() || '-'}</Text>
        }),
        lazosTableSqlColumnHelper.accessor('AREA', {
            header: 'AREA',
            size: 80,
            cell: info => <Text fontSize="xs" textAlign="center">{info.getValue() || '-'}</Text>
        }),
        lazosTableSqlColumnHelper.accessor('PRIORITY', {
            header: 'PRIORITY',
            size: 80,
            cell: info => <Text fontSize="xs" textAlign="center">{info.getValue() || '-'}</Text>
        }),
        lazosTableSqlColumnHelper.accessor('HITO', {
            header: 'HITO',
            size: 70,
            cell: info => <Text fontSize="xs" textAlign="center">{info.getValue() || '-'}</Text>
        }),
        lazosTableSqlColumnHelper.accessor('SIEMSA', {
            header: 'SIEMSA',
            size: 80,
            cell: info => <Text fontSize="xs" textAlign="center">{formatDate(info.getValue())}</Text>,
        }),
        lazosTableSqlColumnHelper.accessor('LOOP', {
            header: 'LOOP',
            size: 105,
            cell: info => <Text fontSize="xs" textAlign="center">{info.getValue() || '-'}</Text>
        }),
        lazosTableSqlColumnHelper.accessor('TAGS', {
            header: 'TAGs',
            size: 70,
            cell: info => <Text fontSize="xs" textAlign="center">{info.getValue() || '-'}</Text>
        }),
        lazosTableSqlColumnHelper.accessor('SERVICE', {
            header: 'SERVICE',
            size: 204,
            cell: info => (
                <Text
                    fontSize="xs"
                    wordBreak="break-word"
                    whiteSpace="normal"
                    textAlign="left"
                >
                    {info.getValue() || '-'}
                </Text>
            )
        }),
        lazosTableSqlColumnHelper.accessor('INSTALLED', {
            header: 'INSTALLED',
            size: 100,
            cell: info => <Text fontSize="xs" textAlign="center">{info.getValue() || '-'}</Text>
        }),
        lazosTableSqlColumnHelper.accessor('WIRED', {
            header: 'WIRED',
            size: 80,
            cell: info => <Text fontSize="xs" textAlign="center">{info.getValue() || '-'}</Text>
        }),
        lazosTableSqlColumnHelper.accessor('CONNECTED', {
            header: 'CONNECTED',
            size: 96,
            cell: info => <Text fontSize="xs" textAlign="center">{info.getValue() || '-'}</Text>
        }),
        lazosTableSqlColumnHelper.accessor('CABLE_TEST', {
            header: 'CABLE TEST',
            size: 96,
            cell: info => <Text fontSize="xs" textAlign="center">{info.getValue() || '-'}</Text>
        }),
        lazosTableSqlColumnHelper.accessor('QCF', {
            header: 'QCF',
            size: 80,
            cell: info => <Text fontSize="xs" textAlign="center">{info.getValue() || '-'}</Text>
        }),
        lazosTableSqlColumnHelper.accessor('OK100', {
            header: 'OK=100%',
            cell: info => {
                const value = parseFloat(info.getValue()) || 0;
                const percentage = Math.min(Math.max(value * 100, 0), 100);
                return (
                    <Box w="100%" position="relative">
                        <Box
                            h="16px"
                            w={`${percentage}%`}
                            bg="green.500"
                            borderRadius="sm"
                        />
                        <Text
                            fontSize="xs"
                            position="absolute"
                            top="0"
                            left="0"
                            right="0"
                            textAlign="center"
                            color="white"
                            fontWeight="bold"
                            textShadow="0px 0px 2px rgba(0,0,0,0.7)"
                        >
                            {percentage.toFixed(0)}%
                        </Text>
                    </Box>
                );
            },
            size: 95,
        }),
        lazosTableSqlColumnHelper.accessor('DOSSIER', {
            header: 'DOSSIER',
            size: 80,
            cell: info => <Text fontSize="xs" textAlign="center">{info.getValue() || '-'}</Text>,
        }),
        lazosTableSqlColumnHelper.accessor('TEST_LOOP', {
            header: 'TEST LOOP',
            size: 80,
            cell: info => <Text fontSize="xs" textAlign="center">{formatDate(info.getValue()) || '-' }</Text>
        }),
        lazosTableSqlColumnHelper.accessor('ACTION', {
            header: 'ACTION',
            size: 100,
            cell: info => <Text fontSize="xs" textAlign="center">{info.getValue() || '-'}</Text>
        }),
        lazosTableSqlColumnHelper.accessor('BY', {
            header: 'BY',
            size: 80,
            cell: info => <Text fontSize="xs" textAlign="center">{info.getValue() || '-'}</Text>
        }),
        lazosTableSqlColumnHelper.accessor('STATUS_CO', {
            header: 'Status C/O',
            size: 80,
            cell: info => <Text fontSize="xs" textAlign="center">{info.getValue() || '-'}</Text>
        })
    ], []);

    // Define multi-level header structure
    const multiLevelHeaders = useMemo(() => {
        return [
            {
                level: 1,
                headers: [
                    {
                        id: 'identification',
                        title: 'IDENTIFICATION',
                        colspan: 10,
                        startCol: 0,
                        color: '#002b5b'
                    },
                    {
                        id: 'construction',
                        title: 'CONSTRUCTION',
                        colspan: 6,
                        startCol: 10,
                        color: '#006494'
                    },
                    {
                        id: 'precommissioning',
                        title: 'PRECOMMISSIONING',
                        colspan: 2,
                        startCol: 16,
                        color: '#2a9d8F'
                    },
                    {
                        id: 'comments',
                        title: 'COMMENTS',
                        colspan: 3,
                        startCol: 18,
                        color: '#287271'
                    }
                ]
            }
        ];
    }, []);

    // State to track if parquet is loaded
    const [parquetLoaded, setParquetLoaded] = useState(false);

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
            setLazosTableSqlLoadTime(Math.round(endLoadTime - startLoadTime));
            setParquetLoaded(true);
        } catch (parquetError) {
            console.error('Error loading Parquet:', parquetError);
            setLazosTableSqlError('Failed to load data source');
        }
    };

    // Query data with current filters
    const queryData = async () => {
        if (!parquetLoaded) return;

        try {
            setLazosTableSqlLoading(true);
            const whereClause = getSqlWhereClause();
            console.log('LazosTableSql executing query with WHERE clause:', whereClause);
            const startQueryTime = performance.now();

            const finalQuery = buildLoopTestProgressQuery(whereClause);

            console.log('Final SQL query:', finalQuery);
            const result = await executeQuery(finalQuery);

            const endQueryTime = performance.now();
            setLazosTableSqlQueryTime(Math.round(endQueryTime - startQueryTime));
            console.log('Query result count:', result?.length || 0);
            setLazosTableSqlData(result || []);

            // Calculate frozen count on first load
            if (!frozenInstalledCount && result && result.length > 0) {
                const installedCount = result.reduce((sum, row) => {
                    const value = row.INSTALLED;
                    return sum + (value && value !== '-' && value !== '' ? 1 : 0);
                }, 0);
                setFrozenInstalledCount(installedCount);
            }

            if (setTableData) {
                setTableData(result || []);
            }
        } catch (err) {
            console.error('Error querying data:', err);
            setLazosTableSqlError(err.message);
        } finally {
            setLazosTableSqlLoading(false);
        }
    };

    // Load parquet file once on mount
    useEffect(() => {
        loadParquetFile();
    }, [createTableFromParquet, dbLoading, dbError]);

    // Query data when parquet is loaded or filters change
    useEffect(() => {
        if (parquetLoaded) {
            queryData();
        }
    }, [parquetLoaded, getSqlWhereClause]);



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
                    <IconButton
                        icon={<MdCategory />}
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                            if (isLazosSubsystemFilterVisible) {
                                setLazosSubsystemFilteredData([]);
                            }
                            setIsLazosSubsystemFilterVisible(!isLazosSubsystemFilterVisible);
                        }}
                        aria-label="Toggle subsystem filter"
                        title="Subsystem Filter"
                    />
                    <IconButton
                        icon={<MdLoop />}
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                            if (isLazosTagLoopFilterVisible) {
                                setLazosTagLoopFilteredData([]);
                            }
                            setIsLazosTagLoopFilterVisible(!isLazosTagLoopFilterVisible);
                        }}
                        aria-label="Toggle tag loop filter"
                        title="TAG LOOP Filter"
                    />
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
                        Rows: {displayData.length}
                    </Badge>
                    {frozenInstalledCount !== null && (
                        <Badge colorScheme="blue" fontSize="xs" px={2} py={1}>
                            Total Installed: {frozenInstalledCount}
                        </Badge>
                    )}
                    {(lazosSubsystemFilteredData.length > 0 || lazosTagLoopFilteredData.length > 0) && (
                        <Badge colorScheme="orange" fontSize="xs" px={2} py={1}>
                            Filtered from {lazosTableSqlData.length}
                        </Badge>
                    )}
                </HStack>
            </HStack>

            <VirtualizedTableWasm
                data={displayData || []}
                columns={lazosTableSqlColumns}
                multiLevelHeaders={multiLevelHeaders}
                height={600}
                showDynamicCounts={true}
                frozenDynamicCounts={frozenInstalledCount ? { installed: frozenInstalledCount } : null}
            />

            {/* Lazos Subsystem Filter */}
            <LazosSubsystemFilter
                data={lazosTableSqlData}
                onFilterChange={setLazosSubsystemFilteredData}
                isVisible={isLazosSubsystemFilterVisible}
                onClose={() => {
                    setIsLazosSubsystemFilterVisible(false);
                    setLazosSubsystemFilteredData([]);
                }}
            />

            {/* Lazos TAG LOOP Filter */}
            <LazosTagLoopFilter
                data={lazosTableSqlData}
                onFilterChange={setLazosTagLoopFilteredData}
                isVisible={isLazosTagLoopFilterVisible}
                onClose={() => {
                    setIsLazosTagLoopFilterVisible(false);
                    setLazosTagLoopFilteredData([]);
                }}
            />
        </Box>
    );
};

export default LazosTableSqlLoopTestControl;
