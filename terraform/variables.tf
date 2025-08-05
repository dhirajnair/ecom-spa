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

# Networking
variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

# Database Configuration
variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "db_allocated_storage" {
  description = "Allocated storage for RDS instance (GB)"
  type        = number
  default     = 20
}

variable "db_username" {
  description = "Database username"
  type        = string
  default     = "ecom"
}

# Application Configuration
variable "jwt_secret_key" {
  description = "JWT secret key for authentication"
  type        = string
  sensitive   = true
  default     = "change-this-in-production-use-secrets-manager"
}

# ECS Configuration
variable "product_service_cpu" {
  description = "CPU units for product service"
  type        = number
  default     = 256
}

variable "product_service_memory" {
  description = "Memory for product service (MB)"
  type        = number
  default     = 512
}

variable "cart_service_cpu" {
  description = "CPU units for cart service"
  type        = number
  default     = 256
}

variable "cart_service_memory" {
  description = "Memory for cart service (MB)"
  type        = number
  default     = 512
}

variable "frontend_cpu" {
  description = "CPU units for frontend"
  type        = number
  default     = 256
}

variable "frontend_memory" {
  description = "Memory for frontend (MB)"
  type        = number
  default     = 512
}

# Auto Scaling
variable "min_capacity" {
  description = "Minimum number of tasks"
  type        = number
  default     = 1
}

variable "max_capacity" {
  description = "Maximum number of tasks"
  type        = number
  default     = 10
}

variable "desired_capacity" {
  description = "Desired number of tasks"
  type        = number
  default     = 2
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