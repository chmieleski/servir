# Infra (Terraform)

This folder contains AWS Terraform stacks for the API MVP deployment.

## Layout

- `infra/terraform/bootstrap`: one-time remote state bootstrap (S3 + DynamoDB lock table)
- `infra/terraform/api`: API runtime stack (VPC, EC2 host, ECR, RDS PostgreSQL, SSM parameters)

## Prerequisites

- Terraform CLI `>= 1.8.0`
- AWS credentials with permissions to create VPC/EC2/RDS/IAM/SSM/ECR resources

## GitHub Actions Setup (Secrets/Variables/OIDC)

For the complete CI/CD setup guide (GitHub OIDC, IAM role, repository secrets/variables, Infracost API key, DNS and validation checklist), see:

- `docs/infra/github-actions-setup.md`

## 1) Bootstrap Remote State (one-time)

```bash
cd infra/terraform/bootstrap
terraform init
terraform apply \
  -var="state_bucket_name=<globally-unique-bucket-name>" \
  -var="lock_table_name=servir-prod-terraform-locks"
```

After apply, note `state_bucket_name` and `lock_table_name`.

## 2) Configure API Stack Backend

```bash
cd infra/terraform/api
terraform init -backend-config=backend.hcl
```

`backend.hcl` should look like `backend.hcl.example`.

## 3) Plan/Apply API Stack

```bash
cd infra/terraform/api
terraform plan -var-file=terraform.tfvars
terraform apply -var-file=terraform.tfvars
```

Note: `api_root_volume_size_gb` must be at least `30` for the current Amazon Linux 2023 ARM64 AMI used by this stack.

## Database Secrets Path

The API stack writes database connection values into SSM Parameter Store:

- `/<project>/<environment>/api/database/host`
- `/<project>/<environment>/api/database/port`
- `/<project>/<environment>/api/database/name`
- `/<project>/<environment>/api/database/user`
- `/<project>/<environment>/api/database/password` (`SecureString`)
- `/<project>/<environment>/api/database/ssl`

## CI/CD Variables and Secrets

Repository secrets:

- `AWS_ROLE_ARN`: IAM role ARN assumed by GitHub OIDC
- `INFRACOST_API_KEY`: Infracost API key

Repository variables:

- `TF_STATE_BUCKET`: S3 bucket name for Terraform state
- `TF_STATE_LOCK_TABLE`: DynamoDB lock table name
- `TF_STATE_KEY`: Terraform state key (default: `api/prod/terraform.tfstate`)
- `API_DOMAIN`: API domain, e.g. `api.servir.app`
- `LETSENCRYPT_EMAIL`: email for TLS certificates
- `API_CORS_ORIGIN`: comma-separated allowed origins
- `API_PREFIX` (optional, set empty to expose routes at subdomain root)
- `API_DOCS_ENABLED` (optional, default `true`)
- `API_DOCS_PATH` (optional, default `docs` when using root routes)
