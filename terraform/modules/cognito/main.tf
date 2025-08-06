# Random ID for unique naming
resource "random_id" "cognito_suffix" {
  byte_length = 4
}

# Cognito User Pool
resource "aws_cognito_user_pool" "main" {
  name = "${var.project_name}-${var.environment}-user-pool"

  # Username configuration
  username_attributes      = var.username_attributes
  auto_verified_attributes = var.auto_verified_attributes

  # Password policy
  password_policy {
    minimum_length    = var.password_policy.minimum_length
    require_lowercase = var.password_policy.require_lowercase
    require_numbers   = var.password_policy.require_numbers
    require_symbols   = var.password_policy.require_symbols
    require_uppercase = var.password_policy.require_uppercase
  }

  # MFA configuration
  mfa_configuration = var.mfa_configuration

  # Schema attributes
  dynamic "schema" {
    for_each = var.schema_attributes
    content {
      name                     = schema.value.name
      attribute_data_type      = schema.value.attribute_data_type
      required                 = schema.value.required
      mutable                  = schema.value.mutable
      developer_only_attribute = schema.value.developer_only_attribute
    }
  }

  # Default required attributes
  schema {
    name                = "email"
    attribute_data_type = "String"
    required            = true
    mutable             = true
  }

  schema {
    name                = "given_name"
    attribute_data_type = "String"
    required            = false
    mutable             = true
  }

  schema {
    name                = "family_name"
    attribute_data_type = "String"
    required            = false
    mutable             = true
  }

  # Email configuration
  email_configuration {
    email_sending_account = "COGNITO_DEFAULT"
  }

  # Admin create user configuration
  admin_create_user_config {
    allow_admin_create_user_only = false
  }

  # User pool add-ons
  user_pool_add_ons {
    advanced_security_mode = "ENFORCED"
  }

  # Account recovery
  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-user-pool"
    Environment = var.environment
    Project     = var.project_name
  }
}

# Cognito User Pool Domain
resource "aws_cognito_user_pool_domain" "main" {
  count  = var.enable_user_pool_domain ? 1 : 0
  domain = var.domain_prefix != null ? var.domain_prefix : "${var.project_name}-${var.environment}-${random_id.cognito_suffix.hex}"
  
  user_pool_id = aws_cognito_user_pool.main.id

  depends_on = [aws_cognito_user_pool.main]
}

# Cognito User Pool Client for Web App
resource "aws_cognito_user_pool_client" "web_client" {
  name         = "${var.project_name}-${var.environment}-web-client"
  user_pool_id = aws_cognito_user_pool.main.id

  # Client configuration
  generate_secret = false
  
  # OAuth configuration
  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_flows                  = ["code", "implicit"]
  allowed_oauth_scopes                 = ["email", "openid", "profile", "aws.cognito.signin.user.admin"]
  
  callback_urls = [
    "${var.frontend_domain}/auth/callback",
    "${var.frontend_domain}/",
    "http://localhost:3000/auth/callback",
    "http://localhost:3000/"
  ]
  
  logout_urls = [
    "${var.frontend_domain}/auth/logout",
    "${var.frontend_domain}/",
    "http://localhost:3000/auth/logout",
    "http://localhost:3000/"
  ]

  # Supported identity providers
  supported_identity_providers = ["COGNITO"]

  # Token validity
  access_token_validity  = 60   # 1 hour
  id_token_validity      = 60   # 1 hour
  refresh_token_validity = 30   # 30 days

  token_validity_units {
    access_token  = "minutes"
    id_token      = "minutes"
    refresh_token = "days"
  }

  # Explicit auth flows
  explicit_auth_flows = [
    "ALLOW_USER_SRP_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
    "ALLOW_USER_PASSWORD_AUTH"
  ]

  # Prevent user existence errors
  prevent_user_existence_errors = "ENABLED"

  # Read and write attributes
  read_attributes = [
    "email",
    "email_verified",
    "given_name",
    "family_name"
  ]

  write_attributes = [
    "email",
    "given_name",
    "family_name"
  ]
}

