provider "aws" {
  region = var.aws_region
}

# VPC for the ECS cluster
module "vpc" {
  source = "terraform-aws-modules/vpc/aws"
  
  name = "${var.project_name}-vpc"
  cidr = var.vpc_cidr
  
  azs             = var.availability_zones
  private_subnets = var.private_subnets
  public_subnets  = var.public_subnets
  
  enable_nat_gateway = true
  single_nat_gateway = true
  
  tags = {
    Project     = var.project_name
    Environment = var.environment
  }
}

# Security group for ECS tasks
resource "aws_security_group" "ecs_tasks" {
  name        = "${var.project_name}-ecs-tasks-sg"
  description = "Security group for ECS tasks"
  vpc_id      = module.vpc.vpc_id
  
  ingress {
    from_port   = 8000
    to_port     = 8002
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
    description = "Allow inbound traffic for Triton Inference Server"
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = {
    Project     = var.project_name
    Environment = var.environment
  }
}

# ECS Cluster
resource "aws_ecs_cluster" "gpu_cluster" {
  name = "${var.project_name}-cluster"
  
  setting {
    name  = "containerInsights"
    value = "enabled"
  }
  
  tags = {
    Project     = var.project_name
    Environment = var.environment
  }
}

# Fargate Capacity Provider (if enabled)
resource "aws_ecs_cluster_capacity_providers" "fargate_provider" {
  count = var.enable_fargate ? 1 : 0
  
  cluster_name = aws_ecs_cluster.gpu_cluster.name
  
  capacity_providers = ["FARGATE", "FARGATE_SPOT", aws_ecs_capacity_provider.gpu_capacity_provider.name]
  
  default_capacity_provider_strategy {
    capacity_provider = aws_ecs_capacity_provider.gpu_capacity_provider.name
    weight            = 1
    base              = 1
  }
}

# IAM Role for ECS Task Execution
resource "aws_iam_role" "ecs_task_execution_role" {
  name = "${var.project_name}-task-execution-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })
  
  tags = {
    Project     = var.project_name
    Environment = var.environment
  }
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution_role_policy" {
  role       = aws_iam_role.ecs_task_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# IAM Role for ECS Task
resource "aws_iam_role" "ecs_task_role" {
  name = "${var.project_name}-task-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })
  
  tags = {
    Project     = var.project_name
    Environment = var.environment
  }
}

# Launch Template for GPU instances
resource "aws_launch_template" "gpu_launch_template" {
  name_prefix   = "${var.project_name}-gpu-"
  image_id      = var.gpu_ami_id
  instance_type = var.gpu_instance_type
  
  iam_instance_profile {
    name = aws_iam_instance_profile.ecs_instance_profile.name
  }
  
  vpc_security_group_ids = [aws_security_group.ecs_tasks.id]
  
  user_data = base64encode(<<-EOF
    #!/bin/bash
    echo ECS_CLUSTER=${aws_ecs_cluster.gpu_cluster.name} >> /etc/ecs/ecs.config
    echo ECS_ENABLE_GPU_SUPPORT=true >> /etc/ecs/ecs.config
    
    # Install NVIDIA drivers and container toolkit
    distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
    curl -s -L https://nvidia.github.io/libnvidia-container/gpgkey | apt-key add -
    curl -s -L https://nvidia.github.io/libnvidia-container/$distribution/libnvidia-container.list | tee /etc/apt/sources.list.d/nvidia-container-toolkit.list
    
    apt-get update
    apt-get install -y nvidia-container-toolkit nvidia-container-runtime
    
    # Configure Docker for NVIDIA runtime
    mkdir -p /etc/docker
    tee /etc/docker/daemon.json <<DOCKERCONFIG
    {
        "default-runtime": "nvidia",
        "runtimes": {
            "nvidia": {
                "path": "/usr/bin/nvidia-container-runtime",
                "runtimeArgs": []
            }
        }
    }
    DOCKERCONFIG
    
    # Restart Docker
    systemctl restart docker
    
    # Enable NVIDIA Fabric Manager for P4d instances
    if [[ $(curl -s http://169.254.169.254/latest/meta-data/instance-type) == p4d* ]]; then
      systemctl enable nvidia-fabricmanager
      systemctl start nvidia-fabricmanager
    fi
    
    # Enable NVIDIA Persistence Daemon for P5 instances
    if [[ $(curl -s http://169.254.169.254/latest/meta-data/instance-type) == p5* ]]; then
      systemctl enable nvidia-persistenced
      systemctl start nvidia-persistenced
    fi
  EOF
  )
  
  tag_specifications {
    resource_type = "instance"
    tags = {
      Name        = "${var.project_name}-gpu-instance"
      Project     = var.project_name
      Environment = var.environment
    }
  }
}

# IAM Role for EC2 instances
resource "aws_iam_role" "ecs_instance_role" {
  name = "${var.project_name}-instance-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })
  
  tags = {
    Project     = var.project_name
    Environment = var.environment
  }
}

resource "aws_iam_role_policy_attachment" "ecs_instance_role_policy" {
  role       = aws_iam_role.ecs_instance_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonEC2ContainerServiceforEC2Role"
}

resource "aws_iam_instance_profile" "ecs_instance_profile" {
  name = "${var.project_name}-instance-profile"
  role = aws_iam_role.ecs_instance_role.name
}

# Auto Scaling Group for GPU instances
resource "aws_autoscaling_group" "gpu_asg" {
  name                = "${var.project_name}-gpu-asg"
  vpc_zone_identifier = module.vpc.private_subnets
  min_size            = var.min_gpu_instances
  max_size            = var.max_gpu_instances
  desired_capacity    = var.desired_gpu_instances
  
  launch_template {
    id      = aws_launch_template.gpu_launch_template.id
    version = "$Latest"
  }
  
  tag {
    key                 = "AmazonECSManaged"
    value               = true
    propagate_at_launch = true
  }
  
  tag {
    key                 = "Name"
    value               = "${var.project_name}-gpu-instance"
    propagate_at_launch = true
  }
  
  tag {
    key                 = "Project"
    value               = var.project_name
    propagate_at_launch = true
  }
  
  tag {
    key                 = "Environment"
    value               = var.environment
    propagate_at_launch = true
  }
}

# ECS Capacity Provider
resource "aws_ecs_capacity_provider" "gpu_capacity_provider" {
  name = "${var.project_name}-gpu-capacity-provider"
  
  auto_scaling_group_provider {
    auto_scaling_group_arn = aws_autoscaling_group.gpu_asg.arn
    
    managed_scaling {
      maximum_scaling_step_size = 10
      minimum_scaling_step_size = 1
      status                    = "ENABLED"
      target_capacity           = 100
    }
  }
}

resource "aws_ecs_cluster_capacity_providers" "gpu_cluster_capacity_provider" {
  cluster_name       = aws_ecs_cluster.gpu_cluster.name
  capacity_providers = [aws_ecs_capacity_provider.gpu_capacity_provider.name]
  
  default_capacity_provider_strategy {
    capacity_provider = aws_ecs_capacity_provider.gpu_capacity_provider.name
    weight            = 1
    base              = 0
  }
}

# Task Definition for GPU workload - EC2 launch type
resource "aws_ecs_task_definition" "gpu_task" {
  family                   = "${var.project_name}-gpu-task"
  network_mode             = "bridge"
  requires_compatibilities = ["EC2"]
  execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn
  task_role_arn            = aws_iam_role.ecs_task_role.arn
  
  container_definitions = jsonencode([
    {
      name      = "gpu-container"
      image     = var.container_image
      essential = true
      
      portMappings = [
        {
          containerPort = 8000
          hostPort      = 8000
          protocol      = "tcp"
        },
        {
          containerPort = 8001
          hostPort      = 8001
          protocol      = "tcp"
        },
        {
          containerPort = 8002
          hostPort      = 8002
          protocol      = "tcp"
        }
      ]
      
      environment = [
        {
          name  = "AWS_ROLE_ARN"
          value = aws_iam_role.ecs_task_role.arn
        },
        {
          name  = "MODEL_REPOSITORY"
          value = var.model_repository
        },
        {
          name  = "NVIDIA_VISIBLE_DEVICES"
          value = "all"
        },
        {
          name  = "NVIDIA_DRIVER_CAPABILITIES"
          value = "compute,utility"
        }
      ]
      
      resourceRequirements = [
        {
          type  = "GPU"
          value = tostring(var.gpu_count)
        }
      ]
      
      memory = 24000
      
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = "/ecs/${var.project_name}"
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "gpu-service"
        }
      }
    }
  ])
  
  tags = {
    Project     = var.project_name
    Environment = var.environment
  }
}

# Task Definition for GPU workload - Fargate launch type (if enabled)
resource "aws_ecs_task_definition" "gpu_task_fargate" {
  count                    = var.enable_fargate ? 1 : 0
  family                   = "${var.project_name}-gpu-task-fargate"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "4096"
  memory                   = "30720"
  execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn
  task_role_arn            = aws_iam_role.ecs_task_role.arn
  
  container_definitions = jsonencode([
    {
      name      = "gpu-container-fargate"
      image     = var.container_image
      essential = true
      
      portMappings = [
        {
          containerPort = 8000
          hostPort      = 8000
          protocol      = "tcp"
        },
        {
          containerPort = 8001
          hostPort      = 8001
          protocol      = "tcp"
        },
        {
          containerPort = 8002
          hostPort      = 8002
          protocol      = "tcp"
        }
      ]
      
      environment = [
        {
          name  = "AWS_ROLE_ARN"
          value = aws_iam_role.ecs_task_role.arn
        },
        {
          name  = "MODEL_REPOSITORY"
          value = var.model_repository
        },
        {
          name  = "NVIDIA_VISIBLE_DEVICES"
          value = "all"
        },
        {
          name  = "NVIDIA_DRIVER_CAPABILITIES"
          value = "compute,utility"
        }
      ]
      
      resourceRequirements = [
        {
          type  = "GPU"
          value = tostring(var.gpu_count)
        }
      ]
      
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = "/ecs/${var.project_name}"
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "gpu-service-fargate"
        }
      }
    }
  ])
  
  runtime_platform {
    operating_system_family = "LINUX"
    cpu_architecture        = "X86_64"
  }
  
  tags = {
    Project     = var.project_name
    Environment = var.environment
  }
}

# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "ecs_logs" {
  name              = "/ecs/${var.project_name}"
  retention_in_days = 30
  
  tags = {
    Project     = var.project_name
    Environment = var.environment
  }
}

# ECS Service for EC2 launch type
resource "aws_ecs_service" "gpu_service" {
  name            = "${var.project_name}-gpu-service"
  cluster         = aws_ecs_cluster.gpu_cluster.id
  task_definition = aws_ecs_task_definition.gpu_task.arn
  desired_count   = var.desired_task_count
  
  capacity_provider_strategy {
    capacity_provider = aws_ecs_capacity_provider.gpu_capacity_provider.name
    weight            = 1
    base              = 0
  }
  
  # Health check configuration
  health_check_grace_period_seconds = 120
  
  # Load balancer configuration
  load_balancer {
    target_group_arn = aws_lb_target_group.gpu_target_group.arn
    container_name   = "gpu-container"
    container_port   = 8000
  }
  
  tags = {
    Project     = var.project_name
    Environment = var.environment
  }
}

# ECS Service for Fargate launch type (if enabled)
resource "aws_ecs_service" "gpu_service_fargate" {
  count           = var.enable_fargate ? 1 : 0
  name            = "${var.project_name}-gpu-service-fargate"
  cluster         = aws_ecs_cluster.gpu_cluster.id
  task_definition = aws_ecs_task_definition.gpu_task_fargate[0].arn
  desired_count   = var.desired_task_count
  launch_type     = "FARGATE"
  
  network_configuration {
    subnets          = module.vpc.private_subnets
    security_groups  = [aws_security_group.ecs_tasks.id]
    assign_public_ip = false
  }
  
  # Health check configuration
  health_check_grace_period_seconds = 120
  
  # Load balancer configuration
  load_balancer {
    target_group_arn = aws_lb_target_group.gpu_fargate_target_group[0].arn
    container_name   = "gpu-container-fargate"
    container_port   = 8000
  }
  
  tags = {
    Project     = var.project_name
    Environment = var.environment
  }
}

# Auto Scaling for ECS Service
resource "aws_appautoscaling_target" "ecs_target" {
  max_capacity       = var.max_task_count
  min_capacity       = var.min_task_count
  resource_id        = "service/${aws_ecs_cluster.gpu_cluster.name}/${aws_ecs_service.gpu_service.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "ecs_policy_cpu" {
  name               = "${var.project_name}-cpu-autoscaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs_target.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs_target.scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs_target.service_namespace
  
  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value       = 70
    scale_in_cooldown  = 300
    scale_out_cooldown = 300
  }
}

resource "aws_appautoscaling_policy" "ecs_policy_memory" {
  name               = "${var.project_name}-memory-autoscaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs_target.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs_target.scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs_target.service_namespace
  
  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageMemoryUtilization"
    }
    target_value       = 70
    scale_in_cooldown  = 300
    scale_out_cooldown = 300
  }
}
# Load Balancer for GPU services
resource "aws_lb" "gpu_lb" {
  name               = "${var.project_name}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.lb_sg.id]
  subnets            = module.vpc.public_subnets

  enable_deletion_protection = false

  tags = {
    Project     = var.project_name
    Environment = var.environment
  }
}

