#!/bin/bash

set -e

APP_NAME=${1:-"react-app"}
AWS_REGION=${2:-"us-east-1"}
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

REPO_NAME="${APP_NAME}-excel-processor"
IMAGE_TAG="latest"
IMAGE_URI="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${REPO_NAME}:${IMAGE_TAG}"

echo "Building Excel processor Lambda..."
echo "Repository: ${REPO_NAME}"
echo "Image URI: ${IMAGE_URI}"

# Create ECR repository if it doesn't exist
#aws ecr describe-repositories --repository-names ${REPO_NAME} --region ${AWS_REGION} 2>/dev/null || \
#aws ecr create-repository --repository-name ${REPO_NAME} --region ${AWS_REGION}

# Get ECR login token
aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com

# Build Docker image
docker build --platform linux/arm64 -t ${REPO_NAME}:${IMAGE_TAG} .

# Tag for ECR
docker tag ${REPO_NAME}:${IMAGE_TAG} ${IMAGE_URI}

# Push to ECR
docker push ${IMAGE_URI}

echo "Successfully built and pushed Excel processor Lambda to ECR"
echo "Image URI: ${IMAGE_URI}"