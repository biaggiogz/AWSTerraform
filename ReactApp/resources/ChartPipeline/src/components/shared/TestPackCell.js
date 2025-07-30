import React from 'react';
import { Button, Text, HStack } from '@chakra-ui/react';

const TestPackCell = React.memo(({ testPacks, tp, onTestPackSelect, selectedTestPack }) => {
  // Handle single test pack (for DynamicInstrumentsTable)
  if (tp !== undefined) {
    if (!tp || tp === '') {
      return <Text fontSize="xs" color="gray.500">-</Text>;
    }

    return (
      <Button
        size="xs"
        variant={selectedTestPack === tp ? "solid" : "outline"}
        onClick={() => onTestPackSelect && onTestPackSelect(tp)}
        _hover={{ bg: selectedTestPack === tp ? "green.200" : "blue.200" }}
        fontSize="10px"
        fontWeight="medium"
        color={selectedTestPack === tp ? "white" : "blue.600"}
        bg={selectedTestPack === tp ? "green.500" : "white"}
        borderColor={selectedTestPack === tp ? "green.500" : "blue.500"}
        minWidth="30px"
        height="18px"
        px={2}
        borderRadius="sm"
      >
        {tp}
      </Button>
    );
  }

  // Handle multiple test packs (for DetailsInstrumentsTable and ControlInstrumentsByIsometric)
  if (!testPacks || testPacks.length === 0) {
    return <Text fontSize="xs" color="gray.500">NOT APPLY</Text>;
  }

  if (testPacks.length === 1) {
    return (
      <Button
        size="xs"
        variant={selectedTestPack === testPacks[0] ? "solid" : "outline"}
        onClick={() => onTestPackSelect && onTestPackSelect(testPacks[0])}
        _hover={{ bg: selectedTestPack === testPacks[0] ? "green.200" : "blue.200" }}
        fontSize="10px"
        fontWeight="medium"
        color={selectedTestPack === testPacks[0] ? "white" : "blue.600"}
        bg={selectedTestPack === testPacks[0] ? "green.500" : "white"}
        borderColor={selectedTestPack === testPacks[0] ? "green.500" : "blue.500"}
        minWidth="30px"
        height="18px"
        px={2}
        borderRadius="sm"
      >
        {testPacks[0]}
      </Button>
    );
  }

  return (
    <HStack spacing={1} wrap="wrap" justify="center">
      {testPacks.map((testPack, index) => (
        <Button
          key={`${testPack}-${index}`}
          size="xs"
          variant={selectedTestPack === testPack ? "solid" : "outline"}
          onClick={() => onTestPackSelect && onTestPackSelect(testPack)}
          _hover={{ bg: selectedTestPack === testPack ? "green.200" : "blue.200" }}
          fontSize="10px"
          fontWeight="medium"
          color={selectedTestPack === testPack ? "white" : "blue.600"}
          bg={selectedTestPack === testPack ? "green.500" : "white"}
          borderColor={selectedTestPack === testPack ? "green.500" : "blue.500"}
          minWidth="30px"
          height="18px"
          px={2}
          borderRadius="sm"
        >
          {testPack}
        </Button>
      ))}
    </HStack>
  );
});

export default TestPackCell;