# Project Configuration
variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "ecom-spa"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "dev"
}

# AWS Configuration
variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-west-2"
}

# Note: VPC not needed for serverless Lambda architecture
# Keeping variable commented for future use if needed
# variable "vpc_cidr" {
#   description = "CIDR block for VPC"
#   type        = string
#   default     = "10.0.0.0/16"
# }

# DynamoDB Configuration
variable "dynamodb_billing_mode" {
  description = "DynamoDB billing mode"
  type        = string
  default     = "PAY_PER_REQUEST"
}

variable "enable_point_in_time_recovery" {
  description = "Enable point-in-time recovery for DynamoDB tables"
  type        = bool
  default     = true
}

variable "dynamodb_deletion_protection" {
  description = "Enable deletion protection for DynamoDB tables"
  type        = bool
  default     = false
}

# Application Configuration
variable "jwt_secret_key" {
  description = "JWT secret key for authentication"
  type        = string
  sensitive   = true
  default     = "change-this-in-production-use-secrets-manager"
}

# Lambda Configuration
variable "lambda_memory_size" {
  description = "Memory size for Lambda functions (MB)"
  type        = number
  default     = 512
}

variable "lambda_timeout" {
  description = "Timeout for Lambda functions (seconds)"
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

# Provisioned Concurrency (optional)
variable "enable_provisioned_concurrency" {
  description = "Enable provisioned concurrency for Lambda functions"
  type        = bool
  default     = false
}

# Domain Configuration (optional)
variable "domain_name" {
  description = "Domain name for the application"
  type        = string
  default     = ""
}

variable "certificate_arn" {
  description = "ACM certificate ARN for HTTPS"
  type        = string
  default     = ""
}

# Cognito Configuration
variable "cognito_domain_prefix" {
  description = "Domain prefix for Cognito hosted UI (must be unique across AWS)"
  type        = string
  default     = null
}

variable "frontend_domain" {
  description = "Frontend domain for Cognito callback URLs"
  type        = string
  default     = "http://localhost:3001"
}


variable "cognito_password_policy" {
  description = "Password policy configuration for Cognito User Pool"
  type = object({
    minimum_length    = number
    require_lowercase = bool
    require_numbers   = bool
    require_symbols   = bool
    require_uppercase = bool
  })
  default = {
    minimum_length    = 8
    require_lowercase = true
    require_numbers   = true
    require_symbols   = false
    require_uppercase = true
  }
}

variable "cognito_mfa_configuration" {
  description = "MFA configuration for Cognito User Pool"
  type        = string
  default     = "OPTIONAL"
  validation {
    condition     = contains(["OFF", "ON", "OPTIONAL"], var.cognito_mfa_configuration)
    error_message = "MFA configuration must be OFF, ON, or OPTIONAL."
  }
}

variable "enable_cognito_domain" {
  description = "Enable Cognito hosted UI domain"
  type        = bool
  default     = true
}

# API Gateway Configuration
variable "api_gateway_stage_name" {
  description = "API Gateway stage name"
  type        = string
  default     = "prod"
}

variable "api_gateway_domain_name" {
  description = "Custom domain name for API Gateway"
  type        = string
  default     = ""
}

variable "api_gateway_certificate_arn" {
  description = "ACM certificate ARN for API Gateway custom domain"
  type        = string
  default     = ""
}

variable "api_gateway_cors_origins" {
  description = "CORS allowed origins for API Gateway"
  type        = list(string)
  default     = ["*"]
}

# DynamoDB Seeding Configuration
variable "enable_product_seeding" {
  description = "Enable automatic seeding of sample products (only if table is empty)"
  type        = bool
  default     = true
}

variable "force_reseed_products" {
  description = "Force re-seeding of products table (WARNING: will delete existing data)"
  type        = bool
  default     = false
}