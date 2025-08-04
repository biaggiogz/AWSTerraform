#!/bin/bash
set -e

echo "🐍 Building Python Lambda Docker image..."

# Build and push Docker image
./deploy.sh

echo "🚀 Deploying with Terraform..."

# Deploy with Terraform
cd ../../Infra
terraform apply -auto-approve

echo "✅ Python preprocessor deployed successfully!"