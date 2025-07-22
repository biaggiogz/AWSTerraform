/**
 * Utility functions for generating SQL queries for the INSTRUMENTS REPORT tab
 */

/**
 * Generates a SQL query to count total isometrics
 * @returns {string} SQL query string
 */
export const getTotalIsometricsQuery = () => `
SELECT COUNT(DISTINCT "ISOMETRIC") AS "TOTAL ISOS _Global"
FROM controlInstrumentsByIsometric;

SELECT COUNT(DISTINCT "ISOMETRIC") AS "TOTAL ISOS _Local"
FROM controlInstrumentsByIsometric;
`;

/**
 * Generates a SQL query to count total tag instruments
 * @returns {string} SQL query string
 */
export const getTotalTagInstQuery = () => `
SELECT COUNT("TAG INST") AS "TOTAL TAG INST _Global"
FROM detailsInstrumentsTable;

SELECT COUNT("TAG INST") AS "TOTAL TAG INST _Local"
FROM detailsInstrumentsTable;
`;

/**
 * Generates a SQL query to sum total instruments
 * @returns {string} SQL query string
 */
export const getTotalInstQuery = () => `
-- For controlInstrumentsByIsometric table
SELECT SUM("QTY INST") AS "TOTAL INST _Global"
FROM controlInstrumentsByIsometric;

SELECT SUM("QTY INST") AS "TOTAL INST _Local"
FROM controlInstrumentsByIsometric;

-- For dynamicInstrumentTable
SELECT SUM("TOTAL INST") AS "TOTAL INST DYNAMIC _Global"
FROM dynamicInstrumentTable;

SELECT SUM("TOTAL INST") AS "TOTAL INST DYNAMIC _Local"
FROM dynamicInstrumentTable;
`;

/**
 * Generates a SQL query to sum total done instruments
 * @returns {string} SQL query string
 */
export const getTotalDoneQuery = () => `
SELECT SUM("INSTALLED BY TEIGA-TMI") + SUM("INSTALLED BY SIEMSA") AS "TOTAL DONE _Global"
FROM controlInstrumentsByIsometric;

SELECT SUM("INSTALLED BY TEIGA-TMI") + SUM("INSTALLED BY SIEMSA") AS "TOTAL DONE _Local"
FROM controlInstrumentsByIsometric;
`;

/**
 * Generates a SQL query to sum total installed by TEIGA-TMI
 * @returns {string} SQL query string
 */
export const getTotalInstalledTeigaTmiQuery = () => `
SELECT SUM("INSTALLED BY TEIGA-TMI") AS "TOTAL INSTALLED TEIGA-TMI _Global"
FROM controlInstrumentsByIsometric;

SELECT SUM("INSTALLED BY TEIGA-TMI") AS "TOTAL INSTALLED TEIGA-TMI _Local"
FROM controlInstrumentsByIsometric;
`;

/**
 * Generates a SQL query to sum total installed by SIEMSA
 * @returns {string} SQL query string
 */
export const getTotalInstalledSiemsaQuery = () => `
SELECT SUM("INSTALLED BY SIEMSA") AS "TOTAL INSTALLED SIEMSA _Global"
FROM controlInstrumentsByIsometric;

SELECT SUM("INSTALLED BY SIEMSA") AS "TOTAL INSTALLED SIEMSA _Local"
FROM controlInstrumentsByIsometric;
`;

/**
 * Generates a SQL query for dynamic instrument table total done
 * @returns {string} SQL query string
 */
export const getDynamicTotalDoneQuery = () => `
-- Query for dynamicInstrumentTable directly
SELECT SUM("DONE") AS "TOTAL INST DONE _Global"
FROM dynamicInstrumentTable;

SELECT SUM("DONE") AS "TOTAL INST DONE _Local"
FROM dynamicInstrumentTable;
`;

/**
 * Generates a combined SQL query for all metrics
 * @returns {string} SQL query string with all metrics
 */