# Cognito User Pool Client for Backend API
resource "aws_cognito_user_pool_client" "api_client" {
  name         = "${var.project_name}-${var.environment}-api-client"
  user_pool_id = aws_cognito_user_pool.main.id

  # Client configuration for machine-to-machine communication
  generate_secret = true
  
  # OAuth configuration for client credentials flow
  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_flows                  = ["client_credentials"]
  allowed_oauth_scopes                 = ["aws.cognito.signin.user.admin"]

  # Token validity
  access_token_validity = 60   # 1 hour

  token_validity_units {
    access_token = "minutes"
  }

  # Explicit auth flows
  explicit_auth_flows = [
    "ALLOW_REFRESH_TOKEN_AUTH"
  ]

  # Prevent user existence errors
  prevent_user_existence_errors = "ENABLED"
}

# Cognito Identity Pool
resource "aws_cognito_identity_pool" "main" {
  identity_pool_name               = "${var.project_name}-${var.environment}-identity-pool"
  allow_unauthenticated_identities = false

  cognito_identity_providers {
    client_id               = aws_cognito_user_pool_client.web_client.id
    provider_name           = aws_cognito_user_pool.main.endpoint
    server_side_token_check = false
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-identity-pool"
    Environment = var.environment
    Project     = var.project_name
  }
}

# IAM role for authenticated users
resource "aws_iam_role" "authenticated" {
  name = "${var.project_name}-${var.environment}-cognito-authenticated"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRoleWithWebIdentity"
        Effect = "Allow"
        Principal = {
          Federated = "cognito-identity.amazonaws.com"
        }
        Condition = {
          StringEquals = {
            "cognito-identity.amazonaws.com:aud" = aws_cognito_identity_pool.main.id
          }
          "ForAnyValue:StringLike" = {
            "cognito-identity.amazonaws.com:amr" = "authenticated"
          }
        }
      }
    ]
  })

  tags = {
    Name        = "${var.project_name}-${var.environment}-cognito-authenticated"
    Environment = var.environment
    Project     = var.project_name
  }
}

# IAM policy for authenticated users
resource "aws_iam_role_policy" "authenticated" {
  name = "${var.project_name}-${var.environment}-cognito-authenticated-policy"
  role = aws_iam_role.authenticated.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "mobileanalytics:PutEvents",
          "cognito-sync:*",
          "cognito-identity:*"
        ]
        Resource = "*"
      }
    ]
  })
}

# IAM role for unauthenticated users
resource "aws_iam_role" "unauthenticated" {
  name = "${var.project_name}-${var.environment}-cognito-unauthenticated"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRoleWithWebIdentity"
        Effect = "Allow"
        Principal = {
          Federated = "cognito-identity.amazonaws.com"
        }
        Condition = {
          StringEquals = {
            "cognito-identity.amazonaws.com:aud" = aws_cognito_identity_pool.main.id
          }
          "ForAnyValue:StringLike" = {
            "cognito-identity.amazonaws.com:amr" = "unauthenticated"
          }
        }
      }
    ]
  })

  tags = {
    Name        = "${var.project_name}-${var.environment}-cognito-unauthenticated"
    Environment = var.environment
    Project     = var.project_name
  }
}

# IAM policy for unauthenticated users (minimal permissions)
resource "aws_iam_role_policy" "unauthenticated" {
  name = "${var.project_name}-${var.environment}-cognito-unauthenticated-policy"
  role = aws_iam_role.unauthenticated.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "mobileanalytics:PutEvents"
        ]
        Resource = "*"
      }
    ]
  })
}

# Attach roles to Identity Pool
resource "aws_cognito_identity_pool_roles_attachment" "main" {
  identity_pool_id = aws_cognito_identity_pool.main.id

  roles = {
    "authenticated"   = aws_iam_role.authenticated.arn
    "unauthenticated" = aws_iam_role.unauthenticated.arn
  }

  depends_on = [
    aws_cognito_identity_pool.main,
    aws_iam_role.authenticated,
    aws_iam_role.unauthenticated
  ]
}
