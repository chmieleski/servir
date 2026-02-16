variable "aws_region" {
  description = "AWS region where the API infrastructure is deployed."
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name used for naming and tagging."
  type        = string
  default     = "servir"
}

variable "environment" {
  description = "Environment name used for naming and tagging."
  type        = string
  default     = "prod"
}

variable "api_domain" {
  description = "Public API domain used by Caddy for TLS and routing."
  type        = string
  default     = "api.example.com"
}

variable "letsencrypt_email" {
  description = "Email used by Caddy for certificate management."
  type        = string
  default     = "ops@example.com"
}

variable "vpc_cidr_block" {
  description = "CIDR block for the VPC."
  type        = string
  default     = "10.20.0.0/16"
}

variable "public_subnet_cidr" {
  description = "CIDR block for the API public subnet."
  type        = string
  default     = "10.20.1.0/24"
}

variable "private_subnet_a_cidr" {
  description = "CIDR block for the first private subnet (DB)."
  type        = string
  default     = "10.20.11.0/24"
}

variable "private_subnet_b_cidr" {
  description = "CIDR block for the second private subnet (DB)."
  type        = string
  default     = "10.20.12.0/24"
}

variable "api_instance_type" {
  description = "EC2 instance type for the API host."
  type        = string
  default     = "t4g.nano"
}

variable "api_root_volume_size_gb" {
  description = "Root EBS volume size for API host. Amazon Linux 2023 ARM64 AMIs currently require at least 30 GB."
  type        = number
  default     = 30

  validation {
    condition     = var.api_root_volume_size_gb >= 30
    error_message = "api_root_volume_size_gb must be at least 30 GB for the selected Amazon Linux 2023 ARM64 AMI snapshot."
  }
}

variable "api_prefix" {
  description = "API prefix exposed by NestJS."
  type        = string
  default     = "api/v1"
}

variable "api_docs_enabled" {
  description = "Whether Swagger docs are enabled in production."
  type        = bool
  default     = true
}

variable "api_docs_path" {
  description = "Swagger docs path."
  type        = string
  default     = "api/docs"
}

variable "api_cors_origin" {
  description = "CORS origins passed to API container."
  type        = string
  default     = "*"
}

variable "app_version" {
  description = "APP_VERSION environment variable for API container."
  type        = string
  default     = "0.0.0"
}

variable "db_instance_class" {
  description = "RDS instance class."
  type        = string
  default     = "db.t4g.micro"
}

variable "db_allocated_storage_gb" {
  description = "RDS allocated storage in GB."
  type        = number
  default     = 20
}

variable "db_name" {
  description = "RDS database name."
  type        = string
  default     = "servir"
}

variable "db_master_username" {
  description = "RDS master username."
  type        = string
  default     = "servir"
}

variable "db_port" {
  description = "RDS database port."
  type        = number
  default     = 5432
}

variable "db_backup_retention_days" {
  description = "Number of days for automated backup retention."
  type        = number
  default     = 1
}

variable "db_password_length" {
  description = "Random password length for RDS master user."
  type        = number
  default     = 24
}

variable "db_ssl" {
  description = "Whether API should use SSL for database connection."
  type        = bool
  default     = true
}

variable "public_ingress_cidrs" {
  description = "CIDRs allowed to access the API host on ports 80 and 443."
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "tags" {
  description = "Additional tags applied to resources."
  type        = map(string)
  default     = {}
}
