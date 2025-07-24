import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
    Box,
    HStack,
    Text,
    VStack,
    Button,
    SimpleGrid,
    Divider,
    IconButton,
    Select,
    Input
} from '@chakra-ui/react';
import { MdClose } from 'react-icons/md';
import ResizableDraggablePanel from '../ui/ResizableDraggablePanel';

const SubsystemFilterA = ({
                              data,
                              onFilterChange,
                              isVisible,
                              onClose,
                              onPropagationChange,
                              onBringToFront
                          }) => {
    const [selectedSubsystems, setSelectedSubsystems] = useState({});
    const [propagationTarget, setPropagationTarget] = useState('nothing');
    const [searchTerm, setSearchTerm] = useState('');

    const subsystemValues = useMemo(() => {
        if (!data || data.length === 0) return {};

        const values = {};
        data.forEach(row => {
            if (row.subsystem) {
                values[row.subsystem] = true;
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

    const debounceRef = useRef(null);

    React.useEffect(() => {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        debounceRef.current = setTimeout(() => {
            if (!data || data.length === 0) {
                onFilterChange([]);
                return;
            }

            const filteredData = data.filter(row => {
                if (!row.subsystem || !selectedSubsystems[row.subsystem]) return false;
                return true;
            });

            onFilterChange(filteredData);

            if (onPropagationChange && propagationTarget !== 'nothing') {
                onPropagationChange(filteredData, propagationTarget);
            }
        }, 100);

        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, [data, selectedSubsystems, onFilterChange, onPropagationChange, propagationTarget]);

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

    const handlePropagationChange = useCallback((value) => {
        setPropagationTarget(value);

        if (onPropagationChange) {
            if (value === 'nothing') {
                onPropagationChange([], 'nothing');
            } else {
                const currentFilteredData = data.filter(row => {
                    if (!row.subsystem || !selectedSubsystems[row.subsystem]) return false;
                    return true;
                });
                onPropagationChange(currentFilteredData, value);
            }
        }
    }, [data, selectedSubsystems, onPropagationChange]);

    const getSubsystemColor = useCallback((subsystem) => {
        const hash = subsystem.split('').reduce((acc, char) => {
            return char.charCodeAt(0) + ((acc << 5) - acc);
        }, 0);

        const h = Math.abs(hash) % 360;
        const s = 60 + (Math.abs(hash) % 30);
        const l = 35 + (Math.abs(hash) % 15);

        return `hsl(${h}, ${s}%, ${l}%)`;
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
            const color = getSubsystemColor(subsystem);

            return (
                <Button
                    key={subsystem}
                    size="sm"
                    height="36px"
                    variant={isSelected ? "solid" : "outline"}
                    bg={isSelected ? color : "white"}
                    borderColor={color}
                    color={isSelected ? "white" : "black"}
                    onClick={() => toggleSubsystem(subsystem)}
                    mb={1}
                    _hover={{ bg: isSelected ? color : "gray.100" }}
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

    React.useEffect(() => {
        if (!isVisible) {
            setPropagationTarget('nothing');
        }
    }, [isVisible]);

    if (!isVisible) return null;

    return (
        <ResizableDraggablePanel
            title="Subsystem Filter"
            initialWidth={400}
            initialHeight={600}
            initialX={250}
            initialY={250}
            minWidth={350}
            minHeight={400}
            onBringToFront={onBringToFront}
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

                    <Box>
                        <Text fontSize="xs" fontWeight="semibold" mb={1}>Propagate to:</Text>
                        <Select
                            size="sm"
                            value={propagationTarget}
                            onChange={(e) => handlePropagationChange(e.target.value)}
                            bg="white"
                        >
                            <option value="nothing">Nothing</option>
                            <option value="tableB">Table B (Test Pack Details)</option>
                        </Select>
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

export default React.memo(SubsystemFilterA);
