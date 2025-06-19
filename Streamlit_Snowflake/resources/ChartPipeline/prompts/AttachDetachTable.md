# ⚙️ Request: Add Detach/Attach Functionality to Table "Loop Test Control - Precommissioning"

## 🧭 Target Tab: `LOOP TEST PROGRESS`
> Enable users to **detach and re-attach** the main table from this tab while maintaining full filter/data synchronization.

---

## ⚠️ Implementation Principles
- ✅ **Accuracy** of logic and synchronization is more important than implementation speed.
- ✅ All existing filter flows must remain **functional and synchronized** (Area, Subsystem, Metric bar).
- ✅ Maintain **performance optimizations and architecture** per project standards.

---

## 📂 Dataset & Project Structure

| Element              | Path/Reference                                                                 |
|----------------------|---------------------------------------------------------------------------------|
| **CSV File**         | `data/test_of_lazos_updated.csv`                                                |
| **Component Target** | `LazosTable.optimized.js`                                                       |
| **Project README**   | `ECS/Streamlit_Snowflake/resources/ChartPipeline/README.md`                     |
| **Optimization Guide** | `ECS/Streamlit_Snowflake/resources/ChartPipeline/optimization-guide.md`     |

---

## 🎯 Feature Goals

| Feature                   | Description                                                                                  |
|---------------------------|----------------------------------------------------------------------------------------------|
| 🧩 **Detach/Attach Toggle**  | Add a toggle button that allows users to detach the table into a **portal** outside the tab |
| 🎯 **Draggable UI**         | When detached, the table should be **draggable and repositionable** on screen              |
| 🔄 **State Sync**           | Filters applied via the Filter Panel or Metric Bar should **still affect the detached table** |
| 🔁 **Re-Attach Option**     | Allow users to re-attach the table to its original location in the tab                     |

---

## 📐 Technical Requirements

| Requirement          | Value / Expectation                                                                                   |
|----------------------|-------------------------------------------------------------------------------------------------------|
| Library              | Use `@chakra-ui/portal` for rendering detached table                                                  |
| Draggable Behavior   | Optional: use `react-draggable` or Chakra-compliant dragging mechanism                               |
| Toggle Control       | Clear “Detach / Attach” button, preferably placed above or near the table title                      |
| Maintain State       | Ensure table keeps all filter, sort, and scroll states when toggled between attached/detached modes  |
| Performance          | Use `React.memo`, `useMemo`, and `useCallback` to prevent unnecessary re-renders                     |
| Visual Consistency   | Match spacing, styles, and typography of existing UI (Chakra UI theme)                               |
| Accessibility        | Keep focus indicators, tab controls, and contrasts accessible                                        |

---

📌 Reminders

    Maintain all existing filter and dashboard interactions

    Keep architecture and performance optimizations (e.g., @tanstack/react-virtual, Chakra UI, memoization)

    Follow existing UI/UX patterns

    Do not duplicate filtering logic — filter table once based on combined state


## 🧪 Testing Environment


✅ You can request a small test live using http://localhost:3000/ which is active as decribe below to verify:

| COMMAND |  PID  | USER  | FD  | TYPE | DEVICE  | SIZE/OFF | NODE | NAME                                                 |
|---------|-------|--------|-----|------|---------|----------|------|------------------------------------------------------|
| firefox |  4712 | ubuntu | 65u | IPv4 | 1105168 | 0t0      | TCP  | localhost:51086->localhost:3000 (ESTABLISHED)       |
| node    | 29760 | ubuntu | 18u | IPv4 | 736052  | 0t0      | TCP  | *:3000 (LISTEN)                                      |
| node    | 29760 | ubuntu | 21u | IPv4 | 1102976 | 0t0      | TCP  | localhost:3000->localhost:51086 (ESTABLISHED)       |)       |