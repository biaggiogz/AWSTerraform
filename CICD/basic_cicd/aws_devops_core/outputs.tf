# AWS DevOps Core - Specific Values
output "aws_devops_core_s3_bucket" {
  value = module.module-aws-tf-cicd.s3_bucket_names["aws_devops_core"]
}
output "dev_workload_s3_bucket" {
  value = module.module-aws-tf-cicd.s3_bucket_names["dev_workload"]
}
output "aws_devops_core_ddb_table" {
  value = module.module-aws-tf-cicd.dynamodb_table_names["aws_devops_core"]
}
output "dev_workload_ddb_table" {
  value = module.module-aws-tf-cicd.dynamodb_table_names["dev_workload"]
}
#
# # # Example Production Workload
# output "s3_bucket_name" {
#   value = module.module-aws-tf-cicd.s3_bucket_names
# }
# output "workload_ddb_table_name" {
#   value = module.module-aws-tf-cicd.dynamodb_table_names
# }