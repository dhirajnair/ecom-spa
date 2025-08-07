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
  
  depends_on = [
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