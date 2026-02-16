# Guia de Configuracao do GitHub Actions + AWS (API)

Este guia descreve como configurar o deploy do `apps/api` com Terraform + GitHub Actions, incluindo OIDC, `secrets/variables`, Infracost e DNS.

## 1. Pre-requisitos

- Conta AWS com permissao para IAM, S3, DynamoDB, VPC/EC2, ECR, SSM e RDS.
- Dominio/subdominio para API (ex.: `api.servir.app`).
- Bootstrap do estado remoto Terraform concluido (`infra/terraform/bootstrap`).
- Repositorio GitHub com Actions habilitado.

## 2. Fluxo (resumo)

1. PR com alteracoes de infra/API: roda `Infra Plan` (+ Infracost se chave configurada).
2. Push na `main`: roda `CI`.
3. `Deploy API` dispara via `workflow_run` apenas quando `CI` conclui com `success`.
4. `Deploy API` valida escopo de mudancas:
   - Se mudou escopo API/infra relevante, faz apply + build/push + deploy via SSM.
   - Se nao mudou, finaliza com skip.
5. `workflow_dispatch` permite deploy manual (override de escopo).

## 3. Bootstrap do Terraform state (obter valores do backend)

Se ainda nao executou:

```bash
cd infra/terraform/bootstrap
terraform init
terraform apply \
  -var="state_bucket_name=<bucket-global-unico>" \
  -var="lock_table_name=servir-prod-terraform-locks"
```

Depois capture:

```bash
terraform output state_bucket_name
terraform output lock_table_name
```

Mapeamento para GitHub Variables:

- `TF_STATE_BUCKET` <- `state_bucket_name`
- `TF_STATE_LOCK_TABLE` <- `lock_table_name`
- `TF_STATE_KEY` (opcional) <- ex.: `api/prod/terraform.tfstate`

## 4. Configurar GitHub OIDC no AWS

### 4.1 Criar o Identity Provider OIDC (uma vez por conta)

No IAM > Identity providers:

- Provider URL: `https://token.actions.githubusercontent.com`
- Audience: `sts.amazonaws.com`

## 5. Criar role IAM para o GitHub Actions

Crie uma role dedicada para CI/CD e configure trust policy restringindo ao seu repo:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::<AWS_ACCOUNT_ID>:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": ["repo:<GITHUB_ORG>/<GITHUB_REPO>:ref:refs/heads/main", "repo:<GITHUB_ORG>/<GITHUB_REPO>:pull_request"]
        }
      }
    }
  ]
}
```

### 5.1 Permissoes minimas praticas para este stack

Anexe uma policy custom para o estado remoto:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "TerraformStateS3",
      "Effect": "Allow",
      "Action": ["s3:ListBucket", "s3:GetBucketVersioning"],
      "Resource": "arn:aws:s3:::<TF_STATE_BUCKET>"
    },
    {
      "Sid": "TerraformStateS3Objects",
      "Effect": "Allow",
      "Action": ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"],
      "Resource": "arn:aws:s3:::<TF_STATE_BUCKET>/*"
    },
    {
      "Sid": "TerraformLockDynamoDB",
      "Effect": "Allow",
      "Action": ["dynamodb:DescribeTable", "dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:DeleteItem"],
      "Resource": "arn:aws:dynamodb:us-east-1:<AWS_ACCOUNT_ID>:table/<TF_STATE_LOCK_TABLE>"
    }
  ]
}
```

