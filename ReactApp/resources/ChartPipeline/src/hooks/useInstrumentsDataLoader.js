import { useState, useEffect, useCallback } from 'react';
import useDuckDB from './useDuckDB3';
import simpleQueryOptimizer from '../utils/simpleQueryOptimizer';

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

  // Register templates once
  useEffect(() => {
    const templates = {
      details: `SELECT item_isoinst AS "ITEM", tag_inst_isoinst AS "TAG INST", instrument_type_isoinst AS "INSTRUMENT TYPE", subsystem AS "SUBSYSTEM", tp_include_isoinst AS "TPs", progress_ac_tp_1, progress_ac_tp_2, progress_ac_tp_3, pid_isoinst AS "P&ID", hito_isoinst AS "HITO", teiga_reinstatement_isoinst AS "TEIGA REINSTATEMENT", teiga_insulation_isoinst AS "TEIGA INSULATION", siemsa_isoinst AS "SIEMSA", ten_isoinst AS "TEN", mounting_on_isoequipack_isoinst AS "MOUNTING ON ISO/EQUI/PACK", on_isoinst AS "ON", scope__by_isoinst AS "SCOPE BY", teigatmi_isoinst AS "TEIGA-TMI", siemsa1_isoinst AS "SIEMSA_2", installed_isoinst AS "INSTALLED", wired_isoinst AS "WIRED", connected_isoinst AS "CONNECTED", cable_test_isoinst AS "CABLE TEST", qcf_isoinst AS "QFC", ok100_isoinst AS "OK=100%", with__without_signal_isoinst AS "WITH & WITHOUT SIGNAL", warehouse_code_isoinst AS "WAREHOUSE CODE", delivery_isoinst AS "DELIVERY", date_isoinst AS "DATE", vendor_isoinst AS "VENDOR" FROM master_subsystem WHERE item_isoinst IS NOT NULL ORDER BY item_isoinst ASC`,
      control: `WITH inst_data AS (
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
        -- New TEIGA-TMI logic
          COUNT(scope__by_isoinst) FILTER(WHERE 
            scope__by_isoinst = 'TEIGA-TMI' 
            AND installed_teigatmi_isoinst = 1 
            AND date_installed_teigatmi_isoinst IS NOT NULL
        ) AS installed_teiga_tmi,
        -- New SIEMSA logic  
          COUNT(scope__by_isoinst) FILTER(WHERE 
            scope__by_isoinst = 'SIEMSA' 
            AND installed_isoinst IS NOT NULL
        ) AS installed_siemsa
        FROM master_subsystem
        WHERE on_isoinst != 'W_ISO'
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
             LEFT JOIN progress_data p ON i.isometric = p.isometric`,
      dynamic:
          `SELECT
             subsystem AS "SUBSYSTEM",
             COUNT(tag_inst_isoinst) AS "TOTAL INST",
             COUNT(scope__by_isoinst) FILTER(WHERE 
        scope__by_isoinst = 'TEIGA-TMI' 
    ) AS "TOTAL TEIGA",
             COUNT(scope__by_isoinst) FILTER(WHERE 
        scope__by_isoinst = 'TEIGA-TMI' 
        AND installed_teigatmi_isoinst = 1 
        AND date_installed_teigatmi_isoinst IS NOT NULL
    ) AS "INSTALLED TEIGA",
             COUNT(scope__by_isoinst) FILTER(WHERE 
        scope__by_isoinst = 'TEIGA-TMI' 
    ) - COUNT(scope__by_isoinst) FILTER(WHERE 
        scope__by_isoinst = 'TEIGA-TMI' 
        AND installed_teigatmi_isoinst = 1 
        AND date_installed_teigatmi_isoinst IS NOT NULL
    ) AS "PENDING TEIGA",
             COUNT(scope__by_isoinst) FILTER(WHERE 
        scope__by_isoinst = 'SIEMSA' 
    ) AS "TOTAL SIEMSA",
             COUNT(scope__by_isoinst) FILTER(WHERE 
        scope__by_isoinst = 'SIEMSA' 
        AND installed_isoinst IS NOT NULL
    ) AS "INSTALLED SIEMSA",
             COUNT(scope__by_isoinst) FILTER(WHERE 
        scope__by_isoinst = 'SIEMSA' 
    ) - COUNT(scope__by_isoinst) FILTER(WHERE 
        scope__by_isoinst = 'SIEMSA' 
        AND installed_isoinst IS NOT NULL
    ) AS "PENDING SIEMSA",
             COUNT(qcf_released_instrument_isoinst) FILTER(WHERE qcf_released_instrument_isoinst IS NOT NULL) AS "QFC RELEASE"
           FROM master_subsystem
           WHERE item_isoinst IS NOT NULL
           GROUP BY subsystem`
    };
    Object.entries(templates).forEach(([name, query]) => {
      simpleQueryOptimizer.registerTemplate(name, query);
    });
  }, []);

  const getQuery = useCallback((tableType, whereClause) => {
    return simpleQueryOptimizer.optimizeQuery(tableType, whereClause || '');
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
      console.error('Error loading data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [tableType, whereClause, cacheKey, dbLoading, dbError, createTableFromParquet, executeQuery, getQuery]);

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