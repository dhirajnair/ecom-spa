# 🚀 AWS Setup and Deployment (Concise)

## 📋 Prerequisites

- **AWS CLI** configured and logged in
- **Terraform** >= 1.0
- **Docker** (only if you build/push images)

## 🔐 AWS Credentials Setup

```bash
# Option 1: Configure via AWS CLI (recommended)
aws configure

# Option 2: Environment variables
export AWS_ACCESS_KEY_ID="<your-access-key>"
export AWS_SECRET_ACCESS_KEY="<your-secret-key>"
export AWS_DEFAULT_REGION="ap-south-1"

# Verify identity
aws sts get-caller-identity
```


## 🛠️ Setup

### Configure Terraform Variables

```bash
# Copy and edit Terraform variables
cp terraform/terraform.tfvars.example terraform/terraform.tfvars
# Edit: project_name, environment, aws_region, cognito_domain_prefix, jwt_secret_key

# Install Terraform (macOS)
brew install terraform

# Initialize, plan (save to plan.txt), and apply
cd terraform
terraform init
terraform plan -no-color | tee plan.txt
terraform apply -auto-approve
```

### Seed DynamoDB (to be done every time after "destroy")
```bash

cd ../scripts
pip install boto3
python aws-setup-dynamodb.py
```

## 🧹 Teardown

```bash
cd terraform && terraform destroy -auto-approve
```

