resource "random_string" "codepipeline_artifacts_s3_buckets" {
  for_each = var.codepipeline_pipelines == null ? {} : var.codepipeline_pipelines
  length   = 4
  special  = false
  upper    = false
}

resource "aws_s3_bucket" "codepipeline_artifacts_buckets" {
  for_each = var.codepipeline_pipelines == null ? {} : var.codepipeline_pipelines
  bucket   = "pipeline-artifacts-${each.value.name}-${random_string.codepipeline_artifacts_s3_buckets[each.key].result}"
  force_destroy = true

}