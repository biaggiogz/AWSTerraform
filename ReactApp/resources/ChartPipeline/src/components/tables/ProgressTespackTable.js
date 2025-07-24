import React, { useMemo } from 'react';
import {
    Box,
    Text,
    HStack,
    Badge,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    Tooltip,
} from '@chakra-ui/react';
import {
    useReactTable,
    getCoreRowModel,
    flexRender,
    createColumnHelper,
} from '@tanstack/react-table';

const ProgressTestpackTable = ({ data, selectedSubsystem, isProgressFilterVisible }) => {
    const columnHelper = createColumnHelper();

    // Memoize selected TPs to avoid recalculation
    const selectedTPs = useMemo(() => {
        if (!isProgressFilterVisible) return null;
        const state = window.progressFilterState;
        return state?.filteredData
            ? state.filteredData.map((d) => String(d.tp_id || d.testPack || d.id || ''))
            : null;
    }, [isProgressFilterVisible]);

    // Flattened rows: each row is one test pack
    const flattenedData = useMemo(() => {
        if (!data || data.length === 0) return [];

        return data
            .filter(row => row.tp_id && row.subsystem)
            .filter(row => !selectedSubsystem || row.subsystem === selectedSubsystem)
            .filter(row => {
                if (!selectedTPs) return true;
                return selectedTPs.includes(String(row.tp_id));
            })
            .map(row => ({
                id: String(row.tp_id),
                subsystem: row.subsystem,
                progress: parseFloat(row.progress_tp || 0),
            }));
    }, [data, selectedSubsystem, selectedTPs]);

    // Memoize progress color calculation
    const getProgressColor = useMemo(() => {
        return (progress) => {
            if (progress >= 1) return '#437057';
            if (progress >= 0.9) return '#97B067';
            return '#E86A33';
        };
    }, []);

    const columns = useMemo(
        () => [
            columnHelper.accessor('subsystem', {
                header: 'Subsystem',
                cell: info => (
                    <Text fontWeight="semibold" color="blue.700">
                        {info.getValue()}
                    </Text>
                ),
            }),
            columnHelper.accessor('id', {
                header: 'Test Pack ID',
                cell: info => <Text>{info.getValue()}</Text>,
            }),
            columnHelper.accessor('progress', {
                header: 'Progress',
                cell: info => {
                    const progress = info.getValue();
                    const percent = Math.round(progress * 100);
                    const color = getProgressColor(progress);

                    return (
                        <Tooltip label={`${percent}%`} hasArrow>
                            <Badge bg={color} color="white" borderRadius="md" px={2}>
                                {percent}%
                            </Badge>
                        </Tooltip>
                    );
                },
            }),
        ],
        [columnHelper, getProgressColor]
    );

    const table = useReactTable({
        data: flattenedData,
        columns,
        getCoreRowModel: getCoreRowModel(),
    });

    return (
        <Box border="1px solid" borderColor="gray.200" borderRadius="md" bg="white" overflow="hidden">
            <Box p={2} bg="#0082A9" color="white" fontWeight="bold" fontSize="sm" textAlign="center">
                TEST PACKS PROGRESS BY SUBSYSTEM
            </Box>

            {flattenedData.length === 0 ? (
                <Box p={4} textAlign="center" color="gray.500">
                    <Text fontSize="sm">
                        {isProgressFilterVisible &&
                        window.progressFilterState?.filteredData?.length === 0
                            ? 'No test packs match the current filter selection'
                            : 'No test pack data available'}
                    </Text>
                </Box>
            ) : (
                <Table variant="simple" size="sm">
                    <Thead bg="gray.50">
                        {table.getHeaderGroups().map(headerGroup => (
                            <Tr key={headerGroup.id}>
                                {headerGroup.headers.map(header => (
                                    <Th key={header.id}>
                                        {flexRender(header.column.columnDef.header, header.getContext())}
                                    </Th>
                                ))}
                            </Tr>
                        ))}
                    </Thead>
                    <Tbody>
                        {table.getRowModel().rows.map(row => (
                            <Tr key={row.id}>
                                {row.getVisibleCells().map(cell => (
                                    <Td key={cell.id}>
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </Td>
                                ))}
                            </Tr>
                        ))}
                    </Tbody>
                </Table>
            )}
        </Box>
    );
};

export default ProgressTestpackTable;
