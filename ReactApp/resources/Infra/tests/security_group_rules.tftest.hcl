variables {
  app_name = "streamlit-test"
  create_vpc_resources = true
  create_ecs_security_group = true
  create_alb_security_group = true
  container_port = 8501
}

run "verify_security_group_rules" {
  command = plan
  
  assert {
    condition     = aws_vpc_security_group_ingress_rule.streamlit_alb_sg_http_traffic[0].from_port == 80
    error_message = "ALB security group should allow HTTP traffic on port 80"
  }
  
  assert {
    condition     = aws_vpc_security_group_ingress_rule.streamlit_alb_sg_https_traffic[0].from_port == 443
    error_message = "ALB security group should allow HTTPS traffic on port 443"
  }
}