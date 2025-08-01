import sqlCompilerBridge from '../wasm/sqlCompilerBridge';
import queryChangeDetector from './queryChangeDetector';

class SqlTemplateManager {
  constructor() {
    this.templates = new Map();
    this.watchers = new Set();
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      await sqlCompilerBridge.initialize();
      await queryChangeDetector.initialize();
      
      // Load templates from existing queries
      await this.loadExistingTemplates();
      
      this.initialized = true;
      console.log('SQL Template Manager initialized');
    } catch (error) {
      console.error('Failed to initialize SQL Template Manager:', error);
      throw error;
    }
  }

  async loadExistingTemplates() {
    // Extract templates from the existing useInstrumentsDataLoader queries
    const existingQueries = this.getExistingQueries();
    
    for (const [name, queryData] of Object.entries(existingQueries)) {
      await this.registerTemplate(name, queryData);
    }
  }

  getExistingQueries() {
    return {
      details: {
        name: 'details',
        base_query: `
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
          ORDER BY item_isoinst ASC`,
        parameters: ['whereClause'],
        optimization_hints: ['index_scan', 'filter_pushdown', 'order_optimization']
      },

      control: {
        name: 'control',
        base_query: `
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
        parameters: ['whereClause'],
        optimization_hints: ['cte_optimization', 'join_reorder', 'aggregate_pushdown']
      },

      dynamic: {
        name: 'dynamic',
        base_query: `
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
          ORDER BY subsystem, hito, tp`,
        parameters: ['whereClause'],
        optimization_hints: ['complex_cte', 'window_functions', 'lateral_join', 'aggregate_optimization']
      }
    };
  }

  async registerTemplate(name, template) {
    if (!this.initialized) {
      throw new Error('SQL Template Manager not initialized');
    }

    try {
      await sqlCompilerBridge.registerTemplate(name, template);
      this.templates.set(name, template);
      
      // Set up change detection for this template
      queryChangeDetector.watchQuery(name, (templateName, updatedTemplate) => {
        this.notifyWatchers(templateName, updatedTemplate);
      });

      console.log(`Template ${name} registered successfully`);
    } catch (error) {
      console.error(`Failed to register template ${name}:`, error);
      throw error;
    }
  }

  async updateTemplate(name, updatedTemplate) {
    if (!this.initialized) {
      throw new Error('SQL Template Manager not initialized');
    }

    try {
      await queryChangeDetector.updateTemplate(name, updatedTemplate);
      this.templates.set(name, updatedTemplate);
      console.log(`Template ${name} updated successfully`);
    } catch (error) {
      console.error(`Failed to update template ${name}:`, error);
      throw error;
    }
  }

  getTemplate(name) {
    return this.templates.get(name);
  }

  getAllTemplates() {
    return Array.from(this.templates.entries());
  }

  async compileQuery(templateName, whereClause = '') {
    if (!this.initialized) {
      throw new Error('SQL Template Manager not initialized');
    }

    return await sqlCompilerBridge.compileQuery(templateName, whereClause);
  }

  watchTemplateChanges(callback) {
    this.watchers.add(callback);
    return () => this.watchers.delete(callback);
  }

  notifyWatchers(templateName, template) {
    this.watchers.forEach(callback => {
      try {
        callback(templateName, template);
      } catch (error) {
        console.error('Template change watcher error:', error);
      }
    });
  }

  async getCacheStats() {
    if (!this.initialized) return {};
    return await sqlCompilerBridge.getCacheStats();
  }

  async invalidateCache(pattern = '') {
    if (!this.initialized) return 0;
    return await sqlCompilerBridge.invalidateCache(pattern);
  }

  getStats() {
    return {
      initialized: this.initialized,
      templateCount: this.templates.size,
      watcherCount: this.watchers.size,
      queryChangeDetector: queryChangeDetector.getStats()
    };
  }
}

// Singleton instance
const sqlTemplateManager = new SqlTemplateManager();

export default sqlTemplateManager;