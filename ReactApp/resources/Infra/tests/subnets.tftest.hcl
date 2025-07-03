variables {
  app_name             = "streamlit-test"
  environment          = "test"
  vpc_cidr_block       = "10.0.0.0/16"
  create_vpc_resources = true
}

run "verify_subnets" {
  command = plan

  assert {
    condition     = aws_subnet.public_subnet1[0].map_public_ip_on_launch == true
    error_message = "Public subnet 1 should have map_public_ip_on_launch enabled"
  }

  assert {
    condition     = aws_subnet.public_subnet2[0].map_public_ip_on_launch == true
    error_message = "Public subnet 2 should have map_public_ip_on_launch enabled"
  }
}