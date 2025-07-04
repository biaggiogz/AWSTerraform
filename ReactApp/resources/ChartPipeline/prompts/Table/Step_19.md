# Initialize variables
selected_test_pack = None  # No TEST PACK selected initially

# Function to handle user click on a TEST PACK value
function onTestPackClick(clicked_value):
global selected_test_pack

    if selected_test_pack == clicked_value:
        # Case: User clicked the same value again → reset filter
        selected_test_pack = None
        showAllRecordsInBothTables()
    else:
        # Case: User clicked a new TEST PACK value → apply filter
        selected_test_pack = clicked_value
        filterBothTablesByTestPack(clicked_value)


# Function to filter both tables
function filterBothTablesByTestPack(test_pack_value):
for row in isometric_table:
if row["TEST PACK"] == test_pack_value:
showRow(row)
else:
hideRow(row)

    for row in mounting_table:
        if row["TEST PACK"] == test_pack_value:
            showRow(row)
        else:
            hideRow(row)


# Function to reset (unfilter) both tables
function showAllRecordsInBothTables():
for row in isometric_table:
showRow(row)

    for row in mounting_table:
        showRow(row)
