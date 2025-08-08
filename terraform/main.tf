terraform {
  required_version = ">= 1.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.1"
    }
    null = {
      source  = "hashicorp/null"
      version = "~> 3.2"
    }
  }

  # Uncomment and configure for remote state
  # backend "s3" {
  #   bucket = "your-terraform-state-bucket"
  #   key    = "ecom-spa/terraform.tfstate"
  #   region = "us-west-2"
  # }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "ecom-spa"
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

# Data sources
data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_caller_identity" "current" {}

# Note: VPC and Security Groups not needed for serverless Lambda architecture
# Keeping modules commented for future use if needed
# module "vpc" {
#   source = "./modules/vpc"
#   project_name        = var.project_name
#   environment        = var.environment
#   availability_zones = data.aws_availability_zones.available.names
#   vpc_cidr          = var.vpc_cidr
# }

# module "security_groups" {
#   source = "./modules/security"
#   project_name = var.project_name
#   environment  = var.environment
#   vpc_id       = module.vpc.vpc_id
# }

# DynamoDB Tables
module "dynamodb" {
  source = "./modules/dynamodb"
  
  project_name                = var.project_name
  environment                = var.environment
  billing_mode               = var.dynamodb_billing_mode
  enable_point_in_time_recovery = var.enable_point_in_time_recovery
  deletion_protection        = var.dynamodb_deletion_protection
}

# Cognito User Pool and Identity Pool
module "cognito" {
  source = "./modules/cognito"
  
  project_name    = var.project_name
  environment     = var.environment
  domain_prefix   = var.cognito_domain_prefix
  frontend_domain = var.frontend_domain
  api_domain      = var.api_domain
  
  password_policy = var.cognito_password_policy
  mfa_configuration = var.cognito_mfa_configuration
  enable_user_pool_domain = var.enable_cognito_domain
}

# ECR Repositories (still needed for Lambda container images)
module "ecr" {
  source = "./modules/ecr"
  
  project_name = var.project_name
  environment  = var.environment
}

# Build and push container images so Lambda can reference :latest
resource "null_resource" "build_and_push_images" {
  triggers = {
    product_dockerfile_sha  = filesha1("${path.root}/../backend/product-service/Dockerfile")
    cart_dockerfile_sha     = filesha1("${path.root}/../backend/cart-service/Dockerfile")
    frontend_dockerfile_sha = filesha1("${path.root}/../frontend/Dockerfile")
    product_repo            = module.ecr.product_service_repository_url
    cart_repo               = module.ecr.cart_service_repository_url
    frontend_repo           = module.ecr.frontend_repository_url
  }

  provisioner "local-exec" {
    interpreter = ["/bin/bash", "-lc"]
    command = <<-EOT
      set -euo pipefail
      export DOCKER_BUILDKIT=1
      export BUILDKIT_PROGRESS=plain
      ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
      REGION=${var.aws_region}
      aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com

      # Build product-service (context: backend)
      docker pull ${module.ecr.product_service_repository_url}:latest || true
      docker build --platform linux/amd64 \
        --build-arg BUILDKIT_INLINE_CACHE=1 \
        --cache-from ${module.ecr.product_service_repository_url}:latest \
        -f ${path.root}/../backend/product-service/Dockerfile \
        -t product-service ${path.root}/../backend
      docker tag product-service:latest ${module.ecr.product_service_repository_url}:latest
      docker push ${module.ecr.product_service_repository_url}:latest

      # Build cart-service (context: backend)
      docker pull ${module.ecr.cart_service_repository_url}:latest || true
      docker build --platform linux/amd64 \
        --build-arg BUILDKIT_INLINE_CACHE=1 \
        --cache-from ${module.ecr.cart_service_repository_url}:latest \
        -f ${path.root}/../backend/cart-service/Dockerfile \
        -t cart-service ${path.root}/../backend
      docker tag cart-service:latest ${module.ecr.cart_service_repository_url}:latest
      docker push ${module.ecr.cart_service_repository_url}:latest

      # Build frontend (context: frontend)
      docker pull ${module.ecr.frontend_repository_url}:latest || true
      docker build --platform linux/amd64 \
        --build-arg BUILDKIT_INLINE_CACHE=1 \
        --cache-from ${module.ecr.frontend_repository_url}:latest \
        -f ${path.root}/../frontend/Dockerfile \
        -t frontend ${path.root}/../frontend
      docker tag frontend:latest ${module.ecr.frontend_repository_url}:latest
      docker push ${module.ecr.frontend_repository_url}:latest
    EOT
  }

  depends_on = [module.ecr]
}

