## Metrics
| Metric                                           | Condition                                                                                                                                       | Meaning                                                                                               | Value |
|--------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------|--------|
| Unique TAG_LOOPs                                 | `df["TAG LOOP"].nunique()`                                                                                                                       | Number of distinct TAG_LOOPs in the dataset.                                                          | 89     |
| TAG_LOOPs with OK=100%                           | `df[df["OK=100%"].astype(str).str.replace("%","").str.strip().astype(float) == 100]["TAG LOOP"].nunique()`                                      | Number of TAG_LOOPs where OK=100% status is achieved, indicating full installation/verification.      | 26     |
| TAG_LOOPs with all construction steps complete   | `df.dropna(subset=["INSTALLED", "WIRED", "CONNECTED", "CABLE TEST"])["TAG LOOP"].nunique()`                                                     | Number of TAG_LOOPs where all construction steps are documented as complete.                          | 12     |
| TAG_LOOPs with Pre-Commissioning Dates           | `df[(~df["DOSSIER"].isnull()) | (~df["TEST LOOP"].isnull())]["TAG LOOP"].nunique()`                                                          | Number of TAG_LOOPs with at least one pre-commissioning date recorded.                                | 26     |
| TAG_LOOPs with incomplete construction           | `df[df[["INSTALLED", "WIRED", "CONNECTED", "CABLE TEST"]].isnull().any(axis=1)]["TAG LOOP"].nunique()`                                          | Number of TAG_LOOPs missing at least one construction step.                                           | 77     |


## Bar Chart (Vertical)

Why:
A bar chart is the most effective and widely 
recommended chart for comparing categorical 
metrics, such as counts of TAG_LOOPs in 
different completion states. Each bar can 
represent a metric (e.g., "OK=100%", "All Construction Steps Complete"), making it easy to compare values side by side. This approach is clear, scalable, and ideal for project progress tracking

How to Use:

    X-axis: Metric categories (e.g., "Unique TAG_LOOPs", "OK=100%", etc.)

    Y-axis: Value (count for each metric)

    Each bar:

        Represents the value for a specific metric.

        Display the numeric value inside the bar (centered or top-aligned within the bar), not as a label on top or beside. This makes the chart easier to read and keeps the visual clean.