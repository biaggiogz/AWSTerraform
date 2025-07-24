import React, { useMemo, useState } from 'react';
import { Box, Text, HStack, VStack, Heading, Tooltip, Badge } from '@chakra-ui/react';
import { useReactTable, getCoreRowModel, flexRender } from '@tanstack/react-table';
import { FixedSizeList as List } from 'react-window';

const TPBySubsystemTable = ({ data, selectedSubsystem, isProgressFilterVisible }) => {
  // Group TPs by subsystem
  const subsystemTPs = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    // Create a map of subsystems to their TPs
    const subsystemMap = new Map();
    
    data.forEach(row => {
      if (!row.subsystem || !row.list_includes_tp_id) return;
      
      const subsystem = row.subsystem;
      const tpIdsRaw = row.list_includes_tp_id;
      const progressRaw = row.list_id_tp_total_progress || '';
      
      // Parse TP IDs and progress values
      const tpIds = typeof tpIdsRaw === 'string' ? tpIdsRaw.split('|') : [];
      const progressValues = typeof progressRaw === 'string' 
        ? progressRaw.split('|').map(p => parseFloat(p) || 0)
        : [];
      
      // Create TP objects with ID and progress
      const tps = tpIds.map((id, idx) => ({
        id,
        progress: progressValues[idx] || 0,
        progressPercent: Math.round((progressValues[idx] || 0) * 100)
      }));
      
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
    if (!selectedSubsystem) return subsystemTPs;
    return subsystemTPs.filter(item => item.subsystem === selectedSubsystem);
  }, [subsystemTPs, selectedSubsystem]);
  
  // Apply progress filter if active
  const filteredByProgress = useMemo(() => {
    if (!isProgressFilterVisible || !window.progressFilterState?.filteredData?.length) {
      return filteredSubsystems;
    }
    
    const filteredTPs = window.progressFilterState.filteredData.map(item => item.testPack);
    
    return filteredSubsystems.map(subsystem => ({
      ...subsystem,
      tps: subsystem.tps.filter(tp => filteredTPs.includes(tp.id))
    })).filter(subsystem => subsystem.tps.length > 0);
  }, [filteredSubsystems, isProgressFilterVisible]);
  
  // Get progress color based on value
  const getProgressColor = (progress) => {
    if (progress >= 1) return '#437057';
    if (progress >= 0.9) return '#97B067';
    return '#E86A33';
  };
  
  // Row renderer for virtualized list
  const Row = ({ index, style }) => {
    const subsystem = filteredByProgress[index];
    
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
              {subsystem.tps.map(tp => (
                <Tooltip key={tp.id} label={`${tp.id} - ${tp.progressPercent}%`} hasArrow>
                  <Box
                    px={2}
                    py={1}
                    bg={getProgressColor(tp.progress)}
                    color="white"
                    borderRadius="md"
                    fontSize="xs"
                    fontWeight="medium"
                    mb={1}
                    mr={1}
                  >
                    {tp.id} ({tp.progressPercent}%)
                  </Box>
                </Tooltip>
              ))}
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