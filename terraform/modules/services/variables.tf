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

# Database Configuration
variable "db_host" {
  description = "Database host"
  type        = string
}

variable "db_port" {
  description = "Database port"
  type        = number
}

variable "db_username" {
  description = "Database username"
  type        = string
}

variable "db_password" {
  description = "Database password"
  type        = string
  sensitive   = true
}

# Application Configuration
variable "jwt_secret_key" {
  description = "JWT secret key"
  type        = string
  sensitive   = true
}