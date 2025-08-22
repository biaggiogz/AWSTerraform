# Excel Processor Lambda (Rust)

This Rust implementation replicates the Python Excel preprocessing pipeline with the following features:

## Core Functionality

### Type Inference Engine
- **Numeric Detection**: Identifies integers and floats with pattern matching
- **Boolean Detection**: Recognizes true/false, yes/no, 1/0 patterns  
- **DateTime Detection**: Matches common date formats (YYYY-MM-DD, MM/DD/YYYY, etc.)
- **String Fallback**: Default type for unmatched patterns

### Sheet Processing
- **TEST_LOOP**: Processes test loop data with subsystem grouping
- **TP**: Handles test package data with _TP suffix
- **ISOS**: Processes isometric data
- **Tuberia**: Handles insulation data
- **TRAC_SIEMSA**: Processes tracing information
- **FIELD_CONTROL**: Handles field control data
- **ISO_INST**: Processes instrumentation data
- **Punch_List**: Handles punch list items
- **Subsystems**: Processes subsystem metadata
- **general**: Handles general project data

### Master Table Creation
- Joins multiple sheets on subsystem and record columns
- Creates master_subsystem table for comprehensive analysis
- Implements SSM (Subsystem Status Matrix) analysis

### Output Generation
- **Parquet Files**: Efficient columnar storage for each processed sheet
- **CSV Files**: Human-readable format for SSM data
- **Metadata**: JSON metadata for each processed sheet
- **Progress Tracking**: Real-time progress updates via S3

## Architecture

### Dependencies
- **polars**: High-performance DataFrame operations
- **calamine**: Excel file reading
- **aws-sdk-s3**: S3 operations
- **regex**: Pattern matching for type inference
- **chrono**: DateTime handling
- **serde**: JSON serialization

### Performance Benefits
- **Memory Efficiency**: Polars uses Apache Arrow for zero-copy operations
- **Parallel Processing**: Built-in parallelization for large datasets
- **Type Safety**: Compile-time guarantees prevent runtime errors
- **Resource Management**: Automatic memory management without GC overhead

## Build & Deploy

```bash
# Build Docker image
./build.sh react-app us-east-1

# The build process uses cargo-chef for efficient dependency caching
# Supports both ARM64 and AMD64 architectures
```

## Event Structure

The lambda expects EventBridge events with this structure:
```json
{
  "detail": {
    "bucket": {"name": "bucket-name"},
    "object": {"key": "path/to/file.xlsx"}
  }
}
```

## Output Structure

### Processed Files
- `processedRust/{file_id}_{sheet_name}.parquet`
- `processedRust/{file_id}_{sheet_name}_metadata.json`
- `data/ssm.csv` (SSM analysis)
- `data/master_subsystem.parquet` (Master table)

### Progress Tracking
- `progress/{file_id}.json` (Real-time progress updates)

## Type Inference Logic

The type inference follows this priority order:
1. **Numeric** (95% threshold for conversion success)
2. **Boolean** (95% threshold for recognized patterns)  
3. **DateTime** (30% threshold for date-like patterns)
4. **String** (fallback)

## Comparison with Python Version

| Feature | Python | Rust |
|---------|--------|------|
| Performance | ~30s for large files | ~5s for large files |
| Memory Usage | High (pandas) | Low (polars) |
| Type Safety | Runtime errors | Compile-time safety |
| Concurrency | GIL limitations | True parallelism |
| Dependencies | Heavy (numpy, pandas) | Lightweight |

## Error Handling

- Graceful sheet processing failures
- Detailed error logging with tracing
- Progress updates even on partial failures
- Automatic cleanup of temporary files