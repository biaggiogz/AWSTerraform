

---

## NSTRUMENTS REPORT Tab – Component Summary

### 🔧 **1. Core Application Logic**

* **`src/App.optimized.js:28,37,54,72,88`**
  Dashboard state handler for INSTRUMENTS REPORT tab.

* **`src/hooks/useDashboardConfig.optimized.js:25-31`**
  Maps INSTRUMENTS REPORT to `control_inst_by_isos.csv` with filters: ISOMETRIC, SUBSYSTEM.

* **`src/hooks/useGlobalTableRegistry.js:87-104`**
  Enables cross-tab access to instruments datasets.

---

### 🧭 **2. Navigation & UI Components**

* **`src/components/ui/ChartSelector.optimized.js:36-37,44-48,58,103,135-192`**
  Defines the 4th tab (index 3): INSTRUMENTS REPORT, integrates DynamicCalculationPanel.

---

### 📊 **3. Data Handling**

* **`src/hooks/useInstrumentsDataLoader.optimized.js:26-27`**
  Loads both `control_inst_by_isos.csv` and `details_inst.csv`.

* **`src/hooks/useInstrumentsFilter.js`**
  Implements control-details dataset filtering logic.

---

### 🧮 **4. SQL Query Engine (Dynamic Calculation)**

* **`src/components/panels/DynamicCalculationPanel.js:1-845`**
  Core SQL interface for INSTRUMENTS REPORT:

    * Query editor w/ intellisense (`lines 424-477`)
    * Quick metrics (`lines 384-421`)
    * Live execution (`lines 90-95`)
    * Field suggestions (`lines 138-192`)
    * Global/local toggle (`lines 524-675`)

* **`src/components/ui/SQLIntellisense.js:1-211`**
  Autocomplete support for SQL queries.

* **`src/hooks/useDuckDB.js:1-339`**
  SQL engine for query parsing, execution, and field mapping.

* **`src/hooks/usePersistentSQLState.js:1-101`**
  Manages query state, metric cards, localStorage.

* **`src/components/ui/CrossTabDataAccess.js:1-221`**
  Enables queries and table access across dashboards.

* **`src/wasm/sql-engine.wasm.js:1-50+`**
  WASM-accelerated SQL parsing and execution.

---

### 📋 **5. Table Components**

* **`src/components/tables/ControlInstrumentsTable.optimized.js:200-983`**
  Main table for control instruments:

    * Multi-level headers
    * Clickable filters
    * Virtualized scroll
    * Progress bars

* **`src/components/tables/DetailsInstrumentsTable.optimized.js`**
  Details table displaying instrument-level data.

---

### 🧪 **6. Filters**

* **`src/components/filters/IsometricRelationshipFilter.wasm.js:20-79`**
  WASM-powered isometric filter.

* **`src/components/filters/TestPackRelationshipFilter.optimized.js`**
  Test pack filtering logic.

* **`src/components/filters/SubsystemRelationshipFilter.optimized.js`**
  Subsystem filtering logic.

---

### 📐 **7. Relationship & Status Panels**

* **`src/components/panels/IsometricRelationshipPanel.optimized.js`**
  UI panel for visualizing isometric relationships (currently hidden).

---

### 📁 **8. Data Sources**

* `data/control_inst_by_isos.csv`
* `public/data/control_inst_by_isos.csv`
* `data/details_inst.csv`
* `public/data/details_inst.csv`

> Contain control and detailed instrument datasets.

---

### ✅ **9. Key Features of INSTRUMENTS REPORT**

* **Dual Dataset View**: Control & details CSVs loaded and linked.
* **Triple Filtering**: Isometric + Test Pack + Subsystem.
* **Advanced Table UI**: Grouped headers, color-coded sections.
* **Interactive Elements**: Clickable cells, badges, progress bars.
* **SQL Metrics Engine**: SQL query builder w/ live results.
* **Performance Focused**: WASM filters, memoization, virtual scroll.
* **Cross-Tab Access**: Global registry for instruments data.

---

Let me know if you'd like this exported to Markdown or integrated into a developer doc.
