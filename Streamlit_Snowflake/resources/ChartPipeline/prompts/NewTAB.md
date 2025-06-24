## ⚙️ Request: CREATE A TAB CALL "SUMMARY SUBSYSTEMS" INCLUDING:

- TABLE
- FILTER PANEL

---

### ⚠️ Implementation Principle

- ✅ Prioritize **accuracy and logic integrity** over implementation speed.
- ❗ **Do not modify** any existing filter logic, table behavior, or dashboard state beyond the scope defined here.
- Use `useMemo` to memoize global metric computation—trigger recalculation only when the raw dataset changes.
- Avoid unnecessary re-renders by isolating this display from all filter state.

---

### 📂 Dataset

- **Source File:** 
  - `data/test_pack_progress.csv`
  - `data/subsystems_info.csv`

- **Mapped Columns [Dashboard ↔ Dataset test_pack_progress.cv]**:
  - `Test Pack` ↔ `TestPack`
  - `Progress` ↔ `Progress`
  - `Subsystem` ↔ `SUBSYSTEM`

- **Mapped Columns [Dashboard ↔ Dataset subsystems_info.cv]**:
  - `Service` ↔ `SERVICE`
  - `Subsystem` ↔ `SUBSYSTEM`

---

### 🏗️ Project Structure

- **Source Path:** `ECS/Streamlit_Snowflake/resources/ChartPipeline/README.md`
- **Optimization Guide:** `ECS/Streamlit_Snowflake/resources/ChartPipeline/optimization-guide.md`
- **Optimization Summary:** `ECS/Streamlit_Snowflake/resources/ChartPipeline/optimization-summary.md`

---

### 🎯 Goal

- NEW TAB CALL "SUMMARY SUBSYSTEMS"
- TABLE RESPONSIVENESS  "TRACKING PROGRESS"
---

#### LAYOUT

- UI/UX must **exactly match existing components**:
- Styling (colors, padding, spacing)
- Responsiveness
- Component hierarchy and structure
- Optimize performance for large datasets (1,500+ rows, 17+ columns)
- Use `useMemo`, `useCallback`, and `React.memo` where appropriate
- Avoid excessive recalculations and preserve correct filter → table flow

#### Feature

| **Requirement**                  | **Value**                                                                   |
|----------------------------------|-----------------------------------------------------------------------------|
| **Table Library**                | `@tanstack/react-virtual@^3.0.1` + `@tanstack/react-table@^8.11.8`          |
| **Current compatible libraries** | `ECS/Streamlit_Snowflake/resources/ChartPipeline/package.json`              |
| **Target Tab**                   | `SUMMARY SUBSYSTEMS`                                                        |
| **Embedded Inside Dashboard?**   | ❌ No — it must remain a separate component                                  |
| **Vertical Scrolling Required**  | ✅ Yes — enable with `overflowY: auto`                                       |
| **Filter Panel Integration**     | ✅ Yes — table **must respond to Test Pack and Subsystem filter selections** |

#### TABLE DESIGN ,  DATA STRUCTURE AND CALCULATION 

- DATA STRUCTURE
  - COLUMNS TO IGNORE: ["DOSSIER S/N", "FLUIDO", "INSTRUMENTOS", "TRACEADO", "AISLAMIENTO", "EQUIPOS", "MOTORES"]
  - COLUMNS TO VISIBLE: ["SUBSYSTEM","TOTAL ITEMS", "DONE ITEMS","PENDING ITEMS","SERVICE", "N°TP","TP's INCLUDE","PROGRESS","TOTAL LOOP (Signal)","LOOP (Signal) DONE" ,"LOOP (Signal) PENDING"]
  - COLUMNS FROM `subsystems_info.csv` FOR THIS TABLE: ["SUBSYSTEM","SERVICE"]
  - COLUMNS FROM `test_pack_progress.csv` FOR THIS TABLE: ["N°TP","PROGRESS"]
  - COLUMN LINK BETWEEN `subsystems_info.csv` AND `test_pack_progress.csv`: ["SUBSYSTEM"]

- CALCULATION
  - TOTAL ITEMS = is the sum of const subsystemGroups from (SidebarProgressItemsPanel.js) by subsystem
  - DONE TIMES = is the sum of const itemsDone from (SidebarProgressItemsPanel.js) by subsystem
  - PENDING ITEMS = from the sum const itemsPending (SidebarProgressItemsPanel.js) by subsystem
  - N°TP = is the count "Test Pack"  group by subsystem

