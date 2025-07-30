import React from 'react';
import { Box, Text } from '@chakra-ui/react';

const TestPackProgressCell = React.memo(({ testPacks, progressValues }) => {
  if (!testPacks || testPacks.length === 0) {
    return <Text fontSize="xs" color="gray.500">NOT APPLY</Text>;
  }
  
  // Get progress values for each test pack
  const progressData = testPacks.map((_, index) => {
    const progressKey = `progress_ac_tp_${index + 1}`;
    return progressValues && progressValues[progressKey] ? progressValues[progressKey] : 0;
  });
  
  if (testPacks.length === 1) {
    const progress = progressData[0];
    const percentage = Math.round(progress * 100);
    
    return (
      <Box position="relative" width="100%" height="18px">
        <Box 
          height="18px" 
          width={`${percentage}%`} 
          bg="green.500"
          borderRadius="sm"
        />
        <Text 
          fontSize="10px" 
          position="absolute" 
          top="0" 
          left="0" 
          right="0" 
          height="18px"
          display="flex"
          alignItems="center"
          justifyContent="center"
          color="white"
          fontWeight="bold"
          textShadow="0px 0px 2px rgba(0,0,0,0.7)"
        >
          {percentage}%
        </Text>
      </Box>
    );
  }
  
  return (
    <Box>
      {testPacks.map((testPack, index) => {
        const progress = progressData[index] || 0;
        const percentage = Math.round(progress * 100);
        
        return (
          <Box key={`${testPack}-progress-${index}`} position="relative" width="100%" height="18px" mb={1}>
            <Box 
              height="18px" 
              width={`${percentage}%`} 
              bg="green.500"
              borderRadius="sm"
            />
            <Text 
              fontSize="10px" 
              position="absolute" 
              top="0" 
              left="0" 
              right="0" 
              height="18px"
              display="flex"
              alignItems="center"
              justifyContent="center"
              color="white"
              fontWeight="bold"
              textShadow="0px 0px 2px rgba(0,0,0,0.7)"
            >
              {percentage}%
            </Text>
          </Box>
        );
      })}
    </Box>
  );
});

export default TestPackProgressCell;