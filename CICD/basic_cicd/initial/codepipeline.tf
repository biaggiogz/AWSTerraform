# Creates an AWS CodePipeline resource that can be instantiated multiple times using for_each
resource "aws_codepipeline" "codepipeline" {
  # Iterates over the codepipeline_pipelines variable map, if null creates empty map
  for_each = var.codepipeline_pipelines == null ? {} : var.codepipeline_pipelines

  # Basic pipeline configuration
  name          = each.value.name # Name of the pipeline
  pipeline_type = "V2"            # Uses CodePipeline V2
  role_arn      = var.codepipeline_service_role_arn != null ? var.codepipeline_service_role_arn : aws_iam_role.codepipeline_service_role[0].arn # IAM role for pipeline execution

  # Configures S3 bucket for storing pipeline artifacts
  artifact_store {
    # Uses provided bucket name or creates new bucket
    location = each.value.existing_s3_bucket_name != null ? each.value.existing_s3_bucket_name : aws_s3_bucket.codepipeline_artifacts_buckets[each.key].id
    type     = "S3"
  }

  # Dynamically creates pipeline stages based on configuration
  dynamic "stage" {
    # Filters stages based on enabled flag
    for_each = [for s in each.value.stages : {
      name   = s.name
      action = s.action
    } if(lookup(s, "enabled", true))]

    content {
      name = stage.value.name # Name of the stage

      # Dynamically creates actions within each stage
      dynamic "action" {
        for_each = stage.value.action
        content {
          name             = action.value["name"]           # Action name
          owner            = action.value["owner"]          # Owner of the action (AWS, Custom, etc)
          version         = action.value["version"]         # Version of the action
          category        = action.value["category"]        # Category (Source, Build, Deploy, etc)
          provider        = action.value["provider"]        # Service provider (CodeBuild, CodeDeploy, etc)
          input_artifacts  = lookup(action.value, "input_artifacts", [])   # Input artifacts for the action
          output_artifacts = lookup(action.value, "output_artifacts", [])  # Output artifacts produced
          configuration   = lookup(action.value, "configuration", {})      # Action-specific configuration
          role_arn        = lookup(action.value, "role_arn", null)        # Optional IAM role for the action
          run_order       = lookup(action.value, "run_order", null)       # Order of execution within stage
          region          = lookup(action.value, "region", data.aws_region.current.name) # AWS region for action
        }
      }
    }
  }

  # Adds tags to the pipeline resource
  tags = merge(
    {
      "Name" = "${each.value.name}" # Name tag
    },
    var.tags, # Additional tags from variables
  )
}