# Excel Processor Lambda

Rust Lambda function that processes Excel files uploaded to S3 via EventBridge.

## Features

- Triggered by EventBridge when files are uploaded to `rawDataset/` folder
- Reads Excel files (sheet='TEST_LOOP', skiprows=11, columns B:V)
- Converts to Polars DataFrame
- Analyzes data profile (shape, columns, types, null counts)
- Saves as Parquet to `preDataset/parquet/`
- Saves as Iceberg format to `preDataset/iceberg/`

## Build and Deploy

```bash
# Build and push to ECR
./build.sh <app-name> <aws-region>

# Deploy infrastructure with Terraform
cd ../../Infra
terraform apply
```

## Dependencies

- Polars for DataFrame operations
- AWS SDK for S3 operations
- Lambda runtime for event handling
- Tracing for structured logging