import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Alert,
  AlertIcon,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Icon,
  Tooltip,
  Progress
} from '@chakra-ui/react';
import { WarningIcon, CheckCircleIcon, InfoIcon, SmallAddIcon } from '@chakra-ui/icons';

const MLEnhancementPanel = ({ anomalyResults, validationResults, nullPredictions, mlConfidence }) => {
  const totalIssues = anomalyResults.length + validationResults.filter(v => !v.is_valid).length;
  const totalPredictions = nullPredictions.length;

  if (totalIssues === 0 && totalPredictions === 0) {
    return (
      <Box p={4} bg="gray.50" borderRadius="md" h="full">
        <VStack spacing={4} align="stretch">
          <Text fontSize="lg" fontWeight="bold" textAlign="center">
            ML ENHANCEMENT
          </Text>
          
          <Alert status="success" borderRadius="md">
            <AlertIcon />
            <VStack align="start" spacing={1}>
              <Text fontSize="sm" fontWeight="semibold">AI Validation Complete</Text>
              <Text fontSize="xs">No anomalies or issues detected</Text>
            </VStack>
          </Alert>

          <Box p={3} bg="green.50" borderRadius="md" textAlign="center">
            <Icon as={CheckCircleIcon} color="green.500" boxSize={8} mb={2} />
            <Text fontSize="sm" color="green.700" fontWeight="medium">
              ML Confidence: {(mlConfidence * 100).toFixed(1)}%
            </Text>
            <Text fontSize="xs" color="green.600">
              Data patterns validated
            </Text>
          </Box>
        </VStack>
      </Box>
    );
  }

  return (
    <Box p={4} bg="gray.50" borderRadius="md" h="full" overflowY="auto">
      <VStack spacing={4} align="stretch">
        <Text fontSize="lg" fontWeight="bold" textAlign="center">
          ML ENHANCEMENT
        </Text>

        {/* ML Summary */}
        <Box p={3} bg="white" borderRadius="md" borderWidth="1px">
          <Text fontSize="sm" fontWeight="semibold" mb={2}>AI Analysis Summary</Text>
          <HStack spacing={4} justify="space-around">
            <VStack spacing={1}>
              <Text fontSize="lg" fontWeight="bold" color="orange.500">
                {anomalyResults.length}
              </Text>
              <Text fontSize="xs" color="gray.600">Anomalies</Text>
            </VStack>
            <VStack spacing={1}>
              <Text fontSize="lg" fontWeight="bold" color="blue.500">
                {validationResults.filter(v => !v.is_valid).length}
              </Text>
              <Text fontSize="xs" color="gray.600">Validations</Text>
            </VStack>
            <VStack spacing={1}>
              <Text fontSize="lg" fontWeight="bold" color="green.500">
                {nullPredictions.length}
              </Text>
              <Text fontSize="xs" color="gray.600">Predictions</Text>
            </VStack>
          </HStack>
        </Box>

        {/* Anomaly Detection Results */}
        {anomalyResults.length > 0 && (
          <Box>
            <Text fontSize="md" fontWeight="semibold" mb={3}>🔍 Anomaly Detection</Text>
            <Accordion allowMultiple size="sm">
              {anomalyResults.map((anomaly, index) => (
                <AccordionItem key={index}>
                  <AccordionButton py={2}>
                    <Box flex="1" textAlign="left">
                      <HStack justify="space-between">
                        <Text fontSize="sm" fontWeight="medium">Row {anomaly.row_index + 1}</Text>
                        <Badge colorScheme="orange" variant="solid">
                          {(anomaly.anomaly_score * 100).toFixed(1)}% anomaly
                        </Badge>
                      </HStack>
                    </Box>
                    <AccordionIcon />
                  </AccordionButton>
                  <AccordionPanel pb={4}>
                    <Box p={3} bg="orange.50" borderRadius="md" borderLeft="4px solid" borderColor="orange.400">
                      <VStack spacing={2} align="stretch">
                        <HStack spacing={2}>
                          <Icon as={WarningIcon} color="orange.500" boxSize={4} />
                          <Text fontSize="sm" fontWeight="semibold" color="orange.700">
                            Anomaly Detected
                          </Text>
                        </HStack>
                        <Text fontSize="sm" color="orange.700">
                          {anomaly.explanation}
                        </Text>
                        <Progress 
                          value={anomaly.anomaly_score * 100} 
                          size="sm" 
                          colorScheme="orange"
                        />
                      </VStack>
                    </Box>
                  </AccordionPanel>
                </AccordionItem>
              ))}
            </Accordion>
          </Box>
        )}

        {/* Context Validation Results */}
        {validationResults.filter(v => !v.is_valid).length > 0 && (
          <Box>
            <Text fontSize="md" fontWeight="semibold" mb={3}>🔗 Context Validation</Text>
            <Accordion allowMultiple size="sm">
              {validationResults.filter(v => !v.is_valid).map((validation, index) => (
                <AccordionItem key={index}>
                  <AccordionButton py={2}>
                    <Box flex="1" textAlign="left">
                      <HStack justify="space-between">
                        <Text fontSize="sm" fontWeight="medium">{validation.column}</Text>
                        <Badge colorScheme="blue" variant="solid">
                          {(validation.confidence * 100).toFixed(0)}% confidence
                        </Badge>
                      </HStack>
                    </Box>
                    <AccordionIcon />
                  </AccordionButton>
                  <AccordionPanel pb={4}>
                    <Box p={3} bg="blue.50" borderRadius="md" borderLeft="4px solid" borderColor="blue.400">
                      <VStack spacing={2} align="stretch">
                        <HStack spacing={2}>
                          <Icon as={InfoIcon} color="blue.500" boxSize={4} />
                          <Text fontSize="sm" fontWeight="semibold" color="blue.700">
                            Validation Issue - Row {validation.row_index + 1}
                          </Text>
                        </HStack>
                        {validation.suggested_value && (
                          <Box>
                            <Text fontSize="xs" color="blue.600" fontWeight="semibold" mb={1}>
                              AI Suggested Value:
                            </Text>
                            <Badge variant="outline" colorScheme="blue" fontSize="xs">
                              {validation.suggested_value}
                            </Badge>
                          </Box>
                        )}
                        <Progress 
                          value={validation.confidence * 100} 
                          size="sm" 
                          colorScheme="blue"
                        />
                      </VStack>
                    </Box>
                  </AccordionPanel>
                </AccordionItem>
              ))}
            </Accordion>
          </Box>
        )}

        {/* Smart Null Predictions */}
        {nullPredictions.length > 0 && (
          <Box>
            <Text fontSize="md" fontWeight="semibold" mb={3}>🤖 Smart Predictions</Text>
            <Accordion allowMultiple size="sm">
              {nullPredictions.map((prediction, index) => (
                <AccordionItem key={index}>
                  <AccordionButton py={2}>
                    <Box flex="1" textAlign="left">
                      <HStack justify="space-between">
                        <Text fontSize="sm" fontWeight="medium">{prediction.column}</Text>
                        <Badge colorScheme="green" variant="solid">
                          {(prediction.confidence * 100).toFixed(0)}% confidence
                        </Badge>
                      </HStack>
                    </Box>
                    <AccordionIcon />
                  </AccordionButton>
                  <AccordionPanel pb={4}>
                    <Box p={3} bg="green.50" borderRadius="md" borderLeft="4px solid" borderColor="green.400">
                      <VStack spacing={2} align="stretch">
                        <HStack spacing={2}>
                          <Icon as={SmallAddIcon} color="green.500" boxSize={4} />
                          <Text fontSize="sm" fontWeight="semibold" color="green.700">
                            Predicted Value - Row {prediction.row_index + 1}
                          </Text>
                        </HStack>
                        <Box>
                          <Text fontSize="xs" color="green.600" fontWeight="semibold" mb={1}>
                            AI Prediction:
                          </Text>
                          <Badge variant="solid" colorScheme="green" fontSize="xs">
                            {prediction.predicted_value}
                          </Badge>
                        </Box>
                        <Progress 
                          value={prediction.confidence * 100} 
                          size="sm" 
                          colorScheme="green"
                        />
                      </VStack>
                    </Box>
                  </AccordionPanel>
                </AccordionItem>
              ))}
            </Accordion>
          </Box>
        )}

        {/* ML Learning Notice */}
        <Box p={3} bg="purple.50" borderRadius="md" borderLeft="4px solid" borderColor="purple.400">
          <HStack spacing={2}>
            <Icon as={InfoIcon} color="purple.500" />
            <VStack align="start" spacing={1}>
              <Text fontSize="sm" fontWeight="semibold" color="purple.700">
                Continuous Learning
              </Text>
              <Text fontSize="xs" color="purple.600">
                AI models improve with each approval and correction
              </Text>
            </VStack>
          </HStack>
        </Box>
      </VStack>
    </Box>
  );
};

export default MLEnhancementPanel;