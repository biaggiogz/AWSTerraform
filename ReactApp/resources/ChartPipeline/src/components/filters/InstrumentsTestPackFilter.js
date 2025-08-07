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

const InstrumentsTestPackFilter = ({
    data,
    onFilterChange,
    isVisible,
    onClose,
    onBringToFront
}) => {
    const [topZIndex, setTopZIndex] = useState(100);
    const [selectedTestPacks, setSelectedTestPacks] = useState({});
    const [searchTerm, setSearchTerm] = useState('');

    const handleFilterBringToFront = () => {
        const newZIndex = topZIndex + 100;
        setTopZIndex(newZIndex + 1);
        return newZIndex;
    };

    const testPackValues = useMemo(() => {
        if (!data || data.length === 0) return {};

        const values = {};
        data.forEach(row => {
            if (row.TPs && row.TPs !== '' && row.TPs !== 'NOT_APPLY') {
                // Use the entire TPs value as the filter key
                values[row.TPs] = true;
            }
        });

        return values;
    }, [data]);

    const sortedTestPacks = useMemo(() => {
        return Object.keys(testPackValues)
            .sort((a, b) => a.localeCompare(b))
            .reduce((obj, key) => {
                obj[key] = true;
                return obj;
            }, {});
    }, [testPackValues]);

    React.useEffect(() => {
        const testPackKeys = Object.keys(sortedTestPacks);
        if (testPackKeys.length > 0 && Object.keys(selectedTestPacks).length === 0) {
            const initialState = testPackKeys.reduce((acc, testPack) => {
                acc[testPack] = true;
                return acc;
            }, {});
            setSelectedTestPacks(initialState);
        }
    }, [sortedTestPacks]);

    const filteredData = useMemo(() => {
        if (!data || data.length === 0) return [];
        return data.filter(row => {
            if (!row.TPs || row.TPs === '' || row.TPs === 'NOT_APPLY') return false;
            // Check if the entire TPs value matches any selected test pack
            return selectedTestPacks[row.TPs];
        });
    }, [data, selectedTestPacks]);

    const debouncedFilterChange = useFilterDebounce(useCallback((filteredData) => {
        const allSelected = Object.keys(sortedTestPacks).every(key => selectedTestPacks[key]);
        if (allSelected) {
            onFilterChange([]);
        } else {
            onFilterChange(filteredData);
        }
    }, [onFilterChange, sortedTestPacks, selectedTestPacks]), 50);

    React.useEffect(() => {
        debouncedFilterChange(filteredData);
    }, [filteredData, debouncedFilterChange]);

    const toggleTestPack = useCallback((testPack) => {
        setSelectedTestPacks(prev => ({
            ...prev,
            [testPack]: !prev[testPack]
        }));
    }, []);

    const toggleAllTestPacks = useCallback((value) => {
        const newState = Object.keys(sortedTestPacks).reduce((acc, testPack) => {
            acc[testPack] = value;
            return acc;
        }, {});
        setSelectedTestPacks(newState);
    }, [sortedTestPacks]);

    const invertTestPackSelection = useCallback(() => {
        setSelectedTestPacks(prev => {
            const invertedState = {};
            Object.keys(sortedTestPacks).forEach(testPack => {
                invertedState[testPack] = !prev[testPack];
            });
            return invertedState;
        });
    }, [sortedTestPacks]);

    const getTestPackColor = useCallback(() => {
        return '#28a745';
    }, []);

    const filteredTestPacks = useMemo(() => {
        if (!searchTerm) return sortedTestPacks;

        const filtered = {};
        Object.keys(sortedTestPacks).forEach((testPack) => {
            if (testPack.toLowerCase().includes(searchTerm.toLowerCase())) {
                filtered[testPack] = true;
            }
        });
        return filtered;
    }, [sortedTestPacks, searchTerm]);

    const memoizedButtons = useMemo(() =>
        Object.keys(filteredTestPacks).map((testPack) => {
            const isSelected = selectedTestPacks[testPack] || false;
            const color = getTestPackColor();

            return (
                <Button
                    key={testPack}
                    size="sm"
                    height="36px"
                    variant={isSelected ? "solid" : "outline"}
                    bg={isSelected ? color : "rgba(128, 128, 128, 0.3)"}
                    borderColor={isSelected ? color : "rgba(128, 128, 128, 0.5)"}
                    color={isSelected ? "white" : "black"}
                    onClick={() => toggleTestPack(testPack)}
                    mb={1}
                    _hover={{ bg: isSelected ? color : "rgba(128, 128, 128, 0.4)" }}
                >
                    <VStack spacing={0} align="center">
                        <Text fontSize="xs" fontWeight="bold" noOfLines={1}>
                            {testPack}
                        </Text>
                    </VStack>
                </Button>
            );
        }), [filteredTestPacks, selectedTestPacks, toggleTestPack, getTestPackColor]
    );

    if (!isVisible) return null;

    return (
        <ResizableDraggablePanel
            title="Instruments Test Pack Filter"
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
                    <Button size="xs" colorScheme="blue" onClick={() => toggleAllTestPacks(true)}>Select All</Button>
                    <Button size="xs" colorScheme="gray" onClick={() => toggleAllTestPacks(false)}>Clear All</Button>
                    <Button size="xs" colorScheme="teal" onClick={invertTestPackSelection}>Invert</Button>
                </HStack>

                <VStack spacing={2} align="stretch">
                    <Box>
                        <Text fontSize="xs" fontWeight="semibold" mb={1}>Search test packs:</Text>
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

export default React.memo(InstrumentsTestPackFilter);