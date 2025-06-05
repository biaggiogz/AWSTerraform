locals {
  codestar_connection_arns = module.module-aws-tf-cicd.connection_arns
  tf_test_module_initial_codebuild_project_name = "TerraformTest-module-initial"
  chevkov_module_initial_codebuild_project_name = "Checkov-module-initial"

  tf_test_aws_devops_core_codebuild_project_name = "TerraformTest-aws-devops-core"
  chevkov_aws_devops_core_codebuild_project_name = "Checkov-aws-devops-core"

  tf_test_dev_workload_codebuild_project_name  = "TerraformTest-devworkload"
  chevkov_dev_workload_codebuild_project_name  = "Checkov-dev-workload"

  tf_apply_dev_workload_codebuild_project_name = "TFApply-dev-workload"


  tf_test_path_to_buildspec  = "buildspec/tf-test-buildspec.yml"  # Terraform Test Framework (Test Functionality)
  checkov_path_to_buildspec  = "buildspec/checkov-buildspec.yml"  # Checkov (Test Security)
  tf_apply_path_to_buildspec = "buildspec/tf-apply-buildspec.yml" # TF Apply (Provision Resources)



  tf_module_validation_module_initial_codepipeline_pipeline_name   = "module-initial"
  tf_deployment_dev_workload_codepipeline_pipeline_name = "dev-workload"

  # Images
  checkov_image = "bridgecrew/checkov"
}