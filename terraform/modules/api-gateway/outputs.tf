output "api_id" {
  description = "API Gateway REST API ID"
  value       = aws_api_gateway_rest_api.main.id
}

output "api_arn" {
  description = "API Gateway REST API ARN"
  value       = aws_api_gateway_rest_api.main.arn
}

output "api_execution_arn" {
  description = "API Gateway REST API execution ARN"
  value       = aws_api_gateway_rest_api.main.execution_arn
}

output "api_url" {
  description = "API Gateway invoke URL"
  value       = aws_api_gateway_stage.main.invoke_url
}

output "api_stage_name" {
  description = "API Gateway stage name"
  value       = aws_api_gateway_stage.main.stage_name
}

# VPC Link and ALB not used in serverless Lambda architecture

output "cognito_authorizer_id" {
  description = "Cognito User Pool authorizer ID"
  value       = aws_api_gateway_authorizer.cognito.id
}

output "custom_domain_name" {
  description = "Custom domain name (if configured)"
  value       = var.domain_name != "" ? aws_api_gateway_domain_name.main[0].domain_name : null
}

output "custom_domain_cloudfront_domain" {
  description = "CloudFront domain for custom domain (if configured)"
  value       = var.domain_name != "" ? aws_api_gateway_domain_name.main[0].cloudfront_domain_name : null
}

output "custom_domain_cloudfront_zone_id" {
  description = "CloudFront zone ID for custom domain (if configured)"
  value       = var.domain_name != "" ? aws_api_gateway_domain_name.main[0].cloudfront_zone_id : null
}

# Endpoint URLs for different services
output "products_endpoint" {
  description = "Products API endpoint URL"
  value       = "${aws_api_gateway_stage.main.invoke_url}/api/products"
}

output "cart_endpoint" {
  description = "Cart API endpoint URL (requires Cognito auth)"
  value       = "${aws_api_gateway_stage.main.invoke_url}/api/cart"
}

output "auth_endpoint" {
  description = "Auth API endpoint URL"
  value       = "${aws_api_gateway_stage.main.invoke_url}/api/auth"
}

# Configuration for frontend
output "api_config" {
  description = "API Gateway configuration for frontend"
  value = {
    api_id       = aws_api_gateway_rest_api.main.id
    api_url      = aws_api_gateway_stage.main.invoke_url
    stage_name   = aws_api_gateway_stage.main.stage_name
    products_url = "${aws_api_gateway_stage.main.invoke_url}/api/products"
    cart_url     = "${aws_api_gateway_stage.main.invoke_url}/api/cart"
    auth_url     = "${aws_api_gateway_stage.main.invoke_url}/api/auth"
  }
}

# CloudWatch Log Group
output "log_group_name" {
  description = "CloudWatch log group name for API Gateway"
  value       = data.aws_cloudwatch_log_group.api_gateway.name
}

output "log_group_arn" {
  description = "CloudWatch log group ARN for API Gateway"
  value       = data.aws_cloudwatch_log_group.api_gateway.arn
}
