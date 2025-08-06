variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "stage_name" {
  description = "API Gateway stage name"
  type        = string
  default     = "prod"
}

# Cognito Configuration
variable "cognito_user_pool_id" {
  description = "Cognito User Pool ID for authorization"
  type        = string
}

variable "cognito_user_pool_arn" {
  description = "Cognito User Pool ARN for authorization"
  type        = string
}

# ALB Configuration for backend services
variable "alb_arn" {
  description = "ALB ARN for VPC Link connection"
  type        = string
}

variable "alb_dns_name" {
  description = "ALB DNS name for backend services"
  type        = string
}

variable "alb_zone_id" {
  description = "ALB hosted zone ID"
  type        = string
}

# VPC Configuration (for VPC Link if needed)
variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "private_subnet_ids" {
  description = "Private subnet IDs for VPC Link"
  type        = list(string)
}

# Service Configuration
variable "product_service_url" {
  description = "Product service URL path"
  type        = string
  default     = "/api/products"
}

variable "cart_service_url" {
  description = "Cart service URL path"
  type        = string
  default     = "/api/cart"
}

# Optional: Custom domain
variable "domain_name" {
  description = "Custom domain name for API Gateway"
  type        = string
  default     = ""
}

variable "certificate_arn" {
  description = "ACM certificate ARN for custom domain"
  type        = string
  default     = ""
}

# CORS Configuration
variable "cors_allow_origins" {
  description = "CORS allowed origins"
  type        = list(string)
  default     = ["*"]
}

variable "cors_allow_methods" {
  description = "CORS allowed methods"
  type        = list(string)
  default     = ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"]
}

variable "cors_allow_headers" {
  description = "CORS allowed headers"
  type        = list(string)
  default     = ["Content-Type", "X-Amz-Date", "Authorization", "X-Api-Key", "X-Amz-Security-Token"]
}

# Throttling Configuration
variable "throttle_rate_limit" {
  description = "API Gateway throttle rate limit (requests per second)"
  type        = number
  default     = 1000
}

variable "throttle_burst_limit" {
  description = "API Gateway throttle burst limit"
  type        = number
  default     = 2000
}
