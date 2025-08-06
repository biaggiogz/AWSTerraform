import React, { useState, useMemo, useCallback } from 'react';
import {
    Box,
    HStack,
    Text,
    VStack,
    Button,
    SimpleGrid,
    Divider,
    IconButton,
    Input
} from '@chakra-ui/react';
import { MdClose } from 'react-icons/md';
import ResizableDraggablePanel from '../ui/ResizableDraggablePanel';
import { useFilterDebounce } from './hooks/useFilterDebounce';

const InstrumentsSubsystemFilter = ({
    data,
    onFilterChange,
    isVisible,
    onClose,
    onBringToFront
}) => {
    const [topZIndex, setTopZIndex] = useState(100);
    const [selectedSubsystems, setSelectedSubsystems] = useState({});
    const [searchTerm, setSearchTerm] = useState('');

    const handleFilterBringToFront = () => {
        const newZIndex = topZIndex + 100;
        setTopZIndex(newZIndex + 1);
        return newZIndex;
    };

    const subsystemValues = useMemo(() => {
        if (!data || data.length === 0) return {};

        const values = {};
        data.forEach(row => {
            if (row.SUBSYSTEM) {
                values[row.SUBSYSTEM] = true;
            }
        });

        return values;
    }, [data]);

    const sortedSubsystems = useMemo(() => {
        return Object.keys(subsystemValues)
            .sort((a, b) => a.localeCompare(b))
            .reduce((obj, key) => {
                obj[key] = true;
                return obj;
            }, {});
    }, [subsystemValues]);

    React.useEffect(() => {
        const subsystemKeys = Object.keys(sortedSubsystems);
        if (subsystemKeys.length > 0 && Object.keys(selectedSubsystems).length === 0) {
            const initialState = subsystemKeys.reduce((acc, subsystem) => {
                acc[subsystem] = true;
                return acc;
            }, {});
            setSelectedSubsystems(initialState);
        }
    }, [sortedSubsystems]);

    const filteredData = useMemo(() => {
        if (!data || data.length === 0) return [];
        return data.filter(row => row.SUBSYSTEM && selectedSubsystems[row.SUBSYSTEM]);
    }, [data, selectedSubsystems]);

    const debouncedFilterChange = useFilterDebounce(useCallback((filteredData) => {
        const allSelected = Object.keys(sortedSubsystems).every(key => selectedSubsystems[key]);
        if (allSelected) {
            onFilterChange([]);
        } else {
            onFilterChange(filteredData);
        }
    }, [onFilterChange, sortedSubsystems, selectedSubsystems]), 50);

    React.useEffect(() => {
        debouncedFilterChange(filteredData);
    }, [filteredData, debouncedFilterChange]);

    const toggleSubsystem = useCallback((subsystem) => {
        setSelectedSubsystems(prev => ({
            ...prev,
            [subsystem]: !prev[subsystem]
        }));
    }, []);

    const toggleAllSubsystems = useCallback((value) => {
        const newState = Object.keys(sortedSubsystems).reduce((acc, subsystem) => {
            acc[subsystem] = value;
            return acc;
        }, {});
        setSelectedSubsystems(newState);
    }, [sortedSubsystems]);

    const invertSubsystemSelection = useCallback(() => {
        setSelectedSubsystems(prev => {
            const invertedState = {};
            Object.keys(sortedSubsystems).forEach(subsystem => {
                invertedState[subsystem] = !prev[subsystem];
            });
            return invertedState;
        });
    }, [sortedSubsystems]);

    const getSubsystemColor = useCallback(() => {
        return '#007598';
    }, []);

    const filteredSubsystems = useMemo(() => {
        if (!searchTerm) return sortedSubsystems;

        const filtered = {};
        Object.keys(sortedSubsystems).forEach((subsystem) => {
            if (subsystem.toLowerCase().includes(searchTerm.toLowerCase())) {
                filtered[subsystem] = true;
            }
        });
        return filtered;
    }, [sortedSubsystems, searchTerm]);

    const memoizedButtons = useMemo(() =>
        Object.keys(filteredSubsystems).map((subsystem) => {
            const isSelected = selectedSubsystems[subsystem] || false;
            const color = getSubsystemColor();

            return (
                <Button
                    key={subsystem}
                    size="sm"
                    height="36px"
                    variant={isSelected ? "solid" : "outline"}
                    bg={isSelected ? color : "rgba(128, 128, 128, 0.3)"}
                    borderColor={isSelected ? color : "rgba(128, 128, 128, 0.5)"}
                    color={isSelected ? "white" : "black"}
                    onClick={() => toggleSubsystem(subsystem)}
                    mb={1}
                    _hover={{ bg: isSelected ? color : "rgba(128, 128, 128, 0.4)" }}
                >
                    <VStack spacing={0} align="center">
                        <Text fontSize="xs" fontWeight="bold" noOfLines={1}>
                            {subsystem}
                        </Text>
                    </VStack>
                </Button>
            );
        }), [filteredSubsystems, selectedSubsystems, toggleSubsystem, getSubsystemColor]
    );

    if (!isVisible) return null;

    return (
        <ResizableDraggablePanel
            title="Instruments Subsystem Filter"
            initialWidth={400}
            initialHeight={600}
            initialX={1690}
            initialY={230}
            minWidth={350}
            minHeight={400}
            onBringToFront={handleFilterBringToFront}
        >
            <VStack spacing={3} align="stretch" p={3} height="100%">
                <HStack justify="flex-end" align="center">
                    <IconButton
                        icon={<MdClose />}
                        size="sm"
                        variant="ghost"
                        onClick={onClose}
                        aria-label="Close filter"
                    />
                </HStack>

                <HStack spacing={2}>
                    <Button size="xs" colorScheme="blue" onClick={() => toggleAllSubsystems(true)}>Select All</Button>
                    <Button size="xs" colorScheme="gray" onClick={() => toggleAllSubsystems(false)}>Clear All</Button>
                    <Button size="xs" colorScheme="teal" onClick={invertSubsystemSelection}>Invert</Button>
                </HStack>

                <VStack spacing={2} align="stretch">
                    <Box>
                        <Text fontSize="xs" fontWeight="semibold" mb={1}>Search subsystems:</Text>
                        <Input
                            size="sm"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            bg="white"
                        />
                    </Box>
                </VStack>

                <Divider />

                <Box overflowY="auto" flex="1">
                    <SimpleGrid columns={3} spacing={2}>
                        {memoizedButtons}
                    </SimpleGrid>
                </Box>
            </VStack>
        </ResizableDraggablePanel>
    );
};

export default React.memo(InstrumentsSubsystemFilter);