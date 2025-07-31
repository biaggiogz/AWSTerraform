# Secure S3 File Upload Implementation

## Architecture

### ✅ Secure Approach (Current Implementation)
- **Presigned URLs**: Lambda generates temporary, secure URLs
- **No credentials in frontend**: Zero exposure of AWS keys
- **Existing bucket**: Uses React app bucket with `rawDataset/` prefix
- **API Gateway**: Secure endpoint for presigned URL generation
- **IAM roles**: Lambda uses roles, not hardcoded credentials

### ❌ Previous Issues Fixed
- ~~Separate S3 bucket~~ → Uses existing React app bucket
- ~~AWS credentials in .env~~ → No credentials needed
- ~~Client-side AWS SDK~~ → Simple fetch() calls

## Components

### 1. Lambda Function (`presigned-url-generator`)
- Generates presigned URLs for upload/delete operations
- Uses IAM role with minimal S3 permissions
- 5-minute URL expiration for security

### 2. API Gateway
- Secure endpoint: `/presigned-url`
- CORS enabled for browser requests
- Invokes Lambda function

### 3. React Frontend
- Requests presigned URL from API Gateway
- Uploads directly to S3 using presigned URL
- No AWS credentials required

## File Flow

```
1. User selects file
2. Frontend → API Gateway → Lambda
3. Lambda generates presigned URL
4. Frontend uploads file directly to S3
5. File stored in: bucket/rawDataset/filename.csv
```

## Deployment

```bash
# 1. Deploy infrastructure
cd ../Infra
terraform apply

# 2. Build React app (includes API URL injection)
cd ../ChartPipeline
npm run build

# 3. Deploy to S3 (handled by Terraform)
```

## Security Benefits

- **No credentials exposure**: Frontend never sees AWS keys
- **Time-limited access**: Presigned URLs expire in 5 minutes
- **Scoped permissions**: Lambda can only access `rawDataset/` folder
- **HTTPS only**: All communications encrypted
- **CORS protection**: API only accepts requests from allowed origins