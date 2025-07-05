import { useState, useEffect, useRef } from 'react';

// JavaScript-based SQL parser
const useDuckDB = () => {
  const [db, setDb] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const tablesRef = useRef({});

  useEffect(() => {
    setDb({ type: 'js-sql' });
    setLoading(false);
  }, []);

  const parseSQL = (query) => {
    const sql = query.trim();
    
    // Extract table name - handle quoted names with spaces
    const fromMatch = sql.match(/FROM\s+["']([^"']+)["']|FROM\s+([^\s;]+)/i);
    const tableName = fromMatch ? (fromMatch[1] || fromMatch[2]) : null;
    
    // Extract SELECT fields
    const selectMatch = sql.match(/SELECT\s+(.+?)\s+FROM/i);
    const selectFields = selectMatch ? selectMatch[1] : '*';
    
    // Extract WHERE clause
    const whereMatch = sql.match(/WHERE\s+(.+?)(?:\s+GROUP\s+BY|\s+ORDER\s+BY|;|$)/i);
    const whereClause = whereMatch ? whereMatch[1] : null;
    
    // Extract GROUP BY
    const groupByMatch = sql.match(/GROUP\s+BY\s+["']?([^"'\s;,]+)["']?/i);
    const groupBy = groupByMatch ? groupByMatch[1] : null;
    
    return { tableName, selectFields, whereClause, groupBy };
  };

  const executeQuery = async (query) => {
    try {
      const { tableName, selectFields, whereClause, groupBy } = parseSQL(query);
      console.log('Parsed table name:', tableName);
      console.log('Available tables:', Object.keys(tablesRef.current));
      
      let data = tablesRef.current[tableName] || [];
      
      if (data.length === 0) {
        return [{ 'Error': `Table '${tableName}' not found. Available: ${Object.keys(tablesRef.current).join(', ')}` }];
      }
      
      // Handle SELECT with aggregation
      if (selectFields.includes('COUNT')) {
        const countMatch = selectFields.match(/COUNT\(["']?([^"')]+)["']?\)\s+AS\s+["']?([^"']+)["']?/);
        if (countMatch) {
          const [, field, alias] = countMatch;
          
          if (groupBy) {
            // GROUP BY aggregation
            const groups = {};
            const groupField = groupBy.replace(/"/g, '');
            
            data.forEach(row => {
              // Try different field name variations
              const key = row[groupField] || row[groupField.toUpperCase()] || row[groupField.toLowerCase()] || 'Unknown';
              groups[key] = (groups[key] || 0) + 1;
            });
            
            return Object.entries(groups)
              .sort(([,a], [,b]) => b - a) // Sort by count descending
              .map(([key, count]) => ({
                [groupField]: key,
                [alias]: count
              }));
          } else {
            // Simple COUNT
            const fieldName = field.replace(/"/g, '');
            let count = 0;
            
            if (fieldName === '*') {
              count = data.length;
            } else {
              // Count non-null values in specific field
              count = data.filter(row => {
                const value = row[fieldName] || row[fieldName.toUpperCase()] || row[fieldName.toLowerCase()];
                return value !== null && value !== undefined && value !== '';
              }).length;
            }
            
            return [{ [alias]: count }];
          }
        }
      }
      
      // Handle simple SELECT *
      if (selectFields.trim() === '*') {
        return data.slice(0, 10); // Limit to first 10 rows
      }
      
      // Default: return count
      return [{ 'Total Records': data.length }];
    } catch (err) {
      console.error('SQL Parse Error:', err);
      return [{ 'Error': `Query failed: ${err.message}` }];
    }
  };

  const createTable = async (tableName, data) => {
    if (!data || data.length === 0) return;
    tablesRef.current[tableName] = data;
  };

  return { db, loading, error, executeQuery, createTable };
};

export default useDuckDB;