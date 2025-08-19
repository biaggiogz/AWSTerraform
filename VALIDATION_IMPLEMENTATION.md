# Excel File Validation Implementation

## Overview
This implementation adds Excel file validation functionality to the existing Lambda processing pipeline without creating additional Lambdas, avoiding synchronization issues.

## Components Added

### 1. UI Components

#### SheetParametersForm.js
- Allows users to configure sheet parameters (name, skip_rows, column_range)
- Pre-populated with default values for known sheets
- Validates user input and provides helpful instructions

#### ValidationResultsView.js  
- Displays detailed validation results to users
- Shows errors, warnings, and sheet-specific validation details
- Provides options to retry with different parameters or proceed if valid

### 2. Modified Components

#### FileUploadSection.js
- Added sheet parameters configuration UI
- Integrated validation workflow into upload process
- Added validation status tracking and error handling
- Only allows Excel files (.xlsx, .xlsm) for validation

#### s3Utils.js
- Added `uploadSheetParameters()` function
- Added `downloadJsonFromS3()` function  
- Added `checkS3ObjectExists()` function
- Added `getValidationResults()` function

### 3. Lambda Modifications

#### lambda_function.py
- Added `validate_excel_file()` function
- Added `validate_sheet()` function
- Added `process_excel_with_custom_parameters()` function
- Modified main handler to check for sheet parameters and validate before processing
- Saves validation results to S3 for UI feedback

## Workflow

1. **User Configuration**: User configures sheet parameters using the UI form
2. **File Upload**: User uploads Excel file (.xlsx/.xlsm only)
3. **Parameter Upload**: Sheet parameters are uploaded to S3 (`sheet-parameters/{fileId}.json`)
4. **Lambda Processing**: 
   - Lambda detects parameters file
   - Validates Excel structure against parameters
   - If validation fails: saves error details and stops processing
   - If validation passes: continues with custom parameter processing
5. **User Feedback**: 
   - Validation errors shown in detailed UI
   - User can fix parameters and retry
   - Successful validation proceeds to normal processing

## Key Features

- **No Additional Lambdas**: All validation logic integrated into existing Lambda
- **Flexible Parameters**: Users can customize sheet names, skip rows, and column ranges
- **Detailed Feedback**: Comprehensive validation results with specific error messages
- **Graceful Fallback**: Falls back to default processing if no parameters provided
- **Error Recovery**: Users can fix issues and retry without re-uploading files

## File Structure

```
ReactApp/resources/ChartPipeline/src/
├── components/ui/
│   ├── SheetParametersForm.js          # New: Parameter configuration UI
│   ├── ValidationResultsView.js        # New: Validation results display
│   └── FileUploadSection.js            # Modified: Added validation workflow
├── utils/
│   └── s3Utils.js                      # Modified: Added validation utilities
└── Lambdas/python-preprocessor/
    └── lambda_function.py              # Modified: Added validation logic
```

## Usage

1. Navigate to "UPDATE DATASET" tab
2. Click "Sheet Parameters" to configure sheet settings
3. Adjust sheet names, skip rows, and column ranges as needed
4. Upload Excel file - validation runs automatically
5. Review validation results if errors occur
6. Fix parameters and retry, or proceed if validation passes

## Benefits

- **Prevents Processing Errors**: Catches structural issues before processing
- **User-Friendly**: Clear feedback on what needs to be fixed
- **Flexible**: Accommodates different Excel file structures
- **Reliable**: Single Lambda approach avoids synchronization issues
- **Maintainable**: Minimal code changes to existing working system