# Lambda Functions
module "lambda" {
  source = "./modules/lambda"
  
  project_name                = var.project_name
  environment                = var.environment
  
  # Container images
  product_service_image_uri  = "${module.ecr.product_service_repository_url}:latest"
  cart_service_image_uri     = "${module.ecr.cart_service_repository_url}:latest"
  frontend_image_uri         = "${module.ecr.frontend_repository_url}:latest"
  
  # DynamoDB Configuration
  products_table_name        = module.dynamodb.products_table_name
  carts_table_name          = module.dynamodb.carts_table_name
  
  # Lambda Configuration
  lambda_memory_size       = var.lambda_memory_size
  lambda_timeout          = var.lambda_timeout
  lambda_architecture     = var.lambda_architecture
  enable_provisioned_concurrency = var.enable_provisioned_concurrency
  
  # Application Configuration
  jwt_secret_key            = var.jwt_secret_key
  aws_region               = var.aws_region
  
  # Cognito Configuration
  cognito_user_pool_id     = module.cognito.user_pool_id
  cognito_web_client_id    = module.cognito.web_client_id
  cognito_api_client_id    = module.cognito.api_client_id
  cognito_identity_pool_id = module.cognito.identity_pool_id
  cognito_user_pool_domain = module.cognito.user_pool_domain
  
  depends_on = [
    null_resource.build_and_push_images,
    module.dynamodb,
    module.cognito,
    module.ecr
  ]
}

# API Gateway
module "api_gateway" {
  source = "./modules/api-gateway"
  
  project_name    = var.project_name
  environment     = var.environment
  stage_name      = var.api_gateway_stage_name
  
  # Cognito Configuration
  cognito_user_pool_id  = module.cognito.user_pool_id
  cognito_user_pool_arn = module.cognito.user_pool_arn
  
  # Lambda Configuration
  product_service_function_arn = module.lambda.product_service_function_arn
  cart_service_function_arn    = module.lambda.cart_service_function_arn
  frontend_function_arn        = module.lambda.frontend_function_arn
  product_service_invoke_arn   = module.lambda.product_service_invoke_arn
  cart_service_invoke_arn      = module.lambda.cart_service_invoke_arn
  frontend_invoke_arn          = module.lambda.frontend_invoke_arn
  
  # Optional: Custom domain
  domain_name     = var.api_gateway_domain_name
  certificate_arn = var.api_gateway_certificate_arn
  
  # CORS Configuration
  cors_allow_origins = var.api_gateway_cors_origins
  
  depends_on = [
    module.lambda,
    module.cognito
  ]
}

