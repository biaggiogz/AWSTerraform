import React from 'react';
import { Button, Text } from '@chakra-ui/react';

const SubsystemCell = React.memo(({ subsystem, onSubsystemSelect, selectedSubsystem }) => {
  if (!subsystem || subsystem === '') {
    return <Text fontSize="xs" color="gray.500">-</Text>;
  }

  return (
    <Button
      size="xs"
      variant={selectedSubsystem === subsystem ? "solid" : "outline"}
      onClick={() => onSubsystemSelect && onSubsystemSelect(subsystem)}
      _hover={{ bg: selectedSubsystem === subsystem ? "green.200" : "blue.200" }}
      fontSize="10px"
      fontWeight="medium"
      color={selectedSubsystem === subsystem ? "white" : "blue.600"}
      bg={selectedSubsystem === subsystem ? "green.500" : "white"}
      borderColor={selectedSubsystem === subsystem ? "green.500" : "blue.500"}
      minWidth="30px"
      height="18px"
      px={2}
      borderRadius="sm"
    >
      {subsystem}
    </Button>
  );
});

export default SubsystemCell;