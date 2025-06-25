# TEST PACK Columns Implementation

## Overview
This implementation enhances the SummarySubsystems.js component by adding TEST PACK data columns to the existing table. The implementation follows the requirements specified in Step_2.md, ensuring proper row merging and centered values in merged cells.

## Key Features
1. Added TEST PACK data columns:
   - N°TP: Number of test packs per subsystem (count of distinct TEST PACKs)
   - TP's INCLUDE: Test pack IDs from the "TEST PACK" column in SQL result
   - PROGRESS TEST PACK: Progress visualization and percentage from "PROGRESS TEST PACK" column

2. Row merging implementation:
   - MERGED CELLS (with vertically centered values):
     - SUBSYSTEM: One value per subsystem group
     - TOTAL ITEMS: Merged for all rows of same subsystem
     - DONE ITEMS: Merged for all rows of same subsystem
     - PENDING ITEMS: Merged for all rows of same subsystem
     - Progress Items%: Merged for all rows of same subsystem
     - N°TP: Merged for all rows of same subsystem

   - UNMERGED CELLS (one value per row):
     - TP's INCLUDE: One test pack ID per row
     - PROGRESS TEST PACK: One progress visualization/percentage per row

3. Progress Visualization:
   - Progress bars with block representation (█████) to match the required visual style
   - Percentage display below the progress bar
   - Color coding based on progress level (red, blue, green)

## Data Processing
- Test pack data is extracted from the "TEST PACK" column in the CSV file
- Progress values are calculated based on "CONSTRUC COORD PROGRESS" values
- For each subsystem, test packs are grouped and displayed as separate rows
- The first row of each subsystem contains values for all merged columns

## Implementation Details
1. Enhanced the `subsystemProgressData` calculation to:
   - Track test pack progress values per subsystem
   - Calculate average progress when multiple entries exist for the same test pack
   - Create proper row structure for merged cells

2. Updated the table rendering to:
   - Apply proper rowSpan attributes to merged cells
   - Center values vertically in merged cells
   - Display progress bars with block representation

## Notes
- The implementation ignores columns [TOTAL LOOP Signal), LOOP (Signal) DONE, LOOP (Signal) PENDING, SERVICE] as specified in the requirements
- All values in merged cells are vertically centered as required