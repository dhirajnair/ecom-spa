variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "domain_prefix" {
  description = "Domain prefix for Cognito hosted UI"
  type        = string
  default     = null
}

variable "frontend_domain" {
  description = "Frontend domain for callback URLs"
  type        = string
  default     = "http://localhost:3000"
}

variable "stage_name" {
  description = "API Gateway stage name used in Hosted UI URLs (e.g., dev, prod)"
  type        = string
  default     = "dev"
}

variable "api_domain" {
  description = "API domain for CORS"
  type        = string
  default     = "http://localhost:3001"
}

variable "password_policy" {
  description = "Password policy configuration"
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

variable "auto_verified_attributes" {
  description = "Attributes to be auto-verified"
  type        = list(string)
  default     = ["email"]
}

variable "username_attributes" {
  description = "Attributes used as username"
  type        = list(string)
  default     = ["email"]
}

variable "mfa_configuration" {
  description = "MFA configuration"
  type        = string
  default     = "OPTIONAL"
  validation {
    condition     = contains(["OFF", "ON", "OPTIONAL"], var.mfa_configuration)
    error_message = "MFA configuration must be OFF, ON, or OPTIONAL."
  }
}

variable "enable_user_pool_domain" {
  description = "Enable Cognito User Pool domain"
  type        = bool
  default     = true
}

variable "schema_attributes" {
  description = "Custom schema attributes"
  type = list(object({
    name                     = string
    attribute_data_type      = string
    required                 = bool
    mutable                  = bool
    developer_only_attribute = bool
  }))
  default = []
}
