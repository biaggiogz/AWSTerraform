/**
 * ViewSubsystems.solid.jsx
 * Main container component for the VIEW SUBSYSTEMS tab
 * 
 * Features:
 * - Pure SolidJS implementation (zero React dependencies)
 * - Component-level code splitting with lazy loading
 * - Isolated error boundaries
 * - Built-in performance tracking
 */

import { createSignal, createEffect, createResource, onCleanup, onMount, Show, ErrorBoundary, Suspense, lazy } from 'solid-js';
import { createStore } from 'solid-js/store';
import { createDuckDBManager } from '../data/DuckDBManager.solid';
import { createQueryEngine } from '../data/QueryEngine.solid';
import transformer from '../wasm/DataTransformer.wasm';

// Lazy-loaded components for code splitting
const QueryBuilder = lazy(() => import('../components/QueryBuilder.solid'));
const SQLEditor = lazy(() => import('../components/SQLEditor.solid'));
const HandsontableGrid = lazy(() => import('../components/HandsontableGrid.solid'));
const MetricDashboard = lazy(() => import('../components/MetricDashboard.solid'));

// Performance monitoring
import { startPerformanceMonitoring, recordMetric } from '../utils/performance-monitor';

/**
 * ViewSubsystems component - Main container for the VIEW SUBSYSTEMS tab
 */
