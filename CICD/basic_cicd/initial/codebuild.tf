# Creates an AWS CodeBuild project resource that can be instantiated multiple times using for_each
resource "aws_codebuild_project" "codebuild" {
  # Iterates over the codebuild_projects variable map, if null creates empty map
  for_each = var.codebuild_projects == null ? {} : var.codebuild_projects

  # Basic project configuration
  name          = each.value.name          # Name of the CodeBuild project
  description   = each.value.description   # Description of what the project does
  build_timeout = each.value.build_timeout # Maximum time in minutes that CodeBuild can spend running a build

  # IAM role ARN for CodeBuild to assume - uses provided role or creates new one
  service_role  = var.codebuild_service_role_arn != null ? var.codebuild_service_role_arn : aws_iam_role.codebuild_service_role[0].arn

  # Environment configuration for build container
  environment {
    compute_type = each.value.env_compute_type # Size of build environment (e.g. BUILD_GENERAL1_SMALL)
    image        = each.value.env_image        # Docker image to use for build environment
    type         = each.value.env_type         # Type of build environment (e.g. LINUX_CONTAINER)
  }

  # Source configuration - where CodeBuild gets source code from
  source {
    type            = each.value.source_type         # Source provider type (e.g. GITHUB, CODECOMMIT)
    location        = each.value.source_location     # Location of source code repository
    git_clone_depth = each.value.source_clone_depth # How many commits to fetch
    # Uses buildspec from file if path provided, otherwise uses inline buildspec
    buildspec       = each.value.path_to_build_spec != null ? file(each.value.path_to_build_spec) : each.value.build_spec
  }

  # Git branch, commit or tag to build
  source_version = each.value.source_version

  # Artifacts configuration - where build output is stored
  artifacts {
    type = "NO_ARTIFACTS" # No build artifacts are produced
  }

  # Resource tags - merges Name tag with provided tags
  tags = merge(
    {
      "Name" = each.value.name
    },
    var.tags,
  )

  # Ensures CodeStar connection is created before CodeBuild project
  depends_on = [
    aws_codestarconnections_connection.codestar_connection
  ]
}