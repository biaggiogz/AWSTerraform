/**
 * Utility functions for generating SQL queries for the INSTRUMENTS REPORT tab
 */

/**
 * Generates a SQL query to count total isometrics
 * @returns {string} SQL query string
 */
export const getTotalIsometricsQuery = () => `
SELECT COUNT(DISTINCT "ISOMETRIC") AS "TOTAL ISOS _Global"
FROM "ControlInstrumentsByIsometric";

SELECT COUNT(DISTINCT "ISOMETRIC") AS "TOTAL ISOS _Local"
FROM "ControlInstrumentsByIsometric";
`;

/**
 * Generates a SQL query to count total tag instruments
 * @returns {string} SQL query string
 */
export const getTotalTagInstQuery = () => `
SELECT COUNT("TAG INST") AS "TOTAL TAG INST _Global"
FROM "Details Instruments";

SELECT COUNT("TAG INST") AS "TOTAL TAG INST _Local"
FROM "Details Instruments";
`;

/**
 * Generates a SQL query to sum total instruments
 * @returns {string} SQL query string
 */
export const getTotalInstQuery = () => `
SELECT SUM("QTY INST") AS "TOTAL INST _Global"
FROM "ControlInstrumentsByIsometric";

SELECT SUM("QTY INST") AS "TOTAL INST _Local"
FROM "ControlInstrumentsByIsometric";
`;

/**
 * Generates a SQL query to sum total done instruments
 * @returns {string} SQL query string
 */
export const getTotalDoneQuery = () => `
SELECT SUM("INSTALLED BY TEIGA-TMI") + SUM("INSTALLED BY SIEMSA") AS "TOTAL DONE _Global"
FROM "ControlInstrumentsByIsometric";

SELECT SUM("INSTALLED BY TEIGA-TMI") + SUM("INSTALLED BY SIEMSA") AS "TOTAL DONE _Local"
FROM "ControlInstrumentsByIsometric";
`;

/**
 * Generates a SQL query to sum total installed by TEIGA-TMI
 * @returns {string} SQL query string
 */
export const getTotalInstalledTeigaTmiQuery = () => `
SELECT SUM("INSTALLED BY TEIGA-TMI") AS "TOTAL INSTALLED TEIGA-TMI _Global"
FROM "ControlInstrumentsByIsometric";

SELECT SUM("INSTALLED BY TEIGA-TMI") AS "TOTAL INSTALLED TEIGA-TMI _Local"
FROM "ControlInstrumentsByIsometric";
`;

/**
 * Generates a SQL query to sum total installed by SIEMSA
 * @returns {string} SQL query string
 */
export const getTotalInstalledSiemsaQuery = () => `
SELECT SUM("INSTALLED BY SIEMSA") AS "TOTAL INSTALLED SIEMSA _Global"
FROM "ControlInstrumentsByIsometric";

SELECT SUM("INSTALLED BY SIEMSA") AS "TOTAL INSTALLED SIEMSA _Local"
FROM "ControlInstrumentsByIsometric";
`;

/**
 * Generates a combined SQL query for all metrics
 * @returns {string} SQL query string with all metrics
 */
export const getAllMetricsQuery = () => `
-- Total Isometrics
SELECT COUNT(DISTINCT "ISOMETRIC") AS "TOTAL ISOS _Global"
FROM "ControlInstrumentsByIsometric";

SELECT COUNT(DISTINCT "ISOMETRIC") AS "TOTAL ISOS _Local"
FROM "ControlInstrumentsByIsometric";

-- Total Tag Instruments
SELECT COUNT("TAG INST") AS "TOTAL TAG INST _Global"
FROM "Details Instruments";

SELECT COUNT("TAG INST") AS "TOTAL TAG INST _Local"
FROM "Details Instruments";

-- Total Instruments
SELECT SUM("QTY INST") AS "TOTAL INST _Global"
FROM "ControlInstrumentsByIsometric";

SELECT SUM("QTY INST") AS "TOTAL INST _Local"
FROM "ControlInstrumentsByIsometric";

-- Total Done
SELECT SUM("INSTALLED BY TEIGA-TMI") + SUM("INSTALLED BY SIEMSA") AS "TOTAL DONE _Global"
FROM "ControlInstrumentsByIsometric";

SELECT SUM("INSTALLED BY TEIGA-TMI") + SUM("INSTALLED BY SIEMSA") AS "TOTAL DONE _Local"
FROM "ControlInstrumentsByIsometric";

-- Total Installed by TEIGA-TMI
SELECT SUM("INSTALLED BY TEIGA-TMI") AS "TOTAL INSTALLED TEIGA-TMI _Global"
FROM "ControlInstrumentsByIsometric";

SELECT SUM("INSTALLED BY TEIGA-TMI") AS "TOTAL INSTALLED TEIGA-TMI _Local"
FROM "ControlInstrumentsByIsometric";

-- Total Installed by SIEMSA
SELECT SUM("INSTALLED BY SIEMSA") AS "TOTAL INSTALLED SIEMSA _Global"
FROM "ControlInstrumentsByIsometric";

SELECT SUM("INSTALLED BY SIEMSA") AS "TOTAL INSTALLED SIEMSA _Local"
FROM "ControlInstrumentsByIsometric";
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
  { name: 'All Metrics', query: getAllMetricsQuery() }
];