# API Gateway REST API
resource "aws_api_gateway_rest_api" "main" {
  name        = "${var.project_name}-${var.environment}-api"
  description = "API Gateway for ${var.project_name} ${var.environment} environment"

  endpoint_configuration {
    types = ["REGIONAL"]
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-api"
    Environment = var.environment
    Project     = var.project_name
  }
}

# Cognito User Pool Authorizer
resource "aws_api_gateway_authorizer" "cognito" {
  name          = "${var.project_name}-${var.environment}-cognito-auth"
  rest_api_id   = aws_api_gateway_rest_api.main.id
  type          = "COGNITO_USER_POOLS"
  provider_arns = [var.cognito_user_pool_arn]
}

# Lambda permissions for API Gateway
resource "aws_lambda_permission" "product_service_api_gateway" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = var.product_service_function_arn
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.main.execution_arn}/*/*"
}

resource "aws_lambda_permission" "cart_service_api_gateway" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = var.cart_service_function_arn
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.main.execution_arn}/*/*"
}

resource "aws_lambda_permission" "frontend_api_gateway" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = var.frontend_function_arn
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.main.execution_arn}/*/*"
}

# API Gateway Resources

# /api resource
resource "aws_api_gateway_resource" "api" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "api"
}

# /api/products resource (public endpoints)
resource "aws_api_gateway_resource" "products" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_resource.api.id
  path_part   = "products"
}

# /api/products/* proxy resource
resource "aws_api_gateway_resource" "products_proxy" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_resource.products.id
  path_part   = "{proxy+}"
}

# /api/cart resource (protected endpoints)
resource "aws_api_gateway_resource" "cart" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_resource.api.id
  path_part   = "cart"
}

# /api/cart/* proxy resource
resource "aws_api_gateway_resource" "cart_proxy" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_resource.cart.id
  path_part   = "{proxy+}"
}

# /api/auth resource (authentication endpoints)
resource "aws_api_gateway_resource" "auth" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_resource.api.id
  path_part   = "auth"
}

# /api/auth/* proxy resource
resource "aws_api_gateway_resource" "auth_proxy" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_resource.auth.id
  path_part   = "{proxy+}"
}

# /api/health resource (health checks)
resource "aws_api_gateway_resource" "health" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_resource.api.id
  path_part   = "health"
}

# Methods for Products (Public - No Auth Required)

# ANY /api/products
resource "aws_api_gateway_method" "products_any" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.products.id
  http_method   = "ANY"
  authorization = "NONE"
}

# ANY /api/products/{proxy+}
resource "aws_api_gateway_method" "products_proxy_any" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.products_proxy.id
  http_method   = "ANY"
  authorization = "NONE"

  request_parameters = {
    "method.request.path.proxy" = true
  }
}

# Methods for Cart (Protected - Cognito Auth Required)

# OPTIONS /api/cart (for CORS)
resource "aws_api_gateway_method" "cart_options" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.cart.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

# ANY /api/cart (with Cognito auth)
resource "aws_api_gateway_method" "cart_any" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.cart.id
  http_method   = "ANY"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id
}

# ANY /api/cart/{proxy+} (with Cognito auth)
resource "aws_api_gateway_method" "cart_proxy_any" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.cart_proxy.id
  http_method   = "ANY"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id

  request_parameters = {
    "method.request.path.proxy" = true
  }
}

# OPTIONS /api/cart/{proxy+} (for CORS)
resource "aws_api_gateway_method" "cart_proxy_options" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.cart_proxy.id
  http_method   = "OPTIONS"
  authorization = "NONE"

  request_parameters = {
    "method.request.path.proxy" = true
  }
}

# Methods for Auth (Public - No Auth Required)

# ANY /api/auth/{proxy+}
resource "aws_api_gateway_method" "auth_proxy_any" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.auth_proxy.id
  http_method   = "ANY"
  authorization = "NONE"

  request_parameters = {
    "method.request.path.proxy" = true
  }
}

# GET /api/health (health check endpoint)
resource "aws_api_gateway_method" "health_get" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.health.id
  http_method   = "GET"
  authorization = "NONE"
}

# Frontend root resource (catch-all for SPA)
resource "aws_api_gateway_method" "root_any" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_rest_api.main.root_resource_id
  http_method   = "ANY"
  authorization = "NONE"
}

# Frontend proxy resource (catch-all for SPA routes)
resource "aws_api_gateway_resource" "frontend_proxy" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "{proxy+}"
}

resource "aws_api_gateway_method" "frontend_proxy_any" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.frontend_proxy.id
  http_method   = "ANY"
  authorization = "NONE"

  request_parameters = {
    "method.request.path.proxy" = true
  }
}

# Lambda Integrations

# Products integration (to product service Lambda)
resource "aws_api_gateway_integration" "products_any" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.products.id
  http_method = aws_api_gateway_method.products_any.http_method

  type                    = "AWS_PROXY"
  integration_http_method = "POST"
  uri                     = var.product_service_invoke_arn
}

resource "aws_api_gateway_integration" "products_proxy_any" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.products_proxy.id
  http_method = aws_api_gateway_method.products_proxy_any.http_method

  type                    = "AWS_PROXY"
  integration_http_method = "POST"
  uri                     = var.product_service_invoke_arn
}

# Cart integrations (to cart service Lambda)
resource "aws_api_gateway_integration" "cart_options" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.cart.id
  http_method = aws_api_gateway_method.cart_options.http_method

  type = "MOCK"
  request_templates = {
    "application/json" = jsonencode({
      statusCode = 200
    })
  }
}

resource "aws_api_gateway_integration" "cart_any" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.cart.id
  http_method = aws_api_gateway_method.cart_any.http_method

  type                    = "AWS_PROXY"
  integration_http_method = "POST"
  uri                     = var.cart_service_invoke_arn
}

resource "aws_api_gateway_integration" "cart_proxy_any" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.cart_proxy.id
  http_method = aws_api_gateway_method.cart_proxy_any.http_method

  type                    = "AWS_PROXY"
  integration_http_method = "POST"
  uri                     = var.cart_service_invoke_arn
}

resource "aws_api_gateway_integration" "cart_proxy_options" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.cart_proxy.id
  http_method = aws_api_gateway_method.cart_proxy_options.http_method

  type = "MOCK"
  request_templates = {
    "application/json" = jsonencode({
      statusCode = 200
    })
  }
}

# Auth integration (to cart service Lambda for login endpoint)
resource "aws_api_gateway_integration" "auth_proxy_any" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.auth_proxy.id
  http_method = aws_api_gateway_method.auth_proxy_any.http_method

  type                    = "AWS_PROXY"
  integration_http_method = "POST"
  uri                     = var.cart_service_invoke_arn
}

# Health check integration (to product service Lambda)
resource "aws_api_gateway_integration" "health_get" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.health.id
  http_method = aws_api_gateway_method.health_get.http_method

  type                    = "AWS_PROXY"
  integration_http_method = "POST"
  uri                     = var.product_service_invoke_arn
}

# Frontend integrations (to frontend Lambda)
resource "aws_api_gateway_integration" "root_any" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_rest_api.main.root_resource_id
  http_method = aws_api_gateway_method.root_any.http_method

  type                    = "AWS_PROXY"
  integration_http_method = "POST"
  uri                     = var.frontend_invoke_arn
}

resource "aws_api_gateway_integration" "frontend_proxy_any" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.frontend_proxy.id
  http_method = aws_api_gateway_method.frontend_proxy_any.http_method

  type                    = "AWS_PROXY"
  integration_http_method = "POST"
  uri                     = var.frontend_invoke_arn
}

# CORS Method Responses
resource "aws_api_gateway_method_response" "cart_options" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.cart.id
  http_method = aws_api_gateway_method.cart_options.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_method_response" "cart_proxy_options" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.cart_proxy.id
  http_method = aws_api_gateway_method.cart_proxy_options.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

# CORS Integration Responses
resource "aws_api_gateway_integration_response" "cart_options" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.cart.id
  http_method = aws_api_gateway_method.cart_options.http_method
  status_code = aws_api_gateway_method_response.cart_options.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'${join(",", var.cors_allow_headers)}'"
    "method.response.header.Access-Control-Allow-Methods" = "'${join(",", var.cors_allow_methods)}'"
    "method.response.header.Access-Control-Allow-Origin"  = "'${join(",", var.cors_allow_origins)}'"
  }

  depends_on = [aws_api_gateway_integration.cart_options]
}

resource "aws_api_gateway_integration_response" "cart_proxy_options" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.cart_proxy.id
  http_method = aws_api_gateway_method.cart_proxy_options.http_method
  status_code = aws_api_gateway_method_response.cart_proxy_options.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'${join(",", var.cors_allow_headers)}'"
    "method.response.header.Access-Control-Allow-Methods" = "'${join(",", var.cors_allow_methods)}'"
    "method.response.header.Access-Control-Allow-Origin"  = "'${join(",", var.cors_allow_origins)}'"
  }

  depends_on = [aws_api_gateway_integration.cart_proxy_options]
}

# API Gateway Deployment
resource "aws_api_gateway_deployment" "main" {
  rest_api_id = aws_api_gateway_rest_api.main.id

  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_resource.api.id,
      aws_api_gateway_resource.products.id,
      aws_api_gateway_resource.products_proxy.id,
      aws_api_gateway_resource.cart.id,
      aws_api_gateway_resource.cart_proxy.id,
      aws_api_gateway_resource.auth.id,
      aws_api_gateway_resource.auth_proxy.id,
      aws_api_gateway_resource.health.id,
      aws_api_gateway_method.products_any.id,
      aws_api_gateway_method.products_proxy_any.id,
      aws_api_gateway_method.cart_any.id,
      aws_api_gateway_method.cart_proxy_any.id,
      aws_api_gateway_method.cart_options.id,
      aws_api_gateway_method.cart_proxy_options.id,
      aws_api_gateway_method.auth_proxy_any.id,
      aws_api_gateway_method.health_get.id,
      aws_api_gateway_integration.products_any.id,
      aws_api_gateway_integration.products_proxy_any.id,
      aws_api_gateway_integration.cart_any.id,
      aws_api_gateway_integration.cart_proxy_any.id,
      aws_api_gateway_integration.cart_options.id,
      aws_api_gateway_integration.cart_proxy_options.id,
      aws_api_gateway_integration.auth_proxy_any.id,
      aws_api_gateway_integration.health_get.id,
    ]))
  }

  lifecycle {
    create_before_destroy = true
  }
}

# API Gateway Stage
resource "aws_api_gateway_stage" "main" {
  deployment_id = aws_api_gateway_deployment.main.id
  rest_api_id   = aws_api_gateway_rest_api.main.id
  stage_name    = var.stage_name

  # Throttling will be configured via method settings if needed

  # Enable access logging
  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gateway.arn
    format = jsonencode({
      requestId      = "$context.requestId"
      ip             = "$context.identity.sourceIp"
      caller         = "$context.identity.caller"
      user           = "$context.identity.user"
      requestTime    = "$context.requestTime"
      httpMethod     = "$context.httpMethod"
      resourcePath   = "$context.resourcePath"
      status         = "$context.status"
      protocol       = "$context.protocol"
      responseLength = "$context.responseLength"
      error          = "$context.error.message"
      integrationError = "$context.integrationErrorMessage"
    })
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-api-stage"
    Environment = var.environment
    Project     = var.project_name
  }

  depends_on = [
    aws_api_gateway_account.account,
    aws_iam_role_policy.apigw_cloudwatch_policy
  ]
}

# CloudWatch Log Group for API Gateway
resource "aws_cloudwatch_log_group" "api_gateway" {
  name              = "/aws/apigateway/${var.project_name}-${var.environment}"
  retention_in_days = 14

  tags = {
    Name        = "${var.project_name}-${var.environment}-api-gateway-logs"
    Environment = var.environment
    Project     = var.project_name
  }
}

# IAM role for API Gateway to write CloudWatch Logs
resource "aws_iam_role" "apigw_cloudwatch_role" {
  name = "${var.project_name}-${var.environment}-apigw-cw-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Principal = {
          Service = "apigateway.amazonaws.com"
        },
        Action = "sts:AssumeRole"
      }
    ]
  })
}

resource "aws_iam_role_policy" "apigw_cloudwatch_policy" {
  name = "${var.project_name}-${var.environment}-apigw-cw-policy"
  role = aws_iam_role.apigw_cloudwatch_role.id

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams",
          "logs:PutLogEvents",
          "logs:GetLogEvents",
          "logs:FilterLogEvents",
          "logs:PutRetentionPolicy"
        ],
        Resource = "*"
      }
    ]
  })
}

# Link API Gateway account to CloudWatch role to enable access logging
resource "aws_api_gateway_account" "account" {
  cloudwatch_role_arn = aws_iam_role.apigw_cloudwatch_role.arn
}

# Custom Domain (optional)
resource "aws_api_gateway_domain_name" "main" {
  count           = var.domain_name != "" ? 1 : 0
  domain_name     = var.domain_name
  certificate_arn = var.certificate_arn

  endpoint_configuration {
    types = ["REGIONAL"]
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-api-domain"
    Environment = var.environment
    Project     = var.project_name
  }
}

resource "aws_api_gateway_base_path_mapping" "main" {
  count       = var.domain_name != "" ? 1 : 0
  api_id      = aws_api_gateway_rest_api.main.id
  stage_name  = aws_api_gateway_stage.main.stage_name
  domain_name = aws_api_gateway_domain_name.main[0].domain_name
}