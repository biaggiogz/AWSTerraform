#!/bin/bash
set -e

echo "Starting cleanup of streamlit-test resources..."

# Set AWS region
AWS_REGION="us-east-1"  # Change to your region
APP_NAME="streamlit-test"

# Delete CloudFront distribution
echo "Deleting CloudFront distribution..."
CF_ID=$(aws cloudfront list-distributions --query "DistributionList.Items[?contains(Origins.Items[0].DomainName, '$APP_NAME')].Id" --output text)
if [ ! -z "$CF_ID" ] && [ "$CF_ID" != "None" ]; then
  echo "Found CloudFront distribution: $CF_ID"
  # Get the current config
  # Get current config and ETag
  aws cloudfront get-distribution --id $CF_ID > cf_full.json
  ETAG=$(jq -r '.ETag' cf_full.json)

  # Disable the distribution safely with jq
  jq '.Distribution.DistributionConfig' cf_full.json > cf_config.json
  jq '.Enabled = false' cf_config.json > cf_config_disabled.json

  # Update distribution config
  aws cloudfront update-distribution --id $CF_ID --if-match "$ETAG" --distribution-config file://cf_config_disabled.json

  aws cloudfront wait distribution-deployed --id $CF_ID

  # Get new ETag after update
  aws cloudfront get-distribution --id $CF_ID > cf_full_new.json
  NEW_ETAG=$(jq -r '.ETag' cf_full_new.json)

  aws cloudfront delete-distribution --id $CF_ID --if-match "$NEW_ETAG" || true

  # Cleanup temp files
  rm -f cf_full.json cf_config.json cf_config_disabled.json cf_full_new.json



fi

# Delete ECS service
echo "Deleting ECS service..."
aws ecs update-service --cluster $APP_NAME-ecs-cluster --service $APP_NAME-ecs-service --desired-count 0 || true
aws ecs delete-service --cluster $APP_NAME-ecs-cluster --service $APP_NAME-ecs-service --force || true

# Delete ECS task definitions
echo "Deleting ECS task definitions..."
TASK_DEFS=$(aws ecs list-task-definitions --family-prefix $APP_NAME-ecs-task --query "taskDefinitionArns[]" --output text)
for TD in $TASK_DEFS; do
  aws ecs deregister-task-definition --task-definition $TD || true
done

# Delete ECS cluster
echo "Deleting ECS cluster..."
aws ecs delete-cluster --cluster $APP_NAME-ecs-cluster || true

# Delete ALB
echo "Deleting ALB and target groups..."
ALB_ARN=$(aws elbv2 describe-load-balancers --names $APP_NAME-alb --query "LoadBalancers[0].LoadBalancerArn" --output text 2>/dev/null || echo "")
if [ ! -z "$ALB_ARN" ] && [ "$ALB_ARN" != "None" ]; then
  # Delete listeners first
  LISTENERS=$(aws elbv2 describe-listeners --load-balancer-arn $ALB_ARN --query "Listeners[].ListenerArn" --output text)
  for LISTENER in $LISTENERS; do
    aws elbv2 delete-listener --listener-arn $LISTENER || true
  done
  
  # Delete load balancer
  aws elbv2 delete-load-balancer --load-balancer-arn $ALB_ARN || true
  
  # Wait for ALB to be deleted
  sleep 30
  
  # Delete target groups
  TGS=$(aws elbv2 describe-target-groups --query "TargetGroups[?contains(TargetGroupName, '$APP_NAME')].TargetGroupArn" --output text)
  for TG in $TGS; do
    aws elbv2 delete-target-group --target-group-arn $TG || true
  done
fi

# Delete ECR repository
echo "Deleting ECR repository..."
aws ecr delete-repository --repository-name $APP_NAME-repo --force || true

# Delete S3 buckets
echo "Deleting S3 buckets..."
BUCKETS=$(aws s3api list-buckets --query "Buckets[?contains(Name, '$APP_NAME')].Name" --output text)
for BUCKET in $BUCKETS; do
  aws s3 rm s3://$BUCKET --recursive || true
  aws s3api delete-bucket --bucket $BUCKET || true
done

# Delete CloudWatch resources
echo "Deleting CloudWatch resources..."
aws logs delete-log-group --log-group-name /ecs/$APP_NAME-ecs-log-group || true
aws events delete-event-bus --name $APP_NAME-event_bus || true

# Delete CodePipeline and CodeBuild
echo "Deleting CodePipeline and CodeBuild..."
aws codepipeline delete-pipeline --name $APP_NAME-pipeline || true
aws codebuild delete-project --name $APP_NAME-image-builder || true

