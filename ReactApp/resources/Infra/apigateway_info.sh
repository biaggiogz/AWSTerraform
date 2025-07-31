#!/bin/bash

API_ID="azqiollbak"

echo "=== Getting REST API Info ==="
aws apigateway get-rest-api --rest-api-id $API_ID

echo -e "\n=== Getting Resources ==="
RESOURCES=$(aws apigateway get-resources --rest-api-id $API_ID)
echo "$RESOURCES"

echo -e "\n=== Checking for OPTIONS methods ==="
RESOURCE_IDS=$(echo "$RESOURCES" | jq -r '.items[].id')

for RESOURCE_ID in $RESOURCE_IDS; do
    echo "Checking resource: $RESOURCE_ID"
    aws apigateway get-method --rest-api-id $API_ID --resource-id $RESOURCE_ID --http-method OPTIONS 2>/dev/null && echo "OPTIONS method found for resource $RESOURCE_ID" || echo "No OPTIONS method for resource $RESOURCE_ID"
done