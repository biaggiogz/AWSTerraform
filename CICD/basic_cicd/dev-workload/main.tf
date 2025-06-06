data "aws_iam_policy_document" "ec2_trust_relationship" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }
  }
}

resource "random_string" "example" {
  length   = 4
  special  = false
  upper    = false
}

resource "aws_iam_role" "dev" {
  name               = "dev-resource-${random_string.example.result}"
  assume_role_policy = data.aws_iam_policy_document.ec2_trust_relationship.json

  force_detach_policies = true
}
resource "aws_iam_role_policy_attachment" "dev" {
  role       = aws_iam_role.dev.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess"
}

resource "aws_s3_bucket" "example" {
  bucket_prefix = "dev-resource"
  force_destroy = true

}