# Find VPC ID
echo "Finding VPC ID..."
VPC_ID=$(aws ec2 describe-vpcs --filters "Name=tag:Name,Values=$APP_NAME-vpc" --query "Vpcs[0].VpcId" --output text)
if [ "$VPC_ID" == "None" ] || [ -z "$VPC_ID" ]; then
  echo "No VPC found with tag Name:$APP_NAME-vpc"
else
  echo "Found VPC: $VPC_ID"

  # Delete security groups
  echo "Deleting security groups..."
  SG_IDS=$(aws ec2 describe-security-groups --filters "Name=vpc-id,Values=$VPC_ID" "Name=tag:Name,Values=$APP_NAME-*" --query "SecurityGroups[].GroupId" --output text)
  for SG_ID in $SG_IDS; do
    aws ec2 delete-security-group --group-id $SG_ID || true
  done

  # Delete route tables
  echo "Deleting route tables..."
  RT_IDS=$(aws ec2 describe-route-tables --filters "Name=vpc-id,Values=$VPC_ID" --query "RouteTables[?!Associations[?Main]].RouteTableId" --output text)
  for RT_ID in $RT_IDS; do
    # Delete associations first
    ASSOC_IDS=$(aws ec2 describe-route-tables --route-table-ids $RT_ID --query "RouteTables[0].Associations[].RouteTableAssociationId" --output text)
    for ASSOC_ID in $ASSOC_IDS; do
      aws ec2 disassociate-route-table --association-id $ASSOC_ID || true
    done
    
    # Delete routes
    aws ec2 delete-route --route-table-id $RT_ID --destination-cidr-block 0.0.0.0/0 || true
    
    # Delete route table
    aws ec2 delete-route-table --route-table-id $RT_ID || true
  done

  # Release EIPs
  echo "Releasing EIPs..."
  EIP_IDS=$(aws ec2 describe-addresses --filters "Name=tag:Name,Values=$APP_NAME-eip" --query "Addresses[].AllocationId" --output text)
  for EIP_ID in $EIP_IDS; do
    aws ec2 release-address --allocation-id $EIP_ID || true
  done

  # Detach and delete IGW
  echo "Detaching and deleting Internet Gateway..."
  IGW_ID=$(aws ec2 describe-internet-gateways --filters "Name=attachment.vpc-id,Values=$VPC_ID" --query "InternetGateways[0].InternetGatewayId" --output text)
  if [ ! -z "$IGW_ID" ] && [ "$IGW_ID" != "None" ]; then
    aws ec2 detach-internet-gateway --internet-gateway-id $IGW_ID --vpc-id $VPC_ID || true
    aws ec2 delete-internet-gateway --internet-gateway-id $IGW_ID || true
  fi

  # Delete subnets
  echo "Deleting subnets..."
  SUBNET_IDS=$(aws ec2 describe-subnets --filters "Name=vpc-id,Values=$VPC_ID" --query "Subnets[].SubnetId" --output text)
  for SUBNET_ID in $SUBNET_IDS; do
    aws ec2 delete-subnet --subnet-id $SUBNET_ID || true
  done

  # Delete VPC
  echo "Deleting VPC..."
  aws ec2 delete-vpc --vpc-id $VPC_ID || true
fi

# Delete IAM roles and policies
echo "Deleting IAM roles and policies..."
for ROLE in "eventbridge-invoke-streamlit-event-bus" "eventbridge-invoke-streamlit-codepipeline" "codepipeline-service-role" "codebuild-service-role" "ecs-default-role" "ecs-task-execution-role"; do
  # Detach policies
  POLICIES=$(aws iam list-attached-role-policies --role-name $APP_NAME-$ROLE --query "AttachedPolicies[].PolicyArn" --output text 2>/dev/null || echo "")
  for POLICY in $POLICIES; do
    aws iam detach-role-policy --role-name $APP_NAME-$ROLE --policy-arn $POLICY || true
  done
  
  # Delete role
  aws iam delete-role --role-name $APP_NAME-$ROLE || true
done

# Delete custom policies
for POLICY in "eventbridge-invoke-streamlit-event-bus" "eventbridge-invoke-streamlit-codepipeline" "codepipeline-service-role-policy" "codebuild-service-role-policy" "ecs-default-policy"; do
  POLICY_ARN=$(aws iam list-policies --scope Local --query "Policies[?PolicyName=='$APP_NAME-$POLICY'].Arn" --output text)
  if [ ! -z "$POLICY_ARN" ] && [ "$POLICY_ARN" != "None" ]; then
    aws iam delete-policy --policy-arn $POLICY_ARN || true
  fi
done

echo "Cleanup complete!"