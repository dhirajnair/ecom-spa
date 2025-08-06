variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "ecs_cluster_id" {
  description = "ECS cluster ID"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "private_subnet_ids" {
  description = "Private subnet IDs"
  type        = list(string)
}

variable "ecs_security_group_id" {
  description = "ECS security group ID"
  type        = string
}

variable "alb_target_group_arns" {
  description = "ALB target group ARNs"
  type = object({
    product_service = string
    cart_service    = string
    frontend        = string
  })
}

variable "alb_listener_arns" {
  description = "ALB listener ARNs"
  type = object({
    http = string
  })
}

# Container Images
variable "product_service_image" {
  description = "Product service container image"
  type        = string
}

variable "cart_service_image" {
  description = "Cart service container image"
  type        = string
}

variable "frontend_image" {
  description = "Frontend container image"
  type        = string
}

# DynamoDB Configuration
variable "products_table_name" {
  description = "Products DynamoDB table name"
  type        = string
}

variable "carts_table_name" {
  description = "Carts DynamoDB table name"
  type        = string
}

variable "dynamodb_access_role_arn" {
  description = "DynamoDB access role ARN"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
}

# Application Configuration
variable "jwt_secret_key" {
  description = "JWT secret key"
  type        = string
  sensitive   = true
}

# Cognito Configuration
variable "cognito_user_pool_id" {
  description = "Cognito User Pool ID"
  type        = string
}

variable "cognito_web_client_id" {
  description = "Cognito Web Client ID"
  type        = string
}

variable "cognito_api_client_id" {
  description = "Cognito API Client ID"
  type        = string
}

variable "cognito_identity_pool_id" {
  description = "Cognito Identity Pool ID"
  type        = string
}