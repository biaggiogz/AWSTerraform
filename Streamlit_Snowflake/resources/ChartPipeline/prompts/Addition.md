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

When the user clicks the **"DOSSIER COMPLETED"** metric bar (pin bar in dashboard), it should:

✅ **Filter the table "Loop Test Control - Precommissioning"**  
✅ **Only show rows where `DOSSIER != null` (DOSSIER)**

---

### 🔄 Filter Flow Logic

| Trigger Element                                   | Filter Effect                            | Target Component                      |
|---------------------------------------------------|------------------------------------------|----------------------------------------|
| Click: "DOSSIER COMPLETED" metric (dashboard bar) | Filter the table by `DOSSIER != null`    | Table: Loop Test Control - Precommissioning |
| Reset Filters Button                              | Clear this filter and show all rows again | Both Dashboard + Table                 |

---

### 🧠 Additional Notes

- Column `"DOSSIER"` in the table is mapped from field `"DOSSIER"` in the CSV file.
- Ensure this new filter works **in combination with existing filters** (Area and Subsystem), **not as a replacement**.
- The visual state of the metric bar should update (e.g., highlight active filter) to indicate an active filter is applied.
- Avoid full table re-renders — use `useMemo`, proper table state management, and ensure row virtualization remains active.

---

### 📌 Reminder

✅ Keep architecture and performance optimizations (e.g., `@tanstack/react-virtual`, Chakra UI, memoization, etc.)  
✅ Follow existing UI/UX patterns  
✅ Do not duplicate filtering logic — filter table once based on combined state
✅ You can request a small test live using http://localhost:3000/ which is active as decribe below to verify:

| COMMAND |  PID  | USER  | FD  | TYPE | DEVICE  | SIZE/OFF | NODE | NAME                                                 |
|---------|-------|--------|-----|------|---------|----------|------|------------------------------------------------------|
| firefox |  4712 | ubuntu | 65u | IPv4 | 1105168 | 0t0      | TCP  | localhost:51086->localhost:3000 (ESTABLISHED)       |
| node    | 29760 | ubuntu | 18u | IPv4 | 736052  | 0t0      | TCP  | *:3000 (LISTEN)                                      |
| node    | 29760 | ubuntu | 21u | IPv4 | 1102976 | 0t0      | TCP  | localhost:3000->localhost:51086 (ESTABLISHED)       |
