variables {
  app_name                = "streamlit-test"
  environment             = "test"
  vpc_cidr_block          = "10.0.0.0/16"
  create_vpc_resources    = true
  create_ecs_security_group = true
  create_alb_security_group = true
  container_port          = 8501
}

run "verify_security_groups" {
  command = plan

  assert {
    condition     = aws_security_group.streamlit_ecs_sg[0].name == "${var.app_name}-ecs-sg"
    error_message = "ECS security group name is incorrect"
  }

  assert {
    condition     = aws_security_group.streamlit_alb_sg[0].name == "${var.app_name}-alb-sg"
    error_message = "ALB security group name is incorrect"
  }
}