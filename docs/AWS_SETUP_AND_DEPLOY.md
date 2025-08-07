# 🚀 AWS Setup and Deployment Guide

## 📋 Prerequisites

- **AWS CLI** configured with appropriate permissions
- **Terraform** >= 1.0
- **Docker Desktop**

### AWS Credentials Setup

```bash
# Option 1: Configure AWS CLI
aws configure
# Enter: AWS Access Key ID, Secret Access Key, Region, Output format

# Option 2: Environment variables
export AWS_ACCESS_KEY_ID="your-access-key"
export AWS_SECRET_ACCESS_KEY="your-secret-key"
export AWS_DEFAULT_REGION="ap-south-1"

# Option 3: AWS credentials file
# Create ~/.aws/credentials:
# [default]
# aws_access_key_id = your-access-key
# aws_secret_access_key = your-secret-key

# Verify credentials
aws sts get-caller-identity
```

## 🛠️ Setup

### Configure and Deploy Infrastructure

```bash
# Copy and edit Terraform variables
cp terraform/terraform.tfvars.example terraform/terraform.tfvars
# Edit: project_name, environment, aws_region, cognito_domain_prefix, jwt_secret_key

# Deploy infrastructure
cd terraform
terraform init
terraform apply
```

### Get Configuration Values

```bash
# Save these for next steps
terraform output api_gateway_url
terraform output cognito_config
terraform output ecr_repositories
```

## 🚢 Deploy

### Quick Deploy Script

```bash
# Get account ID and ECR login
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REGION=ap-south-1
aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com

# Build, tag, and push all services
for SERVICE in product-service cart-service frontend; do
  REPO_URL="$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/ecom-spa-prod-$SERVICE"
  
  if [ "$SERVICE" = "frontend" ]; then
    docker build -t $SERVICE frontend/
  else
    docker build -t $SERVICE backend/$SERVICE/
  fi
  
  docker tag $SERVICE:latest $REPO_URL:latest
  docker push $REPO_URL:latest
  
  # Update Lambda function
  aws lambda update-function-code \
    --function-name ecom-spa-prod-$SERVICE \
    --image-uri $REPO_URL:latest
done

# Initialize database
python scripts/setup-dynamodb.py

# Test deployment
API_URL=$(terraform output -raw api_gateway_url)
curl -f "$API_URL/prod/api/products"
curl -f "$API_URL/prod/"
```

### Update Frontend Config for Cognito

```bash
# Update frontend/.env with Cognito values from terraform output
terraform output cognito_config

# Example frontend/.env for AWS:
cat > frontend/.env << EOF
REACT_APP_ENV=prod
REACT_APP_USE_COGNITO_AUTH=true
REACT_APP_AWS_REGION=ap-south-1
REACT_APP_USER_POOL_ID=your-user-pool-id
REACT_APP_USER_POOL_WEB_CLIENT_ID=your-web-client-id
REACT_APP_IDENTITY_POOL_ID=your-identity-pool-id
REACT_APP_USER_POOL_DOMAIN=your-cognito-domain-prefix
REACT_APP_PRODUCT_SERVICE_URL=https://your-api-gateway-url/prod/api
REACT_APP_CART_SERVICE_URL=https://your-api-gateway-url/prod/api
EOF

# Rebuild and deploy frontend:
docker build -t frontend frontend/
docker tag frontend:latest $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/ecom-spa-prod-frontend:latest
docker push $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/ecom-spa-prod-frontend:latest
aws lambda update-function-code \
  --function-name ecom-spa-prod-frontend \
  --image-uri $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/ecom-spa-prod-frontend:latest
```

### Access Your Application

```bash
# Get your application URL
API_URL=$(terraform output -raw api_gateway_url)
echo "🌐 Frontend: $API_URL/prod/"
echo "📝 Cognito Hosted UI: https://your-cognito-domain-prefix.auth.ap-south-1.amazoncognito.com"

# Test endpoints
curl -f "$API_URL/prod/api/products"
curl -f "$API_URL/prod/"
```

## 🔄 Update

```bash
# Update code and redeploy
for SERVICE in product-service cart-service frontend; do
  REPO_URL="$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/ecom-spa-prod-$SERVICE"
  docker build -t $SERVICE $([ "$SERVICE" = "frontend" ] && echo "frontend/" || echo "backend/$SERVICE/")
  docker tag $SERVICE:latest $REPO_URL:latest
  docker push $REPO_URL:latest
  aws lambda update-function-code --function-name ecom-spa-prod-$SERVICE --image-uri $REPO_URL:latest
done
```

## 🧹 Cleanup

```bash
cd terraform && terraform destroy
```