# Security group for the load balancer
resource "aws_security_group" "lb_sg" {
  name        = "${var.project_name}-lb-sg"
  description = "Security group for load balancer"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow HTTP traffic"
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow HTTPS traffic"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Project     = var.project_name
    Environment = var.environment
  }
}
# Target group for the EC2 GPU service
resource "aws_lb_target_group" "gpu_target_group" {
  name        = "${var.project_name}-tg"
  port        = 8000
  protocol    = "HTTP"
  vpc_id      = module.vpc.vpc_id
  target_type = "instance"
  
  health_check {
    enabled             = true
    interval            = 30
    path                = "/v2/health/ready"
    port                = "traffic-port"
    healthy_threshold   = 3
    unhealthy_threshold = 3
    timeout             = 5
    matcher             = "200"
  }

  tags = {
    Project     = var.project_name
    Environment = var.environment
  }
}

# Target group for the Fargate GPU service
resource "aws_lb_target_group" "gpu_fargate_target_group" {
  count       = var.enable_fargate ? 1 : 0
  name        = "${var.project_name}-fargate-tg"
  port        = 8000
  protocol    = "HTTP"
  vpc_id      = module.vpc.vpc_id
  target_type = "ip"
  
  health_check {
    enabled             = true
    interval            = 30
    path                = "/v2/health/ready"
    port                = "traffic-port"
    healthy_threshold   = 3
    unhealthy_threshold = 3
    timeout             = 5
    matcher             = "200"
  }

  tags = {
    Project     = var.project_name
    Environment = var.environment
  }
}

