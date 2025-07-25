import React, { useState, useEffect, useRef } from 'react';
import { Box, List, ListItem, Text } from '@chakra-ui/react';

const SQLIntellisense = ({ value, onChange, onSuggestionSelect, ...textareaProps }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const textareaRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Available fields from both tables
  const tableFields = {
    SummarySubsystemsTableA: [
      'serialNumber', 'fluid', 'subsystem', 'totalItems', 'doneInsul', 
      'pendingInsul', 'description', 'numTestPacks', 'totalLoops',
      'doneLoops', 'pendingLoops'
    ],
    SummarySubsystemsTableB: [
      'subsystem', 'testPack', 'testPackProgress', 'traceados', 
      'priority', 'hito', 'teigaReinstatement', 'teigaInsulation', 
      'siemsa', 'technip'
    ]
  };

  const sqlKeywords = [
    'SELECT', 'FROM', 'WHERE', 'GROUP BY', 'ORDER BY', 'HAVING', 
    'JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'OUTER JOIN',
    'AND', 'OR', 'NOT', 'IN', 'LIKE', 'BETWEEN', 'IS NULL', 'IS NOT NULL',
    'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'DISTINCT', 'AS',
    'LIMIT', 'OFFSET', 'ASC', 'DESC'
  ];

  const allFields = [
    ...Object.keys(tableFields).flatMap(table => 
      tableFields[table].map(field => ({ field, table, type: 'field' }))
    ),
    ...sqlKeywords.map(keyword => ({ field: keyword, type: 'keyword' })),
    ...Object.keys(tableFields).map(table => ({ field: table, type: 'table' }))
  ];

  const getCurrentWord = (text, cursorPos) => {
    const beforeCursor = text.slice(0, cursorPos);
    const afterCursor = text.slice(cursorPos);
    const wordStart = Math.max(
      beforeCursor.lastIndexOf(' '),
      beforeCursor.lastIndexOf('\n'),
      beforeCursor.lastIndexOf('('),
      beforeCursor.lastIndexOf(',')
    ) + 1;
    const wordEnd = Math.min(
      afterCursor.search(/[\s\n(),]/) === -1 ? afterCursor.length : afterCursor.search(/[\s\n(),]/),
      afterCursor.length
    );
    
    return {
      word: beforeCursor.slice(wordStart) + afterCursor.slice(0, wordEnd),
      start: wordStart,
      end: cursorPos + wordEnd
    };
  };

  const filterSuggestions = (word) => {
    if (!word || word.length < 1) return [];
    
    return allFields
      .filter(item => 
        item.field.toLowerCase().includes(word.toLowerCase())
      )
      .slice(0, 10);
  };

  const handleTextareaChange = (e) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart;
    
    onChange(e);
    
    const { word } = getCurrentWord(newValue, cursorPos);
    const filtered = filterSuggestions(word);
    
    setSuggestions(filtered);
    setShowSuggestions(filtered.length > 0 && word.length > 0);
    setSelectedIndex(0);
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, suggestions.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Tab':
      case 'Enter':
        if (suggestions[selectedIndex]) {
          e.preventDefault();
          selectSuggestion(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        break;
    }
  };

  const selectSuggestion = (suggestion) => {
    const textarea = textareaRef.current;
    const cursorPos = textarea.selectionStart;
    const { word, start } = getCurrentWord(value, cursorPos);
    
    const newValue = value.slice(0, start) + suggestion.field + value.slice(start + word.length);
    const newCursorPos = start + suggestion.field.length;
    
    onChange({ target: { value: newValue } });
    setShowSuggestions(false);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
    
    if (onSuggestionSelect) {
      onSuggestionSelect(suggestion);
    }
  };

  const handleBlur = () => {
    setTimeout(() => setShowSuggestions(false), 150);
  };

  return (
    <Box position="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleTextareaChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        style={{
          width: '100%',
          minHeight: '150px',
          padding: '8px',
          border: '1px solid #e2e8f0',
          borderRadius: '6px',
          fontFamily: 'monospace',
          fontSize: '14px',
          resize: 'vertical'
        }}
        {...textareaProps}
      />
      
      {showSuggestions && suggestions.length > 0 && (
        <Box
          ref={suggestionsRef}
          position="absolute"
          top="100%"
          left={0}
          right={0}
          bg="white"
          border="1px solid"
          borderColor="gray.200"
          borderRadius="md"
          boxShadow="lg"
          zIndex={1000}
          maxH="200px"
          overflowY="auto"
        >
          <List spacing={0}>
            {suggestions.map((suggestion, index) => (
              <ListItem
                key={`${suggestion.field}-${suggestion.type}`}
                px={3}
                py={2}
                cursor="pointer"
                bg={index === selectedIndex ? 'blue.50' : 'white'}
                _hover={{ bg: 'blue.50' }}
                onClick={() => selectSuggestion(suggestion)}
                borderBottom={index < suggestions.length - 1 ? '1px solid' : 'none'}
                borderColor="gray.100"
              >
                <Text fontSize="sm" fontFamily="monospace">
                  <Text as="span" fontWeight="bold" color={
                    suggestion.type === 'keyword' ? 'blue.600' :
                    suggestion.type === 'table' ? 'green.600' : 'purple.600'
                  }>
                    {suggestion.field}
                  </Text>
                  {suggestion.table && (
                    <Text as="span" fontSize="xs" color="gray.500" ml={2}>
                      ({suggestion.table})
                    </Text>
                  )}
                  <Text as="span" fontSize="xs" color="gray.400" ml={1}>
                    {suggestion.type}
                  </Text>
                </Text>
              </ListItem>
            ))}
          </List>
        </Box>
      )}
    </Box>
  );
};

export default SQLIntellisense;