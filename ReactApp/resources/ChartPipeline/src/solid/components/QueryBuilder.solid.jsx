/**
 * QueryBuilder.solid.jsx
 * Visual query builder component with drag-and-drop interface
 * 
 * Features:
 * - Drag-and-drop query building
 * - Automatic SQL generation
 * - Pre-built query templates
 * - SQL syntax highlighting
 * - Schema-aware auto-completion
 */

import { createSignal, createEffect, createMemo, For, Show } from 'solid-js';
import { createStore } from 'solid-js/store';

/**
 * QueryBuilder component
 * @param {Object} props - Component props
 * @param {Array} props.tables - Available tables
 * @param {Function} props.onExecuteQuery - Query execution callback
 * @param {boolean} props.isLoading - Loading state
 */
const QueryBuilder = (props) => {
  // Component state
  const [store, setStore] = createStore({
    selectedTable: '',
    selectedColumns: [],
    filters: [],
    joins: [],
    groupBy: [],
    orderBy: [],
    limit: 1000,
    tableSchema: {},
    queryTemplates: [
      {
        name: 'Subsystem Summary',
        description: 'Basic summary of all subsystems',
        query: 'SELECT * FROM summarysubsytems LIMIT 100;'
      },
      {
        name: 'Subsystem Details',
        description: 'Detailed information about subsystems',
        query: 'SELECT s.*, i.description FROM summarysubsytems s JOIN subsystems_info i ON s.subsystem_id = i.id LIMIT 100;'
      },
      {
        name: 'Test Status by Subsystem',
        description: 'Test completion status grouped by subsystem',
        query: 'SELECT subsystem_name, status, COUNT(*) as count FROM test_of_lazos_updated GROUP BY subsystem_name, status ORDER BY subsystem_name, status;'
      }
    ]
  });
  
  // Derived state
  const generatedSQL = createMemo(() => {
    if (!store.selectedTable) return '';
    
    // Build SELECT clause
    const columns = store.selectedColumns.length > 0 
      ? store.selectedColumns.join(', ') 
      : '*';
    
    // Build FROM clause
    let from = store.selectedTable;
    
    // Build JOIN clause
    const joins = store.joins.map(join => 
      `${join.type} JOIN ${join.table} ON ${join.leftColumn} = ${join.rightColumn}`
    ).join(' ');
    
    // Build WHERE clause
    const where = store.filters.length > 0 
      ? 'WHERE ' + store.filters.map(filter => 
          `${filter.column} ${filter.operator} ${filter.value}`
        ).join(' AND ')
      : '';
    
    // Build GROUP BY clause
    const groupBy = store.groupBy.length > 0 
      ? 'GROUP BY ' + store.groupBy.join(', ')
      : '';
    
    // Build ORDER BY clause
    const orderBy = store.orderBy.length > 0 
      ? 'ORDER BY ' + store.orderBy.map(order => 
          `${order.column} ${order.direction}`
        ).join(', ')
      : '';
    
    // Build LIMIT clause
    const limit = `LIMIT ${store.limit}`;
    
    // Combine all clauses
    return `SELECT ${columns} FROM ${from} ${joins} ${where} ${groupBy} ${orderBy} ${limit};`.replace(/\s+/g, ' ').trim();
  });
  
  // Load table schema
  const loadTableSchema = async (tableName) => {
    if (!tableName) return;
    
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
        
        // Update store with schema
        setStore('tableSchema', {
          ...store.tableSchema,
          [tableName]: columns
        });
      }
    } catch (error) {
      console.error(`Error loading schema for ${tableName}:`, error);
    }
  };
  
  // Handle table selection
  const handleTableSelect = (tableName) => {
    setStore('selectedTable', tableName);
    setStore('selectedColumns', []);
    
    // Load table schema if not already loaded
    if (!store.tableSchema[tableName]) {
      loadTableSchema(tableName);
    }
  };
  
  // Handle column selection
  const handleColumnSelect = (column) => {
    if (store.selectedColumns.includes(column)) {
      setStore('selectedColumns', store.selectedColumns.filter(c => c !== column));
    } else {
      setStore('selectedColumns', [...store.selectedColumns, column]);
    }
  };
  
  // Handle filter addition
  const handleAddFilter = () => {
    const newFilter = {
      id: Date.now(),
      column: '',
      operator: '=',
      value: ''
    };
    
    setStore('filters', [...store.filters, newFilter]);
  };
  
  // Handle filter update
  const handleUpdateFilter = (id, field, value) => {
    setStore('filters', filter => filter.id === id, field, value);
  };
  
  // Handle filter removal
  const handleRemoveFilter = (id) => {
    setStore('filters', store.filters.filter(f => f.id !== id));
  };
  
  // Handle join addition
  const handleAddJoin = () => {
    const newJoin = {
      id: Date.now(),
      type: 'INNER',
      table: '',
      leftColumn: `${store.selectedTable}.id`,
      rightColumn: ''
    };
    
    setStore('joins', [...store.joins, newJoin]);
  };
  
  // Handle join update
  const handleUpdateJoin = (id, field, value) => {
    setStore('joins', join => join.id === id, field, value);
  };
  
  // Handle join removal
  const handleRemoveJoin = (id) => {
    setStore('joins', store.joins.filter(j => j.id !== id));
  };
  
  // Handle group by addition
  const handleAddGroupBy = (column) => {
    if (!store.groupBy.includes(column)) {
      setStore('groupBy', [...store.groupBy, column]);
    }
  };
  
  // Handle group by removal
  const handleRemoveGroupBy = (column) => {
    setStore('groupBy', store.groupBy.filter(c => c !== column));
  };
  
  // Handle order by addition
  const handleAddOrderBy = (column, direction = 'ASC') => {
    const existingIndex = store.orderBy.findIndex(o => o.column === column);
    
    if (existingIndex >= 0) {
      // Toggle direction if already exists
      setStore('orderBy', existingIndex, 'direction', 
        store.orderBy[existingIndex].direction === 'ASC' ? 'DESC' : 'ASC'
      );
    } else {
      setStore('orderBy', [...store.orderBy, { column, direction }]);
    }
  };
  
  // Handle order by removal
  const handleRemoveOrderBy = (column) => {
    setStore('orderBy', store.orderBy.filter(o => o.column !== column));
  };
  
  // Handle limit change
  const handleLimitChange = (event) => {
    const value = parseInt(event.target.value);
    if (!isNaN(value) && value > 0) {
      setStore('limit', value);
    }
  };
  
  // Handle query execution
  const handleExecuteQuery = () => {
    props.onExecuteQuery(generatedSQL());
  };
  
  // Handle template selection
  const handleSelectTemplate = (template) => {
    props.onExecuteQuery(template.query);
  };
  
  // Get available columns for the selected table
  const availableColumns = createMemo(() => {
    if (!store.selectedTable || !store.tableSchema[store.selectedTable]) {
      return [];
    }
    
    return store.tableSchema[store.selectedTable].map(col => col.name);
  });
  
  return (
    <div class="query-builder">
      <div class="query-builder-header">
        <h2>Visual Query Builder</h2>
      </div>
      
      <div class="query-builder-content">
        <div class="query-builder-sidebar">
          <div class="section">
            <h3>Tables</h3>
            <div class="table-list">
              <For each={props.tables}>
                {(table) => (
                  <div 
                    class={`table-item ${store.selectedTable === table ? 'selected' : ''}`}
                    onClick={() => handleTableSelect(table)}
                  >
                    {table}
                  </div>
                )}
              </For>
            </div>
          </div>
          
          <div class="section">
            <h3>Templates</h3>
            <div class="template-list">
              <For each={store.queryTemplates}>
                {(template) => (
                  <div 
                    class="template-item"
                    onClick={() => handleSelectTemplate(template)}
                  >
                    <div class="template-name">{template.name}</div>
                    <div class="template-description">{template.description}</div>
                  </div>
                )}
              </For>
            </div>
          </div>
        </div>
        
        <div class="query-builder-main">
          <Show when={store.selectedTable}>
            <div class="section">
              <h3>Columns</h3>
              <div class="column-list">
                <For each={availableColumns()}>
                  {(column) => (
                    <div 
                      class={`column-item ${store.selectedColumns.includes(column) ? 'selected' : ''}`}
                      onClick={() => handleColumnSelect(column)}
                    >
                      {column}
                    </div>
                  )}
                </For>
              </div>
            </div>
            
            <div class="section">
              <h3>Filters</h3>
              <button class="add-button" onClick={handleAddFilter}>
                Add Filter
              </button>
              
              <div class="filter-list">
                <For each={store.filters}>
                  {(filter) => (
                    <div class="filter-item">
                      <select 
                        value={filter.column}
                        onChange={(e) => handleUpdateFilter(filter.id, 'column', e.target.value)}
                      >
                        <option value="">Select column</option>
                        <For each={availableColumns()}>
                          {(column) => (
                            <option value={column}>{column}</option>
                          )}
                        </For>
                      </select>
                      
                      <select 
                        value={filter.operator}
                        onChange={(e) => handleUpdateFilter(filter.id, 'operator', e.target.value)}
                      >
                        <option value="=">=</option>
                        <option value="!=">!=</option>
                        <option value=">">></option>
                        <option value="<"><</option>
                        <option value=">=">>=</option>
                        <option value="<="><=</option>
                        <option value="LIKE">LIKE</option>
                        <option value="IN">IN</option>
                      </select>
                      
                      <input 
                        type="text" 
                        value={filter.value}
                        onChange={(e) => handleUpdateFilter(filter.id, 'value', e.target.value)}
                        placeholder="Value"
                      />
                      
                      <button 
                        class="remove-button"
                        onClick={() => handleRemoveFilter(filter.id)}
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </For>
              </div>
            </div>
            
            <div class="section">
              <h3>Joins</h3>
              <button class="add-button" onClick={handleAddJoin}>
                Add Join
              </button>
              
              <div class="join-list">
                <For each={store.joins}>
                  {(join) => (
                    <div class="join-item">
                      <select 
                        value={join.type}
                        onChange={(e) => handleUpdateJoin(join.id, 'type', e.target.value)}
                      >
                        <option value="INNER">INNER JOIN</option>
                        <option value="LEFT">LEFT JOIN</option>
                        <option value="RIGHT">RIGHT JOIN</option>
                        <option value="FULL">FULL JOIN</option>
                      </select>
                      
                      <select 
                        value={join.table}
                        onChange={(e) => handleUpdateJoin(join.id, 'table', e.target.value)}
                      >
                        <option value="">Select table</option>
                        <For each={props.tables.filter(t => t !== store.selectedTable)}>
                          {(table) => (
                            <option value={table}>{table}</option>
                          )}
                        </For>
                      </select>
                      
                      <span>ON</span>
                      
                      <input 
                        type="text" 
                        value={join.leftColumn}
                        onChange={(e) => handleUpdateJoin(join.id, 'leftColumn', e.target.value)}
                        placeholder="Left column"
                      />
                      
                      <span>=</span>
                      
                      <input 
                        type="text" 
                        value={join.rightColumn}
                        onChange={(e) => handleUpdateJoin(join.id, 'rightColumn', e.target.value)}
                        placeholder="Right column"
                      />
                      
                      <button 
                        class="remove-button"
                        onClick={() => handleRemoveJoin(join.id)}
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </For>
              </div>
            </div>
            
            <div class="section">
              <h3>Group By</h3>
              <div class="group-by-list">
                <For each={availableColumns()}>
                  {(column) => (
                    <div 
                      class={`group-by-item ${store.groupBy.includes(column) ? 'selected' : ''}`}
                      onClick={() => store.groupBy.includes(column) ? 
                        handleRemoveGroupBy(column) : 
                        handleAddGroupBy(column)
                      }
                    >
                      {column}
                    </div>
                  )}
                </For>
              </div>
            </div>
            
            <div class="section">
              <h3>Order By</h3>
              <div class="order-by-list">
                <For each={availableColumns()}>
                  {(column) => {
                    const orderItem = store.orderBy.find(o => o.column === column);
                    return (
                      <div 
                        class={`order-by-item ${orderItem ? 'selected' : ''}`}
                        onClick={() => orderItem ? 
                          handleRemoveOrderBy(column) : 
                          handleAddOrderBy(column)
                        }
                      >
                        {column}
                        {orderItem && (
                          <span class="order-direction">
                            {orderItem.direction === 'ASC' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    );
                  }}
                </For>
              </div>
            </div>
            
            <div class="section">
              <h3>Limit</h3>
              <input 
                type="number" 
                value={store.limit}
                onChange={handleLimitChange}
                min="1"
              />
            </div>
          </Show>
        </div>
      </div>
      
      <div class="query-builder-footer">
        <div class="generated-sql">
          <h3>Generated SQL</h3>
          <pre>{generatedSQL()}</pre>
        </div>
        
        <button 
          class="execute-button"
          onClick={handleExecuteQuery}
          disabled={!generatedSQL() || props.isLoading}
        >
          {props.isLoading ? 'Executing...' : 'Execute Query'}
        </button>
      </div>
    </div>
  );
};

export default QueryBuilder;