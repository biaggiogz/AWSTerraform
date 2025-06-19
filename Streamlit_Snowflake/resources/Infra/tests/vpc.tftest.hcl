variables {
  app_name = "streamlit-test"
  create_vpc_resources = true
  vpc_cidr_block = "10.0.0.0/16"
  tags = {
    "IAC_PROVIDER" = "Terraform"
  }
}

run "verify_vpc_creation" {
  command = plan
}