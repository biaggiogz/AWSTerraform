import pandas as pd

# Check what sheets are in the MASTER_DATASET.xlsx file
file_path = '/home/ubuntu/Documents/ECS/ReactApp/resources/Lambdas/python-preprocessor/MASTER_DATASET.xlsx'

try:
    # Get all sheet names
    xl_file = pd.ExcelFile(file_path)
    sheet_names = xl_file.sheet_names
    
    print("Available sheets in MASTER_DATASET.xlsx:")
    for i, sheet in enumerate(sheet_names):
        print(f"{i+1}. '{sheet}'")
    
    # Try to read the TEST_LOOP sheet specifically
    print("\nTrying to read TEST_LOOP sheet...")
    try:
        test_loop_df = pd.read_excel(file_path, sheet_name='TEST_LOOP', skiprows=11, usecols='B:V', dtype=str)
        print(f"✅ TEST_LOOP sheet found! Shape: {test_loop_df.shape}")
        print(f"Columns: {list(test_loop_df.columns)}")
    except Exception as e:
        print(f"❌ Error reading TEST_LOOP sheet: {e}")
        
        # Try without parameters
        try:
            test_loop_df = pd.read_excel(file_path, sheet_name='TEST_LOOP')
            print(f"✅ TEST_LOOP sheet found (no params)! Shape: {test_loop_df.shape}")
        except Exception as e2:
            print(f"❌ Error reading TEST_LOOP sheet (no params): {e2}")
    
except Exception as e:
    print(f"Error opening file: {e}")