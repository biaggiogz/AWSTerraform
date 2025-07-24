import React, { useMemo } from 'react';
import { Box, Text, HStack, VStack, Heading, Tooltip, Badge } from '@chakra-ui/react';
import { FixedSizeList as List } from 'react-window';

const ProgressTestpackTable = ({ data, selectedSubsystem, isProgressFilterVisible }) => {
    // Group test packs by subsystem from CSV data structure
    const subsystemTPs = useMemo(() => {
        if (!data || data.length === 0) return [];

        const subsystemMap = new Map();

        data.forEach(row => {
            const { subsystem, tp_id, progress_tp } = row;
            if (!subsystem || !tp_id) return;

            const progress = parseFloat(progress_tp) || 0;
            const tp = {
                id: String(tp_id),
                progress,
                progressPercent: Math.round(progress * 100)
            };

            if (!subsystemMap.has(subsystem)) {
                subsystemMap.set(subsystem, {
                    subsystem,
                    tps: [tp],
                    avgProgress: progress
                });
            } else {
                const existing = subsystemMap.get(subsystem);
                existing.tps.push(tp);
                existing.avgProgress = existing.tps.reduce((sum, tp) => sum + tp.progress, 0) / existing.tps.length;
            }
        });

        return Array.from(subsystemMap.values())
            .sort((a, b) => a.subsystem.localeCompare(b.subsystem));
    }, [data]);

    // Filter by selected subsystem
    const filteredSubsystems = useMemo(() => {
        if (!selectedSubsystem) return subsystemTPs;
        return subsystemTPs.filter(item => item.subsystem === selectedSubsystem);
    }, [subsystemTPs, selectedSubsystem]);

    // Apply progress filter
    const filteredByProgress = useMemo(() => {
        if (!isProgressFilterVisible || !window.progressFilterState?.filteredData?.length) {
            return filteredSubsystems;
        }

        const filteredTPs = window.progressFilterState.filteredData.map(item => 
            String(item.testPack || item.tp_id || item.id || '')
        ).filter(Boolean);

        return filteredSubsystems.map(subsystem => ({
            ...subsystem,
            tps: subsystem.tps.map(tp => ({
                ...tp,
                isSelected: filteredTPs.includes(tp.id)
            }))
        }));
    }, [filteredSubsystems, isProgressFilterVisible]);

    const getProgressColor = (progress) => {
        if (progress >= 1) return '#437057';
        if (progress >= 0.9) return '#97B067';
        return '#E86A33';
    };

    const Row = ({ index, style }) => {
        const subsystem = filteredByProgress[index];
        const hasActiveFilter = isProgressFilterVisible && window.progressFilterState?.filteredData?.length;

        return (
            <Box
                style={style}
                p={2}
                borderBottom="1px solid"
                borderColor="gray.200"
                bg={index % 2 === 0 ? "white" : "gray.50"}
            >
                <VStack align="stretch" spacing={2}>
                    <HStack justify="space-between">
                        <Heading size="xs" color="#007598">{subsystem.subsystem}</Heading>
                        <Badge
                            colorScheme={subsystem.avgProgress >= 0.9 ? "green" : subsystem.avgProgress >= 0.7 ? "yellow" : "orange"}
                            fontSize="xs"
                        >
                            {Math.round(subsystem.avgProgress * 100)}% Avg
                        </Badge>
                    </HStack>
                    <Box>
                        <HStack spacing={1} flexWrap="wrap">
                            {subsystem.tps.map(tp => {
                                const isSelected = hasActiveFilter ? tp.isSelected : true;
                                const opacity = hasActiveFilter && !isSelected ? 0.4 : 1;
                                const bgColor = getProgressColor(tp.progress);

                                return (
                                    <Tooltip key={tp.id} label={`TP ${tp.id} - ${tp.progressPercent}%`} hasArrow>
                                        <Box
                                            px={2}
                                            py={1}
                                            bg={bgColor}
                                            color="white"
                                            borderRadius="md"
                                            fontSize="xs"
                                            fontWeight="medium"
                                            mb={1}
                                            mr={1}
                                            opacity={opacity}
                                            transition="opacity 0.2s"
                                        >
                                            {tp.id} ({tp.progressPercent}%)
                                        </Box>
                                    </Tooltip>
                                );
                            })}
                        </HStack>
                    </Box>
                </VStack>
            </Box>
        );
    };

    return (
        <Box
            border="1px solid"
            borderColor="gray.200"
            borderRadius="md"
            bg="white"
            height="100%"
            overflow="hidden"
        >
            <Box
                p={2}
                bg="#0082A9"
                color="white"
                fontWeight="bold"
                fontSize="sm"
                textAlign="center"
            >
                TEST PACKS PROGRESS BY SUBSYSTEM
            </Box>

            {filteredByProgress.length > 0 ? (
                <List
                    height={400}
                    itemCount={filteredByProgress.length}
                    itemSize={120}
                    width="100%"
                >
                    {Row}
                </List>
            ) : (
                <Box p={4} textAlign="center" color="gray.500">
                    <Text fontSize="sm">No test pack data available</Text>
                </Box>
            )}
        </Box>
    );
};

export default ProgressTestpackTable;