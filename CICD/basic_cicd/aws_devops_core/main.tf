module "module-aws-tf-cicd" {
  source = "../initial"

  tf_remote_state_resource_configs = {
    aws_devops_core : {
      prefix = "aws-devops-core"
    },
    dev_workload : {
      prefix = "dev-workload"
    },
  }

  codestar_connections = {
    "initial" = {
      connection_name = "DevOpsTF"
      provider_type   = "GitHub"
      tags = {
        Environment = "Base"
        Project     = "CICD"
      }
    }
  }

  codebuild_projects = {
    tf_test_module_intial : {
      name        = local.tf_test_module_initial_codebuild_project_name
      description = "CodeBuild Project that uses the Terraform Test Framework to test the functionality of the module initial Terraform Module."
      path_to_build_spec = local.tf_test_path_to_buildspec
    },
    chevkov_module_initial : {
      name        = local.chevkov_module_initial_codebuild_project_name
      description = "CodeBuild Project that uses Checkov to test the security of the module initial Terraform Module."
      env_image   = local.checkov_image
      path_to_build_spec = local.checkov_path_to_buildspec
    },

    tf_test_aws_devops_core : {
      name        = local.tf_test_aws_devops_core_codebuild_project_name
      description = "CodeBuild Project that uses the Terraform Test Framework to test the functionality of the DevOps Core Infrastructure."
      path_to_build_spec = local.tf_test_path_to_buildspec
    },
    chevkov_aws_devops_core : {
      name        = local.chevkov_aws_devops_core_codebuild_project_name
      description = "CodeBuild Project that uses Checkov to test the security of the DevOps Core Infrastructure."
      env_image   = local.checkov_image

      path_to_build_spec = local.checkov_path_to_buildspec
    },

    tf_test_dev_workload : {
      name        = local.tf_test_dev_workload_codebuild_project_name
      description = "CodeBuild Project that uses the Terraform Test Framework to test the functionality of the Example Production Workload."
      path_to_build_spec = local.tf_test_path_to_buildspec
    },

    chevkov_dev_workload : {
      name        = local.chevkov_dev_workload_codebuild_project_name
      description = "CodeBuild Project that uses Checkov to test the security of the dev Workload."
      env_image   = local.checkov_image

      path_to_build_spec = local.checkov_path_to_buildspec
    },
    tf_apply_dev_production_workload : {
      name        = local.tf_apply_dev_workload_codebuild_project_name
      description = "CodeBuild Project that uses Checkov to test the security of the dev Workload."
      path_to_build_spec = local.tf_apply_path_to_buildspec
    },
  }

  codepipeline_pipelines = {

    tf_module_validation_module_initial: {
      name = local.tf_module_validation_module_initial_codepipeline_pipeline_name
      pipeline_type = "V2"

      tags = {
        "Description"         = "Pipeline that validates functionality and security of the module initial Terraform Module.",
        "Usage"               = "Terraform Module Validation",
        "PrimaryOwner"        = "Biaggio gz",
        "PrimaryOwnerTitle"   = "DevOps"
      }

      stages = [
        {
          name = "Source"
          action = [
            {
              name             = "PullFromGitHub"
              owner            = "AWS"
              version          = "1"
              category         = "Source"
              provider         = "CodeStarSourceConnection"
              input_artifacts = []
              output_artifacts = ["source_output_artifacts"]
              run_order        = 1
              configuration = {
                ConnectionArn    = local.codestar_connection_arns["initial"]  # <-- pass ARN here
                FullRepositoryId = "biaggiogz/AWSTerraform"               # Use your GitHub repo path
                BranchName       = "CICD"
              }
            }
          ]
        },

        {
          name = "Build_TF_Test"
          action = [
            {
              name             = "TerraformTest"
              owner            = "AWS"
              version          = "1"
              category         = "Build"
              provider         = "CodeBuild"
              run_order = 2
              configuration = {
                ProjectName= local.tf_test_module_initial_codebuild_project_name
              }
              input_artifacts = ["source_output_artifacts"]
              output_artifacts = ["build_tf_test_output_artifacts"]

            }
          ]
        },

        {
          name = "Build_Checkov"
          action = [
            {
              name             = "Checkov"
              owner            = "AWS"
              version          = "1"
              category         = "Build"
              provider         = "CodeBuild"
              input_artifacts = ["source_output_artifacts"]
              output_artifacts = ["build_checkov_output_artifacts"]
              run_order = 3
              configuration = {
                ProjectName = local.chevkov_module_initial_codebuild_project_name

              }
            }
          ]
        },
      ]

    },


    tf_deployment_dev_workload : {
      pipeline_type = "V2"
      name = local.tf_deployment_dev_workload_codepipeline_pipeline_name
      tags = {
        "Description"         = "Pipeline that validates functionality/security and deploys the Example Production Workload.",
        "Usage"               = "Dev Workload",
        "PrimaryOwner"        = "Biaggio gz",
        "PrimaryOwnerTitle"   = "DevOps"
      }

      stages = [
        {
          name = "Source"
          action = [
            {
              name             = "PullFromGitHub"
              owner            = "AWS"
              version          = "1"
              category         = "Source"
              provider         = "CodeStarSourceConnection"
              input_artifacts = []
              output_artifacts = ["source_output_artifacts"]
              run_order        = 1
              configuration = {
                ConnectionArn    = local.codestar_connection_arns["initial"]  # <-- pass ARN here
                FullRepositoryId = "biaggiogz/AWSTerraform"               # Use your GitHub repo path
                BranchName       = "CICD"
                DetectChanges: false
              }
            }
          ]
        },

        {
          name = "Build_TF_Test"
          action = [
            {
              name     = "TerraformTest"
              category = "Build"
              owner    = "AWS"
              provider = "CodeBuild"
              version  = "1"
              configuration = {
                ProjectName = local.tf_test_dev_workload_codebuild_project_name
              }
              input_artifacts = ["source_output_artifacts"]
              output_artifacts = ["build_tf_test_output_artifacts"]

              run_order = 2
            },
          ]
        },

        {
          name = "Build_Checkov"
          action = [
            {
              name     = "Checkov"
              category = "Build"
              owner    = "AWS"
              provider = "CodeBuild"
              version  = "1"
              configuration = {
                ProjectName = local.chevkov_dev_workload_codebuild_project_name
              }
              input_artifacts = ["source_output_artifacts"]
              output_artifacts = ["build_checkov_output_artifacts"]

              run_order = 3
            },
          ]
        },
        {
          name = "Manual_Approval"
          action = [
            {
              name     = "ManualApprovalAction"
              category = "Approval"
              owner    = "AWS"
              provider = "Manual"
              version  = "1"
              configuration = {
                CustomData      = "Please approve this deployment."
                NotificationArn = aws_sns_topic.manual_approval_sns_topic.arn
              }

              input_artifacts = []
              output_artifacts = []

              run_order = 4
            },
          ]
        },
        {
          name = "Apply"
          action = [
            {
              name     = "TerraformApply"
              category = "Build"
              owner    = "AWS"
              provider = "CodeBuild"
              version  = "1"
              configuration = {
                ProjectName = local.tf_apply_dev_workload_codebuild_project_name
              }
              input_artifacts = ["source_output_artifacts"]
              output_artifacts = ["build_tf_apply_output_artifacts"]

              run_order = 5
            },
          ]
        },

      ]

    },
  }
}

resource "aws_sns_topic" "manual_approval_sns_topic" {
  name = "manual-approval-sns-topic"
}

resource "aws_sns_topic_subscription" "manual_approval_sns_subscription" {
  topic_arn = aws_sns_topic.manual_approval_sns_topic.arn
  protocol  = "email"
  endpoint  = "gabirelgutierrez@outlook.com"
}