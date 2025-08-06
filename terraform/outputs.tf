# VPC Outputs
output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = module.vpc.public_subnet_ids
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = module.vpc.private_subnet_ids
}

# DynamoDB Outputs
output "dynamodb_table_names" {
  description = "DynamoDB table names"
  value       = module.dynamodb.table_names
}

output "dynamodb_table_arns" {
  description = "DynamoDB table ARNs"
  value       = module.dynamodb.table_arns
}

# Load Balancer Outputs
output "alb_dns_name" {
  description = "Application Load Balancer DNS name"
  value       = module.alb.alb_dns_name
}

output "alb_zone_id" {
  description = "Application Load Balancer zone ID"
  value       = module.alb.alb_zone_id
}

# Application URLs
output "application_url" {
  description = "Application URL"
  value       = "http://${module.alb.alb_dns_name}"
}

output "product_service_url" {
  description = "Product service URL"
  value       = "http://${module.alb.alb_dns_name}/api/products"
}

output "cart_service_url" {
  description = "Cart service URL"
  value       = "http://${module.alb.alb_dns_name}/api/cart"
}

# ECR Repository URLs
output "ecr_repositories" {
  description = "ECR repository URLs"
  value = {
    product_service = module.ecr.product_service_repository_url
    cart_service    = module.ecr.cart_service_repository_url
    frontend        = module.ecr.frontend_repository_url
  }
}

# ECS Cluster
output "ecs_cluster_name" {
  description = "ECS cluster name"
  value       = module.ecs.cluster_name
}

output "ecs_cluster_arn" {
  description = "ECS cluster ARN"
  value       = module.ecs.cluster_arn
}

# Security Groups
output "security_groups" {
  description = "Security group IDs"
  value = {
    alb = module.security_groups.alb_security_group_id
    ecs = module.security_groups.ecs_security_group_id
  }
}

# DynamoDB Access Role
output "dynamodb_access_role_arn" {
  description = "DynamoDB access role ARN for ECS tasks"
  value       = module.dynamodb.dynamodb_access_role_arn
}

# Cognito Outputs
output "cognito_user_pool_id" {
  description = "Cognito User Pool ID"
  value       = module.cognito.user_pool_id
}

output "cognito_user_pool_arn" {
  description = "Cognito User Pool ARN"
  value       = module.cognito.user_pool_arn
}

output "cognito_web_client_id" {
  description = "Cognito User Pool Web Client ID"
  value       = module.cognito.web_client_id
}

output "cognito_identity_pool_id" {
  description = "Cognito Identity Pool ID"
  value       = module.cognito.identity_pool_id
}

output "cognito_hosted_ui_url" {
  description = "Cognito Hosted UI URL"
  value       = module.cognito.user_pool_hosted_ui_url
}

output "cognito_config" {
  description = "Cognito configuration for frontend"
  value       = module.cognito.cognito_config
}

# API Gateway Outputs
output "api_gateway_url" {
  description = "API Gateway invoke URL"
  value       = module.api_gateway.api_url
}

output "api_gateway_id" {
  description = "API Gateway REST API ID"
  value       = module.api_gateway.api_id
}

output "api_gateway_stage_name" {
  description = "API Gateway stage name"
  value       = module.api_gateway.api_stage_name
}

output "api_endpoints" {
  description = "API Gateway endpoint URLs"
  value = {
    base_url     = module.api_gateway.api_url
    products_url = module.api_gateway.products_endpoint
    cart_url     = module.api_gateway.cart_endpoint
    auth_url     = module.api_gateway.auth_endpoint
  }
}

output "api_gateway_config" {
  description = "Complete API Gateway configuration for frontend"
  value       = module.api_gateway.api_config
}

# Deployment Information
output "deployment_info" {
  description = "Deployment information"
  value = {
    region      = var.aws_region
    environment = var.environment
    project     = var.project_name
    deployed_at = timestamp()
  }
}