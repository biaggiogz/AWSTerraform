// Simple query optimization without WASM complexity
class SimpleQueryOptimizer {
  constructor() {
    this.queryCache = new Map();
    this.templates = new Map();
  }

  registerTemplate(name, baseQuery) {
    this.templates.set(name, baseQuery);
  }

  optimizeQuery(templateName, whereClause) {
    const cacheKey = `${templateName}_${whereClause}`;
    
    if (this.queryCache.has(cacheKey)) {
      return this.queryCache.get(cacheKey);
    }

    const baseQuery = this.templates.get(templateName);
    if (!baseQuery) return '';

    // Simple optimizations
    let optimized = baseQuery;
    
    // Add WHERE clause efficiently
    if (whereClause) {
      optimized = this.injectWhereClause(optimized, whereClause);
    }

    // Cache the result
    this.queryCache.set(cacheKey, optimized);
    return optimized;
  }

  injectWhereClause(query, whereClause) {
    if (query.includes('WHERE')) {
      return query.replace(/WHERE\s+/, `WHERE ${whereClause.substring(6)} AND `);
    }
    
    const insertPoint = query.search(/\s+(GROUP BY|ORDER BY|LIMIT)/i);
    if (insertPoint > -1) {
      return query.slice(0, insertPoint) + ` ${whereClause}` + query.slice(insertPoint);
    }
    
    return query + ` ${whereClause}`;
  }

  invalidateCache(pattern = '') {
    if (!pattern) {
      this.queryCache.clear();
      return;
    }
    
    for (const key of this.queryCache.keys()) {
      if (key.includes(pattern)) {
        this.queryCache.delete(key);
      }
    }
  }
}

export default new SimpleQueryOptimizer();