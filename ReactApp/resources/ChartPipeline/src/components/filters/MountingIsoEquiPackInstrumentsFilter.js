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

const MountingIsoEquiPackInstrumentsFilter = ({
    data,
    onFilterChange,
    isVisible,
    onClose,
    onBringToFront
}) => {
    const [topZIndex, setTopZIndex] = useState(100);
    const [selectedCategories, setSelectedCategories] = useState({});
    const [selectedMountingValues, setSelectedMountingValues] = useState({});
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState(null);

    const handleFilterBringToFront = () => {
        const newZIndex = topZIndex + 100;
        setTopZIndex(newZIndex + 1);
        return newZIndex;
    };

    // Extract categories from ON column
    const categoryValues = useMemo(() => {
        if (!data || data.length === 0) return {};

        const values = {};
        data.forEach(row => {
            if (row.ON && row.ON !== '') {
                values[row.ON] = true;
            }
        });

        return values;
    }, [data]);

    const sortedCategories = useMemo(() => {
        return Object.keys(categoryValues)
            .sort((a, b) => a.localeCompare(b))
            .reduce((obj, key) => {
                obj[key] = true;
                return obj;
            }, {});
    }, [categoryValues]);

    // Get mounting values for selected categories
    const mountingValues = useMemo(() => {
        if (!data || data.length === 0) return {};

        const values = {};
        data.forEach(row => {
            if (row.ON && selectedCategories[row.ON] && row['MOUNTING ON ISO/EQUI/PACK']) {
                values[row['MOUNTING ON ISO/EQUI/PACK']] = true;
            }
        });

        return values;
    }, [data, selectedCategories]);

    const sortedMountingValues = useMemo(() => {
        return Object.keys(mountingValues)
            .sort((a, b) => a.localeCompare(b))
            .reduce((obj, key) => {
                obj[key] = true;
                return obj;
            }, {});
    }, [mountingValues]);

    React.useEffect(() => {
        const categoryKeys = Object.keys(sortedCategories);
        if (categoryKeys.length > 0 && Object.keys(selectedCategories).length === 0) {
            const initialState = categoryKeys.reduce((acc, category) => {
                acc[category] = true;
                return acc;
            }, {});
            setSelectedCategories(initialState);
        }
    }, [sortedCategories]);

    React.useEffect(() => {
        const mountingKeys = Object.keys(sortedMountingValues);
        if (mountingKeys.length > 0) {
            const initialState = mountingKeys.reduce((acc, mounting) => {
                acc[mounting] = true;
                return acc;
            }, {});
            setSelectedMountingValues(initialState);
        }
    }, [sortedMountingValues]);

    const filteredData = useMemo(() => {
        if (!data || data.length === 0) return [];
        return data.filter(row => {
            // Filter by category (ON column)
            if (row.ON && !selectedCategories[row.ON]) return false;
            // Filter by mounting value
            if (row['MOUNTING ON ISO/EQUI/PACK'] && !selectedMountingValues[row['MOUNTING ON ISO/EQUI/PACK']]) return false;
            return true;
        });
    }, [data, selectedCategories, selectedMountingValues]);

    const debouncedFilterChange = useFilterDebounce(useCallback((filteredData) => {
        const allCategoriesSelected = Object.keys(sortedCategories).every(key => selectedCategories[key]);
        const allMountingSelected = Object.keys(sortedMountingValues).every(key => selectedMountingValues[key]);
        if (allCategoriesSelected && allMountingSelected) {
            onFilterChange([]);
        } else {
            onFilterChange(filteredData);
        }
    }, [onFilterChange, sortedCategories, sortedMountingValues, selectedCategories, selectedMountingValues]), 50);

    React.useEffect(() => {
        debouncedFilterChange(filteredData);
    }, [filteredData, debouncedFilterChange]);

    const toggleCategory = useCallback((category) => {
        setSelectedCategories(prev => ({
            ...prev,
            [category]: !prev[category]
        }));
    }, []);

    const toggleMountingValue = useCallback((mounting) => {
        setSelectedMountingValues(prev => ({
            ...prev,
            [mounting]: !prev[mounting]
        }));
    }, []);

    const toggleAllCategories = useCallback((value) => {
        const newState = Object.keys(sortedCategories).reduce((acc, category) => {
            acc[category] = value;
            return acc;
        }, {});
        setSelectedCategories(newState);
    }, [sortedCategories]);

    const toggleAllMountingValues = useCallback((value) => {
        const newState = Object.keys(sortedMountingValues).reduce((acc, mounting) => {
            acc[mounting] = value;
            return acc;
        }, {});
        setSelectedMountingValues(newState);
    }, [sortedMountingValues]);

    const getCategoryColor = useCallback(() => {
        return '#007598';
    }, []);

    const getMountingColor = useCallback(() => {
        return '#113F67';
    }, []);

    const filteredCategories = useMemo(() => {
        if (!searchTerm) return sortedCategories;

        const filtered = {};
        Object.keys(sortedCategories).forEach((category) => {
            if (category.toLowerCase().includes(searchTerm.toLowerCase())) {
                filtered[category] = true;
            }
        });
        return filtered;
    }, [sortedCategories, searchTerm]);

    const filteredMountingValues = useMemo(() => {
        if (!searchTerm) return sortedMountingValues;

        const filtered = {};
        Object.keys(sortedMountingValues).forEach((mounting) => {
            if (mounting.toLowerCase().includes(searchTerm.toLowerCase())) {
                filtered[mounting] = true;
            }
        });
        return filtered;
    }, [sortedMountingValues, searchTerm]);

    if (!isVisible) return null;

    return (
        <ResizableDraggablePanel
            title="Mounting ISO/EQUI/PACK Filter"
            initialWidth={450}
            initialHeight={700}
            initialX={1690}
            initialY={230}
            minWidth={400}
            minHeight={500}
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

                <VStack spacing={2} align="stretch">
                    <Box>
                        <Text fontSize="xs" fontWeight="semibold" mb={1}>Search:</Text>
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

                {/* Categories Section */}
                <VStack spacing={2} align="stretch">
                    <Text fontSize="sm" fontWeight="bold" color="purple.600">Categories (ON)</Text>
                    <HStack spacing={2}>
                        <Button size="xs" colorScheme="blue" onClick={() => toggleAllCategories(true)}>Select All</Button>
                        <Button size="xs" colorScheme="gray" onClick={() => toggleAllCategories(false)}>Clear All</Button>
                    </HStack>
                    <Box maxHeight="150px" overflowY="auto">
                        <SimpleGrid columns={2} spacing={2}>
                            {Object.keys(filteredCategories).map((category) => {
                                const isSelected = selectedCategories[category] || false;
                                const color = getCategoryColor();

                                return (
                                    <Button
                                        key={category}
                                        size="sm"
                                        height="36px"
                                        variant={isSelected ? "solid" : "outline"}
                                        bg={isSelected ? color : "rgba(128, 128, 128, 0.3)"}
                                        borderColor={isSelected ? color : "rgba(128, 128, 128, 0.5)"}
                                        color={isSelected ? "white" : "black"}
                                        onClick={() => toggleCategory(category)}
                                        mb={1}
                                        _hover={{ bg: isSelected ? color : "rgba(128, 128, 128, 0.4)" }}
                                    >
                                        <Text fontSize="xs" fontWeight="bold" noOfLines={1}>
                                            {category}
                                        </Text>
                                    </Button>
                                );
                            })}
                        </SimpleGrid>
                    </Box>
                </VStack>

                <Divider />

                {/* Mounting Values Section */}
                <VStack spacing={2} align="stretch" flex="1">
                    <Text fontSize="sm" fontWeight="bold" color="green.600">Mounting Values</Text>
                    <HStack spacing={2}>
                        <Button size="xs" colorScheme="blue" onClick={() => toggleAllMountingValues(true)}>Select All</Button>
                        <Button size="xs" colorScheme="gray" onClick={() => toggleAllMountingValues(false)}>Clear All</Button>
                    </HStack>
                    <Box overflowY="auto" flex="1">
                        <SimpleGrid columns={2} spacing={2}>
                            {Object.keys(filteredMountingValues).map((mounting) => {
                                const isSelected = selectedMountingValues[mounting] || false;
                                const color = getMountingColor();

                                return (
                                    <Button
                                        key={mounting}
                                        size="sm"
                                        height="36px"
                                        variant={isSelected ? "solid" : "outline"}
                                        bg={isSelected ? color : "rgba(128, 128, 128, 0.3)"}
                                        borderColor={isSelected ? color : "rgba(128, 128, 128, 0.5)"}
                                        color={isSelected ? "white" : "black"}
                                        onClick={() => toggleMountingValue(mounting)}
                                        mb={1}
                                        _hover={{ bg: isSelected ? color : "rgba(128, 128, 128, 0.4)" }}
                                    >
                                        <Text fontSize="xs" fontWeight="bold" noOfLines={1}>
                                            {mounting}
                                        </Text>
                                    </Button>
                                );
                            })}
                        </SimpleGrid>
                    </Box>
                </VStack>
            </VStack>
        </ResizableDraggablePanel>
    );
};

export default React.memo(MountingIsoEquiPackInstrumentsFilter);