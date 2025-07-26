import React, { useState, useRef, useEffect, useMemo } from 'react';
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
import { MdClose, MdLock, MdLockOpen, MdExpandLess, MdExpandMore, MdCheckCircle, MdLoop, MdFlag, MdPrecisionManufacturing ,MdCategory} from 'react-icons/md';
import useDynamicCalculations from '../../hooks/useDynamicCalculations';
import { usePersistentSQLState } from '../../hooks/usePersistentSQLState';
import InsulStatusFilter from '../filters/InsulationStatusFilter';
import LoopStatusFilter from '../filters/LoopStatusFilter';
// Import directly without lazy loading
import HitoFilterA from '../filters/HitoFilterA';
import SubsystemFilterA from '../filters/SubsystemFilterA'

const DynamicCalculationPanel = ({ controlData, detailsData, filteredControlData, filteredDetailsData, csvProgressData, filters, onFilteredDataChange, onFilteredControlDataChange, onLoopFilteredControlDataChange, onLoopPropagationChange, onItemsPropagationChange, onProgressFilterVisibilityChange, onItemsFilterVisibilityChange, onLoopFilterVisibilityChange, onProgressPropagationChange, onHitoPropagationChange, onHitoFilterVisibilityChange, onHitoFilteredDataChange, onSubsystemPropagationChange, onSubsystemFilterVisibilityChange, onSubsystemFilteredDataChange, onProgressTableVisibilityChange, onBringToFront }) => {
  // Determine tab context based on data structure
  const isSubsystemsTab = controlData && detailsData && 
    controlData[0] && ('subsystem' in controlData[0] || 'serialNumber' in controlData[0]);
  const tabName = isSubsystemsTab ? 'summarySubsystems' : 'instrumentsReport';
  
  const { sqlState, updateQuery } = usePersistentSQLState(tabName);
  const [sqlQuery, setSqlQuery] = useState(sqlState.query || `SELECT SUM(total_insulation) AS "Total Insul _Global"
FROM "Subsystem Overview";

SELECT SUM(done_insulation) AS "Done Insul _Local"
FROM "Subsystem Overview";`);
  const [metricCards, setMetricCards] = useState([]);
  const [lockedCards, setLockedCards] = useState(new Set());
  const [deletedCards, setDeletedCards] = useState(new Set());
  const [isInterfaceVisible, setIsInterfaceVisible] = useState(true);
  const [showFieldSuggestions, setShowFieldSuggestions] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);

  const [isLoopFilterVisible, setIsLoopFilterVisible] = useState(false);
  const [isInsulFilterVisible, setIsInsulFilterVisible] = useState(false);
  const [isHitoFilterVisible, setIsHitoFilterVisible] = useState(false);
  const [isSubsystemFilterAVisible, setIsSubsystemFilterAVisible] = useState(false);
  const [isProgressTableVisible, setIsProgressTableVisible] = useState(true);
  const textareaRef = useRef(null);

  // Restore query from persistent state
  useEffect(() => {
    if (sqlState.query && sqlState.query !== sqlQuery) {
      setSqlQuery(sqlState.query);
    }
  }, [sqlState.query]);
  
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
  
  // Log available tables and fields for debugging
  React.useEffect(() => {
    if (tableInfo && Object.keys(tableInfo).length > 0) {
      console.log('Available tables:', Object.keys(tableInfo));
      Object.entries(tableInfo).forEach(([tableName, info]) => {
        console.log(`Fields in ${tableName}:`, info.fields);
      });
    }
  }, [tableInfo]);

  // Tab context already determined above

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // Color mapping for metric cards - matching SummarySubsystemsTableA.js header colors
  const getMetricColor = useMemo(() => {
    const colorMap = {
      subsystem: '#007598', hito: '#007598', description: '#007598', fluid: '#007598',
      insulation: '#CEC19B',
      insul: '#CEC19B',
      loop: '#7CA2C5',
      inst: '#977AA3',
      tracing: '#09A7A3',
      punch: '#687F9D',
      items:'#B03052',
      'total isos': '#007598',
      'total test pack': '#7CA2C5',
      'total scope teiga': '#977AA3',
      'total scope siemsa': '#977AA3',
      'total installed teiga': '#977AA3',
      'total installed': '#977AA3',
      'trac yes': '#09A7A3',
      'total items': '#B03052'
    };
    
    return (metricName) => {
      const name = metricName.toLowerCase();
      for (const key in colorMap) {
        if (name.includes(key)) return colorMap[key];
      }
      return '#E2E8F0';
    };
  }, []);

  const handleExecute = () => {
    if (!sqlQuery.trim()) return;
    setDeletedCards(new Set()); // Clear deleted cards on new query
    
    // Clear any stale cached results before executing new query
    const cacheKey = `${tabName}_sqlState`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        const age = Date.now() - (parsed.timestamp || 0);
        if (age > 300000) { // 5 minutes
          localStorage.removeItem(cacheKey);
          console.log('Cleared stale calculation cache');
        }
      } catch (e) {
        localStorage.removeItem(cacheKey);
      }
    }
    
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
  const getAllFieldNames = useMemo(() => {
    const fields = new Set();
    const tableInfoValues = Object.values(tableInfo);
    for (let i = 0; i < tableInfoValues.length; i++) {
      const info = tableInfoValues[i];
      for (let j = 0; j < info.fields.length; j++) {
        fields.add(info.fields[j]);
      }
    }
    return Array.from(fields).sort();
  }, [tableInfo]);

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

  // Update metric cards when calculations change or filtered data changes
  React.useEffect(() => {
    if (calculations.length > 0) {
      // Create a unique key for each calculation to prevent duplicates
      const newCards = [];
      for (let rowIdx = 0; rowIdx < calculations.length; rowIdx++) {
        const row = calculations[rowIdx];
        const entries = Object.entries(row);
        for (let entryIdx = 0; entryIdx < entries.length; entryIdx++) {
          const [key, value] = entries[entryIdx];
          const cleanKey = key.replace(/_Local$|_Global$/, '');
          const scope = key.endsWith('_Local') ? 'LOCAL' : key.endsWith('_Global') ? 'GLOBAL' : null;
          newCards.push({
            id: `${rowIdx}-${entryIdx}-${key}`,
            key: cleanKey,
            value,
            scope,
            timestamp: Date.now(),
            originalKey: key
          });
        }
      }
      
      // Auto-lock all Global metrics
      const globalCardIds = [];
      for (let i = 0; i < newCards.length; i++) {
        if (newCards[i].scope === 'GLOBAL') {
          globalCardIds.push(newCards[i].id);
        }
      }
      
      setLockedCards(prev => {
        const newLockedCards = new Set(prev);
        globalCardIds.forEach(id => newLockedCards.add(id));
        return newLockedCards;
      });
      
      setMetricCards(prev => {
        // Keep existing cards that haven't been manually deleted
        const existingCards = prev.filter(card => !deletedCards.has(card.id));
        
        // Add only truly new cards that don't exist yet and haven't been deleted
        const trulyNewCards = newCards.filter(newCard => 
          !prev.some(existingCard => 
            (existingCard.originalKey === newCard.originalKey || 
             (existingCard.key === newCard.key && existingCard.scope === newCard.scope))
          ) && !deletedCards.has(newCard.id)
        );
        
        // For all existing cards, update values based on scope and lock status
        const updatedExistingCards = existingCards.map(existingCard => {
          // Always update Local metrics regardless of lock status
          if (existingCard.scope === 'LOCAL') {
            // Find matching new card by key and scope
            const matchingNewCard = newCards.find(nc => 
              nc.key === existingCard.key && nc.scope === 'LOCAL'
            );
            if (matchingNewCard) {
              return { ...existingCard, value: matchingNewCard.value, timestamp: Date.now() };
            }
          }
          // For other cards, only update if not locked
          else if (!lockedCards.has(existingCard.id)) {
            const newCard = newCards.find(nc => nc.id === existingCard.id);
            if (newCard) {
              return newCard;
            }
          }
          return existingCard;
        });
        
        const finalCards = [...updatedExistingCards, ...trulyNewCards];
        
        // Save metric cards to persistent state
        updateQuery(sqlQuery, finalCards);
        
        return finalCards;
      });
    }
  }, [calculations, lockedCards, deletedCards, sqlQuery, updateQuery, filteredControlData, filteredDetailsData]);

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
    <Box 
      bg={bgColor} 
      border="1px" 
      borderColor={borderColor} 
      borderRadius="md" 
      p={2} 
      mt={2}
    >
      <VStack spacing={2} align="stretch">
        <HStack justify="space-between" align="center">
          <Text fontSize="sm" fontWeight="bold" color="blue.600">
            SQL Query Interface
          </Text>
          <HStack spacing={2}>

            <IconButton
              icon={<MdCheckCircle />}
              size="sm"
              variant="ghost"
              onClick={() => {
                const newVisibility = !isInsulFilterVisible;
                setIsInsulFilterVisible(newVisibility);
                if (onItemsFilterVisibilityChange) {
                  onItemsFilterVisibilityChange(newVisibility);
                }
              }}
              aria-label="Toggle insulation status filter"
              title="Insul Status Filter"
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
              icon={<MdCategory />}
              size="sm"
              variant="ghost"
              onClick={() => {
                const newVisibility = !isSubsystemFilterAVisible;
                setIsSubsystemFilterAVisible(newVisibility);
                if (onSubsystemFilterVisibilityChange) {
                  onSubsystemFilterVisibilityChange(newVisibility);
                }
              }}
              aria-label="Toggle subsystem "
              title="Subsystem Filter"
            />
            <IconButton
              icon={<MdPrecisionManufacturing />}
              size="sm"
              variant="ghost"
              onClick={() => {
                const newVisibility = !isProgressTableVisible;
                setIsProgressTableVisible(newVisibility);
                if (onProgressTableVisibilityChange) {
                  onProgressTableVisibilityChange(newVisibility);
                }
              }}
              aria-label="Toggle progress table"
              title="Toggle Progress Table"
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
                      <Button size="xs" variant="outline" onClick={() => addMetricQuery('SELECT COUNT(DISTINCT subsystem) AS "Total Subsystems _Global"\nFROM "Subsystem Overview";\n\nSELECT COUNT(DISTINCT subsystem) AS "Total Subsystems _Local"\nFROM "Subsystem Overview";')}>
                        Total Subsystems
                      </Button>
                      <Button size="xs" variant="outline" onClick={() => addMetricQuery('SELECT SUM(total_items) AS "Total Items _Global"\nFROM "Subsystem Overview";\n\nSELECT SUM(total_items) AS "Total Items _Local"\nFROM "Subsystem Overview";')}>
                        Total Items
                      </Button>
                      <Button size="xs" variant="outline" onClick={() => addMetricQuery('SELECT SUM(done_items) AS "Total Done Items _Global"\nFROM "Subsystem Overview";\n\nSELECT SUM(done_items) AS "Total Done Items _Local"\nFROM "Subsystem Overview";')}>
                        Total Done Items
                      </Button>
                      <Button size="xs" variant="outline" onClick={() => addMetricQuery('SELECT SUM(pending_items) AS "Total Pending Items _Global"\nFROM "Subsystem Overview";\n\nSELECT SUM(pending_items) AS "Total Pending Items _Local"\nFROM "Subsystem Overview";')}>
                        Total Pending Items
                      </Button>
                      <Button size="xs" variant="outline" onClick={() => addMetricQuery('SELECT SUM(total_insulation) AS "Total Insul _Global"\nFROM "Subsystem Overview";\n\nSELECT SUM(total_insulation) AS "Total Insul _Local"\nFROM "Subsystem Overview";')}>
                        Total Insul
                      </Button>
                      <Button size="xs" variant="outline" onClick={() => addMetricQuery('SELECT SUM(done_insulation) AS "Done Insul _Global"\nFROM "Subsystem Overview";\n\nSELECT SUM(done_insulation) AS "Done Insul _Local"\nFROM "Subsystem Overview";')}>
                        Done Insul
                      </Button>
                      <Button size="xs" variant="outline" onClick={() => addMetricQuery('SELECT SUM(pending_insulation) AS "Pending Insul _Global"\nFROM "Subsystem Overview";\n\nSELECT SUM(pending_insulation) AS "Pending Insul _Local"\nFROM "Subsystem Overview";')}>
                        Pending Insul
                      </Button>
                      <Button size="xs" variant="outline" onClick={() => addMetricQuery('SELECT SUM(total_loop) AS "Total Loops _Global"\nFROM "Subsystem Overview";\n\nSELECT SUM(total_loop) AS "Total Loops _Local"\nFROM "Subsystem Overview";')}>
                        Total Loops
                      </Button>
                      <Button size="xs" variant="outline" onClick={() => addMetricQuery('SELECT SUM(done_loop) AS "Done Insul _Global"\nFROM "Subsystem Overview";\n\nSELECT SUM(done_loop) AS "Done Loops _Local"\nFROM "Subsystem Overview";')}>
                        Done Loops
                      </Button>
                      <Button size="xs" variant="outline" onClick={() => addMetricQuery('SELECT SUM(pending_loop) AS "Pending Loops _Global"\nFROM "Subsystem Overview";\n\nSELECT SUM(pending_loop) AS "Pending Loops _Local"\nFROM "Subsystem Overview";')}>
                        Pending Loops
                      </Button>
                      <Button size="xs" variant="outline" onClick={() => addMetricQuery('SELECT SUM(total_inst) AS "Total Inst _Global"\nFROM "Subsystem Overview";\n\nSELECT SUM(total_inst) AS "Total Inst _Local"\nFROM "Subsystem Overview";')}>
                        Total Inst
                      </Button>
                      <Button size="xs" variant="outline" onClick={() => addMetricQuery('SELECT SUM(done_inst) AS "Done Inst _Global"\nFROM "Subsystem Overview";\n\nSELECT SUM(done_inst) AS "Done Inst _Local"\nFROM "Subsystem Overview";')}>
                        Done Inst
                      </Button>
                      <Button size="xs" variant="outline" onClick={() => addMetricQuery('SELECT SUM(pending_inst) AS "Pending Inst _Global"\nFROM "Subsystem Overview";\n\nSELECT SUM(pending_inst) AS "Pending Inst _Local"\nFROM "Subsystem Overview";')}>
                        Pending Inst
                      </Button>
                      <Button size="xs" variant="outline" onClick={() => addMetricQuery('SELECT SUM(total_tracing) AS "Total Tracing _Global"\nFROM "Subsystem Overview";\n\nSELECT SUM(total_tracing) AS "Total Tracing _Local"\nFROM "Subsystem Overview";')}>
                        Total Tracing
                      </Button>
                      <Button size="xs" variant="outline" onClick={() => addMetricQuery('SELECT SUM(done_tracing) AS "Done Tracing _Global"\nFROM "Subsystem Overview";\n\nSELECT SUM(done_tracing) AS "Done Tracing _Local"\nFROM "Subsystem Overview";')}>
                        Done Tracing
                      </Button>
                      <Button size="xs" variant="outline" onClick={() => addMetricQuery('SELECT SUM(pending_tracing) AS "Pending Tracing _Global"\nFROM "Subsystem Overview";\n\nSELECT SUM(pending_tracing) AS "Pending Tracing _Local"\nFROM "Subsystem Overview";')}>
                        Pending Tracing
                      </Button>
                      <Button size="xs" variant="outline" onClick={() => addMetricQuery('SELECT SUM(total_punch) AS "Total Punch _Global"\nFROM "Subsystem Overview";\n\nSELECT SUM(total_punch) AS "Total Punch _Local"\nFROM "Subsystem Overview";')}>
                        Total Punch
                      </Button>
                      <Button size="xs" variant="outline" onClick={() => addMetricQuery('SELECT SUM(pending_punch) AS "Pending Punch _Global"\nFROM "Subsystem Overview";\n\nSELECT SUM(pending_punch) AS "Pending Punch _Local"\nFROM "Subsystem Overview";')}>
                        Pending Punch
                      </Button>
                      <Button size="xs" variant="outline" onClick={() => addMetricQuery('SELECT SUM(close_punch) AS "Close Punch _Global"\nFROM "Subsystem Overview";\n\nSELECT SUM(close_punch) AS "Close Punch _Local"\nFROM "Subsystem Overview";')}>
                        Close Punch
                      </Button>
                      <Button size="xs" variant="outline" onClick={() => addMetricQuery('SELECT SUM(open_punch) AS "Open Punch _Global"\nFROM "Subsystem Overview";\n\nSELECT SUM(open_punch) AS "Open Punch _Local"\nFROM "Subsystem Overview";')}>
                        Open Punch
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
                      bg={getMetricColor(card.key)}
                      border="3px solid"
                      borderColor={isLocked ? getMetricColor(card.key) : getMetricColor(card.key)}
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
                      bg={getMetricColor(card.key)}
                      border="3px solid"
                      borderColor={isLocked ? getMetricColor(card.key) : getMetricColor(card.key)}
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
                bg={getMetricColor(card.key)}
                border="2px solid"
                borderColor={isLocked ? "orange.300" : getMetricColor(card.key)}
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
      

      
      {isInsulFilterVisible && (
        <InsulStatusFilter
          data={controlData}
          onFilterChange={onFilteredControlDataChange || (() => {})}
          isVisible={isInsulFilterVisible}
          onClose={() => {
            setIsInsulFilterVisible(false);
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
        isSubsystemsTab ? (
          <HitoFilterA
            data={controlData}
            onFilterChange={onFilteredControlDataChange || (() => {})}
            isVisible={isHitoFilterVisible}
            onClose={() => {
              setIsHitoFilterVisible(false);
              if (onHitoFilterVisibilityChange) {
                onHitoFilterVisibilityChange(false);
              }
              // Reset this filter's effect by passing the original data
              if (onFilteredControlDataChange) {
                onFilteredControlDataChange(controlData);
              }
              // Reset propagation if it was active
              if (onHitoPropagationChange) {
                onHitoPropagationChange([], 'nothing');
              }
            }}
            onPropagationChange={onHitoPropagationChange || (() => {})}
            onBringToFront={onBringToFront}
          />
        ) : (
          <HitoFilterA
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
        )
      )}
      
      {isSubsystemFilterAVisible && (
        <SubsystemFilterA
          data={controlData}
          onFilterChange={onSubsystemFilteredDataChange || (() => {})}
          isVisible={isSubsystemFilterAVisible}
          onClose={() => {
            setIsSubsystemFilterAVisible(false);
            if (onSubsystemFilterVisibilityChange) {
              onSubsystemFilterVisibilityChange(false);
            }
            // Reset this filter's effect by passing the original data
            if (onSubsystemFilteredDataChange) {
              onSubsystemFilteredDataChange(controlData);
            }
            // Reset propagation if it was active
            if (onSubsystemPropagationChange) {
              onSubsystemPropagationChange([], 'nothing');
            }
          }}
          onPropagationChange={onSubsystemPropagationChange || (() => {})}
          onBringToFront={onBringToFront}
        />
      )}
    </Box>
  );
};

export default DynamicCalculationPanel;