Anexe uma segunda policy para o stack API (MVP, escopo de servicos usados):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "TerraformApiStackServices",
      "Effect": "Allow",
      "Action": ["ec2:*", "ecr:*", "rds:*", "ssm:*"],
      "Resource": "*"
    },
    {
      "Sid": "IamForEc2RoleAndInstanceProfile",
      "Effect": "Allow",
      "Action": ["iam:CreateRole", "iam:DeleteRole", "iam:GetRole", "iam:TagRole", "iam:UntagRole", "iam:CreatePolicy", "iam:DeletePolicy", "iam:GetPolicy", "iam:GetPolicyVersion", "iam:CreatePolicyVersion", "iam:DeletePolicyVersion", "iam:ListPolicyVersions", "iam:AttachRolePolicy", "iam:DetachRolePolicy", "iam:PutRolePolicy", "iam:DeleteRolePolicy", "iam:ListAttachedRolePolicies", "iam:ListRolePolicies", "iam:CreateInstanceProfile", "iam:DeleteInstanceProfile", "iam:AddRoleToInstanceProfile", "iam:RemoveRoleFromInstanceProfile", "iam:GetInstanceProfile", "iam:TagInstanceProfile", "iam:UntagInstanceProfile", "iam:PassRole"],
      "Resource": "*"
    },
    {
      "Sid": "KmsForSsmSecureString",
      "Effect": "Allow",
      "Action": ["kms:DescribeKey", "kms:Decrypt"],
      "Resource": "*"
    },
    {
      "Sid": "CallerIdentity",
      "Effect": "Allow",
      "Action": "sts:GetCallerIdentity",
      "Resource": "*"
    }
  ]
}
```

No final, copie o ARN da role (ex.: `arn:aws:iam::<id>:role/servir-github-actions-prod`).

## 6. Configurar Secrets e Variables no GitHub

Caminho no GitHub: `Settings > Secrets and variables > Actions`.

| Nome                  | Tipo     | Obrigatorio       | Usado em                           | Como obter                                                                  |
| --------------------- | -------- | ----------------- | ---------------------------------- | --------------------------------------------------------------------------- |
| `AWS_ROLE_ARN`        | Secret   | Sim               | `infra-plan.yml`, `deploy-api.yml` | ARN da role IAM criada na secao 5.                                          |
| `INFRACOST_API_KEY`   | Secret   | Sim (recomendado) | `infra-plan.yml`                   | Infracost dashboard -> API keys -> gerar chave.                             |
| `TF_STATE_BUCKET`     | Variable | Sim               | `infra-plan.yml`, `deploy-api.yml` | Output `state_bucket_name` do bootstrap Terraform.                          |
| `TF_STATE_LOCK_TABLE` | Variable | Sim               | `infra-plan.yml`, `deploy-api.yml` | Output `lock_table_name` do bootstrap Terraform.                            |
| `API_DOMAIN`          | Variable | Sim               | `infra-plan.yml`, `deploy-api.yml` | Subdominio publico da API (ex.: `api.servir.app`).                          |
| `LETSENCRYPT_EMAIL`   | Variable | Sim               | `infra-plan.yml`, `deploy-api.yml` | Email operacional para emissao/renovacao TLS.                               |
| `API_CORS_ORIGIN`     | Variable | Sim               | `infra-plan.yml`, `deploy-api.yml` | Origens permitidas, ex.: `https://servir.app,https://www.servir.app`.       |
| `TF_STATE_KEY`        | Variable | Nao               | `infra-plan.yml`, `deploy-api.yml` | Defina para customizar path do state; default `api/prod/terraform.tfstate`. |
| `API_PREFIX`          | Variable | Nao               | `infra-plan.yml`, `deploy-api.yml` | Deixe vazio para servir na raiz do subdominio.                              |
| `API_DOCS_ENABLED`    | Variable | Nao               | `infra-plan.yml`, `deploy-api.yml` | Default `true`.                                                             |
| `API_DOCS_PATH`       | Variable | Nao               | `infra-plan.yml`, `deploy-api.yml` | Default `docs` (com rotas na raiz).                                         |
| `EXPO_TOKEN`          | Secret   | Nao               | `ci.yml`                           | Token da conta Expo (apenas se quiser validar `@servir/expo` no CI).        |

## 7. Como configurar DNS de `API_DOMAIN`

Depois do primeiro `terraform apply` no stack de API:

```bash
cd infra/terraform/api
terraform output api_elastic_ip
```

No seu provedor DNS (fora do Route53), crie/atualize:

- Tipo: `A`
- Nome: `api` (ou o label do seu subdominio)
- Valor: IP retornado em `api_elastic_ip`
- TTL: 300s (sugestao para rollout inicial)

## 8. Como deixar API na raiz do subdominio

Para expor endpoints sem `/api/...`:

- Defina `API_PREFIX` como string vazia (`""`) em Repository Variables.
- O deploy escreve esse valor no runtime, e a URL base vira `https://<API_DOMAIN>`.

## 9. Checklist final de validacao

1. PR alterando `infra/terraform/api/**` abre `Infra Plan` com `terraform fmt/validate/plan`.
2. Comentario do Infracost aparece no PR (se `INFRACOST_API_KEY` configurado).
3. Merge/push na `main` faz `CI` finalizar com `success`.
4. `Deploy API` dispara por `workflow_run` e usa o `head_sha` do CI.
5. Se nao houver mudanca de escopo API, deploy fica `skipped` sem erro.
6. Se houver mudanca de escopo API, deploy executa `terraform apply`, build/push ARM64, SSM deploy e smoke test.
7. Health check responde em `https://<API_DOMAIN>/<prefixo-ou-raiz>/health`.
