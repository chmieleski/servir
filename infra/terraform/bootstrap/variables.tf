variable "aws_region" {
  description = "AWS region for Terraform state infrastructure."
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name used for tagging."
  type        = string
  default     = "servir"
}

variable "environment" {
  description = "Environment name used for tagging."
  type        = string
  default     = "prod"
}

variable "state_bucket_name" {
  description = "Globally-unique S3 bucket name for Terraform remote state."
  type        = string
}

variable "lock_table_name" {
  description = "DynamoDB table name used for Terraform state locking."
  type        = string
}

variable "tags" {
  description = "Additional tags to attach to all resources."
  type        = map(string)
  default     = {}
}
