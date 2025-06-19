## ⚙️ Request: Add Click-to-Filter Behavior from Metric Bar to Table

### 🧭 Tab: LOOP TEST PROGRESS

---
### ⚠️ Implementation Principle

> ✅ *Accuracy and verification of logic are more important than speed of implementation.*

---

### 📂 Dataset

- **Source File:** `data/test_of_lazos_updated.csv`

---

### 🏗️ Project Structure

- **Source Path:** `ECS/Streamlit_Snowflake/resources/ChartPipeline/README.md`
- **Optimization Guide:** `ECS/Streamlit_Snowflake/resources/ChartPipeline/optimization-guide.md`

### 🎯 Goal

When the user clicks the **"LOOP (Signal) DONE"** metric bar (blue bar in dashboard), it should:

✅ **Filter the table "Loop Test Control - Precommissioning"**  
✅ **Only show rows where `PROGRESS == 100%` (OK=100%)**

---

### 🔄 Filter Flow Logic

| Trigger Element           | Filter Effect                                                                            | Target Component                      |
|--------------------------|-------------------------------------------------------------------------------------------|----------------------------------------|
| Click: "LOOP (Signal) DONE" metric (dashboard bar) | Filter the table by `PROGRESS == 100%`                                         | Table: Loop Test Control - Precommissioning |
| Click: "LOOP (Signal) PENDING" metric             | Filter the table by `PROGRESS < 100%`                                          | Same table                             |
| Reset Filters Button      | Clear this filter and show all rows again                                                | Both Dashboard + Table                 |

---

### 🧠 Additional Notes

- Column `"PROGRESS"` in the table is mapped from field `"OK=100%"` in the CSV file.
- Ensure this new filter works **in combination with existing filters** (Area and Subsystem), **not as a replacement**.
- The visual state of the metric bar should update (e.g., highlight active filter) to indicate an active filter is applied.
- Avoid full table re-renders — use `useMemo`, proper table state management, and ensure row virtualization remains active.

---

### 📌 Reminder

✅ Keep architecture and performance optimizations (e.g., `@tanstack/react-virtual`, Chakra UI, memoization, etc.)  
✅ Follow existing UI/UX patterns  
✅ Do not duplicate filtering logic — filter table once based on combined state
