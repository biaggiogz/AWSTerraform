# Archive the React application for deployment
data "archive_file" "react_assets" {
  type        = "zip"
  source_dir  = var.path_to_app_dir != null ? var.path_to_app_dir : "${path.root}/../ChartPipeline/"
  output_path = "${var.app_name_react}-assets.zip"
}

# Create a hash of data files to detect changes
data "archive_file" "react_data_assets" {
  type        = "zip"
  source_dir  = var.path_to_app_dir != null ? "${var.path_to_app_dir}/data" : "${path.root}/../ChartPipeline/data"
  output_path = "${var.app_name_react}-data-assets.zip"
}

data "archive_file" "react_public_data_assets" {
  type        = "zip"
  source_dir  = var.path_to_app_dir != null ? "${var.path_to_app_dir}/public/data" : "${path.root}/../ChartPipeline/public/data"
  output_path = "${var.app_name_react}-public-data-assets.zip"
}
resource "random_string" "react_s3_bucket" {
  length  = 4
  special = false
  upper   = false
}

# S3 bucket for hosting the React application
resource "aws_s3_bucket" "react_app_bucket" {
  bucket = "${var.app_name_react}-react-app-${random_string.react_s3_bucket.result}"
  force_destroy = true
  tags = merge(
    var.tags,
    {
      Name = "${var.app_name_react}-react-app"
    }
  )
}

resource "aws_s3_bucket_lifecycle_configuration" "react_app_bucket" {
  bucket = aws_s3_bucket.react_app_bucket.id

  rule {
    id     = "delete-all"
    status = "Enabled"

    expiration {
      days = 1
    }
  }
}

# Configure the bucket for website hosting
resource "aws_s3_bucket_website_configuration" "react_app_website" {
  bucket = aws_s3_bucket.react_app_bucket.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "index.html"
  }
}

