output "state_bucket_name" {
  description = "S3 bucket name used for remote Terraform state."
  value       = aws_s3_bucket.terraform_state.bucket
}

output "lock_table_name" {
  description = "DynamoDB table name used for remote Terraform state locking."
  value       = aws_dynamodb_table.terraform_locks.name
}