# Post-apply: update Cognito callbacks with API Gateway URL
resource "null_resource" "update_cognito_callbacks" {
  triggers = {
    api_url       = module.api_gateway.api_url
    user_pool_id  = module.cognito.user_pool_id
    web_client_id = module.cognito.web_client_id
  }

  provisioner "local-exec" {
    interpreter = ["/bin/bash", "-lc"]
    command = <<-EOT
      set -euo pipefail
      API_URL=${module.api_gateway.api_url}
      USER_POOL_ID=${module.cognito.user_pool_id}
      WEB_CLIENT_ID=${module.cognito.web_client_id}
      # Resolve AWS CLI v2 and enforce OAuth settings (these can be cleared by updates otherwise)
      AWS_BIN="$${AWS_BIN:-}"
      if [ -z "$AWS_BIN" ]; then
        if [ -x "/usr/local/bin/aws" ]; then AWS_BIN="/usr/local/bin/aws"; fi
      fi
      if [ -z "$AWS_BIN" ]; then
        if [ -x "/opt/homebrew/bin/aws" ]; then AWS_BIN="/opt/homebrew/bin/aws"; fi
      fi
      if [ -z "$AWS_BIN" ]; then
        AWS_BIN="$(command -v aws)"
      fi
      if ! "$AWS_BIN" --version 2>&1 | grep -q 'aws-cli/2'; then
        echo "ERROR: AWS CLI v2 is required for OAuth flags. Detected: $($AWS_BIN --version 2>&1)" >&2
        exit 1
      fi

      # Build JSON payload to avoid older CLI arg parsing issues
      TMP_JSON=$(mktemp)
      cat > "$TMP_JSON" <<JSON
{
  "UserPoolId": "$USER_POOL_ID",
  "ClientId": "$WEB_CLIENT_ID",
  "AllowedOAuthFlowsUserPoolClient": true,
  "AllowedOAuthFlows": ["code"],
  "AllowedOAuthScopes": ["openid", "email", "profile"],
  "SupportedIdentityProviders": ["COGNITO"],
  "CallbackURLs": [
    "$API_URL/",
    "$API_URL/auth/callback",
    "http://localhost:3000/",
    "http://localhost:3000/auth/callback"
  ],
  "LogoutURLs": [
    "$API_URL/",
    "http://localhost:3000/",
    "http://localhost:3000/auth/logout"
  ]
}
JSON

      "$AWS_BIN" cognito-idp update-user-pool-client \
        --region ${var.aws_region} \
        --cli-input-json file://"$TMP_JSON"

      rm -f "$TMP_JSON"
    EOT
  }

  depends_on = [
    module.api_gateway,
    module.cognito
  ]
}

# Post-apply: seed DynamoDB products table if empty (idempotent)
resource "null_resource" "seed_dynamodb_products" {
  triggers = {
    region          = var.aws_region
    products_table  = module.dynamodb.products_table_name
  }

  provisioner "local-exec" {
    interpreter = ["/bin/bash", "-lc"]
    command = <<-EOT
      set -euo pipefail
      REGION=${var.aws_region}
      TABLE=${module.dynamodb.products_table_name}
      # Check if table is empty (Count == 0)
      COUNT=$(aws dynamodb scan --region "$REGION" --table-name "$TABLE" --select COUNT --query 'Count' --output text || echo 0)
      if [ "$$COUNT" != "0" ]; then
        echo "Products table '$TABLE' already has data (Count=$$COUNT), skipping seed."
        exit 0
      fi

      TMP_JSON=$(mktemp)
      cat > "$TMP_JSON" <<'JSON'
{
  "RequestItems": {
    "TABLE_PLACEHOLDER": [
      {"PutRequest":{"Item":{"id":{"S":"1"},"name":{"S":"Wireless Headphones"},"description":{"S":"High-quality wireless headphones with noise cancellation"},"price":{"N":"199.99"},"category":{"S":"Electronics"},"image_url":{"S":"https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500"},"stock":{"N":"50"}}}},
      {"PutRequest":{"Item":{"id":{"S":"2"},"name":{"S":"Running Shoes"},"description":{"S":"Comfortable running shoes for daily exercise"},"price":{"N":"89.99"},"category":{"S":"Sports"},"image_url":{"S":"https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500"},"stock":{"N":"30"}}}},
      {"PutRequest":{"Item":{"id":{"S":"3"},"name":{"S":"Coffee Maker"},"description":{"S":"Automatic coffee maker for perfect morning coffee"},"price":{"N":"149.99"},"category":{"S":"Home"},"image_url":{"S":"https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=500"},"stock":{"N":"25"}}}},
      {"PutRequest":{"Item":{"id":{"S":"4"},"name":{"S":"Smartphone"},"description":{"S":"Latest smartphone with advanced camera system"},"price":{"N":"699.99"},"category":{"S":"Electronics"},"image_url":{"S":"https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500"},"stock":{"N":"40"}}}},
      {"PutRequest":{"Item":{"id":{"S":"5"},"name":{"S":"Book - Python Programming"},"description":{"S":"Complete guide to Python programming for beginners"},"price":{"N":"39.99"},"category":{"S":"Books"},"image_url":{"S":"https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=500"},"stock":{"N":"100"}}}}
    ]
  }
}
JSON
      sed -i.bak "s/TABLE_PLACEHOLDER/$TABLE/g" "$TMP_JSON"
      aws dynamodb batch-write-item --region "$REGION" --request-items file://"$TMP_JSON"
      rm -f "$TMP_JSON" "$TMP_JSON.bak"
      echo "Seeded sample products into '$TABLE'"
    EOT
  }

  depends_on = [
    module.dynamodb
  ]
}

