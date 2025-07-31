#!/bin/bash

# Script to extract S3 configuration from Terraform outputs and create .env file

echo "Setting up S3 environment configuration..."

# Navigate to Terraform directory
cd ../../Infra

# Get Terraform outputs
BUCKET_NAME=$(terraform output -raw file_upload_bucket_name 2>/dev/null)
ACCESS_KEY=$(terraform output -raw s3_upload_access_key 2>/dev/null)
SECRET_KEY=$(terraform output -raw s3_upload_secret_key 2>/dev/null)
REGION=$(terraform output -raw aws_region 2>/dev/null || echo "us-east-1")

# Navigate back to React app directory
cd ../ChartPipeline

# Create .env file
cat > .env << EOF
# AWS Configuration for S3 File Uploads
REACT_APP_AWS_REGION=${REGION}
REACT_APP_AWS_ACCESS_KEY_ID=${ACCESS_KEY}
REACT_APP_AWS_SECRET_ACCESS_KEY=${SECRET_KEY}
REACT_APP_S3_BUCKET_NAME=${BUCKET_NAME}
EOF

echo "✅ Environment configuration created in .env file"
echo "🔒 Make sure to add .env to your .gitignore file"
echo "📦 S3 Bucket: ${BUCKET_NAME}"
echo "🌍 Region: ${REGION}"