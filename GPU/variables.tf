variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "us-west-2"
}

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "gpu-ecs"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "dev"
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
  default     = ["us-west-2a", "us-west-2b"]
}

variable "private_subnets" {
  description = "List of private subnet CIDR blocks"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "public_subnets" {
  description = "List of public subnet CIDR blocks"
  type        = list(string)
  default     = ["10.0.101.0/24", "10.0.102.0/24"]
}

variable "gpu_ami_id" {
  description = "AMI ID for GPU-enabled ECS instances"
  type        = string
  # This is an example AMI ID for ECS-optimized Amazon Linux 2 with GPU support
  # You should use the latest AMI ID for your region
  default     = "ami-0c9a9eac6d74fff97"
}

variable "gpu_instance_type" {
  description = "EC2 instance type for GPU instances"
  type        = string
  default     = "g4dn.xlarge"  # Entry-level NVIDIA T4 GPU instance
}

variable "min_gpu_instances" {
  description = "Minimum number of GPU instances in the Auto Scaling Group"
  type        = number
  default     = 1
}

variable "max_gpu_instances" {
  description = "Maximum number of GPU instances in the Auto Scaling Group"
  type        = number
  default     = 10
}

variable "desired_gpu_instances" {
  description = "Desired number of GPU instances in the Auto Scaling Group"
  type        = number
  default     = 1
}

variable "container_image" {
  description = "Docker image for the GPU container"
  type        = string
  default     = "nvidia/tritonserver:22.12-py3"
}

variable "model_repository" {
  description = "S3 path to the model repository"
  type        = string
  default     = "s3://your-model-bucket/models"
}

variable "gpu_count" {
  description = "Number of GPUs to allocate per task"
  type        = number
  default     = 1
}

variable "desired_task_count" {
  description = "Desired number of tasks in the ECS service"
  type        = number
  default     = 1
}

variable "min_task_count" {
  description = "Minimum number of tasks for auto scaling"
  type        = number
  default     = 1
}

variable "max_task_count" {
  description = "Maximum number of tasks for auto scaling"
  type        = number
  default     = 10
}