output "user_pool_id" {
  description = "ID of the Cognito User Pool"
  value       = aws_cognito_user_pool.main.id
}

output "user_pool_arn" {
  description = "ARN of the Cognito User Pool"
  value       = aws_cognito_user_pool.main.arn
}

output "user_pool_endpoint" {
  description = "Endpoint of the Cognito User Pool"
  value       = aws_cognito_user_pool.main.endpoint
}

output "user_pool_domain" {
  description = "Domain of the Cognito User Pool"
  value       = var.enable_user_pool_domain ? aws_cognito_user_pool_domain.main[0].domain : null
}

output "user_pool_hosted_ui_url" {
  description = "Hosted UI URL of the Cognito User Pool"
  value = var.enable_user_pool_domain ? "https://${aws_cognito_user_pool_domain.main[0].domain}.auth.${data.aws_region.current.name}.amazoncognito.com" : null
}

output "web_client_id" {
  description = "ID of the Cognito User Pool Web Client"
  value       = aws_cognito_user_pool_client.web_client.id
}

output "web_client_secret" {
  description = "Secret of the Cognito User Pool Web Client"
  value       = aws_cognito_user_pool_client.web_client.client_secret
  sensitive   = true
}

output "api_client_id" {
  description = "ID of the Cognito User Pool API Client"
  value       = aws_cognito_user_pool_client.api_client.id
}

output "api_client_secret" {
  description = "Secret of the Cognito User Pool API Client"
  value       = aws_cognito_user_pool_client.api_client.client_secret
  sensitive   = true
}

output "identity_pool_id" {
  description = "ID of the Cognito Identity Pool"
  value       = aws_cognito_identity_pool.main.id
}

output "identity_pool_arn" {
  description = "ARN of the Cognito Identity Pool"
  value       = aws_cognito_identity_pool.main.arn
}

output "authenticated_role_arn" {
  description = "ARN of the IAM role for authenticated users"
  value       = aws_iam_role.authenticated.arn
}

output "unauthenticated_role_arn" {
  description = "ARN of the IAM role for unauthenticated users"
  value       = aws_iam_role.unauthenticated.arn
}

# Additional outputs for frontend configuration
output "cognito_config" {
  description = "Cognito configuration for frontend"
  value = {
    region                = data.aws_region.current.name
    userPoolId           = aws_cognito_user_pool.main.id
    userPoolWebClientId  = aws_cognito_user_pool_client.web_client.id
    identityPoolId       = aws_cognito_identity_pool.main.id
    domain               = var.enable_user_pool_domain ? aws_cognito_user_pool_domain.main[0].domain : null
    hostedUIUrl          = var.enable_user_pool_domain ? "https://${aws_cognito_user_pool_domain.main[0].domain}.auth.${data.aws_region.current.name}.amazoncognito.com" : null
  }
}

# Data source for current AWS region
data "aws_region" "current" {}

# Environment variables for backend services
output "backend_environment_vars" {
  description = "Environment variables for backend services"
  value = {
    COGNITO_USER_POOL_ID        = aws_cognito_user_pool.main.id
    COGNITO_USER_POOL_REGION    = data.aws_region.current.name
    COGNITO_WEB_CLIENT_ID       = aws_cognito_user_pool_client.web_client.id
    COGNITO_API_CLIENT_ID       = aws_cognito_user_pool_client.api_client.id
    COGNITO_IDENTITY_POOL_ID    = aws_cognito_identity_pool.main.id
  }
  sensitive = false
}

# Sensitive environment variables for backend services  
output "backend_sensitive_vars" {
  description = "Sensitive environment variables for backend services"
  value = {
    COGNITO_API_CLIENT_SECRET = aws_cognito_user_pool_client.api_client.client_secret
  }
  sensitive = true
}
