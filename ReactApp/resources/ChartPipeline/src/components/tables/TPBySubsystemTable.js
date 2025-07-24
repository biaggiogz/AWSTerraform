import React, { useMemo, useState } from 'react';
import { Box, Text, HStack, VStack, Heading, Tooltip, Badge } from '@chakra-ui/react';
import { useReactTable, getCoreRowModel, flexRender } from '@tanstack/react-table';
import { FixedSizeList as List } from 'react-window';

const TPBySubsystemTable = ({ data, selectedSubsystem, isProgressFilterVisible }) => {
  // Add debug logging for data
  React.useEffect(() => {
    if (data && data.length > 0) {
      // Log a sample row to see the structure
      const sampleRow = data.find(row => {
        return row.list_includes_tp_id && 
               typeof row.list_includes_tp_id === 'string' && 
               !row.list_includes_tp_id.includes('|');
      });
      if (sampleRow) {
        console.log('Sample row with single TP ID:', {
          subsystem: sampleRow.subsystem,
          tpId: sampleRow.list_includes_tp_id,
          progress: sampleRow.list_id_tp_total_progress
        });
      }
    }
  }, [data]);
  
  // Group TPs by subsystem
  const subsystemTPs = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    // Create a map of subsystems to their TPs
    const subsystemMap = new Map();
    
    data.forEach(row => {
      if (!row.subsystem) return;
      
      // Skip rows without TP IDs, but log them for debugging
      if (!row.list_includes_tp_id) {
        console.log(`Skipping row for subsystem ${row.subsystem} - no TP ID`);
        return;
      }
      
      const subsystem = row.subsystem;
      const tpIdsRaw = row.list_includes_tp_id;
      const progressRaw = row.list_id_tp_total_progress || '';
      
      // Parse TP IDs and progress values
      // Handle both single values and pipe-separated lists
      let tpIds = [];
      if (typeof tpIdsRaw === 'string') {
        // Check if it contains a pipe character
        tpIds = tpIdsRaw.includes('|') ? tpIdsRaw.split('|') : [tpIdsRaw];
      } else if (tpIdsRaw !== undefined && tpIdsRaw !== null) {
        // Handle non-string values (like numbers)
        tpIds = [String(tpIdsRaw)];
      }
      
      // Debug log the raw TP ID value
      console.log(`TP ID for ${subsystem}:`, {
        raw: tpIdsRaw,
        type: typeof tpIdsRaw,
        parsed: tpIds
      });
      
      // Similarly handle progress values
      let progressValues = [];
      if (typeof progressRaw === 'string') {
        // Check if it contains a pipe character
        try {
          progressValues = progressRaw.includes('|') 
            ? progressRaw.split('|').map(p => parseFloat(p) || 0)
            : [parseFloat(progressRaw) || 0];
        } catch (error) {
          console.error(`Error parsing progress for ${subsystem}:`, error);
          progressValues = [0]; // Default to 0 if parsing fails
        }
      } else if (progressRaw !== undefined && progressRaw !== null) {
        // Handle non-string values
        progressValues = [parseFloat(progressRaw) || 0];
      }
      
      // Create TP objects with ID and progress
      const tps = tpIds.map((id, idx) => {
        // Make sure we have a valid progress value
        const progress = idx < progressValues.length ? progressValues[idx] : 0;
        // Store both the decimal progress (0-1) and percentage (0-100)
        return {
          id,
          progress,
          progressPercent: Math.round(progress * 100)
        };
      });
      
      // Debug log for single TP subsystems
      if (tps.length === 1) {
        console.log(`Single TP for subsystem ${subsystem}:`, {
          tpId: tps[0].id,
          progress: tps[0].progress,
          progressPercent: tps[0].progressPercent
        });
      }
      
      if (!subsystemMap.has(subsystem)) {
        subsystemMap.set(subsystem, {
          subsystem,
          tps: tps,
          avgProgress: tps.length > 0 
            ? tps.reduce((sum, tp) => sum + tp.progress, 0) / tps.length
            : 0
        });
      } else {
        // Merge TPs if subsystem already exists
        const existing = subsystemMap.get(subsystem);
        existing.tps = [...existing.tps, ...tps];
        existing.avgProgress = existing.tps.length > 0 
          ? existing.tps.reduce((sum, tp) => sum + tp.progress, 0) / existing.tps.length
          : 0;
      }
    });
    
    // Convert map to array and sort by subsystem name
    return Array.from(subsystemMap.values())
      .sort((a, b) => a.subsystem.localeCompare(b.subsystem));
  }, [data]);
  
  // Filter by selected subsystem if any
  const filteredSubsystems = useMemo(() => {
    // Log the total number of subsystems with TPs
    console.log(`Total subsystems with TPs: ${subsystemTPs.length}`);
    if (subsystemTPs.length > 0) {
      // Log a sample subsystem
      console.log('Sample subsystem:', subsystemTPs[0]);
    }
    
    if (!selectedSubsystem) return subsystemTPs;
    return subsystemTPs.filter(item => item.subsystem === selectedSubsystem);
  }, [subsystemTPs, selectedSubsystem]);
  
  // Track if the filter is actually visible and active
  const [filterActive, setFilterActive] = React.useState(false);
  
  // Update filter active state when visibility changes
  React.useEffect(() => {
    if (!isProgressFilterVisible) {
      setFilterActive(false);
    } else {
      // Make filter active immediately to be more responsive
      setFilterActive(true);
    }
  }, [isProgressFilterVisible]);
  
  // Force re-render when window.progressFilterState changes
  React.useEffect(() => {
    const checkFilterState = () => {
      if (window.progressFilterState) {
        // Force re-render by updating state
        setFilterActive(window.progressFilterState.hasUserSelection);
      }
    };
    
    // Check initially
    checkFilterState();
    
    // Set up interval to check for changes
    const intervalId = setInterval(checkFilterState, 300);
    
    return () => clearInterval(intervalId);
  }, []);
  
  // Add debug logging to help diagnose issues
  React.useEffect(() => {
    if (isProgressFilterVisible && window.progressFilterState?.filteredData) {
      console.log('Progress filter state:', {
        hasUserSelection: window.progressFilterState.hasUserSelection,
        filteredDataLength: window.progressFilterState.filteredData.length,
        sampleItem: window.progressFilterState.filteredData[0],
      });
    }
  }, [isProgressFilterVisible]);
  
  // Apply progress filter only when user has made specific selections
  const filteredByProgress = useMemo(() => {
    // Only apply filtering if:
    // 1. The filter is visible
    // 2. The filter has been active for a moment (not just opened)
    // 3. The user has made specific selections
    if (!isProgressFilterVisible || !filterActive || !window.progressFilterState?.hasUserSelection) {
      console.log('Not filtering: filter not active or no user selection');
      return filteredSubsystems;
    }
    
    // Get selected TPs directly from the global state
    const selectedTPs = window.progressFilterState?.selectedTPs || [];
    
    // If there are no selected TPs, don't filter the data
    if (!selectedTPs.length) {
      console.log('Not filtering: no selected TPs');
      return filteredSubsystems;
    }
    
    console.log('Selected TPs:', selectedTPs.slice(0, 5), '...', selectedTPs.length, 'total');
    
    // Filter subsystems to only include those with selected TPs
    const filteredSubsystemsWithSelectedTPs = filteredSubsystems
      .map(subsystem => {
        // Mark TPs as selected or not based on filter
        const updatedTPs = subsystem.tps.map(tp => {
          // Convert both to strings for comparison
          const isSelected = selectedTPs.some(selectedTp => String(selectedTp) === String(tp.id));
          return {
            ...tp,
            isSelected
          };
        });
        
        // Only include TPs that are selected
        const selectedTPsOnly = updatedTPs.filter(tp => tp.isSelected);
        
        return {
          ...subsystem,
          tps: selectedTPsOnly,
          // Only include subsystems that have at least one selected TP
          hasSelectedTPs: selectedTPsOnly.length > 0
        };
      })
      .filter(subsystem => subsystem.hasSelectedTPs);
    
    return filteredSubsystemsWithSelectedTPs;
  }, [filteredSubsystems, isProgressFilterVisible, filterActive]);
  
  // Get progress color based on value - matching ProgressFilter.js
  const getProgressColor = (progress) => {
    if (progress >= 100) return '#437057'; // Done 100%
    if (progress >= 90 && progress < 100) return '#97B067'; // From 90% to 99%
    return '#E86A33'; // Below 90%
  };
  
  // Row renderer for virtualized list
  const Row = ({ index, style }) => {
    const subsystem = filteredByProgress[index];
    const hasActiveFilter = isProgressFilterVisible && filterActive && window.progressFilterState?.hasUserSelection;
    
    return (
      <Box 
        style={style} 
        p={2} 
        borderBottom="1px solid" 
        borderColor="gray.200"
        bg={index % 2 === 0 ? "white" : "gray.50"}
        borderLeft="4px solid"
        borderLeftColor="blue.500"
      >
        <VStack align="stretch" spacing={2}>
          <HStack justify="space-between">
            <Heading size="xs" color="#007598">{subsystem.subsystem}</Heading>
            <Badge 
              bg={getProgressColor(Math.round(subsystem.avgProgress * 100))}
              color="white"
              fontSize="xs"
            >
              {Math.round(subsystem.avgProgress * 100)}% Avg
            </Badge>
          </HStack>
          
          <Box>
            <HStack spacing={1} flexWrap="wrap">
              {subsystem.tps.map(tp => {
                const bgColor = getProgressColor(tp.progressPercent);
                
                return (
                  <Tooltip key={tp.id} label={`${tp.id} - ${tp.progressPercent}%`} hasArrow>
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
                      transform="scale(1.05)"
                      boxShadow="0 0 0 2px white, 0 0 0 4px blue.500"
                      border="2px solid"
                      borderColor="blue.500"
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
        TEST PACKS BY SUBSYSTEM
      </Box>
      
      {filteredByProgress.length > 0 ? (
        <List
          height={550}
          itemCount={filteredByProgress.length}
          itemSize={100}
          width="100%"
        >
          {Row}
        </List>
      ) : (
        <Box p={4} textAlign="center" color="gray.500">
          <Text>No test packs available</Text>
        </Box>
      )}
    </Box>
  );
};

export default TPBySubsystemTable;