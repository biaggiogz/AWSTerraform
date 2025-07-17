/**
 * SQLEditor.solid.jsx
 * Advanced SQL editor with Monaco integration
 * 
 * Features:
 * - VS Code-like SQL editor
 * - Interactive schema browser
 * - Browsable query history
 * - Shareable query links
 * - Multiple export formats
 */

import { createSignal, createEffect, onMount, onCleanup, For, Show } from 'solid-js';
import { createStore } from 'solid-js/store';

/**
 * SQLEditor component
 * @param {Object} props - Component props
 * @param {Array} props.tables - Available tables
 * @param {Function} props.onExecuteQuery - Query execution callback
 * @param {Array} props.queryHistory - Query history
 * @param {boolean} props.isLoading - Loading state
 */
const SQLEditor = (props) => {
  // Monaco editor instance
  let monacoEditor = null;
  let editorContainer;
  
  // Component state
  const [query, setQuery] = createSignal('SELECT * FROM summarysubsytems LIMIT 100;');
  const [selectedSchema, setSelectedSchema] = createSignal(null);
  const [schemaData, setSchemaData] = createStore({});
  const [showHistory, setShowHistory] = createSignal(false);
  const [showSchema, setShowSchema] = createSignal(true);
  
  // Initialize Monaco editor
  const initMonaco = async () => {
    if (window.monaco) {
      createEditor();
      return;
    }
    
    // Load Monaco dynamically
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/monaco-editor@0.33.0/min/vs/loader.js';
    script.async = true;
    
    script.onload = () => {
      window.require.config({
        paths: { 'vs': 'https://cdn.jsdelivr.net/npm/monaco-editor@0.33.0/min/vs' }
      });
      
      window.require(['vs/editor/editor.main'], () => {
        // Register SQL language
        registerSQLLanguage();
        
        // Create editor
        createEditor();
      });
    };
    
    document.body.appendChild(script);
  };
  
  // Register SQL language with custom completions
  const registerSQLLanguage = () => {
    if (!window.monaco) return;
    
    // Register SQL language features
    window.monaco.languages.registerCompletionItemProvider('sql', {
      provideCompletionItems: (model, position) => {
        const textUntilPosition = model.getValueInRange({
          startLineNumber: position.lineNumber,
          startColumn: 1,
          endLineNumber: position.lineNumber,
          endColumn: position.column
        });
        
        const suggestions = [];
        
        // SQL keywords
        const keywords = [
          'SELECT', 'FROM', 'WHERE', 'JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN',
          'GROUP BY', 'ORDER BY', 'HAVING', 'LIMIT', 'OFFSET', 'UNION', 'UNION ALL',
          'INSERT INTO', 'UPDATE', 'DELETE FROM', 'CREATE TABLE', 'ALTER TABLE',
          'DROP TABLE', 'AS', 'ON', 'AND', 'OR', 'NOT', 'IN', 'LIKE', 'BETWEEN',
          'IS NULL', 'IS NOT NULL', 'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'DISTINCT'
        ];
        
        // Add keyword suggestions
        keywords.forEach(keyword => {
          suggestions.push({
            label: keyword,
            kind: window.monaco.languages.CompletionItemKind.Keyword,
            insertText: keyword,
            detail: 'SQL keyword'
          });
        });
        
        // Add table suggestions
        props.tables.forEach(table => {
          suggestions.push({
            label: table,
            kind: window.monaco.languages.CompletionItemKind.Class,
            insertText: table,
            detail: 'Table'
          });
          
          // Add column suggestions if schema is available
          if (schemaData[table]) {
            schemaData[table].forEach(column => {
              suggestions.push({
                label: `${table}.${column.name}`,
                kind: window.monaco.languages.CompletionItemKind.Field,
                insertText: `${table}.${column.name}`,
                detail: `Column (${column.type})`
              });
            });
          }
        });
        
        return { suggestions };
      }
    });
  };
  
  // Create Monaco editor
  const createEditor = () => {
    if (!window.monaco || !editorContainer) return;
    
    // Create editor
    monacoEditor = window.monaco.editor.create(editorContainer, {
      value: query(),
      language: 'sql',
      theme: 'vs-dark',
      automaticLayout: true,
      minimap: { enabled: true },
      lineNumbers: 'on',
      scrollBeyondLastLine: false,
      wordWrap: 'on',
      fontSize: 14,
      tabSize: 2
    });
    
    // Add change listener
    monacoEditor.onDidChangeModelContent(() => {
      setQuery(monacoEditor.getValue());
    });
    
    // Add keyboard shortcuts
    monacoEditor.addCommand(
      window.monaco.KeyMod.CtrlCmd | window.monaco.KeyCode.Enter,
      () => handleExecuteQuery()
    );
  };
  
  // Load table schema
  const loadTableSchema = async (tableName) => {
    try {
      // Execute DESCRIBE query to get table schema
      const result = await props.onExecuteQuery(`DESCRIBE ${tableName}`);
      
      if (result.success) {
        // Extract column information
        const columns = result.data.map(row => ({
          name: row.column_name,
          type: row.column_type,
          nullable: row.null === 'YES'
        }));
        
        // Update schema data
        setSchemaData(tableName, columns);
        
        // Set as selected schema
        setSelectedSchema(tableName);
      }
    } catch (error) {
      console.error(`Error loading schema for ${tableName}:`, error);
    }
  };
  
  // Handle query execution
  const handleExecuteQuery = () => {
    const currentQuery = query();
    if (!currentQuery.trim()) return;
    
    props.onExecuteQuery(currentQuery);
  };
  
  // Handle history item selection
  const handleSelectHistoryItem = (item) => {
    setQuery(item.query);
    if (monacoEditor) {
      monacoEditor.setValue(item.query);
    }
  };
  
  // Handle schema item selection
  const handleSelectSchemaItem = (tableName) => {
    // Load schema if not already loaded
    if (!schemaData[tableName]) {
      loadTableSchema(tableName);
    } else {
      setSelectedSchema(tableName);
    }
  };
  
  // Insert table or column into editor
  const handleInsertIntoEditor = (text) => {
    if (!monacoEditor) return;
    
    const selection = monacoEditor.getSelection();
    monacoEditor.executeEdits('insert', [
      {
        range: selection,
        text,
        forceMoveMarkers: true
      }
    ]);
    
    monacoEditor.focus();
  };
  
  // Format SQL query
  const handleFormatQuery = () => {
    if (!monacoEditor) return;
    
    // Simple SQL formatting (in a real implementation, use a proper SQL formatter)
    const sql = monacoEditor.getValue();
    
    // Split by keywords
    const formattedSQL = sql
      .replace(/\s+/g, ' ')
      .replace(/\s*,\s*/g, ', ')
      .replace(/\(\s*/g, '(')
      .replace(/\s*\)/g, ')')
      .replace(/\s*=\s*/g, ' = ')
      .replace(/\s*>\s*/g, ' > ')
      .replace(/\s*<\s*/g, ' < ')
      .replace(/\s*SELECT\s+/gi, 'SELECT\n  ')
      .replace(/\s*FROM\s+/gi, '\nFROM\n  ')
      .replace(/\s*WHERE\s+/gi, '\nWHERE\n  ')
      .replace(/\s*AND\s+/gi, '\n  AND ')
      .replace(/\s*OR\s+/gi, '\n  OR ')
      .replace(/\s*GROUP BY\s+/gi, '\nGROUP BY\n  ')
      .replace(/\s*ORDER BY\s+/gi, '\nORDER BY\n  ')
      .replace(/\s*HAVING\s+/gi, '\nHAVING\n  ')
      .replace(/\s*LIMIT\s+/gi, '\nLIMIT ');
    
    monacoEditor.setValue(formattedSQL);
    setQuery(formattedSQL);
  };
  
  // Share query as URL
  const handleShareQuery = () => {
    const encodedQuery = encodeURIComponent(query());
    const url = `${window.location.origin}${window.location.pathname}?sql=${encodedQuery}`;
    
    // Copy to clipboard
    navigator.clipboard.writeText(url)
      .then(() => {
        alert('Query URL copied to clipboard!');
      })
      .catch(err => {
        console.error('Failed to copy URL:', err);
        alert('Failed to copy URL. Please copy it manually.');
      });
  };
  
  // Clear editor
  const handleClearEditor = () => {
    if (monacoEditor) {
      monacoEditor.setValue('');
    }
    setQuery('');
  };
  
  // Check for query in URL on mount
  const checkQueryInUrl = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const sqlParam = urlParams.get('sql');
    
    if (sqlParam) {
      const decodedQuery = decodeURIComponent(sqlParam);
      setQuery(decodedQuery);
      if (monacoEditor) {
        monacoEditor.setValue(decodedQuery);
      }
    }
  };
  
  // Initialize on mount
  onMount(() => {
    initMonaco();
    checkQueryInUrl();
    
    // Load schema for first table
    if (props.tables.length > 0) {
      loadTableSchema(props.tables[0]);
    }
  });
  
  // Clean up on unmount
  onCleanup(() => {
    if (monacoEditor) {
      monacoEditor.dispose();
    }
  });
  
  return (
    <div class="sql-editor">
      <div class="sql-editor-header">
        <h2>SQL Editor</h2>
        <div class="toolbar">
          <button 
            class="toolbar-button"
            onClick={handleExecuteQuery}
            disabled={props.isLoading}
          >
            {props.isLoading ? 'Executing...' : 'Execute (Ctrl+Enter)'}
          </button>
          
          <button 
            class="toolbar-button"
            onClick={handleFormatQuery}
          >
            Format SQL
          </button>
          
          <button 
            class="toolbar-button"
            onClick={handleShareQuery}
          >
            Share Query
          </button>
          
          <button 
            class="toolbar-button"
            onClick={handleClearEditor}
          >
            Clear
          </button>
          
          <button 
            class={`toolbar-button toggle ${showSchema() ? 'active' : ''}`}
            onClick={() => setShowSchema(!showSchema())}
          >
            Schema Browser
          </button>
          
          <button 
            class={`toolbar-button toggle ${showHistory() ? 'active' : ''}`}
            onClick={() => setShowHistory(!showHistory())}
          >
            Query History
          </button>
        </div>
      </div>
      
      <div class="sql-editor-content">
        <Show when={showSchema()}>
          <div class="schema-browser">
            <h3>Schema Browser</h3>
            <div class="table-list">
              <For each={props.tables}>
                {(table) => (
                  <div 
                    class={`table-item ${selectedSchema() === table ? 'selected' : ''}`}
                    onClick={() => handleSelectSchemaItem(table)}
                  >
                    <span class="table-icon">📋</span>
                    <span class="table-name">{table}</span>
                  </div>
                )}
              </For>
            </div>
            
            <Show when={selectedSchema() && schemaData[selectedSchema()]}>
              <div class="column-list">
                <h4>{selectedSchema()}</h4>
                <For each={schemaData[selectedSchema()]}>
                  {(column) => (
                    <div 
                      class="column-item"
                      onClick={() => handleInsertIntoEditor(`${selectedSchema()}.${column.name}`)}
                    >
                      <span class="column-icon">🔹</span>
                      <span class="column-name">{column.name}</span>
                      <span class="column-type">{column.type}</span>
                    </div>
                  )}
                </For>
              </div>
            </Show>
          </div>
        </Show>
        
        <div class="editor-container" ref={editorContainer}></div>
        
        <Show when={showHistory()}>
          <div class="query-history">
            <h3>Query History</h3>
            <div class="history-list">
              <For each={props.queryHistory}>
                {(item) => (
                  <div 
                    class={`history-item ${item.success ? 'success' : 'error'}`}
                    onClick={() => handleSelectHistoryItem(item)}
                  >
                    <div class="history-query">{item.query.substring(0, 50)}...</div>
                    <div class="history-meta">
                      <span class="history-time">{new Date(item.timestamp).toLocaleTimeString()}</span>
                      <span class="history-status">{item.success ? 'Success' : 'Error'}</span>
                      <span class="history-rows">{item.resultRowCount} rows</span>
                      <span class="history-time">{item.executionTime.toFixed(2)}ms</span>
                    </div>
                  </div>
                )}
              </For>
            </div>
          </div>
        </Show>
      </div>
    </div>
  );
};

export default SQLEditor;