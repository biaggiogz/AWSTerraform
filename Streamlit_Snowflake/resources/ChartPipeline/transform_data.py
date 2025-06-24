#!/usr/bin/env python3
"""
Data transformation script that merges subsystem progress from:
- aislamientos.csv (item progress)
- pipelinedata.csv (construction coordination progress)
- test_of_lazos_updated.csv (loop completion)
"""

import pandas as pd
import os

def transform_data():
    # File paths
    base_dir = "/home/ubuntu/Documents/Terraform/ECS/Streamlit_Snowflake/resources/ChartPipeline/data/"
    file_1 = os.path.join(base_dir, "aislamientos.csv")
    file_2 = os.path.join(base_dir, "pipelinedata.csv")
    file_3 = os.path.join(base_dir, "test_of_lazos_updated.csv")
    output_file = os.path.join(base_dir, "summarysubsytems.csv")

    # Load datasets
    df1 = pd.read_csv(file_1)
    df2 = pd.read_csv(file_2)
    df3 = pd.read_csv(file_3)

    # -------- Item Progress (DATA_1) --------
    progress_cols = [
        'Avance Distanciadores',
        'Avance Aislamiento',
        'Avance Chapa',
        'Avance Cajas',
        'Avance Rematar'
    ]

    def count_done(group):
        mask = True
        for col in progress_cols:
            mask &= (group[col] == 1)
        return mask.sum()

    item_stats = df1.groupby('SUBSYSTEM').agg(TOTAL_ITEMS=('ISO', 'count'))
    item_stats['DONEITEMS'] = df1.groupby('SUBSYSTEM').apply(count_done)
    item_stats['PENDINGITEMS'] = item_stats['TOTAL_ITEMS'] - item_stats['DONEITEMS']
    item_stats.reset_index(inplace=True)

    # -------- Pipeline Progress (DATA_2) --------
    df2_grouped = df2.groupby(['SUBSYSTEM', 'TEST PACK'])['CONSTRUC COORD PROGRESS'].mean().reset_index()
    df2_grouped.rename(columns={'CONSTRUC COORD PROGRESS': 'PROGRESS'}, inplace=True)

    # -------- Loop Completion (DATA_3) --------
    df3 = df3.rename(columns={'SUBS_PRE': 'SUBSYSTEM'})
    df3['OK=100%'] = df3['OK=100%'].astype(str).str.strip()

    loop_stats = df3.groupby('SUBSYSTEM').agg(
        TOTAL_LOOPS=('TAG LOOP', 'count'),
        DONELOOPS=('OK=100%', lambda x: (x == '100.00%').sum()),
        PENDINGLOOPS=('OK=100%', lambda x: (x != '100.00%').sum())
    ).reset_index()

    # -------- Merge All Data --------
    combined = pd.merge(item_stats, df2_grouped, how='left', on='SUBSYSTEM')
    combined = pd.merge(combined, loop_stats, how='left', on='SUBSYSTEM')

    # Save output
    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    print(f"Saving final combined data to: {output_file}")
    combined.to_csv(output_file, index=False)

    print("\nTransformation completed successfully!")
    print(f"Rows in result: {len(combined)}")
    print("\nSample output:")
    print(combined.head())

    return combined

if __name__ == "__main__":
    transform_data()
