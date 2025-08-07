import React from 'react';
import { Button, Text, HStack, VStack, Badge } from '@chakra-ui/react';

const TestPackCell = React.memo(({ testPacks, tp, onTestPackSelect, selectedTestPack }) => {
  // Handle single test pack (for DynamicInstrumentsTable)
  if (tp !== undefined) {
    if (!tp || tp === '') {
      return <Text fontSize="xs" color="gray.500">-</Text>;
    }

    return (
      <Badge
        size="sm"
        colorScheme="blue"
        fontSize="10px"
        px={2}
        py={1}
        borderRadius="sm"
      >
        {tp}
      </Badge>
    );
  }

  // Handle multiple test packs (for DetailsInstrumentsTable and ControlInstrumentsByIsometric)
  if (!testPacks || testPacks.length === 0) {
    return <Text fontSize="xs" color="gray.500">NOT APPLY</Text>;
  }

  if (testPacks.length === 1) {
    return (
      <Badge
        size="sm"
        colorScheme="blue"
        fontSize="10px"
        px={2}
        py={1}
        borderRadius="sm"
      >
        {testPacks[0]}
      </Badge>
    );
  }

  return (
    <VStack spacing={1} align="center">
      {testPacks.map((testPack, index) => (
        <Badge
          key={`${testPack}-${index}`}
          size="sm"
          colorScheme="blue"
          fontSize="10px"
          px={2}
          py={1}
          borderRadius="sm"
        >
          {testPack}
        </Badge>
      ))}
    </VStack>
  );
});

export default TestPackCell;