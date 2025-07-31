# S3 File Upload Configuration

## Overview
The FileUploadSection component now uploads files directly to AWS S3 instead of storing them locally. Files are uploaded to the `rawDataset/` folder in the S3 bucket.

## Deployment Steps

### 1. Deploy Terraform Infrastructure
```bash
cd ../Infra
terraform init
terraform plan
terraform apply
```

### 2. Configure Environment Variables
```bash
cd ../ChartPipeline
./scripts/setup-s3-env.sh
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Build and Deploy
```bash
npm run build
```

## Configuration

### Environment Variables
The following environment variables are required:
- `REACT_APP_AWS_REGION`: AWS region (default: us-east-1)
- `REACT_APP_AWS_ACCESS_KEY_ID`: AWS access key for S3 uploads
- `REACT_APP_AWS_SECRET_ACCESS_KEY`: AWS secret key for S3 uploads
- `REACT_APP_S3_BUCKET_NAME`: S3 bucket name for file uploads

### S3 Bucket Structure
```
your-bucket-name/
└── rawDataset/
    ├── file1.csv
    ├── file2.xlsx
    └── file3.xlsm
```

## Features

### File Upload
- Supports CSV, XLSX, and XLSM files
- Uploads directly to S3 with progress indication
- Validates file types before upload
- Shows upload status and errors

### File Management
- Lists uploaded files with S3 status
- Download files directly from S3
- Delete files from S3
- File size and upload date display

### Security
- IAM user with minimal S3 permissions
- CORS configuration for browser uploads
- Files stored in dedicated `rawDataset/` prefix

## Troubleshooting

### Common Issues
1. **Upload fails**: Check AWS credentials and bucket permissions
2. **CORS errors**: Verify S3 bucket CORS configuration
3. **Access denied**: Ensure IAM user has proper S3 permissions

### Debug Steps
1. Check browser console for detailed error messages
2. Verify environment variables are loaded
3. Test AWS credentials with AWS CLI
4. Check S3 bucket exists and is accessible