export const getAllMetricsQuery = () => `
-- Total Isometrics
SELECT COUNT(DISTINCT "ISOMETRIC") AS "TOTAL ISOS _Global"
FROM controlInstrumentsByIsometric;

SELECT COUNT(DISTINCT "ISOMETRIC") AS "TOTAL ISOS _Local"
FROM controlInstrumentsByIsometric;

-- Total Tag Instruments
SELECT COUNT("TAG INST") AS "TOTAL TAG INST _Global"
FROM detailsInstrumentsTable;

SELECT COUNT("TAG INST") AS "TOTAL TAG INST _Local"
FROM detailsInstrumentsTable;

-- Total Instruments
SELECT SUM("QTY INST") AS "TOTAL INST _Global"
FROM controlInstrumentsByIsometric;

SELECT SUM("QTY INST") AS "TOTAL INST _Local"
FROM controlInstrumentsByIsometric;

-- Total Done
SELECT SUM("INSTALLED BY TEIGA-TMI") + SUM("INSTALLED BY SIEMSA") AS "TOTAL DONE _Global"
FROM controlInstrumentsByIsometric;

SELECT SUM("INSTALLED BY TEIGA-TMI") + SUM("INSTALLED BY SIEMSA") AS "TOTAL DONE _Local"
FROM controlInstrumentsByIsometric;

-- Total Installed by TEIGA-TMI
SELECT SUM("INSTALLED BY TEIGA-TMI") AS "TOTAL INSTALLED TEIGA-TMI _Global"
FROM controlInstrumentsByIsometric;

SELECT SUM("INSTALLED BY TEIGA-TMI") AS "TOTAL INSTALLED TEIGA-TMI _Local"
FROM controlInstrumentsByIsometric;

-- Total Installed by SIEMSA
SELECT SUM("INSTALLED BY SIEMSA") AS "TOTAL INSTALLED SIEMSA _Global"
FROM controlInstrumentsByIsometric;

SELECT SUM("INSTALLED BY SIEMSA") AS "TOTAL INSTALLED SIEMSA _Local"
FROM controlInstrumentsByIsometric;

-- Dynamic Table Example with correct column names
SELECT SUM("TOTAL INST") AS "TOTAL INST DYNAMIC _Global"
FROM dynamicInstrumentTable;

SELECT SUM("TOTAL INST") AS "TOTAL INST DYNAMIC _Local"
FROM dynamicInstrumentTable;

SELECT SUM("INSTALLED BY TEIGA-TMI") AS "INSTALLED BY TEIGA-TMI DYNAMIC _Global"
FROM dynamicInstrumentTable;

SELECT SUM("INSTALLED BY SIEMSA") AS "INSTALLED BY SIEMSA DYNAMIC _Global"
FROM dynamicInstrumentTable;

SELECT SUM("DONE") AS "DONE DYNAMIC _Global"
FROM dynamicInstrumentTable;

SELECT SUM("PENDING") AS "PENDING DYNAMIC _Global"
FROM dynamicInstrumentTable;

-- Fallback to master_subsystem if available
SELECT COUNT(*) AS "MASTER SUBSYSTEM COUNT _Global"
FROM master_subsystem;

-- Test table query (always works if DuckDB is functioning)
SELECT id, name FROM master_table AS "TEST TABLE _Global";
`;

/**
 * Generates a SQL query specifically for the dynamicInstrumentTable
 * @returns {string} SQL query string
 */
export const getDynamicTableQuery = () => `
-- Query for dynamicInstrumentTable directly
SELECT SUM("TOTAL INST") AS "TOTAL INST _Global"
FROM dynamicInstrumentTable;

SELECT SUM("INSTALLED BY TEIGA-TMI") AS "INSTALLED BY TEIGA-TMI _Global"
FROM dynamicInstrumentTable;

SELECT SUM("INSTALLED BY SIEMSA") AS "INSTALLED BY SIEMSA _Global"
FROM dynamicInstrumentTable;

SELECT SUM("PENDING") AS "PENDING _Global"
FROM dynamicInstrumentTable;

SELECT SUM("DONE") AS "DONE _Global"
FROM dynamicInstrumentTable;
`;

/**
 * Returns a list of all available metric queries
 * @returns {Array} Array of objects with name and query properties
 */
export const getAvailableMetricQueries = () => [
  { name: 'Total Isometrics', query: getTotalIsometricsQuery() },
  { name: 'Total Tag Instruments', query: getTotalTagInstQuery() },
  { name: 'Total Instruments', query: getTotalInstQuery() },
  { name: 'Total Done', query: getTotalDoneQuery() },
  { name: 'Total Installed by TEIGA-TMI', query: getTotalInstalledTeigaTmiQuery() },
  { name: 'Total Installed by SIEMSA', query: getTotalInstalledSiemsaQuery() },
  { name: 'Dynamic Total Done', query: getDynamicTotalDoneQuery() },
  { name: 'Dynamic Table Query', query: getDynamicTableQuery() },
  { name: 'All Metrics', query: getAllMetricsQuery() }
];