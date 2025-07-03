variables {
  app_name = "streamlit-test"
  create_vpc_resources = true
  tags = {
    "IAC_PROVIDER" = "Terraform"
  }
}

run "verify_route_tables" {
  command = plan
  
  assert {
    condition     = length(aws_route_table_association.public_subnet1_association) > 0
    error_message = "Route table association for public subnet 1 should exist"
  }
}