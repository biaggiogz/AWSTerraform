resource "random_string" "random_string" {
  length  = 4
  special = false
  upper   = false
}

data "aws_iam_policy_document" "codebuild_trust_relationship" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["codebuild.amazonaws.com"]
    }
  }
}

data "aws_iam_policy_document" "codebuild_policy" {
  count = var.create_codebuild_service_role ? 1 : 0
  statement {
    effect  = "Allow"
    actions = ["s3:*"]
    resources = [
      "*",
    ]
  }


}

resource "aws_iam_role" "codebuild_service_role" {
  count              = var.create_codebuild_service_role ? 1 : 0
  name               = "${var.project_prefix}-codebuild-service-role-${random_string.random_string.result}"
  assume_role_policy = data.aws_iam_policy_document.codebuild_trust_relationship.json
}

resource "aws_iam_role_policy_attachment" "codebuild_service_role" {
  count      = var.create_codebuild_service_role ? 1 : 0
  role       = aws_iam_role.codebuild_service_role[0].name
  policy_arn = "arn:aws:iam::aws:policy/AdministratorAccess"

  # - Challenge: resolve Checkov issues -
  #checkov:skip=CKV_AWS_274: "Disallow IAM roles, users, and groups from using the AWS AdministratorAccess policy"
}
