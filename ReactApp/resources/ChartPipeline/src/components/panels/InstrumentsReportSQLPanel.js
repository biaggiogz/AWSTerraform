import React, { useState, useRef, useEffect } from 'react';
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
  IconButton
} from '@chakra-ui/react';
import { MdClose, MdLock, MdLockOpen, MdExpandLess, MdExpandMore, MdFilterList, MdCheckCircle, MdLoop, MdFlag } from 'react-icons/md';
import useInstrumentsReportDuckDB from '../../hooks/useInstrumentsReportDuckDB';
import * as instrumentsReportQueries from '../../utils/instrumentsReportQueries';
import { usePersistentSQLState } from '../../hooks/usePersistentSQLState';
import ProgressFilter from '../filters/ProgressFilter';
import ItemsStatusFilter from '../filters/ItemsStatusFilter';
import LoopStatusFilter from '../filters/LoopStatusFilter';
import HitoFilter from '../filters/HitoFilter';

const InstrumentsReportSQLPanel = ({ controlData, detailsData, filteredControlData, filteredDetailsData, filters, onFilteredDataChange, onFilteredControlDataChange, onLoopFilteredControlDataChange, onLoopPropagationChange, onItemsPropagationChange, onProgressFilterVisibilityChange, onItemsFilterVisibilityChange, onLoopFilterVisibilityChange, onProgressPropagationChange, onHitoPropagationChange, onHitoFilterVisibilityChange, onHitoFilteredDataChange, onBringToFront }) => {
  // Always use instrumentsReport as the tab name
  const tabName = 'instrumentsReport';
  
  const { sqlState, updateQuery } = usePersistentSQLState(tabName);
  const [sqlQuery, setSqlQuery] = useState(sqlState.query || `SELECT COUNT(DISTINCT "ISOMETRIC") AS "TOTAL ISOS _Global"
FROM controlInstrumentsByIsometric;

SELECT COUNT(DISTINCT "ISOMETRIC") AS "TOTAL ISOS _Local"
FROM controlInstrumentsByIsometric;`);
  const [metricCards, setMetricCards] = useState([]);
  const [lockedCards, setLockedCards] = useState(new Set());
  const [deletedCards, setDeletedCards] = useState(new Set());
  const [isInterfaceVisible, setIsInterfaceVisible] = useState(true);
  const [showFieldSuggestions, setShowFieldSuggestions] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [isSubsystemFilterVisible, setIsSubsystemFilterVisible] = useState(false);
  const [isLoopFilterVisible, setIsLoopFilterVisible] = useState(false);
  const [isHitoFilterVisible, setIsHitoFilterVisible] = useState(false);
  const textareaRef = useRef(null);

  // Restore query from persistent state
  useEffect(() => {
    if (sqlState.query && sqlState.query !== sqlQuery) {
      setSqlQuery(sqlState.query);
    }
  }, [sqlState.query]);
  
  // Get dynamic data from controlData if available
  const dynamicData = controlData;
  
  const { 
    calculations, 
    loading, 
    executeSQLQuery, 
    tableInfo,
    availableTables
  } = useInstrumentsReportDuckDB(
    controlData, 
    detailsData,
    dynamicData,
    filteredControlData,
    filteredDetailsData,
    filteredControlData // Use filtered control data for dynamic table too
  );

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // Color mapping for metric cards
  const getMetricColor = (metricName) => {
    const name = metricName.toLowerCase();
    if (name.includes('total isos')) return '#007598';
    if (name.includes('total tag inst')) return '#007598';
    if (name.includes('total inst')) return '#B3CDDF';
    if (name.includes('total done')) return '#7CA2C5';
    if (name.includes('total installed teiga-tmi')) return '#B3CDDF';
    if (name.includes('total installed siemsa')) return '#B3CDDF';
    return '#E2E8F0'; // default gray
  };

  const handleExecute = () => {
    if (!sqlQuery.trim()) return;
    setDeletedCards(new Set()); // Clear deleted cards on new query
    updateQuery(sqlQuery); // Save query to persistent state
    executeSQLQuery(sqlQuery);
  };

  const addMetricQuery = (newQuery) => {
    setSqlQuery(prev => {
      const updatedQuery = !prev.trim() ? newQuery : prev + '\n\n' + newQuery;
      updateQuery(updatedQuery); // Save to persistent state
      return updatedQuery;
    });
  };

  const deleteCard = (cardId) => {
    console.log('Deleting card:', cardId);
    setMetricCards(prev => {
      const filtered = prev.filter(card => card.id !== cardId);
      console.log('Cards after delete:', filtered.length);
      // Update persistent state
      updateQuery(sqlQuery, filtered);
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
      if (info && Array.isArray(info.fields)) {
        info.fields.forEach(field => fields.add(field));
      }
    });
    return Array.from(fields).sort();
  };

  // Handle textarea changes with intellisense
  const handleSqlQueryChange = (e) => {
    const value = e.target.value;
    const position = e.target.selectionStart;
    setSqlQuery(value);
    setCursorPosition(position);
    
    // Show suggestions when typing after opening quote
    const beforeCursor = value.substring(0, position);
    const lastQuote = beforeCursor.lastIndexOf("+");
    
    // Check if we're inside an unclosed quote
    if (lastQuote !== -1) {
      const afterLastQuote = beforeCursor.substring(lastQuote + 1);
      // Show suggestions if no closing quote found after the last opening quote
      if (!afterLastQuote.includes("+")) {
        setShowFieldSuggestions(true);
      } else {
        setShowFieldSuggestions(false);
      }
    } else {
      setShowFieldSuggestions(false);
    }
  };

  // Insert field name at cursor position
  const insertFieldName = (fieldName) => {
    const textarea = textareaRef.current;
    const beforeCursor = sqlQuery.substring(0, cursorPosition);
    const afterCursor = sqlQuery.substring(cursorPosition);
    
    // Find the last + before cursor
    const lastPlusIndex = beforeCursor.lastIndexOf("+");
    const beforePlus = beforeCursor.substring(0, lastPlusIndex);
    
    const newQuery = beforePlus + fieldName + afterCursor;
    setSqlQuery(newQuery);
    setShowFieldSuggestions(false);
    
    // Focus back to textarea
    setTimeout(() => {
      textarea.focus();
      const newPosition = beforePlus.length + fieldName.length;
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
        
        const finalCards = [...updatedCards, ...trulyNewCards];
        
        // Save metric cards to persistent state
        updateQuery(sqlQuery, finalCards);
        
        return finalCards;
      });
    }
  }, [calculations, lockedCards, deletedCards, sqlQuery, updateQuery]);

  // Restore metric cards from persistent state on mount
  useEffect(() => {
    if (sqlState.result && Array.isArray(sqlState.result)) {
      setMetricCards(sqlState.result);
    }
  }, [sqlState.result]);

  // Separate global and local metrics
  const globalMetrics = metricCards.filter(card => card.scope === 'GLOBAL');
  const localMetrics = metricCards.filter(card => card.scope === 'LOCAL');
  const otherMetrics = metricCards.filter(card => !card.scope);

  return (
    <>
      <HStack justify="space-between" align="center">
        <Text fontSize="sm" fontWeight="bold" color="blue.600">
          INSTRUMENTS REPORT SQL Query Interface
        </Text>
        <HStack spacing={2}>
          <IconButton
            icon={<MdFilterList />}
            size="sm"
            variant="ghost"
            onClick={() => {
              const newVisibility = !isFilterVisible;
              setIsFilterVisible(newVisibility);
              if (onProgressFilterVisibilityChange) {
                onProgressFilterVisibilityChange(newVisibility);
              }
            }}
            aria-label="Toggle progress filter"
            title="Test Pack Progress Filter"
          />
          <IconButton
            icon={<MdCheckCircle />}
            size="sm"
            variant="ghost"
            onClick={() => {
              const newVisibility = !isSubsystemFilterVisible;
              setIsSubsystemFilterVisible(newVisibility);
              if (onItemsFilterVisibilityChange) {
                onItemsFilterVisibilityChange(newVisibility);
              }
            }}
            aria-label="Toggle subsystem status filter"
            title="Items Status Filter"
          />
          <IconButton
            icon={<MdLoop />}
            size="sm"
            variant="ghost"
            onClick={() => {
              const newVisibility = !isLoopFilterVisible;
              setIsLoopFilterVisible(newVisibility);
              if (onLoopFilterVisibilityChange) {
                onLoopFilterVisibilityChange(newVisibility);
              }
            }}
            aria-label="Toggle loop status filter"
            title="Loop Status Filter"
          />
          <IconButton
            icon={<MdFlag />}
            size="sm"
            variant="ghost"
            onClick={() => {
              const newVisibility = !isHitoFilterVisible;
              setIsHitoFilterVisible(newVisibility);
              if (onHitoFilterVisibilityChange) {
                onHitoFilterVisibilityChange(newVisibility);
              }
            }}
            aria-label="Toggle hito filter"
            title="Hito Filter"
          />
          <IconButton
            icon={isInterfaceVisible ? <MdExpandLess /> : <MdExpandMore />}
            size="sm"
            variant="ghost"
            onClick={() => setIsInterfaceVisible(!isInterfaceVisible)}
            aria-label={isInterfaceVisible ? "Hide interface" : "Show interface"}
          />
        </HStack>
      </HStack>
      
      {isInterfaceVisible && (
        <>
          {/* Schema Reference */}
          <VStack spacing={2} align="stretch" fontSize="xs" color="gray.600">
            {Object.entries(tableInfo).map(([tableName, info]) => (
              <Box key={tableName} pl={4} borderLeft="2px solid" borderColor="blue.200">
                <Text fontWeight="bold">{tableName} ({info.totalRows} rows)</Text>
                <Text><strong>Fields:</strong> {info.fields.slice(0, 8).join(', ')}{info.fields.length > 8 ? '...' : ''}</Text>
              </Box>
            ))}
          </VStack>

          {/* Default Quick Metrics - INSTRUMENTS REPORT specific */}
          <Box>
            <Text fontSize="sm" fontWeight="semibold" mb={2}>Default Quick Metrics:</Text>
            <VStack spacing={2} align="stretch">
              <HStack spacing={2} wrap="wrap">
                <Button size="xs" variant="outline" onClick={() => addMetricQuery(instrumentsReportQueries.getTotalIsometricsQuery())}>
                  Total Isos
                </Button>
                <Button size="xs" variant="outline" onClick={() => addMetricQuery(instrumentsReportQueries.getTotalTagInstQuery())}>
                  Total Tag Inst
                </Button>
                <Button size="xs" variant="outline" onClick={() => addMetricQuery(instrumentsReportQueries.getTotalInstQuery())}>
                  Total Inst
                </Button>
                <Button size="xs" variant="outline" onClick={() => addMetricQuery(instrumentsReportQueries.getTotalDoneQuery())}>
                  Total Done
                </Button>
              </HStack>
              <HStack spacing={2} wrap="wrap">
                <Button size="xs" variant="outline" onClick={() => addMetricQuery(instrumentsReportQueries.getTotalInstalledTeigaTmiQuery())}>
                  Total Installed TEIGA-TMI
                </Button>
                <Button size="xs" variant="outline" onClick={() => addMetricQuery(instrumentsReportQueries.getTotalInstalledSiemsaQuery())}>
                  Total Installed SIEMSA
                </Button>
                <Button size="xs" variant="outline" onClick={() => addMetricQuery(instrumentsReportQueries.getAllMetricsQuery())}>
                  All Metrics
                </Button>
              </HStack>
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
              💡 Type + to see field suggestions
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
      
      {/* Global and Local Metrics Side by Side */}
      {(globalMetrics.length > 0 || localMetrics.length > 0) && !loading && (
        <HStack spacing={4} align="flex-start" mt={1}>
          {/* Global Metrics - Left Side */}
          {globalMetrics.length > 0 && (
            <VStack spacing={1} align="stretch" flex={1}>
              <Text fontSize="xs" fontWeight="bold" color="rgba(103, 154, 154,1)" textAlign="center">
                GLOBAL
              </Text>
              <HStack spacing={2} wrap="wrap" justify="center">
                {globalMetrics.map((card) => {
                  const isLocked = lockedCards.has(card.id);
                  return (
                    <Box
                      key={card.id}
                      bg="rgba(103, 154, 154)"
                      border="3px solid"
                      borderColor={isLocked ? "rgba(103, 154, 154,0.8)" : "rgba(103, 154, 154,0.8)"}
                      borderRadius="lg"
                      p={0.5}
                      minW="100px"
                      textAlign="center"
                      boxShadow="md"
                      position="relative"
                      minH="fit-content"
                    >
                      {/* Top row with buttons */}
                      <Box
                        display="flex"
                        justifyContent="space-between"
                        alignItems="flex-start"
                        position="absolute"
                        top="2px"
                        left="2px"
                        right="2px"
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
                      <Box pt={3} pb={1}>
                        <Text fontSize="md" fontWeight="bold" color="white">
                          {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
                        </Text>
                        <Text fontSize="xs" color="white">
                          {card.key}
                        </Text>
                      </Box>
                    </Box>
                  );
                })}
              </HStack>
            </VStack>
          )}
          
          {/* Local Metrics - Right Side */}
          {localMetrics.length > 0 && (
            <VStack spacing={1} align="stretch" flex={1}>
              <Text fontSize="xs" fontWeight="bold" color="rgba(0, 0, 60,1)" textAlign="center">
                LOCAL
              </Text>
              <HStack spacing={2} wrap="wrap" justify="center">
                {localMetrics.map((card) => {
                  const isLocked = lockedCards.has(card.id);
                  return (
                    <Box
                      key={card.id}
                      bg="rgba(0, 0, 60,1)"
                      border="3px solid"
                      borderColor={isLocked ? "rgba(0, 0, 60,1)" : "rgba(0, 0, 60,1)"}
                      borderRadius="lg"
                      p={0.5}
                      minW="100px"
                      textAlign="center"
                      boxShadow="md"
                      position="relative"
                      minH="fit-content"
                    >
                      {/* Top row with buttons */}
                      <Box
                        display="flex"
                        justifyContent="space-between"
                        alignItems="flex-start"
                        position="absolute"
                        top="2px"
                        left="2px"
                        right="2px"
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
                      <Box pt={3} pb={1}>
                        <Text fontSize="md" fontWeight="bold" color="white">
                          {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
                        </Text>
                        <Text fontSize="xs" color="white">
                          {card.key}
                        </Text>
                      </Box>
                    </Box>
                  );
                })}
              </HStack>
            </VStack>
          )}
        </HStack>
      )}
      
      {/* Other Metrics (without scope) */}
      {otherMetrics.length > 0 && !loading && (
        <HStack spacing={2} wrap="wrap" justify="center" mt={2}>
          {otherMetrics.map((card) => {
            const isLocked = lockedCards.has(card.id);
            return (
              <Box
                key={card.id}
                bg="#E2E8F0"
                border="2px solid"
                borderColor={isLocked ? "orange.300" : "#3D365C"}
                borderRadius="lg"
                p={0.5}
                minW="120px"
                textAlign="center"
                boxShadow="md"
                position="relative"
                minH="fit-content"
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
                <Box pt={3} pb={1}>
                  <Text fontSize="md" fontWeight="bold" color="white">
                    {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
                  </Text>
                  <Text fontSize="xs" color="white">
                    {card.key}
                  </Text>
                </Box>
              </Box>
            );
          })}
        </HStack>
      )}
      
      {isFilterVisible && (
        <ProgressFilter
          data={detailsData}
          onFilterChange={onFilteredDataChange || (() => {})}
          isVisible={isFilterVisible}
          onClose={() => {
            setIsFilterVisible(false);
            if (onProgressFilterVisibilityChange) {
              onProgressFilterVisibilityChange(false);
            }
            // Reset this filter's effect by passing the original data
            if (onFilteredDataChange) {
              onFilteredDataChange(detailsData);
            }
            // Reset propagation if it was active
            if (onProgressPropagationChange) {
              onProgressPropagationChange([], 'nothing');
            }
          }}
          onPropagationChange={onProgressPropagationChange || (() => {})}
          onBringToFront={onBringToFront}
        />
      )}
      
      {isSubsystemFilterVisible && (
        <ItemsStatusFilter
          data={controlData}
          onFilterChange={onFilteredControlDataChange || (() => {})}
          isVisible={isSubsystemFilterVisible}
          onClose={() => {
            setIsSubsystemFilterVisible(false);
            if (onItemsFilterVisibilityChange) {
              onItemsFilterVisibilityChange(false);
            }
            // Reset this filter's effect by passing the original data
            if (onFilteredControlDataChange) {
              onFilteredControlDataChange(controlData);
            }
            // Reset propagation if it was active
            if (onItemsPropagationChange) {
              onItemsPropagationChange([], 'nothing');
            }
          }}
          onPropagationChange={onItemsPropagationChange || (() => {})}
          onBringToFront={onBringToFront}
        />
      )}
      
      {isLoopFilterVisible && (
        <LoopStatusFilter
          data={controlData}
          onFilterChange={onLoopFilteredControlDataChange || (() => {})}
          isVisible={isLoopFilterVisible}
          onClose={() => {
            setIsLoopFilterVisible(false);
            if (onLoopFilterVisibilityChange) {
              onLoopFilterVisibilityChange(false);
            }
            // Reset this filter's effect by passing the original data
            if (onLoopFilteredControlDataChange) {
              onLoopFilteredControlDataChange(controlData);
            }
            // Reset propagation if it was active
            if (onLoopPropagationChange) {
              onLoopPropagationChange([], 'nothing');
            }
          }}
          onPropagationChange={onLoopPropagationChange || (() => {})}
          onBringToFront={onBringToFront}
        />
      )}
      
      {isHitoFilterVisible && (
        <HitoFilter
          data={detailsData}
          onFilterChange={onHitoFilteredDataChange || (() => {})}
          isVisible={isHitoFilterVisible}
          onClose={() => {
            setIsHitoFilterVisible(false);
            if (onHitoFilterVisibilityChange) {
              onHitoFilterVisibilityChange(false);
            }
            // Reset this filter's effect by passing the original data
            if (onHitoFilteredDataChange) {
              onHitoFilteredDataChange(detailsData);
            }
            // Reset propagation if it was active
            if (onHitoPropagationChange) {
              onHitoPropagationChange([], 'nothing');
            }
          }}
          onPropagationChange={onHitoPropagationChange || (() => {})}
          onBringToFront={onBringToFront}
        />
      )}
    </>
  );
};

export default InstrumentsReportSQLPanel;