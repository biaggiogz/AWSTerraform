/**
 * QueryEngine.solid.js
 * SQL query processor with optimization and caching
 * 
 * Features:
 * - Automatic query optimization
 * - Prepared statements with cached query plans
 * - Batch processing with multi-query transaction support
 * - Detailed SQL error reporting
 * - Query history tracking
 */

import { createSignal, createMemo, createEffect } from 'solid-js';
import { createStore } from 'solid-js/store';

/**
 * Create a query engine with optimization and caching
 * @param {Object} duckDBManager - DuckDB manager instance
 */
export const createQueryEngine = (duckDBManager) => {
  // Query history store
  const [queryHistory, setQueryHistory] = createStore([]);
  
  // Query cache for prepared statements
  const [queryCache, setQueryCache] = createStore({});
  
  // Current query state
  const [currentQuery, setCurrentQuery] = createSignal('');
  const [queryParams, setQueryParams] = createSignal({});
  const [isExecuting, setIsExecuting] = createSignal(false);
  const [lastResult, setLastResult] = createSignal(null);
  const [lastError, setLastError] = createSignal(null);
  
  // Query optimization rules
  const optimizationRules = [
    // Add LIMIT if missing for large result sets
    {
      pattern: /^SELECT(?!.*LIMIT\s+\d+).*/i,
      transform: (query) => `${query} LIMIT 10000`
    },
    // Use prepared statements for parameterized queries
    {
      pattern: /'([^']+)'/g,
      transform: (query, index) => {
        return query.replace(/'([^']+)'/g, (match, value, offset) => {
          const paramName = `param${index}_${offset}`;
          return `$${paramName}`;
        });
      }
    },
    // Add indexes for JOIN operations
    {
      pattern: /JOIN\s+(\w+)\s+ON\s+(\w+)\.(\w+)\s*=\s*(\w+)\.(\w+)/gi,
      analyze: async (query, match) => {
        const tableName = match[1];
        const columnName = match[3];
        
        // Check if index exists
        const indexCheck = await duckDBManager.executeQuery(
          `SELECT * FROM pragma_index_list('${tableName}') WHERE name = 'idx_${tableName}_${columnName}'`
        );
        
        // Create index if it doesn't exist
        if (indexCheck.data && indexCheck.data.length === 0) {
          await duckDBManager.executeQuery(
            `CREATE INDEX IF NOT EXISTS idx_${tableName}_${columnName} ON ${tableName}(${columnName})`
          );
        }
        
        return query; // Return original query
      }
    }
  ];
  
  /**
   * Optimize a SQL query using defined rules
   * @param {string} query - SQL query to optimize
   */
  const optimizeQuery = async (query) => {
    let optimizedQuery = query;
    
    for (const rule of optimizationRules) {
      if (rule.pattern.test(optimizedQuery)) {
        if (rule.transform) {
          optimizedQuery = optimizedQuery.replace(rule.pattern, rule.transform);
        }
        if (rule.analyze) {
          optimizedQuery = await rule.analyze(optimizedQuery, rule.pattern.exec(optimizedQuery));
        }
      }
    }
    
    return optimizedQuery;
  };
  
  /**
   * Execute a SQL query with optimization
   * @param {string} query - SQL query
   * @param {Object} params - Query parameters
   */
  const executeQuery = async (query, params = {}) => {
    try {
      setIsExecuting(true);
      setCurrentQuery(query);
      setQueryParams(params);
      setLastError(null);
      
      // Check query cache first
      const cacheKey = `${query}_${JSON.stringify(params)}`;
      if (queryCache[cacheKey] && queryCache[cacheKey].timestamp > Date.now() - 30000) {
        setLastResult(queryCache[cacheKey].result);
        
        // Add to history
        addToHistory(query, params, queryCache[cacheKey].result, 0);
        
        return queryCache[cacheKey].result;
      }
      
      // Optimize the query
      const optimizedQuery = await optimizeQuery(query);
      
      // Execute the query
      const startTime = performance.now();
      const result = await duckDBManager.executeQuery(optimizedQuery, params);
      const executionTime = performance.now() - startTime;
      
      // Update cache
      setQueryCache(cache => ({
        ...cache,
        [cacheKey]: {
          result,
          timestamp: Date.now(),
          executionTime
        }
      }));
      
      // Add to history
      addToHistory(query, params, result, executionTime);
      
      setLastResult(result);
      return result;
    } catch (error) {
      const errorDetails = {
        message: error.message,
        query,
        params
      };
      
      setLastError(errorDetails);
      
      // Add to history
      addToHistory(query, params, null, 0, errorDetails);
      
      throw error;
    } finally {
      setIsExecuting(false);
    }
  };
  
  /**
   * Execute multiple queries in a transaction
   * @param {Array} queries - Array of query objects {query, params}
   */
  const executeTransaction = async (queries) => {
    try {
      setIsExecuting(true);
      
      // Start transaction
      await duckDBManager.executeQuery('BEGIN TRANSACTION');
      
      const results = [];
      
      // Execute each query
      for (const { query, params } of queries) {
        const result = await executeQuery(query, params);
        results.push(result);
      }
      
      // Commit transaction
      await duckDBManager.executeQuery('COMMIT');
      
      return {
        success: true,
        results
      };
    } catch (error) {
      // Rollback on error
      await duckDBManager.executeQuery('ROLLBACK');
      
      setLastError({
        message: error.message,
        queries
      });
      
      return {
        success: false,
        error: error.message
      };
    } finally {
      setIsExecuting(false);
    }
  };
  
  /**
   * Add a query to the history
   * @param {string} query - SQL query
   * @param {Object} params - Query parameters
   * @param {Object} result - Query result
   * @param {number} executionTime - Query execution time
   * @param {Object} error - Error details (if any)
   */
  const addToHistory = (query, params, result, executionTime, error = null) => {
    const historyItem = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      query,
      params,
      executionTime,
      success: !error,
      error,
      resultRowCount: result?.data?.length || 0
    };
    
    // Add to history (limit to 100 items)
    setQueryHistory(history => {
      const newHistory = [historyItem, ...history];
      if (newHistory.length > 100) {
        return newHistory.slice(0, 100);
      }
      return newHistory;
    });
  };
  
  /**
   * Clear the query cache
   */
  const clearCache = () => {
    setQueryCache({});
  };
  
  /**
   * Clear the query history
   */
  const clearHistory = () => {
    setQueryHistory([]);
  };
  
  /**
   * Get query execution plan
   * @param {string} query - SQL query
   */
  const getQueryPlan = async (query) => {
    const result = await duckDBManager.executeQuery(`EXPLAIN ${query}`);
    return result;
  };
  
  // Computed properties
  const successfulQueries = createMemo(() => {
    return queryHistory.filter(item => item.success);
  });
  
  const failedQueries = createMemo(() => {
    return queryHistory.filter(item => !item.success);
  });
  
  const averageExecutionTime = createMemo(() => {
    const successful = successfulQueries();
    if (successful.length === 0) return 0;
    
    const total = successful.reduce((sum, item) => sum + item.executionTime, 0);
    return total / successful.length;
  });
  
  return {
    // State
    currentQuery,
    queryParams,
    isExecuting,
    lastResult,
    lastError,
    queryHistory,
    
    // Computed
    successfulQueries,
    failedQueries,
    averageExecutionTime,
    
    // Methods
    executeQuery,
    executeTransaction,
    optimizeQuery,
    getQueryPlan,
    clearCache,
    clearHistory
  };
};

export default createQueryEngine;