# Post-create step: update Lambda env vars (from Terraform outputs) as the last step
resource "null_resource" "update_lambda_env" {
  provisioner "local-exec" {
    interpreter = ["/bin/bash", "-lc"]
    command = <<-EOT
      set -euo pipefail
      REGION=${var.aws_region}
      API_URL=${module.api_gateway.api_url}
      USER_POOL_ID=${module.cognito.user_pool_id}
      WEB_CLIENT_ID=${module.cognito.web_client_id}
      API_CLIENT_ID=${module.cognito.api_client_id}
      IDENTITY_POOL_ID=${module.cognito.identity_pool_id}
      PRODUCTS_TABLE=${module.dynamodb.products_table_name}
      CARTS_TABLE=${module.dynamodb.carts_table_name}

      PRODUCT_FN_NAME=${var.project_name}-${var.environment}-product-service
      CART_FN_NAME=${var.project_name}-${var.environment}-cart-service
      FRONTEND_FN_NAME=${var.project_name}-${var.environment}-frontend

      aws lambda update-function-configuration --region $REGION \
        --function-name "$PRODUCT_FN_NAME" \
        --environment "Variables={ENV=${var.environment},PRODUCTS_TABLE_NAME=$PRODUCTS_TABLE,USE_COGNITO_AUTH=true,COGNITO_USER_POOL_ID=$USER_POOL_ID,COGNITO_WEB_CLIENT_ID=$WEB_CLIENT_ID,JWT_SECRET_KEY=${var.jwt_secret_key}}"

      aws lambda update-function-configuration --region $REGION \
        --function-name "$CART_FN_NAME" \
        --environment "Variables={ENV=${var.environment},CARTS_TABLE_NAME=$CARTS_TABLE,PRODUCTS_TABLE_NAME=$PRODUCTS_TABLE,USE_COGNITO_AUTH=true,COGNITO_USER_POOL_ID=$USER_POOL_ID,COGNITO_WEB_CLIENT_ID=$WEB_CLIENT_ID,COGNITO_API_CLIENT_ID=$API_CLIENT_ID,JWT_SECRET_KEY=${var.jwt_secret_key},PRODUCT_SERVICE_URL=${module.api_gateway.api_url}/api}"

      aws lambda update-function-configuration --region $REGION \
        --function-name "$FRONTEND_FN_NAME" \
        --environment "Variables={REACT_APP_USE_COGNITO_AUTH=true,REACT_APP_USER_POOL_ID=$USER_POOL_ID,REACT_APP_USER_POOL_WEB_CLIENT_ID=$WEB_CLIENT_ID,REACT_APP_IDENTITY_POOL_ID=$IDENTITY_POOL_ID,REACT_APP_API_GATEWAY_URL=$API_URL,REACT_APP_AWS_REGION=${var.aws_region},REACT_APP_USER_POOL_DOMAIN=${module.cognito.user_pool_domain}}"
    EOT
  }

  triggers = {
    api_url            = module.api_gateway.api_url
    user_pool          = module.cognito.user_pool_id
    web_client         = module.cognito.web_client_id
    api_client         = module.cognito.api_client_id
    identity_pool      = module.cognito.identity_pool_id
    products_table     = module.dynamodb.products_table_name
    carts_table        = module.dynamodb.carts_table_name
  }

  depends_on = [
    module.api_gateway,
    module.lambda
  ]
}