provider "aws" {
  region = "us-east-1"
}

variables {
}

run "test_iam_role_and_s3_bucket" {
  module {
    source = "../"  # Adjust path as needed
  }

  assert {
    condition     = length(random_string.example.result) == 4
    error_message = "Random string length is not 4"
  }

  assert {
    condition     = aws_iam_role.dev.name != ""
    error_message = "IAM role name is empty"
  }

  assert {
    condition     = can(jsondecode(aws_iam_role.dev.assume_role_policy))
    error_message = "IAM role assume_role_policy is not valid JSON"
  }

  assert {
    condition     = aws_iam_role_policy_attachment.dev.policy_arn == "arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess"
    error_message = "IAM role policy attachment ARN is incorrect"
  }

  assert {
    condition     = startswith(aws_s3_bucket.example.bucket, "dev-resource")
    error_message = "S3 bucket name does not start with 'dev-resource'"
  }

  assert {
    condition     = aws_s3_bucket.example.force_destroy == true
    error_message = "S3 bucket force_destroy should be true"
  }
}
