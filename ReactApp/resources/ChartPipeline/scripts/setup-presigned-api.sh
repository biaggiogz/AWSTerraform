#!/bin/bash

# Script to inject API Gateway URL into React build

echo "Setting up presigned API configuration..."

# Navigate to Terraform directory
cd ../Infra

# Get API Gateway URL from Terraform outputs
API_URL=$(terraform output -raw presigned_api_url 2>/dev/null)

# Navigate back to React app directory
cd ../ChartPipeline

# Inject API URL into build
if [ -d "build" ]; then
  echo "window.REACT_APP_PRESIGNED_API_URL = '${API_URL}';" > build/config.js
  
  # Update index.html to include config.js
  sed -i 's|</head>|<script src="/config.js"></script></head>|' build/index.html
  
  echo "✅ API configuration injected into build"
  echo "🔗 API URL: ${API_URL}"
else
  echo "❌ Build directory not found. Run 'npm run build' first."
fi