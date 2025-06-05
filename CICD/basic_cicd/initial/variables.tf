variable "codestar_connections" {
  type = map(object({
    connection_name = string
    provider_type   = string
    tags            = map(string)
  }))
  description = "Map of CodeStar Connections"
  default     = {}
}

variable "tags" {
  type        = map(string)
  description = "Default tags to apply to all resources"
  default     = {}
}

////////////////////////////

variable "codebuild_projects" {
  description = "Map of CodeBuild project configurations"
  type = map(object({
    name             = string
    description      = optional(string, "")
    build_timeout    = optional(number, 60)
    env_compute_type = string
    env_image        = string
    env_type         = string
    source_type      = string
    source_location  = string
    source_clone_depth = optional(number, 1)
    path_to_build_spec = optional(string, null)
    build_spec       = optional(string, null)
    source_version   = optional(string, null)
  }))
  default = {}
}

variable "codebuild_service_role_arn" {
  description = "ARN of the IAM role CodeBuild will use. If null, a default role is created."
  type        = string
  default     = null
}

variable "create_codebuild_service_role" {
  type        = bool
  default     = true
  description = "Conditional creation of CodeBuild IAM Role."
}
variable "project_prefix" {
  type        = string
  default     = "tf-workshop"
  description = "The prefix for the current project"

  validation {
    condition     = length(var.project_prefix) > 1 && length(var.project_prefix) <= 40
    error_message = "The defined 'project_prefix' has too many characters (${length(var.project_prefix)}). This can cause deployment failures for AWS resources with smaller character limits. Please reduce the character count and try again."
  }
}

variable "codepipeline_pipelines" {
  description = "Map of CodePipeline pipeline configurations"
  type = map(object({
    name                     = string
    pipeline_type            = string
    existing_s3_bucket_name  = optional(string, null)
    stages                   = list(object({
      name    = string
      enabled = optional(bool, true)
      action  = list(object({
        name             = string
        owner            = string
        version          = string
        category         = string
        provider         = string
        input_artifacts  = optional(list(string), [])
        output_artifacts = optional(list(string), [])
        configuration    = optional(map(string), {})
        role_arn         = optional(string, null)
        run_order        = optional(number, null)
        region           = optional(string, null)  # will default to current region in resource
      }))
    }))
  }))
  default = {}
}

variable "codepipeline_service_role_arn" {
  description = "ARN of the IAM role CodePipeline will use. If null, a default role is created."
  type        = string
  default     = null
}

variable "create_codepipeline_service_role" {
  type        = bool
  default     = true
  description = "Conditional creation of CodePipeline IAM Role."
}


variable "create_cloudwatch_service_role" {
  type        = bool
  default     = true
  description = "Conditional creation of Cloudwatch IAM Role."
}

variable "eventbridge_rules_enable_force_destroy" {
  description = "Enable force destroy on all EventBridge rules. This allows the destruction of all events in the rule."
  type        = bool
  default     = true
}

variable "enable_force_detach_policies" {
  description = "Enable force detaching any policies from IAM roles."
  type        = bool
  default     = true
}
variable "s3_public_access_block" {
  type        = bool
  default     = true
  description = "Conditional enabling of S3 Public Access Block."
}

variable "tf_remote_state_resource_configs" {
  type = map(object({
    prefix           = optional(string, "my-prefix")
    ddb_billing_mode = optional(string, "PAY_PER_REQUEST")
    ddb_hash_key     = optional(string, "LockID")
  }))
  description = "Configurations for Terraform State Resources"
  default     = {}

  validation {
    condition     = alltrue([for config in values(var.tf_remote_state_resource_configs) : length(config.prefix) > 3 && length(config.prefix) <= 40])
    error_message = "The prefix of one of the defined Terraform Remote State Resource Configs is too long. A prefix can be a maxmium of 40 characters, as the names are used by other resources throughout this module. This can cause deployment failures for AWS resources with smaller character limits for naming. Please ensure all prefixes are 40 characters or less, and try again."
  }

  validation {
    condition     = alltrue([for config in values(var.tf_remote_state_resource_configs) : config.ddb_billing_mode == "PAY_PER_REQUEST" || config.ddb_billing_mode == "PROVISIONED"])
    error_message = "The DynamoDB Billing Mode ('ddb_billing_mode') of one of the defined Terraform Remote State Resource Configs is not an accepted value. Valid values for DynamoDB Billing Mode are 'PAY_PER_REQUEST' or 'PROVISIONED'. Please ensure the 'ddb_billing_mode' is set to one of these values and try again."
  }
}