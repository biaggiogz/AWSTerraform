import React, { useState, useRef } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Textarea,
  Button,
  Badge,
  Spinner,
  useColorModeValue,
  IconButton,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  List,
  ListItem
} from '@chakra-ui/react';
import { MdClose, MdLock, MdLockOpen, MdExpandLess, MdExpandMore } from 'react-icons/md';
import useDynamicCalculations from '../../hooks/useDynamicCalculations';

const DynamicCalculationPanel = ({ controlData, detailsData, filteredControlData, filteredDetailsData, filters }) => {
  const [sqlQuery, setSqlQuery] = useState(`SELECT SUM(totalItems) AS "Total Items _Global"
FROM "Control Instruments";

SELECT SUM(doneItems) AS "Done Items _Local"
FROM "Control Instruments";`);
  const [metricCards, setMetricCards] = useState([]);
  const [lockedCards, setLockedCards] = useState(new Set());
  const [deletedCards, setDeletedCards] = useState(new Set());
  const [isInterfaceVisible, setIsInterfaceVisible] = useState(true);
  const [showFieldSuggestions, setShowFieldSuggestions] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const textareaRef = useRef(null);
  
  const { 
    calculations, 
    loading, 
    executeSQLQuery, 
    controlColumns, 
    detailColumns,
    availableTables,
    tableInfo
  } = useDynamicCalculations(
    controlData, 
    detailsData,
    filteredControlData,
    filteredDetailsData,
    filters
  );

  // Table names for SUMMARY SUBSYSTEMS
  const isSubsystemsTab = controlData && detailsData && 
    controlData[0] && ('subsystem' in controlData[0] || 'serialNumber' in controlData[0]);

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // Color mapping for metric cards
  const getMetricColor = (metricName) => {
    const name = metricName.toLowerCase();
    if (name.includes('total isos')) return '#007598';
    if (name.includes('total at') && name.includes('%')) return '#007598';
    if (name.includes('total subsystem')) return '#CEC19B';
    if (name.includes('total test pack')) return '#7CA2C5';
    if (name.includes('total inst')) return '#B3CDDF';
    if (name.includes('total scope teiga')) return '#B3CDDF';
    if (name.includes('total scope siemsa')) return '#B3CDDF';
    if (name.includes('total installed teiga')) return '#B3CDDF';
    if (name.includes('total installed')) return '#B3CDDF';
    if (name.includes('trac yes')) return '#D98265';
    return '#E2E8F0'; // default gray
  };

  const handleExecute = () => {
    if (!sqlQuery.trim()) return;
    setDeletedCards(new Set()); // Clear deleted cards on new query
    executeSQLQuery(sqlQuery);
  };

  const addMetricQuery = (newQuery) => {
    setSqlQuery(prev => {
      if (!prev.trim()) return newQuery;
      return prev + '\n\n' + newQuery;
    });
  };

  const deleteCard = (cardId) => {
    console.log('Deleting card:', cardId);
    setMetricCards(prev => {
      const filtered = prev.filter(card => card.id !== cardId);
      console.log('Cards after delete:', filtered.length);
      return filtered;
    });
    setLockedCards(prev => {
      const newSet = new Set(prev);
      newSet.delete(cardId);
      return newSet;
    });
    setDeletedCards(prev => {
      const newSet = new Set(prev);
      newSet.add(cardId);
      return newSet;
    });
  };

  const toggleCardLock = (cardId) => {
    setLockedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cardId)) {
        newSet.delete(cardId);
      } else {
        newSet.add(cardId);
      }
      return newSet;
    });
  };

  // Get all available field names for intellisense
  const getAllFieldNames = () => {
    const fields = new Set();
    Object.values(tableInfo).forEach(info => {
      info.fields.forEach(field => fields.add(field));
    });
    return Array.from(fields).sort();
  };

  // Handle textarea changes with intellisense
  const handleSqlQueryChange = (e) => {
    const value = e.target.value;
    const position = e.target.selectionStart;
    setSqlQuery(value);
    setCursorPosition(position);
    
    // Show suggestions when typing field names
    const beforeCursor = value.substring(0, position);
    const afterQuote = beforeCursor.lastIndexOf('"');
    const beforeQuote = beforeCursor.lastIndexOf('"', afterQuote - 1);
    
    if (afterQuote > beforeQuote && beforeCursor.charAt(afterQuote + 1) !== '"') {
      setShowFieldSuggestions(true);
    } else {
      setShowFieldSuggestions(false);
    }
  };

  // Insert field name at cursor position
  const insertFieldName = (fieldName) => {
    const textarea = textareaRef.current;
    const beforeCursor = sqlQuery.substring(0, cursorPosition);
    const afterCursor = sqlQuery.substring(cursorPosition);
    
    // Find the last quote before cursor
    const lastQuoteIndex = beforeCursor.lastIndexOf('"');
    const beforeQuote = beforeCursor.substring(0, lastQuoteIndex + 1);
    
    const newQuery = beforeQuote + fieldName + '"' + afterCursor;
    setSqlQuery(newQuery);
    setShowFieldSuggestions(false);
    
    // Focus back to textarea
    setTimeout(() => {
      textarea.focus();
      const newPosition = beforeQuote.length + fieldName.length + 1;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  // Update metric cards when calculations change
  React.useEffect(() => {
    if (calculations.length > 0) {
      const newCards = calculations.flatMap((row, rowIdx) => 
        Object.entries(row).map(([key, value], entryIdx) => {
          const cleanKey = key.replace(/_Local$|_Global$/, '');
          const scope = key.endsWith('_Local') ? 'LOCAL' : key.endsWith('_Global') ? 'GLOBAL' : null;
          return {
            id: `${rowIdx}-${entryIdx}-${key}`,
            key: cleanKey,
            value,
            scope,
            timestamp: Date.now()
          };
        })
      );
      
      setMetricCards(prev => {
        // Keep existing cards that still exist in new results AND haven't been manually deleted
        const existingCards = prev.filter(card => 
          newCards.some(newCard => newCard.id === card.id) && !deletedCards.has(card.id)
        );
        
        // Add only truly new cards that don't exist yet and haven't been deleted
        const trulyNewCards = newCards.filter(newCard => 
          !prev.some(existingCard => existingCard.id === newCard.id) && !deletedCards.has(newCard.id)
        );
        
        // Update values for existing unlocked cards
        const updatedCards = existingCards.map(existingCard => {
          if (lockedCards.has(existingCard.id)) {
            return existingCard; // Keep locked cards unchanged
          }
          const newCard = newCards.find(nc => nc.id === existingCard.id);
          return newCard || existingCard;
        });
        
        return [...updatedCards, ...trulyNewCards];
      });
    }
  }, [calculations, lockedCards, deletedCards]);

  // Separate global and local metrics
  const globalMetrics = metricCards.filter(card => card.scope === 'GLOBAL');
  const localMetrics = metricCards.filter(card => card.scope === 'LOCAL');
  const otherMetrics = metricCards.filter(card => !card.scope);

  return (
    <Box 
      bg={bgColor} 
      border="1px" 
      borderColor={borderColor} 
      borderRadius="md" 
      p={4} 
      mt={4}
    >
      <VStack spacing={4} align="stretch">
        <HStack justify="space-between" align="center">
          <Text fontSize="sm" fontWeight="bold" color="blue.600">
            SQL Query Interface
          </Text>
          <IconButton
            icon={isInterfaceVisible ? <MdExpandLess /> : <MdExpandMore />}
            size="sm"
            variant="ghost"
            onClick={() => setIsInterfaceVisible(!isInterfaceVisible)}
            aria-label={isInterfaceVisible ? "Hide interface" : "Show interface"}
          />
        </HStack>
        
        {isInterfaceVisible && (
          <>
            {/* Schema Reference */}
            <VStack spacing={2} align="stretch" fontSize="xs" color="gray.600">
              {Object.entries(tableInfo).map(([tableName, info]) => (
                <Box key={tableName} pl={4} borderLeft="2px solid" borderColor="blue.200">
                  <Text fontWeight="bold">"{tableName}" ({info.filteredRows}/{info.totalRows} rows)</Text>
                  <Text><strong>Fields:</strong> {info.fields.slice(0, 8).join(', ')}{info.fields.length > 8 ? '...' : ''}</Text>
                </Box>
              ))}
            </VStack>

            {/* Default Quick Metrics */}
            <Box>
              <Text fontSize="sm" fontWeight="semibold" mb={2}>Default Quick Metrics:</Text>
              <VStack spacing={2} align="stretch">
                {isSubsystemsTab ? (
                  // SUMMARY SUBSYSTEMS metrics
                  <>
                    <HStack spacing={2} wrap="wrap">
                      <Button size="xs" variant="outline" onClick={() => addMetricQuery('SELECT COUNT(DISTINCT subsystem) AS "Total Subsystems _Global"\nFROM "Control Instruments";\n\nSELECT COUNT(DISTINCT subsystem) AS "Total Subsystems _Local"\nFROM "Control Instruments";')}>
                        Total Subsystems
                      </Button>
                      <Button size="xs" variant="outline" onClick={() => addMetricQuery('SELECT SUM(totalItems) AS "Total Items _Global"\nFROM "Control Instruments";\n\nSELECT SUM(totalItems) AS "Total Items _Local"\nFROM "Control Instruments";')}>
                        Total Items
                      </Button>
                      <Button size="xs" variant="outline" onClick={() => addMetricQuery('SELECT SUM(doneItems) AS "Done Items _Global"\nFROM "Control Instruments";\n\nSELECT SUM(doneItems) AS "Done Items _Local"\nFROM "Control Instruments";')}>
                        Done Items
                      </Button>
                      <Button size="xs" variant="outline" onClick={() => addMetricQuery('SELECT SUM(pendingItems) AS "Pending Items _Global"\nFROM "Control Instruments";\n\nSELECT SUM(pendingItems) AS "Pending Items _Local"\nFROM "Control Instruments";')}>
                        Pending Items
                      </Button>
                      <Button size="xs" variant="outline" onClick={() => addMetricQuery('SELECT COUNT(DISTINCT testPack) AS "Total Test Packs _Global"\nFROM "Details Instruments";\n\nSELECT COUNT(DISTINCT testPack) AS "Total Test Packs _Local"\nFROM "Details Instruments";')}>
                        Total Test Packs
                      </Button>
                    </HStack>
                    <HStack spacing={2} wrap="wrap">
                      <Button size="xs" variant="outline" onClick={() => addMetricQuery('SELECT SUM(totalLoops) AS "Total Loops _Global"\nFROM "Control Instruments";\n\nSELECT SUM(totalLoops) AS "Total Loops _Local"\nFROM "Control Instruments";')}>
                        Total Loops
                      </Button>
                      <Button size="xs" variant="outline" onClick={() => addMetricQuery('SELECT SUM(doneLoops) AS "Done Loops _Global"\nFROM "Control Instruments";\n\nSELECT SUM(doneLoops) AS "Done Loops _Local"\nFROM "Control Instruments";')}>
                        Done Loops
                      </Button>
                      <Button size="xs" variant="outline" onClick={() => addMetricQuery('SELECT AVG(testPackProgress) AS "Avg Progress _Global"\nFROM "Details Instruments";\n\nSELECT AVG(testPackProgress) AS "Avg Progress _Local"\nFROM "Details Instruments";')}>
                        Avg Progress
                      </Button>
                    </HStack>
                  </>
                ) : (
                  // INSTRUMENTS metrics
                  <>
                    <HStack spacing={2} wrap="wrap">
                      <Button size="xs" variant="outline" onClick={() => addMetricQuery('SELECT COUNT("ISOMETRIC") AS "Total Isos _Global"\nFROM "Control Instruments";\n\nSELECT COUNT("ISOMETRIC") AS "Total Isos _Local"\nFROM "Control Instruments";')}>
                        Total Isos
                      </Button>
                      <Button size="xs" variant="outline" onClick={() => addMetricQuery('SELECT COUNT("WELDING FW+SW") AS "Total at 100% _Global"\nFROM "Control Instruments"\nWHERE "WELDING FW+SW" = 1;\n\nSELECT COUNT("WELDING FW+SW") AS "Total at 100% _Local"\nFROM "Control Instruments"\nWHERE "WELDING FW+SW" = 1;')}>
                        Total at 100%
                      </Button>
                      <Button size="xs" variant="outline" onClick={() => addMetricQuery('SELECT COUNT("SUBSYSTEM") AS "Total Subsystem _Global"\nFROM "Control Instruments";\n\nSELECT COUNT("SUBSYSTEM") AS "Total Subsystem _Local"\nFROM "Control Instruments";')}>
                        Total Subsystem
                      </Button>
                      <Button size="xs" variant="outline" onClick={() => addMetricQuery('SELECT COUNT(DISTINCT "TEST PACK") AS "Total Test Pack _Global"\nFROM "Control Instruments";\n\nSELECT COUNT(DISTINCT "TEST PACK") AS "Total Test Pack _Local"\nFROM "Control Instruments";')}>
                        Total Test Pack
                      </Button>
                      <Button size="xs" variant="outline" onClick={() => addMetricQuery('SELECT SUM("QTY INST") AS "Total Inst _Global"\nFROM "Control Instruments";\n\nSELECT SUM("QTY INST") AS "Total Inst _Local"\nFROM "Control Instruments";')}>
                        Total Inst
                      </Button>
                    </HStack>
                    <HStack spacing={2} wrap="wrap">
                      <Button size="xs" variant="outline" onClick={() => addMetricQuery('SELECT SUM("SCOPE BY TEIGA-TMI") AS "Total Scope TEIGA _Global"\nFROM "Control Instruments";\n\nSELECT SUM("SCOPE BY TEIGA-TMI") AS "Total Scope TEIGA _Local"\nFROM "Control Instruments";')}>
                        Total Scope TEIGA
                      </Button>
                      <Button size="xs" variant="outline" onClick={() => addMetricQuery('SELECT SUM("SCOPE BY SIEMSA") AS "Total Scope Siemsa _Global"\nFROM "Control Instruments";\n\nSELECT SUM("SCOPE BY SIEMSA") AS "Total Scope Siemsa _Local"\nFROM "Control Instruments";')}>
                        Total Scope Siemsa
                      </Button>
                      <Button size="xs" variant="outline" onClick={() => addMetricQuery('SELECT SUM(CAST("INSTALLED (TEIGA-TMI)" AS INTEGER)) AS "Total Installed Teiga _Global"\nFROM "Control Instruments"\nWHERE "INSTALLED (TEIGA-TMI)" != \'NOT APPLY\';\n\nSELECT SUM(CAST("INSTALLED (TEIGA-TMI)" AS INTEGER)) AS "Total Installed Teiga _Local"\nFROM "Control Instruments"\nWHERE "INSTALLED (TEIGA-TMI)" != \'NOT APPLY\';')}>
                        Total Installed Teiga
                      </Button>
                      <Button size="xs" variant="outline" onClick={() => addMetricQuery('SELECT SUM("TOTAL INSTALLED") AS "Total Installed _Global"\nFROM "Control Instruments";\n\nSELECT SUM("TOTAL INSTALLED") AS "Total Installed _Local"\nFROM "Control Instruments";')}>
                        Total Installed
                      </Button>
                      <Button size="xs" variant="outline" onClick={() => addMetricQuery('SELECT COUNT("TRAC (YES & NOT)") AS "Trac YES _Global"\nFROM "Control Instruments"\nWHERE "TRAC (YES & NOT)" = \'YES\';\n\nSELECT COUNT("TRAC (YES & NOT)") AS "Trac YES _Local"\nFROM "Control Instruments"\nWHERE "TRAC (YES & NOT)" = \'YES\';')}>
                        Trac YES
                      </Button>
                    </HStack>
                  </>
                )}
              </VStack>
            </Box>

            {/* SQL Editor with Intellisense */}
            <Box>
              <Text fontSize="sm" mb={2} fontWeight="semibold">SQL Query:</Text>
              <Box position="relative">
                <Textarea 
                  ref={textareaRef}
                  value={sqlQuery}
                  onChange={handleSqlQueryChange}
                  onFocus={() => setShowFieldSuggestions(false)}
                  placeholder='Enter your SQL query here... Use "field_name" for field suggestions'
                  fontFamily="monospace"
                  fontSize="sm"
                  minH="120px"
                  resize="vertical"
                />
                
                {/* Field Suggestions Popup */}
                {showFieldSuggestions && (
                  <Box
                    position="absolute"
                    top="100%"
                    left="0"
                    right="0"
                    bg={bgColor}
                    border="1px solid"
                    borderColor={borderColor}
                    borderRadius="md"
                    maxH="200px"
                    overflowY="auto"
                    zIndex={1000}
                    boxShadow="lg"
                  >
                    <Text fontSize="xs" p={2} fontWeight="bold" borderBottom="1px solid" borderColor={borderColor}>
                      Available Fields:
                    </Text>
                    {getAllFieldNames().map(field => (
                      <Box
                        key={field}
                        p={2}
                        fontSize="xs"
                        cursor="pointer"
                        _hover={{ bg: 'blue.50' }}
                        onClick={() => insertFieldName(field)}
                      >
                        {field}
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>
              <Text fontSize="xs" color="gray.500" mt={1}>
                💡 Type " to see field suggestions
              </Text>
            </Box>
            
            <HStack justify="space-between">
              <Button 
                colorScheme="blue" 
                onClick={handleExecute}
                isDisabled={!sqlQuery.trim() || loading}
                isLoading={loading}
              >
                Execute Query
              </Button>
              
              {/* Active Filters Display */}
              {(filters.selectedIsometric || filters.selectedTestPack || filters.selectedSubsystem) && (
                <HStack spacing={2}>
                  <Text fontSize="xs" color="gray.600">Active Filters:</Text>
                  {filters.selectedIsometric && (
                    <Badge colorScheme="purple" fontSize="xs">ISO: {filters.selectedIsometric}</Badge>
                  )}
                  {filters.selectedTestPack && (
                    <Badge colorScheme="blue" fontSize="xs">PACK: {filters.selectedTestPack}</Badge>
                  )}
                  {filters.selectedSubsystem && (
                    <Badge colorScheme="orange" fontSize="xs">SUB: {filters.selectedSubsystem}</Badge>
                  )}
                </HStack>
              )}
            </HStack>
          </>
        )}

      </VStack>
      
      {/* Results as Metric Cards - Always Visible */}
      {loading && (
        <HStack justify="center" py={4}>
          <Spinner size="sm" />
          <Text>Executing query...</Text>
        </HStack>
      )}
      
      {metricCards.length === 0 && !loading && (
        <Text textAlign="center" color="gray.500" py={4}>
          Execute a query to see metric cards
        </Text>
      )}
      
      {/* Global Metrics Section */}
      {globalMetrics.length > 0 && !loading && (
        <VStack spacing={3} align="stretch" mt={4}>
          <Box
            bg="blue.500"
            color="white"
            p={2}
            borderRadius="md"
            textAlign="center"
            fontWeight="bold"
          >
            GLOBAL
          </Box>
          <HStack spacing={2} wrap="wrap" justify="center">
            {globalMetrics.map((card) => {
              const isLocked = lockedCards.has(card.id);
              return (
                <Box
                  key={card.id}
                  bg={getMetricColor(card.key)}
                  border="2px solid"
                  borderColor={isLocked ? "orange.300" : "blue.200"}
                  borderRadius="lg"
                  p={1}
                  minW="120px"
                  textAlign="center"
                  boxShadow="md"
                  position="relative"
                >
                  {/* Top row with buttons */}
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="flex-start"
                    position="absolute"
                    top="4px"
                    left="4px"
                    right="4px"
                    zIndex={1}
                  >
                    <IconButton
                      icon={<MdClose />}
                      size="xs"
                      colorScheme="blue"
                      variant="ghost"
                      onClick={() => deleteCard(card.id)}
                      aria-label="Delete card"
                      minW="auto"
                      h="auto"
                      p={0}
                    />
                    <IconButton
                      icon={isLocked ? <MdLock /> : <MdLockOpen />}
                      size="xs"
                      colorScheme="blue"
                      variant="ghost"
                      onClick={() => toggleCardLock(card.id)}
                      aria-label={isLocked ? "Unlock card" : "Lock card"}
                      minW="auto"
                      h="auto"
                      p={0}
                    />
                  </Box>
                  
                  {/* Metric content without scope text */}
                  <Box pt={6}>
                    <Text fontSize="lg" fontWeight="bold" color="white">
                      {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
                    </Text>
                    <Text fontSize="sm" color="white" mt={1}>
                      {card.key}
                    </Text>
                  </Box>
                </Box>
              );
            })}
          </HStack>
        </VStack>
      )}
      
      {/* Local Metrics Section */}
      {localMetrics.length > 0 && !loading && (
        <VStack spacing={3} align="stretch" mt={4}>
          <Box
            bg="green.500"
            color="white"
            p={2}
            borderRadius="md"
            textAlign="center"
            fontWeight="bold"
          >
            LOCAL
          </Box>
          <HStack spacing={2} wrap="wrap" justify="center">
            {localMetrics.map((card) => {
              const isLocked = lockedCards.has(card.id);
              return (
                <Box
                  key={card.id}
                  bg={getMetricColor(card.key)}
                  border="2px solid"
                  borderColor={isLocked ? "orange.300" : "blue.200"}
                  borderRadius="lg"
                  p={1}
                  minW="120px"
                  textAlign="center"
                  boxShadow="md"
                  position="relative"
                >
                  {/* Top row with buttons */}
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="flex-start"
                    position="absolute"
                    top="4px"
                    left="4px"
                    right="4px"
                    zIndex={1}
                  >
                    <IconButton
                      icon={<MdClose />}
                      size="xs"
                      colorScheme="blue"
                      variant="ghost"
                      onClick={() => deleteCard(card.id)}
                      aria-label="Delete card"
                      minW="auto"
                      h="auto"
                      p={0}
                    />
                    <IconButton
                      icon={isLocked ? <MdLock /> : <MdLockOpen />}
                      size="xs"
                      colorScheme="blue"
                      variant="ghost"
                      onClick={() => toggleCardLock(card.id)}
                      aria-label={isLocked ? "Unlock card" : "Lock card"}
                      minW="auto"
                      h="auto"
                      p={0}
                    />
                  </Box>
                  
                  {/* Metric content without scope text */}
                  <Box pt={6}>
                    <Text fontSize="lg" fontWeight="bold" color="white">
                      {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
                    </Text>
                    <Text fontSize="sm" color="white" mt={1}>
                      {card.key}
                    </Text>
                  </Box>
                </Box>
              );
            })}
          </HStack>
        </VStack>
      )}
      
      {/* Other Metrics (without scope) */}
      {otherMetrics.length > 0 && !loading && (
        <HStack spacing={2} wrap="wrap" justify="center" mt={4}>
          {otherMetrics.map((card) => {
            const isLocked = lockedCards.has(card.id);
            return (
              <Box
                key={card.id}
                bg={getMetricColor(card.key)}
                border="2px solid"
                borderColor={isLocked ? "orange.300" : "blue.200"}
                borderRadius="lg"
                p={1}
                minW="120px"
                textAlign="center"
                boxShadow="md"
                position="relative"
              >
                {/* Top row with buttons */}
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="flex-start"
                  position="absolute"
                  top="4px"
                  left="4px"
                  right="4px"
                  zIndex={1}
                >
                  <IconButton
                    icon={<MdClose />}
                    size="xs"
                    colorScheme="blue"
                    variant="ghost"
                    onClick={() => deleteCard(card.id)}
                    aria-label="Delete card"
                    minW="auto"
                    h="auto"
                    p={0}
                  />
                  <IconButton
                    icon={isLocked ? <MdLock /> : <MdLockOpen />}
                    size="xs"
                    colorScheme="blue"
                    variant="ghost"
                    onClick={() => toggleCardLock(card.id)}
                    aria-label={isLocked ? "Unlock card" : "Lock card"}
                    minW="auto"
                    h="auto"
                    p={0}
                  />
                </Box>
                
                {/* Metric content */}
                <Box pt={6}>
                  <Text fontSize="lg" fontWeight="bold" color="white">
                    {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
                  </Text>
                  <Text fontSize="sm" color="white" mt={1}>
                    {card.key}
                  </Text>
                </Box>
              </Box>
            );
          })}
        </HStack>
      )}
    </Box>
  );
};

export default DynamicCalculationPanel;