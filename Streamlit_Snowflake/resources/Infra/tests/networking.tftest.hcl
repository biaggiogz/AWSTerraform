variables {
  app_name             = "streamlit-test"
  environment          = "test"
  vpc_cidr_block       = "10.0.0.0/16"
  create_vpc_resources = true
}

run "verify_networking" {
  command = plan

  assert {
    condition     = aws_eip.streamlit_eip[0].domain == "vpc"
    error_message = "EIP should be in VPC domain"
  }
}