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

const LazosTagLoopFilter = ({
    data,
    onFilterChange,
    isVisible,
    onClose,
    onBringToFront
}) => {
    const [topZIndex, setTopZIndex] = useState(100);
    const [selectedTagLoops, setSelectedTagLoops] = useState({});
    const [searchTerm, setSearchTerm] = useState('');

    const handleFilterBringToFront = () => {
        const newZIndex = topZIndex + 100;
        setTopZIndex(newZIndex + 1);
        return newZIndex;
    };

    const tagLoopValues = useMemo(() => {
        if (!data || data.length === 0) return {};

        const values = {};
        data.forEach(row => {
            if (row['TAG LOOP']) {
                values[row['TAG LOOP']] = true;
            }
        });

        return values;
    }, [data]);

    const sortedTagLoops = useMemo(() => {
        return Object.keys(tagLoopValues)
            .sort((a, b) => a.localeCompare(b))
            .reduce((obj, key) => {
                obj[key] = true;
                return obj;
            }, {});
    }, [tagLoopValues]);

    React.useEffect(() => {
        const tagLoopKeys = Object.keys(sortedTagLoops);
        if (tagLoopKeys.length > 0 && Object.keys(selectedTagLoops).length === 0) {
            const initialState = tagLoopKeys.reduce((acc, tagLoop) => {
                acc[tagLoop] = true;
                return acc;
            }, {});
            setSelectedTagLoops(initialState);
        }
    }, [sortedTagLoops]);

    const filteredData = useMemo(() => {
        if (!data || data.length === 0) return [];
        return data.filter(row => row['TAG LOOP'] && selectedTagLoops[row['TAG LOOP']]);
    }, [data, selectedTagLoops]);

    const debouncedFilterChange = useFilterDebounce(useCallback((filteredData) => {
        // Only call onFilterChange if there's actual filtering happening
        const allSelected = Object.keys(sortedTagLoops).every(key => selectedTagLoops[key]);
        if (allSelected) {
            onFilterChange([]); // Empty array means no filtering
        } else {
            onFilterChange(filteredData);
        }
    }, [onFilterChange, sortedTagLoops, selectedTagLoops]), 50);

    React.useEffect(() => {
        debouncedFilterChange(filteredData);
    }, [filteredData, debouncedFilterChange]);

    const toggleTagLoop = useCallback((tagLoop) => {
        setSelectedTagLoops(prev => ({
            ...prev,
            [tagLoop]: !prev[tagLoop]
        }));
    }, []);

    const toggleAllTagLoops = useCallback((value) => {
        const newState = Object.keys(sortedTagLoops).reduce((acc, tagLoop) => {
            acc[tagLoop] = value;
            return acc;
        }, {});
        setSelectedTagLoops(newState);
    }, [sortedTagLoops]);

    const invertTagLoopSelection = useCallback(() => {
        setSelectedTagLoops(prev => {
            const invertedState = {};
            Object.keys(sortedTagLoops).forEach(tagLoop => {
                invertedState[tagLoop] = !prev[tagLoop];
            });
            return invertedState;
        });
    }, [sortedTagLoops]);

    const getTagLoopColor = useCallback(() => {
        return '#007598';
    }, []);

    const filteredTagLoops = useMemo(() => {
        if (!searchTerm) return sortedTagLoops;

        const filtered = {};
        Object.keys(sortedTagLoops).forEach((tagLoop) => {
            if (tagLoop.toLowerCase().includes(searchTerm.toLowerCase())) {
                filtered[tagLoop] = true;
            }
        });
        return filtered;
    }, [sortedTagLoops, searchTerm]);

    const memoizedButtons = useMemo(() =>
        Object.keys(filteredTagLoops).map((tagLoop) => {
            const isSelected = selectedTagLoops[tagLoop] || false;
            const color = getTagLoopColor();

            return (
                <Button
                    key={tagLoop}
                    size="sm"
                    height="36px"
                    variant={isSelected ? "solid" : "outline"}
                    bg={isSelected ? color : "rgba(128, 128, 128, 0.3)"}
                    borderColor={isSelected ? color : "rgba(128, 128, 128, 0.5)"}
                    color={isSelected ? "white" : "black"}
                    onClick={() => toggleTagLoop(tagLoop)}
                    mb={1}
                    _hover={{ bg: isSelected ? color : "rgba(128, 128, 128, 0.4)" }}
                >
                    <VStack spacing={0} align="center">
                        <Text fontSize="xs" fontWeight="bold" noOfLines={1}>
                            {tagLoop}
                        </Text>
                    </VStack>
                </Button>
            );
        }), [filteredTagLoops, selectedTagLoops, toggleTagLoop, getTagLoopColor]
    );

    if (!isVisible) return null;

    return (
        <ResizableDraggablePanel
            title="Lazos TAG LOOP Filter"
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
                    <Button size="xs" colorScheme="blue" onClick={() => toggleAllTagLoops(true)}>Select All</Button>
                    <Button size="xs" colorScheme="gray" onClick={() => toggleAllTagLoops(false)}>Clear All</Button>
                    <Button size="xs" colorScheme="teal" onClick={invertTagLoopSelection}>Invert</Button>
                </HStack>

                <VStack spacing={2} align="stretch">
                    <Box>
                        <Text fontSize="xs" fontWeight="semibold" mb={1}>Search tag loops:</Text>
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

export default React.memo(LazosTagLoopFilter);