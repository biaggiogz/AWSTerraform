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
