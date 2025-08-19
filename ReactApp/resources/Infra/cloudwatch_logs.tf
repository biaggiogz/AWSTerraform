# CloudWatch Log Group for Lambda function
data "aws_cloudwatch_log_group" "python_preprocessor_logs" {
  name = "/aws/lambda/${var.app_name_react}-python-preprocessor"
}

# Output log group name for frontend access
output "lambda_log_group_name" {
  value       = data.aws_cloudwatch_log_group.python_preprocessor_logs.name
  description = "CloudWatch log group name for Lambda function"
}