#!/bin/bash
set -e

echo "Building and deploying Python preprocessor Lambda Docker image..."

# Configuration
REGION="us-east-1"
ACCOUNT_ID="881490115226"
REPO_NAME="python-preprocessor"
IMAGE_TAG="latest"
IMAGE_URI="${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${REPO_NAME}:${IMAGE_TAG}"

# Login to ECR
echo "Logging into ECR..."
aws ecr get-login-password --region ${REGION} | docker login --username AWS --password-stdin ${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com


# Build Docker image
echo "Building Docker image..."
docker build -t ${REPO_NAME}:${IMAGE_TAG} .

# Tag image for ECR
docker tag ${REPO_NAME}:${IMAGE_TAG} ${IMAGE_URI}

# Push to ECR
echo "Pushing to ECR..."
docker push ${IMAGE_URI}

echo "✅ Python preprocessor Docker image deployed: ${IMAGE_URI}"