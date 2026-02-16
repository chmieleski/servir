output "api_instance_id" {
  description = "EC2 instance ID that runs the API container stack."
  value       = aws_instance.api.id
}

output "api_elastic_ip" {
  description = "Elastic IP address for the API host."
  value       = aws_eip.api.public_ip
}

output "ecr_repository_url" {
  description = "ECR repository URL for the API image."
  value       = aws_ecr_repository.api.repository_url
}

output "healthcheck_url" {
  description = "Public health endpoint URL."
  value       = local.api_prefix_sanitized == "" ? "https://${var.api_domain}/health" : "https://${var.api_domain}/${local.api_prefix_sanitized}/health"
}

output "db_endpoint" {
  description = "RDS endpoint hostname."
  value       = aws_db_instance.postgres.address
}

output "db_port" {
  description = "RDS port."
  value       = tostring(aws_db_instance.postgres.port)
}

output "db_name" {
  description = "RDS database name."
  value       = aws_db_instance.postgres.db_name
}

output "db_host_parameter_name" {
  description = "SSM parameter name for DATABASE_HOST."
  value       = aws_ssm_parameter.db_host.name
}

output "db_port_parameter_name" {
  description = "SSM parameter name for DATABASE_PORT."
  value       = aws_ssm_parameter.db_port.name
}

output "db_name_parameter_name" {
  description = "SSM parameter name for DATABASE_NAME."
  value       = aws_ssm_parameter.db_name.name
}

output "db_user_parameter_name" {
  description = "SSM parameter name for DATABASE_USER."
  value       = aws_ssm_parameter.db_user.name
}

output "db_password_parameter_name" {
  description = "SSM parameter name for DATABASE_PASSWORD."
  value       = aws_ssm_parameter.db_password.name
}

output "db_ssl_parameter_name" {
  description = "SSM parameter name for DATABASE_SSL."
  value       = aws_ssm_parameter.db_ssl.name
}
