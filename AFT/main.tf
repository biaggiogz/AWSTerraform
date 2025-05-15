resource "aws_ssm_parameter" "ct_management_account_id" {
  name  = "/aft/ct_management_account_id"
  type  = "String"
  value = "746669218362"
}

resource "aws_ssm_parameter" "log_archive_account_id" {
  name  = "/aft/log_archive_account_id"
  type  = "String"
  value = "746669218362"
}

resource "aws_ssm_parameter" "audit_account_id" {
  name  = "/aft/audit_account_id"
  type  = "String"
  value = "746669218362"
}

resource "aws_ssm_parameter" "aft_management_account_id" {
  name  = "/aft/aft_management_account_id"
  type  = "String"
  value = "746669218362"
}

module "aft" {
  source = "github.com/aws-ia/terraform-aws-control_tower_account_factory"

  # Required variables
  ct_management_account_id  = aws_ssm_parameter.ct_management_account_id.value
  log_archive_account_id    = aws_ssm_parameter.log_archive_account_id.value
  audit_account_id          = aws_ssm_parameter.audit_account_id.value
  aft_management_account_id = aws_ssm_parameter.aft_management_account_id.value
  ct_home_region            = "us-east-1"  # Replace with your AWS Control Tower home region

  # Optional variables
  tf_backend_secondary_region = "us-west-2"  # Optional - replace as needed
  aft_metrics_reporting       = true

  # AFT Feature flags
  aft_feature_cloudtrail_data_events      = true
  aft_feature_enterprise_support          = false
  aft_feature_delete_default_vpcs_enabled = false

  # Terraform variables
  terraform_version      = "1.5.7"         # Replace with your preferred version
  terraform_distribution = "oss"          # Can be: oss | terraform-enterprise

  # VCS variables (uncomment and customize if needed)
  # vcs_provider                                  = "github"
  # account_request_repo_name                     = "my-org/aft-account-request"
  # account_customizations_repo_name              = "my-org/aft-account-customizations"
  # account_provisioning_customizations_repo_name = "my-org/aft-account-provisioning-customizations"
  # global_customizations_repo_name               = "my-org/aft-global-customizations"
}
