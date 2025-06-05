provider "aws" {
  region = "us-east-1"
}

variables {
  codestar_connections = {
    test_connection = {
      connection_name = "test-connection"
      provider_type   = "GitHub"
      tags = {
        Environment = "Test"
      }
    }
  }

  codebuild_projects = {
    test_project = {
      name             = "test-project"
      description      = "Test CodeBuild project"
      build_timeout    = 30
      env_compute_type = "BUILD_GENERAL1_SMALL"
      env_image        = "aws/codebuild/standard:5.0"
      env_type         = "LINUX_CONTAINER"
      source_type      = "GITHUB"
      source_location  = "https://github.com/hashicorp/example-repo.git"
      source_clone_depth = 1
      build_spec       = <<-EOF
        # Terraform Test
        version: 0.1
        phases:
          pre_build:
            commands:
              - terraform init
              - terraform validate

          build:
            commands:
              - terraform test
      EOF
      source_version   = "refs/heads/main"
    }
  }



  codepipeline_pipelines = {
    test_pipeline = {
      name          = "test-pipeline"
      pipeline_type = "Custom"

      existing_s3_bucket_name = null

      stages = [
        {
          name    = "Source"
          enabled = true
          action = [
            {
              name             = "SourceAction"
              owner           = "AWS"
              version         = "1"
              category        = "Source"
              provider        = "CodeStarSourceConnection"
              output_artifacts = ["source_output"]
              configuration = {
                ConnectionArn    = "arn:aws:codestar-connections:us-east-1:123456789012:connection/abcde-12345"
                FullRepositoryId = "hashicorp/terraform"
                BranchName       = "main"
              }
            }
          ]
        },
        {
          name    = "Build"
          enabled = true
          action = [
            {
              name            = "BuildAction"
              owner           = "AWS"
              version         = "1"
              category        = "Build"
              provider        = "CodeBuild"
              input_artifacts = ["source_output"]
              output_artifacts = ["build_output"]
              configuration = {
                ProjectName = "test-project"
              }
            }
          ]
        }
      ]
    }
  }


  tags = {
    Project = "Example"
  }
}

run "test_codestar_connection" {
  module {
    source = "../"
  }

  assert {
    condition     = output.connection_names["test_connection"] == "test-connection"
    error_message = "CodeStar Connection name is incorrect"
  }

  assert {
    condition     = length(output.connection_arns["test_connection"]) > 0
    error_message = "CodeStar Connection ARN is empty"
  }
}


run "test_codebuild_project" {
  module {
    source = "../"
  }

  assert {
    condition     = output.codebuild_project_names["test_project"] == "test-project"
    error_message = "CodeBuild project name is incorrect"
  }

  assert {
    condition     = length(output.codebuild_project_arns["test_project"]) > 0
    error_message = "CodeBuild project ARN is empty"
  }
}


run "test_codepipeline" {
  module {
    source = "../"
  }

  assert {
    condition     = output.codepipeline_names["test_pipeline"] == "test-pipeline"
    error_message = "CodePipeline name is incorrect"
  }

  assert {
    condition     = length(output.codepipeline_arns["test_pipeline"]) > 0
    error_message = "CodePipeline ARN is empty"
  }
}
