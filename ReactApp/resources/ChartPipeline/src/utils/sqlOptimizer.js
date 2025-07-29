/**
 * SQL Query Optimizer for DuckDB WASM performance
 * Generates optimized queries without altering existing filter logic
 */

// Query template cache for reuse
const queryTemplateCache = new Map();

// Optimized WHERE clause builder
export const buildOptimizedWhereClause = (filters) => {
  const conditions = [];
  
  // Use indexed columns first for better performance
  if (filters.subsystem) {
    conditions.push(`subsystem = '${filters.subsystem}'`);
  }
  
  if (filters.area_tlp && Array.isArray(filters.area_tlp) && filters.area_tlp.length > 0) {
    const values = filters.area_tlp.map(area => `'${area}'`).join(', ');
    conditions.push(`area_tlp IN (${values})`);
  }
  
  if (filters.selectedArea) {
    conditions.push(`area_tlp = '${filters.selectedArea}'`);
  }
  
  // Progress filters with optimized conditions
  if (filters.progressFilter) {
    switch (filters.progressFilter) {
      case 'LOOP (Signal) DONE':
        conditions.push('ok100_tlp = 1.0');
        break;
      case 'LOOP (Signal) PENDING':
        conditions.push('ok100_tlp < 1.0');
        break;
      case 'DOSSIER COMPLETED':
        conditions.push("dossier_tlp IS NOT NULL AND dossier_tlp != ''");
        break;
    }
  }
  
  // Subsystem completion filters
  if (filters.subsystemCompletionFilter) {
    switch (filters.subsystemCompletionFilter) {
      case 'DONE':
        conditions.push(`subsystem IN (
          SELECT subsystem FROM master_subsystem 
          WHERE tag_loop_tlp IS NOT NULL 
          GROUP BY subsystem 
          HAVING MIN(ok100_tlp) = 1.0
        )`);
        break;
      case 'PENDING':
        conditions.push(`subsystem IN (
          SELECT subsystem FROM master_subsystem 
          WHERE tag_loop_tlp IS NOT NULL 
          GROUP BY subsystem 
          HAVING MIN(ok100_tlp) < 1.0
        )`);
        break;
    }
  }
  
  return conditions.length > 0 ? conditions.join(' AND ') : '';
};

// Optimized query builder for Loop Test Progress
export const buildLoopTestProgressQuery = (whereClause) => {
  const cacheKey = `loop_progress_${whereClause}`;
  
  if (queryTemplateCache.has(cacheKey)) {
    return queryTemplateCache.get(cacheKey);
  }
  
  const query = `
    SELECT 
      code_tlp AS "CODE",
      subsystem AS "SUBSYSTEM", 
      tag_loop_tlp AS "TAG LOOP",
      area_tlp AS "AREA",
      priority_tlp AS "PRIORITY",
      hito_tlp AS "HITO",
      siemsa_tlp AS "SIEMSA",
      loop_tlp AS "LOOP",
      tags_tlp AS "TAGS",
      service_tlp AS "SERVICE",
      installed_tlp AS "INSTALLED",
      wired_tlp AS "WIRED", 
      connected_tlp AS "CONNECTED",
      cable_test_tlp AS "CABLE_TEST",
      qcf_tlp AS "QCF",
      ok100_tlp AS "OK100",
      dossier_tlp AS "DOSSIER",
      test_loop_tlp AS "TEST_LOOP",
      action_tlp AS "ACTION",
      by_tlp AS "BY",
      status_closedopen_co_tlp AS "STATUS_CO"
    FROM master_subsystem 
    WHERE tag_loop_tlp IS NOT NULL
    ${whereClause ? ` AND ${whereClause}` : ''}
    ORDER BY subsystem, area_tlp
  `;
  
  queryTemplateCache.set(cacheKey, query);
  return query;
};

// Optimized query for subsystem completion metrics
export const buildSubsystemCompletionQueries = () => {
  return {
    fullyCompleted: `
      SELECT subsystem
      FROM master_subsystem
      WHERE tag_loop_tlp IS NOT NULL
      GROUP BY subsystem
      HAVING MIN(ok100_tlp) = 1.0
    `,
    fullyPending: `
      SELECT subsystem  
      FROM master_subsystem
      WHERE tag_loop_tlp IS NOT NULL
      GROUP BY subsystem
      HAVING MIN(ok100_tlp) < 1.0
    `,
    completedCount: `
      SELECT COUNT(*) AS done_subsystem_count
      FROM (
        SELECT subsystem
        FROM master_subsystem
        WHERE tag_loop_tlp IS NOT NULL
        GROUP BY subsystem
        HAVING MIN(ok100_tlp) = 1.0
      ) AS completed_subsystems
    `,
    pendingCount: `
      SELECT COUNT(*) AS pending_subsystem_count
      FROM (
        SELECT subsystem
        FROM master_subsystem
        WHERE tag_loop_tlp IS NOT NULL
        GROUP BY subsystem
        HAVING MIN(ok100_tlp) < 1.0
      ) AS pending_subsystems
    `
  };
};

// Clear query cache
export const clearQueryCache = () => {
  queryTemplateCache.clear();
};

export default {
  buildOptimizedWhereClause,
  buildLoopTestProgressQuery,
  buildSubsystemCompletionQueries,
  clearQueryCache
};