# Enable public access for the bucket - must be applied before bucket policy
resource "aws_s3_bucket_public_access_block" "react_app_public_access" {
  bucket = aws_s3_bucket.react_app_bucket.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

# Set bucket policy to allow public read access
resource "aws_s3_bucket_policy" "react_app_bucket_policy" {
  bucket = aws_s3_bucket.react_app_bucket.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.react_app_bucket.arn}/*"
      },
      {
        Sid       = "PublicListBucket"
        Effect    = "Allow"
        Principal = "*"
        Action    = ["s3:ListBucket", "s3:GetBucketLocation"]
        Resource  = aws_s3_bucket.react_app_bucket.arn
      }
    ]
  })
  depends_on = [aws_s3_bucket_public_access_block.react_app_public_access]
}

# Upload the React app build files to S3
resource "null_resource" "build_and_deploy_react_app" {
  triggers = {
    src_hash = data.archive_file.react_assets.output_md5
    data_hash = data.archive_file.react_data_assets.output_md5
    public_data_hash = data.archive_file.react_public_data_assets.output_md5
    timestamp = timestamp()
  }

  provisioner "local-exec" {
    command = <<EOT
      cd ${var.path_to_app_dir != null ? var.path_to_app_dir : "${path.root}/../ChartPipeline/"} && \
      export PATH="./node_modules/.bin:/usr/bin:/usr/local/bin:$PATH" && \
      chmod +x sync-data.sh && \
      ./sync-data.sh && \
      /usr/bin/npm install && \
      chmod +x node_modules/.bin/* && \
      REACT_APP_CACHE_VERSION=$(date +%s) REACT_APP_IDENTITY_POOL_ID=${aws_cognito_identity_pool.file_upload_pool.id} REACT_APP_S3_BUCKET=${aws_s3_bucket.react_app_bucket.bucket} /usr/bin/npm run build && \
      aws s3 sync build/ s3://${aws_s3_bucket.react_app_bucket.bucket} --delete --cache-control "no-cache, no-store, must-revalidate" --metadata-directive REPLACE && \
      aws s3 sync build/data/ s3://${aws_s3_bucket.react_app_bucket.bucket}/data/ --cache-control "no-cache, no-store, must-revalidate, max-age=0" --metadata-directive REPLACE
    EOT
  }

  depends_on = [
    aws_s3_bucket.react_app_bucket,
    aws_s3_bucket_policy.react_app_bucket_policy,
    aws_s3_bucket_public_access_block.react_app_public_access
  ]
}

# CloudFront invalidation to ensure new data is served immediately
resource "null_resource" "cloudfront_invalidation" {
  triggers = {
    data_hash = data.archive_file.react_data_assets.output_md5
    public_data_hash = data.archive_file.react_public_data_assets.output_md5
  }

  provisioner "local-exec" {
    command = <<EOT
      aws cloudfront create-invalidation --distribution-id ${aws_cloudfront_distribution.react_app_distribution.id} --paths "/*"
    EOT
  }

  depends_on = [
    null_resource.build_and_deploy_react_app,
    aws_cloudfront_distribution.react_app_distribution
  ]
}

# CloudFront distribution for the React app
resource "aws_cloudfront_distribution" "react_app_distribution" {
  origin {
    domain_name = aws_s3_bucket_website_configuration.react_app_website.website_endpoint
    origin_id   = "S3-${aws_s3_bucket.react_app_bucket.bucket}"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
  price_class         = "PriceClass_100"

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${aws_s3_bucket.react_app_bucket.bucket}"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 300  # 5 minutes for faster data updates
    max_ttl                = 3600 # 1 hour max
  }

  # Separate cache behavior for data files with shorter TTL
  ordered_cache_behavior {
    path_pattern     = "/data/*"
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${aws_s3_bucket.react_app_bucket.bucket}"

    forwarded_values {
      query_string = true  # Allow query string for cache busting
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 60   # 1 minute for data files
    max_ttl                = 300  # 5 minutes max for data
  }

  # Handle SPA routing by redirecting all paths to index.html
  custom_error_response {
    error_code         = 403
    response_code      = 200
    response_page_path = "/index.html"
  }

  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.app_name_react}-cloudfront"
    }
  )

  depends_on = [
    null_resource.build_and_deploy_react_app
  ]
}

# Output the CloudFront URL
output "react_app_url" {
  value       = "https://${aws_cloudfront_distribution.react_app_distribution.domain_name}"
  description = "URL of the React application"
}

# CORS configuration for React app bucket to allow file uploads
resource "aws_s3_bucket_cors_configuration" "react_app_cors" {
  bucket = aws_s3_bucket.react_app_bucket.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST", "DELETE", "HEAD"]
    allowed_origins = ["*"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

# Output the S3 website URL (as backup)
output "react_app_s3_url" {
  value       = "http://${aws_s3_bucket_website_configuration.react_app_website.website_endpoint}"
  description = "S3 website URL of the React application"
}

# Cognito Identity Pool for unauthenticated access
resource "aws_cognito_identity_pool" "file_upload_pool" {
  identity_pool_name               = "${var.app_name_react}_file_upload_pool"
  allow_unauthenticated_identities = true
}

# IAM role for unauthenticated users
resource "aws_iam_role" "cognito_unauthenticated_role" {
  name = "${var.app_name_react}-cognito-unauthenticated-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Federated = "cognito-identity.amazonaws.com"
        }
        Action = "sts:AssumeRoleWithWebIdentity"
        Condition = {
          StringEquals = {
            "cognito-identity.amazonaws.com:aud" = aws_cognito_identity_pool.file_upload_pool.id
          }
          "ForAnyValue:StringLike" = {
            "cognito-identity.amazonaws.com:amr" = "unauthenticated"
          }
        }
      }
    ]
  })
}

# IAM policy for S3 access
resource "aws_iam_role_policy" "cognito_s3_policy" {
  name = "${var.app_name_react}-cognito-s3-policy"
  role = aws_iam_role.cognito_unauthenticated_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:GetObject"
        ]
        Resource = "${aws_s3_bucket.react_app_bucket.arn}/rawDataset/*"
      }
    ]
  })
}

# Attach role to identity pool
resource "aws_cognito_identity_pool_roles_attachment" "file_upload_roles" {
  identity_pool_id = aws_cognito_identity_pool.file_upload_pool.id

  roles = {
    "unauthenticated" = aws_iam_role.cognito_unauthenticated_role.arn
  }
}

# Output the Identity Pool ID
output "identity_pool_id" {
  value       = aws_cognito_identity_pool.file_upload_pool.id
  description = "Cognito Identity Pool ID for file uploads"
}

# Output the Lambda function ARN
output "excel_processor_lambda_arn" {
  value       = aws_lambda_function.excel_processor.arn
  description = "ARN of the Excel processor Lambda function"
}

# EventBridge rule to trigger on S3 object creation in rawDataset/ folder
resource "aws_cloudwatch_event_rule" "s3_file_upload_rule" {
  name        = "${var.app_name_react}-s3-file-upload-rule"
  description = "Trigger when file is uploaded to rawDataset/ folder"

  event_pattern = jsonencode({
    source      = ["aws.s3"]
    detail-type = ["Object Created"]
    detail = {
      bucket = {
        name = [aws_s3_bucket.react_app_bucket.bucket]
      }
      object = {
        key = [{
          prefix = "rawDataset/"
        }]
      }
    }
  })

  tags = merge(
    var.tags,
    {
      Name = "${var.app_name_react}-s3-upload-rule"
    }
  )
}

# S3 bucket notification to send events to EventBridge
resource "aws_s3_bucket_notification" "react_app_bucket_notification" {
  bucket      = aws_s3_bucket.react_app_bucket.id
  eventbridge = true
}

# IAM role for Excel processor Lambda
resource "aws_iam_role" "excel_processor_lambda_role" {
  name = "${var.app_name_react}-excel-processor-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

# IAM policy for Excel processor Lambda
resource "aws_iam_role_policy" "excel_processor_lambda_policy" {
  name = "${var.app_name_react}-excel-processor-lambda-policy"
  role = aws_iam_role.excel_processor_lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject"
        ]
        Resource = "${aws_s3_bucket.react_app_bucket.arn}/*"
      }
    ]
  })
}

# Excel processor Lambda function
resource "aws_lambda_function" "excel_processor" {
  function_name = "${var.app_name_react}-excel-processor"
  role         = aws_iam_role.excel_processor_lambda_role.arn
  
  # Using container image
  package_type = "Image"
  image_uri    = "881490115226.dkr.ecr.us-east-1.amazonaws.com/react-app-excel-processor:latest"

  timeout     = 300
  memory_size = 1024
  
  architectures = ["arm64"]
  
  tags = merge(
    var.tags,
    {
      Name = "${var.app_name_react}-excel-processor"
    }
  )
}

# EventBridge target to trigger Lambda
resource "aws_cloudwatch_event_target" "excel_processor_target" {
  rule      = aws_cloudwatch_event_rule.s3_file_upload_rule.name
  target_id = "ExcelProcessorTarget"
  arn       = aws_lambda_function.excel_processor.arn
}

# Lambda permission for EventBridge
resource "aws_lambda_permission" "allow_eventbridge" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.excel_processor.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.s3_file_upload_rule.arn
}

