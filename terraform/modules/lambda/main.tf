# IAM Role for Lambda Functions
resource "aws_iam_role" "lambda_execution_role" {
  name = "${var.project_name}-${var.environment}-lambda-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "${var.project_name}-${var.environment}-lambda-execution-role"
  }
}

# Basic Lambda execution policy
resource "aws_iam_role_policy_attachment" "lambda_basic_execution" {
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
  role       = aws_iam_role.lambda_execution_role.name
}

# VPC execution policy (if VPC is configured)
resource "aws_iam_role_policy_attachment" "lambda_vpc_execution" {
  count      = var.vpc_id != null ? 1 : 0
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
  role       = aws_iam_role.lambda_execution_role.name
}

# DynamoDB access policy
resource "aws_iam_role_policy" "lambda_dynamodb_policy" {
  name = "${var.project_name}-${var.environment}-lambda-dynamodb-policy"
  role = aws_iam_role.lambda_execution_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan",
          "dynamodb:BatchGetItem",
          "dynamodb:BatchWriteItem"
        ]
        Resource = [
          "arn:aws:dynamodb:${var.aws_region}:*:table/${var.products_table_name}",
          "arn:aws:dynamodb:${var.aws_region}:*:table/${var.carts_table_name}",
          "arn:aws:dynamodb:${var.aws_region}:*:table/${var.products_table_name}/*",
          "arn:aws:dynamodb:${var.aws_region}:*:table/${var.carts_table_name}/*"
        ]
      }
    ]
  })
}

# Product Service Lambda Function
resource "aws_lambda_function" "product_service" {
  function_name = "${var.project_name}-${var.environment}-product-service"
  role         = aws_iam_role.lambda_execution_role.arn
  
  package_type = "Image"
  image_uri    = var.product_service_image_uri
  
  memory_size = var.lambda_memory_size
  timeout     = var.lambda_timeout
  architectures = [var.lambda_architecture]

  environment {
    variables = {
      ENV                    = var.environment
      AWS_REGION            = var.aws_region
      DYNAMODB_ENDPOINT     = ""  # Use default AWS DynamoDB
      PRODUCTS_TABLE_NAME   = var.products_table_name
      USE_COGNITO_AUTH      = "true"
      COGNITO_USER_POOL_ID  = var.cognito_user_pool_id
      COGNITO_WEB_CLIENT_ID = var.cognito_web_client_id
      JWT_SECRET_KEY        = var.jwt_secret_key
    }
  }

  # VPC configuration (optional)
  dynamic "vpc_config" {
    for_each = var.vpc_id != null ? [1] : []
    content {
      subnet_ids         = var.private_subnet_ids
      security_group_ids = [var.lambda_security_group_id]
    }
  }

  # Dead letter queue (optional)
  dead_letter_config {
    target_arn = aws_sqs_queue.lambda_dlq.arn
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-product-service"
  }

  depends_on = [
    aws_iam_role_policy_attachment.lambda_basic_execution,
    aws_iam_role_policy.lambda_dynamodb_policy
  ]
}

# Cart Service Lambda Function
resource "aws_lambda_function" "cart_service" {
  function_name = "${var.project_name}-${var.environment}-cart-service"
  role         = aws_iam_role.lambda_execution_role.arn
  
  package_type = "Image"
  image_uri    = var.cart_service_image_uri
  
  memory_size = var.lambda_memory_size
  timeout     = var.lambda_timeout
  architectures = [var.lambda_architecture]

  environment {
    variables = {
      ENV                     = var.environment
      AWS_REGION             = var.aws_region
      DYNAMODB_ENDPOINT      = ""  # Use default AWS DynamoDB
      CARTS_TABLE_NAME       = var.carts_table_name
      PRODUCTS_TABLE_NAME    = var.products_table_name
      USE_COGNITO_AUTH       = "true"
      COGNITO_USER_POOL_ID   = var.cognito_user_pool_id
      COGNITO_WEB_CLIENT_ID  = var.cognito_web_client_id
      COGNITO_API_CLIENT_ID  = var.cognito_api_client_id
      JWT_SECRET_KEY         = var.jwt_secret_key
      PRODUCT_SERVICE_URL    = "internal"  # Will be handled by API Gateway
    }
  }

  # VPC configuration (optional)
  dynamic "vpc_config" {
    for_each = var.vpc_id != null ? [1] : []
    content {
      subnet_ids         = var.private_subnet_ids
      security_group_ids = [var.lambda_security_group_id]
    }
  }

  # Dead letter queue (optional)
  dead_letter_config {
    target_arn = aws_sqs_queue.lambda_dlq.arn
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-cart-service"
  }

  depends_on = [
    aws_iam_role_policy_attachment.lambda_basic_execution,
    aws_iam_role_policy.lambda_dynamodb_policy
  ]
}

