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
