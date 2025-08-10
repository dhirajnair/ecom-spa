# Terraform for AWS Serverless Deployment

This directory provisions the serverless infrastructure for the e-commerce SPA using Terraform.

## What it deploys
- DynamoDB tables (products, carts)
- ECR repositories (for Lambda container images)
- Lambda functions (frontend, product-service, cart-service)
- API Gateway (REST API) with routes and CORS
- Cognito (User Pool, Identity Pool, Hosted UI)
- IAM roles and permissions

## Prerequisites
- AWS CLI configured and logged in
- Terraform >= 1.0
- Docker (required: Terraform builds and pushes images to ECR during apply)
- jq (optional, for nicer output parsing)

## Deployment Sequence (concise and repeatable)

### 1) Credentials
```bash
aws configure  # or export AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY / AWS_DEFAULT_REGION
aws sts get-caller-identity
```

### 2) Variables (apply once, update as needed)
```bash
cp terraform.tfvars.example terraform.tfvars
# Edit these at minimum:
# - project_name
# - environment            # e.g., dev | staging | prod
# - aws_region             # e.g., ap-south-1
# - cognito_domain_prefix  # must be globally unique in the region
# - jwt_secret_key
```

### 3) Init, Plan (save), Apply
```bash
terraform init
terraform plan -no-color | tee plan.txt
terraform apply -auto-approve
```

During apply, Terraform will:
- Create ECR repos
- Build Docker images for services and push to ECR
- Create DynamoDB, Cognito, API Gateway, and Lambda resources
- Update Cognito callbacks and Lambda environment variables

### 4) Outputs (use for app config and verification)
```bash
terraform output api_gateway_url
terraform output -json cognito_config
terraform output ecr_repositories
terraform output -json deployment_info
```

### 5) Seed DynamoDB (via Make command)
After Terraform deployment, seed the DynamoDB tables using make commands:
```bash
# Seed AWS DynamoDB tables
make seed-aws

# Or if you need to seed with specific region/tables
python3 scripts/aws-dynamodb-seed.py \
  --products-table "$(terraform output -raw products_table_name)" \
  --carts-table "$(terraform output -raw carts_table_name)" \
  --region "$(terraform output -raw aws_region)"
```

### 6) Update variables and re-apply
When you change values in `terraform.tfvars` (e.g., domain prefix, region, JWT, etc.), simply re-apply:
```bash
terraform apply -auto-approve
```

### 7) Teardown
```bash
terraform destroy -auto-approve
```

## Frequently Used Outputs
- `api_gateway_url` – Base URL for the deployed API
- `cognito_config` – Frontend-ready Cognito details (pool IDs, client IDs, domain)
- `ecr_repositories` – ECR URLs for frontend, product, and cart images
- `deployment_info` – Region, environment, project, and timestamp

## Notes
- Ensure Docker is running; Terraform builds and pushes images as part of `apply`.
- The Cognito domain prefix must be unique in your region (update in `terraform.tfvars`).
- For detailed end-to-end steps, see `../docs/AWS_SETUP_AND_DEPLOY.md`.