# Frontend Lambda Function
resource "aws_lambda_function" "frontend" {
  function_name = "${var.project_name}-${var.environment}-frontend"
  role         = aws_iam_role.lambda_execution_role.arn
  
  package_type = "Image"
  image_uri    = var.frontend_image_uri
  
  memory_size = var.lambda_memory_size
  timeout     = var.lambda_timeout
  architectures = [var.lambda_architecture]

  environment {
    variables = {
      ENV                           = var.environment
      AWS_REGION                   = var.aws_region
      REACT_APP_USE_COGNITO_AUTH   = "true"
      REACT_APP_USER_POOL_ID       = var.cognito_user_pool_id
      REACT_APP_USER_POOL_WEB_CLIENT_ID = var.cognito_web_client_id
    }
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-frontend"
  }

  depends_on = [
    aws_iam_role_policy_attachment.lambda_basic_execution
  ]
}

# Dead Letter Queue for Lambda functions
resource "aws_sqs_queue" "lambda_dlq" {
  name = "${var.project_name}-${var.environment}-lambda-dlq"

  message_retention_seconds = 1209600  # 14 days

  tags = {
    Name = "${var.project_name}-${var.environment}-lambda-dlq"
  }
}

# Lambda Aliases for versioning
resource "aws_lambda_alias" "product_service_live" {
  name             = "live"
  description      = "Live alias for product service"
  function_name    = aws_lambda_function.product_service.function_name
  function_version = "$LATEST"
}

resource "aws_lambda_alias" "cart_service_live" {
  name             = "live"
  description      = "Live alias for cart service"
  function_name    = aws_lambda_function.cart_service.function_name
  function_version = "$LATEST"
}

resource "aws_lambda_alias" "frontend_live" {
  name             = "live"
  description      = "Live alias for frontend"
  function_name    = aws_lambda_function.frontend.function_name
  function_version = "$LATEST"
}

# Provisioned Concurrency (optional, for better cold start performance)
resource "aws_lambda_provisioned_concurrency_config" "product_service" {
  count                             = var.enable_provisioned_concurrency && var.provisioned_concurrency_config.product_service > 0 ? 1 : 0
  function_name                     = aws_lambda_function.product_service.function_name
  provisioned_concurrent_executions = var.provisioned_concurrency_config.product_service
  qualifier                         = aws_lambda_alias.product_service_live.name
}

resource "aws_lambda_provisioned_concurrency_config" "cart_service" {
  count                             = var.enable_provisioned_concurrency && var.provisioned_concurrency_config.cart_service > 0 ? 1 : 0
  function_name                     = aws_lambda_function.cart_service.function_name
  provisioned_concurrent_executions = var.provisioned_concurrency_config.cart_service
  qualifier                         = aws_lambda_alias.cart_service_live.name
}

resource "aws_lambda_provisioned_concurrency_config" "frontend" {
  count                             = var.enable_provisioned_concurrency && var.provisioned_concurrency_config.frontend > 0 ? 1 : 0
  function_name                     = aws_lambda_function.frontend.function_name
  provisioned_concurrent_executions = var.provisioned_concurrency_config.frontend
  qualifier                         = aws_lambda_alias.frontend_live.name
}

# CloudWatch Log Groups with retention policy
resource "aws_cloudwatch_log_group" "product_service" {
  name              = "/aws/lambda/${aws_lambda_function.product_service.function_name}"
  retention_in_days = 14

  tags = {
    Name = "${var.project_name}-${var.environment}-product-service-logs"
  }
}

resource "aws_cloudwatch_log_group" "cart_service" {
  name              = "/aws/lambda/${aws_lambda_function.cart_service.function_name}"
  retention_in_days = 14

  tags = {
    Name = "${var.project_name}-${var.environment}-cart-service-logs"
  }
}

resource "aws_cloudwatch_log_group" "frontend" {
  name              = "/aws/lambda/${aws_lambda_function.frontend.function_name}"
  retention_in_days = 14

  tags = {
    Name = "${var.project_name}-${var.environment}-frontend-logs"
  }
}