# HTTP listener for the load balancer
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.gpu_lb.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.gpu_target_group.arn
  }
}
# Auto Scaling for Fargate ECS Service
resource "aws_appautoscaling_target" "ecs_fargate_target" {
  count              = var.enable_fargate ? 1 : 0
  max_capacity       = var.max_task_count
  min_capacity       = var.min_task_count
  resource_id        = "service/${aws_ecs_cluster.gpu_cluster.name}/${aws_ecs_service.gpu_service_fargate[0].name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "ecs_fargate_policy_cpu" {
  count              = var.enable_fargate ? 1 : 0
  name               = "${var.project_name}-fargate-cpu-autoscaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs_fargate_target[0].resource_id
  scalable_dimension = aws_appautoscaling_target.ecs_fargate_target[0].scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs_fargate_target[0].service_namespace
  
  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value       = 70
    scale_in_cooldown  = 300
    scale_out_cooldown = 300
  }
}

resource "aws_appautoscaling_policy" "ecs_fargate_policy_memory" {
  count              = var.enable_fargate ? 1 : 0
  name               = "${var.project_name}-fargate-memory-autoscaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs_fargate_target[0].resource_id
  scalable_dimension = aws_appautoscaling_target.ecs_fargate_target[0].scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs_fargate_target[0].service_namespace
  
  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageMemoryUtilization"
    }
    target_value       = 70
    scale_in_cooldown  = 300
    scale_out_cooldown = 300
  }
}
# CloudWatch Dashboard for GPU Monitoring
resource "aws_cloudwatch_dashboard" "gpu_dashboard" {
  dashboard_name = "${var.project_name}-gpu-dashboard"
  
  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/ECS", "CPUUtilization", "ServiceName", aws_ecs_service.gpu_service.name, "ClusterName", aws_ecs_cluster.gpu_cluster.name]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "CPU Utilization"
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/ECS", "MemoryUtilization", "ServiceName", aws_ecs_service.gpu_service.name, "ClusterName", aws_ecs_cluster.gpu_cluster.name]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "Memory Utilization"
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 24
        height = 6
        properties = {
          metrics = [
            ["AWS/AutoScaling", "GroupInServiceInstances", "AutoScalingGroupName", aws_autoscaling_group.gpu_asg.name]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "GPU Instances Running"
        }
      }
    ]
  })
}

# CloudWatch Alarm for GPU Instance Health
resource "aws_cloudwatch_metric_alarm" "gpu_instance_alarm" {
  alarm_name          = "${var.project_name}-gpu-instance-alarm"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 2
  metric_name         = "GroupInServiceInstances"
  namespace           = "AWS/AutoScaling"
  period              = 120
  statistic           = "Average"
  threshold           = 1
  alarm_description   = "This alarm monitors the number of healthy GPU instances"
  
  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.gpu_asg.name
  }
  
  alarm_actions = [aws_sns_topic.gpu_alerts.arn]
}

# SNS Topic for GPU Alerts
resource "aws_sns_topic" "gpu_alerts" {
  name = "${var.project_name}-gpu-alerts"
  
  tags = {
    Project     = var.project_name
    Environment = var.environment
  }
}