# This resource creates random strings of 4 lowercase characters (no special chars)
# Used to generate unique suffixes for S3 bucket names
# Creates one random string for each entry in tf_remote_state_resource_configs
resource "random_string" "tf_remote_state_s3_buckets" {
  for_each = var.tf_remote_state_resource_configs

  length   = 4
  special  = false
  upper    = false
}

# Creates S3 buckets to store Terraform state files
# Bucket names are constructed from prefix + "tf-state-" + random string
# force_destroy allows bucket deletion even if it contains objects (use carefully)
resource "aws_s3_bucket" "tf_remote_state_s3_buckets" {
  for_each = var.tf_remote_state_resource_configs

  bucket        = "${each.value.prefix}-tf-state-${random_string.tf_remote_state_s3_buckets[each.key].result}"
  force_destroy = true  # Careful with this in production
}

resource "aws_s3_bucket_logging" "tf_remote_state_s3_buckets" {
  for_each = var.tf_remote_state_resource_configs

  bucket = aws_s3_bucket.tf_remote_state_s3_buckets[each.key].id

  target_bucket = aws_s3_bucket.tf_remote_state_s3_buckets[each.key].id
  target_prefix = "log/"
}

# Enables versioning on the S3 buckets to maintain state file history
# Versioning helps protect against accidental deletions/changes
# Applied to each bucket created above
resource "aws_s3_bucket_versioning" "tf_remote_state_s3_buckets" {
  for_each = var.tf_remote_state_resource_configs

  bucket = aws_s3_bucket.tf_remote_state_s3_buckets[each.key].id
  versioning_configuration {
    status = "Enabled"
  }
}

# Configures public access block settings for the S3 buckets
# Prevents any public access to the buckets for security
# All block settings controlled by single variable s3_public_access_block
resource "aws_s3_bucket_public_access_block" "tf_remote_state_s3_buckets_pabs" {
  for_each = var.tf_remote_state_resource_configs

  bucket = aws_s3_bucket.tf_remote_state_s3_buckets[each.key].id

  block_public_acls       = var.s3_public_access_block
  block_public_policy     = var.s3_public_access_block
  ignore_public_acls      = var.s3_public_access_block
  restrict_public_buckets = var.s3_public_access_block
}

# Creates random strings for DynamoDB table names
# Similar to S3 bucket random strings - 4 chars, lowercase, no special chars
# One string per entry in tf_remote_state_resource_configs
resource "random_string" "tf_remote_state_lock_tables" {
  for_each = var.tf_remote_state_resource_configs

  length   = 4
  special  = false
  upper    = false
}

# Creates DynamoDB tables used for state locking
# Table names use prefix + "tf-state-lock-" + random string
# Configurable billing mode and hash key
# Hash key attribute is string type
resource "aws_dynamodb_table" "tf_remote_state_lock_tables" {
  for_each = var.tf_remote_state_resource_configs

  name         = "${each.value.prefix}-tf-state-lock-${random_string.tf_remote_state_lock_tables[each.key].result}"
  billing_mode = each.value.ddb_billing_mode
  hash_key     = each.value.ddb_hash_key

  attribute {
    name = each.value.ddb_hash_key
    type = "S"
  }
}