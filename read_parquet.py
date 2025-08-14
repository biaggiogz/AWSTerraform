#!/usr/bin/env python3
import pandas as pd
import sys

def read_parquet_file(file_path):
    try:
        # Read the parquet file
        df = pd.read_parquet(file_path)
        
        print(f"Shape: {df.shape}")
        print(f"Columns: {list(df.columns)}")
        print("\nFirst 5 rows:")
        print(df.head())
        print("\nData types:")
        print(df.dtypes)
        print("\nBasic info:")
        print(df.info())
        
        return df
    except Exception as e:
        print(f"Error reading parquet file: {e}")
        return None

if __name__ == "__main__":
    file_path = "/home/ubuntu/Documents/ECS/ReactApp/resources/Lambdas/excel-processor/D_02_REPORTE_AVANCE_PRUEBA_DE_LAZOS.parquet"
    df = read_parquet_file(file_path)