import { useState, useEffect, useCallback } from 'react';
import useDuckDB from './useDuckDB3';

const useInstrumentsDataLoader = (tableType, whereClause, cacheKey) => {
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

  const getQuery = useCallback((tableType, whereClause) => {
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
        LIMIT 1000
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
          WHERE on_isoinst = 'PIP'
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
        LIMIT 1000
      `,
      dynamic: `
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
          WHERE on_isoinst = 'PIP'
          ${whereClause ? 'AND ' + whereClause.substring(6) : ''}
          GROUP BY mounting_on_isoequipack_isoinst
        ),
        progress_data AS (
          SELECT
            isometricos_ifc3_isos AS isometric,
            isometric__progress__isos AS isometric_progress,
            hito_isos AS hito
          FROM master_subsystem
          WHERE isometricos_ifc3_isos IS NOT NULL
        ),
        exploded_tps AS (
          SELECT
            i.isometric,
            i.subsystem,
            p.hito,
            UNNEST(string_to_array(i.tps, '|')) AS tp,
            CASE idx
            WHEN 1 THEN i.progress_ac_tp_1
            WHEN 2 THEN i.progress_ac_tp_2
            WHEN 3 THEN i.progress_ac_tp_3
            END AS progress,
            i.qty_inst,
            i.scope_teiga_tmi,
            i.scope_siemsa,
            i.installed_teiga_tmi,
            i.installed_siemsa,
            (i.qty_inst - i.installed_teiga_tmi - i.installed_siemsa) AS pending
          FROM (
            SELECT *,
            generate_subscripts(string_to_array(tps, '|'), 1) AS idx
            FROM inst_data
          ) i
          LEFT JOIN progress_data p ON i.isometric = p.isometric
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
            WHEN ABS(SUM(qty_inst) - SUM(installed_teiga_tmi) - SUM(installed_siemsa)) < 0.01 AND SUM(qty_inst) > 0
              THEN SUM(qty_inst)
            ELSE 0
            END AS "DONE",
          MAX(progress) AS "PROGRESS TP"
        FROM exploded_tps
        GROUP BY subsystem, hito, tp
        ORDER BY subsystem, hito, tp
        LIMIT 5000
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

      // Execute query
      const startQueryTime = performance.now();
      const query = getQuery(tableType, whereClause);
      const results = await executeQuery(query, { 
        useCache: true,
        cacheKey: cacheKey
      });
      
      const endQueryTime = performance.now();
      setQueryTime((endQueryTime - startQueryTime).toFixed(2));

      setData(results);
      setError(null);
      
      const endLoadTime = performance.now();
      setLoadTime((endLoadTime - startLoadTime).toFixed(2));
    } catch (err) {
      console.error('DuckDB error:', err);
      setError(err.message || 'Unknown error');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [createTableFromParquet, executeQuery, dbLoading, dbError, tableType, whereClause, cacheKey, getQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    data,
    loading,
    error,
    loadTime,
    queryTime,
    reload: loadData
  };
};

export default useInstrumentsDataLoader;