+--------+-------------+----------+-------+------+---------+--------------------------------+-----+---------------+----------+-------------+---------+------------+--------+---------+------------+------------+------------+
|DOSSIER |   FLUIDO    |SUBSYSTEM | TOTAL | DONE |PENDING  |          SERVICE               | N°TP| TP's INCLUDE | PROGRESS   |INSTRUMENTOS |TRACEADO |AISLAMIENTO |EQUIPOS |MOTORES  |TOTAL LOOP  | LOOP (Signal)| LOOP (Signal)|
|  S/N   |             |          | ITEMS | ITEMS| ITEMS    |                                |     |               |          |             |         |            |        |         | (Signal)   |    DONE      |   PENDING   |
+--------+-------------+----------+-------+------+---------+--------------------------------+-----+---------------+----------+-------------+---------+------------+--------+---------+------------+------------+------------+
| 00001  |ACL          |            |       |      |         |Distribución agua caliente de   |  4  |     1075      |[████████]|             |Traceado |            |        |         |     5      |     0      |     5      |
|        |             |            |       |      |         |lavados                         |     |     1045      |   28%    |             |Traceado |            |        |         |            |            |            |
|        |             |ACL-00000-01|       |      |         |                                |     |     1077      |    5%    |             |Traceado |            |        |         |            |            |            |
|        |             |            |       |      |         |                                |     |     1038      |    5%    |             |Traceado |            |        |         |            |            |            |
|        |             |            |       |      |         |                                |     |      29       |    0%    |NOT_APPLY    |Traceado |            |        |         |            |            |            |
+--------+-------------+----------+-------+------+---------+--------------------------------+-----+---------------+----------+-------------+---------+------------+--------+---------+------------+------------+------------+
| 00002  | ACL         |            |      |         |Agua caliente de lavados A39001 |  3  |      26       |    0%    |NOT_APPLY    |Traceado |            |        |         |     3      |     0      |     3      |
|        |             | ACL-10001-01|      |      |         |                                |     |     1006      |    0%    |             |Traceado |            |        |         |            |            |            |
+--------+-------------+----------+-------+------+---------+--------------------------------+-----+---------------+----------+-------------+---------+------------+--------+---------+------------+------------+------------+
| 00003  |    ACL      |ACL-10001-02|     |      |         |Agua caliente de lavados ATC001C|  1  |     1006      |[█████    ]|             |Traceado |            |        |         |     3      |     0      |     3      |
| 00004  |             |ACL-10003-01|     |      |         |Agua caliente de lavados A39003 |  1  |     1029      |    5%    |             |Traceado |            |        |         |     0      |     0      |     0      |
| 00005  |             |ACL-10005-01|     |      |         |Agua caliente de lavados A39005 |  1  |     1076      |    0%    |             |Traceado |            |        |         |     0      |     0      |     0      |
| 00006  |             |ACL-A6001-01|     |      |         |Agua caliente de lavados A60006 |  1  |     1051      |    5%    |             |Traceado |            |        |         |     0      |     0      |     0      |
|        |             |          |       |      |         |                                |     |     1005      |    0%    |             |Traceado |            |        |         |            |            |            |
|        |             |          |       |      |         |                                |     |     1023      |    0%    |             |Traceado |            |        |         |            |            |            |
+--------+-------------+----------+-------+------+---------+--------------------------------+-----+---------------+----------+-------------+---------+------------+--------+---------+------------+------------+------------+
| 00007  |            |       |      |         |Agua caliente de lavados PR1819 |  5  |     1076      |    0%    |             |Traceado |            |        |         |     0      |     0      |     0      |
|        |             |          |       |      |         |                                |     |     1079      |[██████   ]|             |         |            |        |         |            |            |            |
|        |     ACL        |          |       |      |         |                                |     |     1035      |   23%    |             |Traceado |            |        |         |            |            |            |
|        |             |  ACL-PR18-01        |       |      |         |                                |     |       6       |    0%    |NOT_APPLY    |   Si    |            |        |         |            |            |            |
|        |             |          |       |      |         |                                |     |       7       |    0%    |NOT_APPLY    |   Si    |            |        |         |            |            |            |
|        |             |          |       |      |         |                                |     |      57       |    4%    |NOT_APPLY    |   Si    |            |        |         |            |            |            |
+--------+-------------+----------+-------+------+---------+--------------------------------+-----+---------------+----------+-------------+---------+------------+--------+---------+------------+------------+------------+
| 00008  |    ACL      |ACL-10005-01|     |      |         |Agua glicolada y líneas asociadas|  8  |     1091      |    0%    |NOT_APPLY    |   Si    |            |        |         |    42      |    16      |    26      |
|        |             |          |       |      |         |                                |     |     2002      |    0%    |NOT_APPLY    |   Si    |            |        |         |            |            |            |
|        |             |          |       |      |         |                                |     |     2010      |[██████   ]|NOT_APPLY    |   Si    |            |        |         |            |            |            |
|        |             |          |       |      |         |                                |     |     2052      |   25%    |NOT_APPLY    |   Si    |            |        |         |            |            |            |
|        |             |          |       |      |         |                                |     |     2053      |    0%    |NOT_APPLY    |   Si    |            |        |         |            |            |            |
|        |             |          |       |      |         |                                |     |     1007      |    0%    |             |Traceado |            |        |         |            |            |            |
|        |             |          |       |      |         |                                |     |     1051      |    0%    |             |Traceado |            |        |         |            |            |            |
|        |             |          |       |      |         |                                |     |     1052      |    0%    |             |Traceado |            |        |         |            |            |            |
+--------+-------------+----------+-------+------+---------+--------------------------------+-----+---------------+----------+-------------+---------+------------+--------+---------+------------+------------+------------+
| 00009  |     AP      |AP-00000-01 |     |      |         |Agua potable (colector)         |  7  |     1052      |    0%    |             |Traceado |            |        |         |     1      |     0      |     1      |
|        |             |          |       |      |         |                                |     |     1033      |    0%    |             |Traceado |            |        |         |            |            |            |
|        |             |          |       |      |         |                                |     |     1034      |    0%    |             |Traceado |            |        |         |            |            |            |
|        |             |          |       |      |         |                                |     |     1100      |    0%    |             |Traceado |            |        |         |            |            |            |
+--------+-------------+----------+-------+------+---------+--------------------------------+-----+---------------+----------+-------------+---------+------------+--------+---------+------------+------------+------------+
| 00010  |             |AP-PR19-01  |     |      |         |Agua potable (PR19)             |  1  |     1100      |    0%    |             |Traceado |            |        |         |     1      |     0      |     1      |
+--------+-------------+----------+-------+------+---------+--------------------------------+-----+---------------+----------+-------------+---------+------------+--------+---------+------------+------------+------------+
