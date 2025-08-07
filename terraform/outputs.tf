# DynamoDB Outputs
output "dynamodb_table_names" {
  description = "DynamoDB table names"
  value       = module.dynamodb.table_names
}

output "dynamodb_table_arns" {
  description = "DynamoDB table ARNs"
  value       = module.dynamodb.table_arns
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