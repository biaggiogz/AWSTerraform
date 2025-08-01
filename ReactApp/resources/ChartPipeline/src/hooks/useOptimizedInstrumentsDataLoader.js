import { useState, useEffect, useCallback, useRef } from 'react';
import useDuckDB from './useDuckDB3';
import sqlCompilerBridge from '../wasm/sqlCompilerBridge';

const useOptimizedInstrumentsDataLoader = (tableType, whereClause, cacheKey) => {
  const {
    createTableFromParquet,
    executeQuery,
    loading: dbLoading,
    error: dbError,
  } = useDuckDB();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadTime, setLoadTime] = useState(null);
  const [queryTime, setQueryTime] = useState(null);
  const [compiledQuery, setCompiledQuery] = useState(null);
  
  const compilerInitialized = useRef(false);
  const lastWhereClause = useRef('');

  // Initialize SQL compiler
  useEffect(() => {
    const initCompiler = async () => {
      if (compilerInitialized.current) return;
      
      try {
        await sqlCompilerBridge.initialize();
        compilerInitialized.current = true;
        console.log('SQL Compiler initialized for data loader');
      } catch (error) {
        console.error('Failed to initialize SQL compiler:', error);
      }
    };

    initCompiler();
  }, []);

  // Watch for template changes and invalidate cache
  useEffect(() => {
    if (!compilerInitialized.current) return;

    const unwatch = sqlCompilerBridge.watchTemplateChanges((templateName, template) => {
      if (templateName === tableType) {
        console.log(`Template ${templateName} changed, invalidating cache`);
        sqlCompilerBridge.invalidateCache(templateName);
        setCompiledQuery(null);
      }
    });

    return unwatch;
  }, [tableType]);

  const compileQuery = useCallback(async (tableType, whereClause) => {
    if (!compilerInitialized.current) {
      // Fallback to original query logic
      return getOriginalQuery(tableType, whereClause);
    }

    try {
      const compiled = await sqlCompilerBridge.compileQuery(tableType, whereClause || '');
      setCompiledQuery(compiled);
      return compiled.optimized_sql;
    } catch (error) {
      console.error('Query compilation failed, using fallback:', error);
      return getOriginalQuery(tableType, whereClause);
    }
  }, []);

  const getOriginalQuery = useCallback((tableType, whereClause) => {
    const queries = {
      details: `
        SELECT
          item_isoinst AS "ITEM",
          tag_inst_isoinst AS "TAG INST",
          instrument_type_isoinst AS "INSTRUMENT TYPE",
          subsystem AS "SUBSYSTEM",
          tp_include_isoinst AS "TPs",
          progress_ac_tp_1,
          progress_ac_tp_2,
          progress_ac_tp_3,
          pid_isoinst AS "P&ID",
          hito_isoinst AS "HITO",
          teiga_reinstatement_isoinst AS "TEIGA REINSTATEMENT",
          teiga_insulation_isoinst AS "TEIGA INSULATION",
          siemsa_isoinst AS "SIEMSA",
          ten_isoinst AS "TEN",
          mounting_on_isoequipack_isoinst AS "MOUNTING ON ISO/EQUI/PACK",
          on_isoinst AS "ON",
          scope__by_isoinst AS "SCOPE BY",
          teigatmi_isoinst AS "TEIGA-TMI",
          siemsa1_isoinst AS "SIEMSA_2",
          installed_isoinst AS "INSTALLED",
          wired_isoinst AS "WIRED",
          connected_isoinst AS "CONNECTED",
          cable_test_isoinst AS "CABLE TEST",
          qcf_isoinst AS "QFC",
          ok100_isoinst AS "OK=100%",
          with__without_signal_isoinst AS "WITH & WITHOUT SIGNAL",
          warehouse_code_isoinst AS "WAREHOUSE CODE",
          delivery_isoinst AS "DELIVERY",
          date_isoinst AS "DATE",
          vendor_isoinst AS "VENDOR"
        FROM master_subsystem
        WHERE item_isoinst IS NOT NULL
        ${whereClause ? 'AND ' + whereClause.substring(6) : ''}
        ORDER BY item_isoinst ASC
      `,
      control: `
        WITH inst_data AS (
          SELECT
            mounting_on_isoequipack_isoinst AS isometric,
            MAX(subsystem) AS subsystem,
            MAX(tp_include_isoinst) AS tps,
            MAX(progress_ac_tp_1) AS progress_ac_tp_1,
            MAX(progress_ac_tp_2) AS progress_ac_tp_2,
            MAX(progress_ac_tp_3) AS progress_ac_tp_3,
            COUNT(tag_inst_isoinst) AS qty_inst,
            COUNT(scope__by_isoinst) FILTER(WHERE scope__by_isoinst = 'TEIGA-TMI') AS scope_teiga_tmi,
            COUNT(scope__by_isoinst) FILTER(WHERE scope__by_isoinst = 'SIEMSA') AS scope_siemsa,
            COUNT(scope__by_isoinst) FILTER(WHERE scope__by_isoinst = 'TEIGA-TMI' AND ok100_isoinst = 1) AS installed_teiga_tmi,
            COUNT(scope__by_isoinst) FILTER(WHERE scope__by_isoinst = 'SIEMSA' AND ok100_isoinst = 1) AS installed_siemsa
          FROM master_subsystem
          WHERE on_isoinst != 'W_ISO'
          ${whereClause ? 'AND ' + whereClause.substring(6) : ''}
          GROUP BY mounting_on_isoequipack_isoinst
        ),
        progress_data AS (
          SELECT
            isometricos_ifc3_isos AS isometric,
            isometric__progress__isos AS isometric_progress,
            hito_isos AS hito,
            teiga_reinstatement_isos AS teiga_reinstatement,
            teiga_insulation_isos AS teiga_insulation,
            siemsa_isos AS siemsa,
            ten_isos AS ten
          FROM master_subsystem
          WHERE isometricos_ifc3_isos IS NOT NULL
        )
        SELECT
          i.isometric AS "ISOMETRIC",
          p.isometric_progress AS "PROGRESS FW+SW",
          i.subsystem AS "SUBSYSTEM",
          p.hito AS "HITO",
          p.teiga_reinstatement AS "TEIGA REINSTATEMENT",
          p.teiga_insulation AS "TEIGA INSULATION",
          p.siemsa AS "SIEMSA",
          p.ten AS "TECHNIP",
          i.tps AS "TPs",
          i.qty_inst AS "QTY INST",
          i.scope_teiga_tmi AS "SCOPE BY TEIGA-TMI",
          i.scope_siemsa AS "SCOPE BY SIEMSA",
          i.installed_teiga_tmi AS "INSTALLED BY TEIGA-TMI",
          i.installed_siemsa AS "INSTALLED BY SIEMSA",
          i.qty_inst - i.installed_teiga_tmi - i.installed_siemsa AS "PENDING",
          i.progress_ac_tp_1,
          i.progress_ac_tp_2,
          i.progress_ac_tp_3
        FROM inst_data i
        LEFT JOIN progress_data p ON i.isometric = p.isometric
      `,
      dynamic: `
        WITH inst_data AS (
          SELECT
            mounting_on_isoequipack_isoinst AS isometric,
            MAX(subsystem) AS subsystem,
            MAX(tp_include_isoinst) AS tps,
            MAX(progress_ac_tp_1) AS progress_ac_tp_1,
            MAX(progress_ac_tp_2) AS progress_ac_tp_2,
            COUNT(tag_inst_isoinst) AS qty_inst,
            COUNT(*) FILTER (WHERE scope__by_isoinst = 'SIEMSA') AS scope_siemsa,
            COUNT(*) FILTER (WHERE scope__by_isoinst = 'TEIGA-TMI') AS scope_teiga_tmi,
            COUNT(*) FILTER (WHERE scope__by_isoinst = 'SIEMSA' AND ok100_isoinst = 1) AS installed_siemsa,
            COUNT(*) FILTER (WHERE scope__by_isoinst = 'TEIGA-TMI' AND ok100_isoinst = 1) AS installed_teiga_tmi
          FROM master_subsystem
          WHERE on_isoinst != 'W_ISO'
          ${whereClause ? 'AND ' + whereClause.substring(6) : ''}
        GROUP BY mounting_on_isoequipack_isoinst
          ),
          progress_data AS (
        SELECT
          isometricos_ifc3_isos AS isometric,
          hito_isos AS hito
        FROM master_subsystem
        WHERE isometricos_ifc3_isos IS NOT NULL
          ),
          tp_counts AS (
        SELECT
          isometric,
          COUNT(*) AS tp_count
        FROM (
          SELECT
          isometric,
          UNNEST(string_to_array(tps, '|')) AS tp
          FROM inst_data
          )
        GROUP BY isometric
          ),
          exploded_tps_raw AS (
        SELECT
          i.*,
          p.hito,
          tp_table.tp,
          c.tp_count
        FROM inst_data i
          LEFT JOIN progress_data p ON i.isometric = p.isometric
          JOIN tp_counts c ON i.isometric = c.isometric
          CROSS JOIN LATERAL (
          SELECT unnest(string_to_array(i.tps, '|')) AS tp
          ) AS tp_table
          ),
          exploded_tps AS (
        SELECT *,
          ROW_NUMBER() OVER (PARTITION BY isometric ORDER BY tp) AS tp_index,
          CASE
          WHEN ROW_NUMBER() OVER (PARTITION BY isometric ORDER BY tp) = 1 THEN progress_ac_tp_1
          WHEN ROW_NUMBER() OVER (PARTITION BY isometric ORDER BY tp) = 2 THEN progress_ac_tp_2
          ELSE NULL
          END AS progress,
          qty_inst / tp_count AS qty_inst,
          scope_teiga_tmi / tp_count AS scope_teiga_tmi,
          scope_siemsa / tp_count AS scope_siemsa,
          installed_teiga_tmi / tp_count AS installed_teiga_tmi,
          installed_siemsa / tp_count AS installed_siemsa,
          (qty_inst - installed_teiga_tmi - installed_siemsa) / tp_count AS pending
        FROM exploded_tps_raw
          )
        SELECT
          subsystem AS "SUBSYSTEM",
          hito AS "HITO",
          tp AS "TP",
          SUM(qty_inst) AS "TOTAL INST",
          SUM(scope_siemsa) AS "TOTAL SIEMSA",
          SUM(scope_teiga_tmi) AS "TOTAL TEIGA",
          SUM(installed_teiga_tmi) AS "INSTALLED TEIGA",
          SUM(installed_siemsa) AS "INSTALLED SIEMSA",
          SUM(pending) AS "PENDING",
          CASE
            WHEN ABS(SUM(qty_inst) - SUM(installed_teiga_tmi) - SUM(installed_siemsa)) < 0.01
              AND SUM(qty_inst) > 0
              THEN SUM(qty_inst)
            ELSE 0
            END AS "DONE",
          MAX(progress) AS "PROGRESS TP"
        FROM exploded_tps
        GROUP BY subsystem, hito, tp
        ORDER BY subsystem, hito, tp
      `
    };
    return queries[tableType] || '';
  }, []);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      
      if (dbLoading || dbError) {
        return;
      }

      const startLoadTime = performance.now();

      // Load Parquet file
      try {
        const res = await fetch('/data/master_subsystem.parquet');
        
        if (!res.ok) throw new Error(`Failed to fetch Parquet: ${res.status}`);
        
        const parquetBuffer = await res.arrayBuffer();
        await createTableFromParquet('master_subsystem', parquetBuffer);
      } catch (parquetError) {
        console.error('Error loading Parquet:', parquetError);
        throw new Error('Failed to load data source');
      }

      // Compile and execute query
      const startQueryTime = performance.now();
      const query = await compileQuery(tableType, whereClause);
      
      const results = await executeQuery(query, { 
        useCache: true,
        cacheKey: compiledQuery?.cache_key || cacheKey
      });
      
      const endQueryTime = performance.now();
      setQueryTime((endQueryTime - startQueryTime).toFixed(2));

      setData(results);
      setError(null);
      
      const endLoadTime = performance.now();
      setLoadTime((endLoadTime - startLoadTime).toFixed(2));

      // Log performance metrics
      if (compiledQuery) {
        console.log(`Query compiled and executed:`, {
          template: tableType,
          hash: compiledQuery.hash,
          estimatedCost: compiledQuery.estimated_cost,
          actualTime: queryTime,
          cacheKey: compiledQuery.cache_key
        });
      }

    } catch (err) {
      console.error('Error loading data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [tableType, whereClause, cacheKey, dbLoading, dbError, createTableFromParquet, executeQuery, compileQuery, compiledQuery]);

  // Trigger reload when where clause changes
  useEffect(() => {
    if (lastWhereClause.current !== whereClause) {
      lastWhereClause.current = whereClause;
      loadData();
    }
  }, [whereClause, loadData]);

  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    data,
    loading,
    error,
    loadTime,
    queryTime,
    compiledQuery,
    reload: loadData,
    getCacheStats: () => compilerInitialized.current ? sqlCompilerBridge.getCacheStats() : {},
    invalidateCache: (pattern) => compilerInitialized.current ? sqlCompilerBridge.invalidateCache(pattern) : 0
  };
};

export default useOptimizedInstrumentsDataLoader;