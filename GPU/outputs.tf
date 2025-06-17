output "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  value       = aws_ecs_cluster.gpu_cluster.name
}

output "ecs_cluster_arn" {
  description = "ARN of the ECS cluster"
  value       = aws_ecs_cluster.gpu_cluster.arn
}

output "task_definition_arn" {
  description = "ARN of the GPU task definition"
  value       = aws_ecs_task_definition.gpu_task.arn
}

output "ecs_service_name" {
  description = "Name of the ECS service"
  value       = aws_ecs_service.gpu_service.name
}

output "vpc_id" {
  description = "ID of the VPC"
  value       = module.vpc.vpc_id
}

output "private_subnets" {
  description = "List of private subnet IDs"
  value       = module.vpc.private_subnets
}

output "public_subnets" {
  description = "List of public subnet IDs"
  value       = module.vpc.public_subnets
}

output "autoscaling_group_name" {
  description = "Name of the Auto Scaling Group for GPU instances"
  value       = aws_autoscaling_group.gpu_asg.name
}

output "capacity_provider_name" {
  description = "Name of the ECS capacity provider"
  value       = aws_ecs_capacity_provider.gpu_capacity_provider.name
}

output "cloudwatch_log_group" {
  description = "Name of the CloudWatch log group"
  value       = aws_cloudwatch_log_group.ecs_logs.name
}

output "load_balancer_dns" {
  description = "DNS name of the load balancer"
  value       = aws_lb.gpu_lb.dns_name
}

output "triton_inference_endpoint" {
  description = "Endpoint for Triton Inference Server"
  value       = "http://${aws_lb.gpu_lb.dns_name}:80/v2"
}

output "gpu_dashboard_url" {
  description = "URL for the GPU monitoring dashboard"
  value       = "https://${var.aws_region}.console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#dashboards:name=${aws_cloudwatch_dashboard.gpu_dashboard.dashboard_name}"
}

output "fargate_service_name" {
  description = "Name of the Fargate ECS service (if enabled)"
  value       = var.enable_fargate ? aws_ecs_service.gpu_service_fargate[0].name : "Fargate not enabled"
}