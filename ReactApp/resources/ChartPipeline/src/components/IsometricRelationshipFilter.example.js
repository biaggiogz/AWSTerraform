import React from 'react';
import { Box, VStack } from '@chakra-ui/react';
import { useIsometricRelationshipFilter } from './IsometricRelationshipFilter.optimized';
import ControlInstrumentsTable from './ControlInstrumentsTable.optimized';
import DetailsInstrumentsTable from './DetailsInstrumentsTable.optimized';
import IsometricRelationshipPanel from './IsometricRelationshipPanel.optimized';

/**
 * Example usage of IsometricRelationshipFilter
 * This demonstrates how to integrate the bidirectional filtering system
 */
const IsometricRelationshipFilterExample = ({ controlData, detailData }) => {
  // Initialize the isometric relationship filter
  const {
    selectedIsometric,
    filteredControlData,
    filteredDetailData,
    highlightedControlRecords,
    highlightedDetailRecords,
    matchingChains,
    relationshipStats,
    onIsometricSelect,
    onClearFilter,
    onChainSelect,
    selectedChainIndex
  } = useIsometricRelationshipFilter(controlData, detailData);

  return (
    <VStack spacing={4} align="stretch">
      {/* Relationship Status Panel */}
      <IsometricRelationshipPanel
        selectedIsometric={selectedIsometric}
        matchingChains={matchingChains}
        relationshipStats={relationshipStats}
        onClearFilter={onClearFilter}
        onChainSelect={onChainSelect}
        selectedChainIndex={selectedChainIndex}
      />

      {/* Control Instruments Table with bidirectional filtering */}
      <ControlInstrumentsTable
        data={filteredControlData}
        selectedIsometric={selectedIsometric}
        onIsometricClick={onIsometricSelect}
        highlightedRecords={highlightedControlRecords}
      />

      {/* Details Instruments Table with bidirectional filtering */}
      <DetailsInstrumentsTable
        data={filteredDetailData}
        selectedIsometric={selectedIsometric}
        onMountingLocationClick={onIsometricSelect}
        highlightedRecords={highlightedDetailRecords}
      />
    </VStack>
  );
};

/**
 * Alternative usage with Context Provider pattern
 */
import { IsometricRelationshipProvider, useIsometricRelationshipContext } from './IsometricRelationshipFilter.optimized';

const TablesWithContext = () => {
  const {
    selectedIsometric,
    filteredControlData,
    filteredDetailData,
    highlightedControlRecords,
    highlightedDetailRecords,
    onIsometricSelect
  } = useIsometricRelationshipContext();

  return (
    <VStack spacing={4} align="stretch">
      <ControlInstrumentsTable
        data={filteredControlData}
        selectedIsometric={selectedIsometric}
        onIsometricClick={onIsometricSelect}
        highlightedRecords={highlightedControlRecords}
      />
      <DetailsInstrumentsTable
        data={filteredDetailData}
        selectedIsometric={selectedIsometric}
        onMountingLocationClick={onIsometricSelect}
        highlightedRecords={highlightedDetailRecords}
      />
    </VStack>
  );
};

const IsometricRelationshipFilterContextExample = ({ controlData, detailData }) => {
  return (
    <IsometricRelationshipProvider controlData={controlData} detailData={detailData}>
      <TablesWithContext />
    </IsometricRelationshipProvider>
  );
};

export { 
  IsometricRelationshipFilterExample, 
  IsometricRelationshipFilterContextExample 
};