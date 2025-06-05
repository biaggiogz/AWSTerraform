output "connection_names" {
  description = "Map of CodeStar Connection Names"
  value = {
    for k, v in aws_codestarconnections_connection.codestar_connection : k => v.name
  }
}

output "connection_arns" {
  description = "Map of CodeStar Connection ARNs"
  value = {
    for k, v in aws_codestarconnections_connection.codestar_connection : k => v.arn
  }
}

output "codebuild_project_names" {
  description = "Map of CodeBuild project names"
  value = {
    for k, v in aws_codebuild_project.codebuild : k => v.name
  }
}

output "codebuild_project_arns" {
  description = "Map of CodeBuild project ARNs"
  value = {
    for k, v in aws_codebuild_project.codebuild : k => v.arn
  }
}
output "codepipeline_names" {
  description = "Map of CodePipeline pipeline names"
  value = {
    for k, v in aws_codepipeline.codepipeline : k => v.name
  }
}

output "codepipeline_arns" {
  description = "Map of CodePipeline pipeline ARNs"
  value = {
    for k, v in aws_codepipeline.codepipeline : k => v.arn
  }
}
output "s3_bucket_names" {
  description = "Map of S3 bucket names"
  value = { for k, v in aws_s3_bucket.tf_remote_state_s3_buckets : k => v.bucket }
}

output "dynamodb_table_names" {
  description = "Map of DynamoDB table names"
  value = { for k, v in aws_dynamodb_table.tf_remote_state_lock_tables : k => v.name }
}
