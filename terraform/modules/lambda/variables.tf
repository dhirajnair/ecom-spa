# General Configuration
variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
}

# Lambda Configuration
variable "product_service_image_uri" {
  description = "ECR image URI for product service"
  type        = string
}

variable "cart_service_image_uri" {
  description = "ECR image URI for cart service"
  type        = string
}

variable "frontend_image_uri" {
  description = "ECR image URI for frontend service"
  type        = string
}

variable "lambda_memory_size" {
  description = "Memory size for Lambda functions"
  type        = number
  default     = 512
}

variable "lambda_timeout" {
  description = "Timeout for Lambda functions in seconds"
  type        = number
  default     = 30
}

variable "lambda_architecture" {
  description = "Architecture for Lambda functions"
  type        = string
  default     = "x86_64"
  validation {
    condition     = contains(["x86_64", "arm64"], var.lambda_architecture)
    error_message = "Architecture must be either x86_64 or arm64."
  }
}

# Environment Variables
variable "jwt_secret_key" {
  description = "JWT secret key for authentication"
  type        = string
  sensitive   = true
}

variable "aws_region" {
  description = "AWS region"
  type        = string
}

variable "products_table_name" {
  description = "DynamoDB products table name"
  type        = string
}

variable "carts_table_name" {
  description = "DynamoDB carts table name"
  type        = string
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

# VPC Configuration (optional for Lambda)
variable "vpc_id" {
  description = "VPC ID for Lambda functions"
  type        = string
  default     = null
}

variable "private_subnet_ids" {
  description = "Private subnet IDs for Lambda functions"
  type        = list(string)
  default     = []
}

variable "lambda_security_group_id" {
  description = "Security group ID for Lambda functions"
  type        = string
  default     = null
}

# Auto Scaling (for provisioned concurrency)
variable "enable_provisioned_concurrency" {
  description = "Enable provisioned concurrency for Lambda functions"
  type        = bool
  default     = false
}

variable "provisioned_concurrency_config" {
  description = "Provisioned concurrency configuration"
  type = object({
    product_service = number
    cart_service    = number
    frontend        = number
  })
  default = {
    product_service = 0
    cart_service    = 0
    frontend        = 0
  }
}