const ViewSubsystems = (props) => {
  // Initialize performance monitoring
  const perfMonitor = startPerformanceMonitoring('ViewSubsystems');
  
  // Component state
  const [activeTab, setActiveTab] = createSignal('query'); // 'query', 'sql', 'results', 'metrics'
  const [isLoading, setIsLoading] = createSignal(false);
  const [error, setError] = createSignal(null);
  const [store, setStore] = createStore({
    tables: [],
    currentQuery: null,
    queryResults: null,
    selectedRows: [],
    filters: {},
    metrics: {}
  });
  
  // Initialize DuckDB manager
  const duckDBManager = createDuckDBManager();
  
  // Initialize query engine
  const queryEngine = createQueryEngine(duckDBManager);
  
  // Initialize data transformer
  const initTransformer = async () => {
    await transformer.initialize();
    return transformer;
  };
  
  const [transformerResource] = createResource(initTransformer);
  
  // Load initial data
  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      recordMetric('loadInitialData:start');
      
      // Load CSV files
      const tables = [
        { name: 'master_subsystem', url: '/data/master_subsystem.csv' },
        { name: 'subsystems_info', url: '/data/subsystems_info.csv' },
        { name: 'summarysubsytems', url: '/data/summarysubsytems.csv' },
        { name: 'test_of_lazos_updated', url: '/data/test_of_lazos_updated.csv' }
      ];
      
      // Load tables in parallel for performance
      const loadPromises = tables.map(table => 
        duckDBManager.loadCSV(table.name, table.url)
      );
      
      const results = await Promise.all(loadPromises);
      
      // Check for errors
      const errors = results.filter(r => !r.success);
      if (errors.length > 0) {
        throw new Error(`Failed to load tables: ${errors.map(e => e.error).join(', ')}`);
      }
      
      // Update store with loaded tables
      setStore('tables', tables.map(t => t.name));
      
      // Execute initial query to get table schema
      const schemaQueries = tables.map(table => 
        queryEngine.executeQuery(`DESCRIBE ${table.name}`)
      );
      
      await Promise.all(schemaQueries);
      
      recordMetric('loadInitialData:end');
    } catch (err) {
      console.error('Error loading initial data:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Execute a query
  const executeQuery = async (query, params = {}) => {
    try {
      setIsLoading(true);
      recordMetric('executeQuery:start');
      
      setStore('currentQuery', { query, params });
      
      const result = await queryEngine.executeQuery(query, params);
      
      if (result.success) {
        setStore('queryResults', result);
      } else {
        setError(result.error);
      }
      
      recordMetric('executeQuery:end');
      return result;
    } catch (err) {
      console.error('Error executing query:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle row selection
  const handleRowSelection = (selectedRows) => {
    setStore('selectedRows', selectedRows);
    
    // Calculate metrics for selected rows
    if (selectedRows.length > 0 && store.queryResults) {
      const selectedData = selectedRows.map(index => store.queryResults.data[index]);
      
      // Use transformer for calculations
      if (transformerResource()) {
        const transformer = transformerResource();
        
        // Calculate metrics
        const numericColumns = store.queryResults.columns.filter(col => {
          const sample = store.queryResults.data[0][col];
          return typeof sample === 'number';
        });
        
        const metrics = {};
        
        for (const column of numericColumns) {
          const values = selectedData.map(row => row[column]);
          
          metrics[column] = {
            sum: transformer.aggregate(values, 'sum'),
            avg: transformer.aggregate(values, 'avg'),
            min: transformer.aggregate(values, 'min'),
            max: transformer.aggregate(values, 'max')
          };
        }
        
        setStore('metrics', metrics);
      }
    }
  };
  
  // Apply filters
  const applyFilters = (filters) => {
    setStore('filters', filters);
    
    // Re-execute query with filters if we have results
    if (store.currentQuery && store.queryResults) {
      // Transform filters to SQL WHERE clause
      const whereClause = Object.entries(filters)
        .filter(([_, value]) => value !== undefined && value !== '')
        .map(([column, value]) => {
          if (Array.isArray(value)) {
            return `${column} IN (${value.map(v => `'${v}'`).join(', ')})`;
          }
          return `${column} = '${value}'`;
        })
        .join(' AND ');
      
      // Modify the current query to include filters
      let query = store.currentQuery.query;
      
      if (whereClause) {
        if (query.toLowerCase().includes('where')) {
          query = query.replace(/where\s+([^;]*)/i, `WHERE $1 AND (${whereClause})`);
        } else if (query.toLowerCase().includes('group by')) {
          query = query.replace(/group by/i, `WHERE ${whereClause} GROUP BY`);
        } else if (query.toLowerCase().includes('order by')) {
          query = query.replace(/order by/i, `WHERE ${whereClause} ORDER BY`);
        } else {
          query = query.replace(/;$/, '');
          query = `${query} WHERE ${whereClause};`;
        }
      }
      
      // Execute the modified query
      executeQuery(query, store.currentQuery.params);
    }
  };
  
  // Load initial data on mount
  onMount(() => {
    loadInitialData();
    
    // Record component mount time
    recordMetric('component:mounted');
  });
  
  // Clean up resources on unmount
  onCleanup(() => {
    // Close DuckDB connection
    duckDBManager.close();
    
    // Dispose transformer
    if (transformerResource()) {
      transformerResource().dispose();
    }
    
    // Stop performance monitoring
    perfMonitor.stop();
  });
  
  // Render error fallback
  const ErrorFallback = (props) => (
    <div class="error-boundary">
      <h2>Something went wrong</h2>
      <pre>{props.error.toString()}</pre>
      <button onClick={props.resetError}>Try again</button>
    </div>
  );
  
  // Render loading fallback
  const LoadingFallback = () => (
    <div class="loading-spinner">
      <div class="spinner"></div>
      <p>Loading component...</p>
    </div>
  );
  
  return (
    <ErrorBoundary fallback={ErrorFallback}>
      <div class="view-subsystems-container">
        <header class="view-subsystems-header">
          <h1>View Subsystems</h1>
          <div class="tabs">
            <button 
              class={activeTab() === 'query' ? 'active' : ''} 
              onClick={() => setActiveTab('query')}
            >
              Query Builder
            </button>
            <button 
              class={activeTab() === 'sql' ? 'active' : ''} 
              onClick={() => setActiveTab('sql')}
            >
              SQL Editor
            </button>
            <button 
              class={activeTab() === 'results' ? 'active' : ''} 
              onClick={() => setActiveTab('results')}
            >
              Results
            </button>
            <button 
              class={activeTab() === 'metrics' ? 'active' : ''} 
              onClick={() => setActiveTab('metrics')}
            >
              Metrics
            </button>
          </div>
        </header>
        
        <main class="view-subsystems-content">
          <Show when={isLoading()}>
            <div class="loading-overlay">
              <div class="spinner"></div>
              <p>Loading data...</p>
            </div>
          </Show>
          
          <Show when={error()}>
            <div class="error-message">
              <p>Error: {error()}</p>
              <button onClick={() => setError(null)}>Dismiss</button>
            </div>
          </Show>
          
          <div class="tab-content">
            <Show when={activeTab() === 'query'}>
              <Suspense fallback={<LoadingFallback />}>
                <QueryBuilder 
                  tables={store.tables}
                  onExecuteQuery={executeQuery}
                  isLoading={isLoading()}
                />
              </Suspense>
            </Show>
            
            <Show when={activeTab() === 'sql'}>
              <Suspense fallback={<LoadingFallback />}>
                <SQLEditor 
                  tables={store.tables}
                  onExecuteQuery={executeQuery}
                  queryHistory={queryEngine.queryHistory}
                  isLoading={isLoading()}
                />
              </Suspense>
            </Show>
            
            <Show when={activeTab() === 'results'}>
              <Suspense fallback={<LoadingFallback />}>
                <Show when={store.queryResults}>
                  <HandsontableGrid 
                    data={store.queryResults.data}
                    columns={store.queryResults.columns}
                    onSelectionChange={handleRowSelection}
                    filters={store.filters}
                    onFilterChange={applyFilters}
                  />
                </Show>
                <Show when={!store.queryResults}>
                  <div class="no-results">
                    <p>No query results to display. Run a query first.</p>
                  </div>
                </Show>
              </Suspense>
            </Show>
            
            <Show when={activeTab() === 'metrics'}>
              <Suspense fallback={<LoadingFallback />}>
                <MetricDashboard 
                  metrics={store.metrics}
                  selectedRows={store.selectedRows}
                  queryResults={store.queryResults}
                />
              </Suspense>
            </Show>
          </div>
        </main>
        
        <footer class="view-subsystems-footer">
          <div class="status-bar">
            <span>Status: {duckDBManager.status()}</span>
            <span>Memory: {(duckDBManager.memoryUsage() / (1024 * 1024)).toFixed(2)} MB</span>
            <span>
              {store.queryResults ? 
                `Results: ${store.queryResults.data.length} rows, ${store.queryResults.columns.length} columns` : 
                'No results'
              }
            </span>
          </div>
        </footer>
      </div>
    </ErrorBoundary>
  );
};

export default ViewSubsystems;