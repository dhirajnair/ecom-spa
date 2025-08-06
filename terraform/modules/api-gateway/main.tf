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

# VPC Link for connecting to existing ALB
resource "aws_api_gateway_vpc_link" "main" {
  name        = "${var.project_name}-${var.environment}-vpc-link"
  description = "VPC Link for API Gateway to ALB"
  target_arns = [var.alb_arn]

  tags = {
    Name        = "${var.project_name}-${var.environment}-vpc-link"
    Environment = var.environment
    Project     = var.project_name
  }
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

# Methods for Products (Public - No Auth Required)

# GET /api/products
resource "aws_api_gateway_method" "products_get" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.products.id
  http_method   = "GET"
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

# Integrations

# Products integration (to product service via ALB)
resource "aws_api_gateway_integration" "products_get" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.products.id
  http_method = aws_api_gateway_method.products_get.http_method

  type                    = "HTTP_PROXY"
  integration_http_method = "GET"
  uri                     = "http://${var.alb_dns_name}${var.product_service_url}"
  connection_type         = "VPC_LINK"
  connection_id           = aws_api_gateway_vpc_link.main.id

  request_parameters = {
    "integration.request.header.Host" = "'${var.alb_dns_name}'"
  }
}

resource "aws_api_gateway_integration" "products_proxy_any" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.products_proxy.id
  http_method = aws_api_gateway_method.products_proxy_any.http_method

  type                    = "HTTP_PROXY"
  integration_http_method = "ANY"
  uri                     = "http://${var.alb_dns_name}${var.product_service_url}/{proxy}"
  connection_type         = "VPC_LINK"
  connection_id           = aws_api_gateway_vpc_link.main.id

  request_parameters = {
    "integration.request.path.proxy"  = "method.request.path.proxy"
    "integration.request.header.Host" = "'${var.alb_dns_name}'"
  }
}

# Cart integrations (to cart service via ALB)
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

  type                    = "HTTP_PROXY"
  integration_http_method = "ANY"
  uri                     = "http://${var.alb_dns_name}${var.cart_service_url}"
  connection_type         = "VPC_LINK"
  connection_id           = aws_api_gateway_vpc_link.main.id

  request_parameters = {
    "integration.request.header.Host" = "'${var.alb_dns_name}'"
  }
}

resource "aws_api_gateway_integration" "cart_proxy_any" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.cart_proxy.id
  http_method = aws_api_gateway_method.cart_proxy_any.http_method

  type                    = "HTTP_PROXY"
  integration_http_method = "ANY"
  uri                     = "http://${var.alb_dns_name}${var.cart_service_url}/{proxy}"
  connection_type         = "VPC_LINK"
  connection_id           = aws_api_gateway_vpc_link.main.id

  request_parameters = {
    "integration.request.path.proxy"  = "method.request.path.proxy"
    "integration.request.header.Host" = "'${var.alb_dns_name}'"
  }
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

# Auth integration (to cart service for login endpoint)
resource "aws_api_gateway_integration" "auth_proxy_any" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.auth_proxy.id
  http_method = aws_api_gateway_method.auth_proxy_any.http_method

  type                    = "HTTP_PROXY"
  integration_http_method = "ANY"
  uri                     = "http://${var.alb_dns_name}/api/auth/{proxy}"
  connection_type         = "VPC_LINK"
  connection_id           = aws_api_gateway_vpc_link.main.id

  request_parameters = {
    "integration.request.path.proxy"  = "method.request.path.proxy"
    "integration.request.header.Host" = "'${var.alb_dns_name}'"
  }
}

# CORS Method Responses
resource "aws_api_gateway_method_response" "cart_options" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.cart.id
  http_method = aws_api_gateway_method.cart_options.http_method
  status_code = "200"

  response_headers = {
    "Access-Control-Allow-Headers" = true
    "Access-Control-Allow-Methods" = true
    "Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_method_response" "cart_proxy_options" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.cart_proxy.id
  http_method = aws_api_gateway_method.cart_proxy_options.http_method
  status_code = "200"

  response_headers = {
    "Access-Control-Allow-Headers" = true
    "Access-Control-Allow-Methods" = true
    "Access-Control-Allow-Origin"  = true
  }
}

# CORS Integration Responses
resource "aws_api_gateway_integration_response" "cart_options" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.cart.id
  http_method = aws_api_gateway_method.cart_options.http_method
  status_code = aws_api_gateway_method_response.cart_options.status_code

  response_headers = {
    "Access-Control-Allow-Headers" = "'${join(",", var.cors_allow_headers)}'"
    "Access-Control-Allow-Methods" = "'${join(",", var.cors_allow_methods)}'"
    "Access-Control-Allow-Origin"  = "'${join(",", var.cors_allow_origins)}'"
  }

  depends_on = [aws_api_gateway_integration.cart_options]
}

resource "aws_api_gateway_integration_response" "cart_proxy_options" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.cart_proxy.id
  http_method = aws_api_gateway_method.cart_proxy_options.http_method
  status_code = aws_api_gateway_method_response.cart_proxy_options.status_code

  response_headers = {
    "Access-Control-Allow-Headers" = "'${join(",", var.cors_allow_headers)}'"
    "Access-Control-Allow-Methods" = "'${join(",", var.cors_allow_methods)}'"
    "Access-Control-Allow-Origin"  = "'${join(",", var.cors_allow_origins)}'"
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
      aws_api_gateway_method.products_get.id,
      aws_api_gateway_method.products_proxy_any.id,
      aws_api_gateway_method.cart_any.id,
      aws_api_gateway_method.cart_proxy_any.id,
      aws_api_gateway_method.cart_options.id,
      aws_api_gateway_method.cart_proxy_options.id,
      aws_api_gateway_method.auth_proxy_any.id,
      aws_api_gateway_integration.products_get.id,
      aws_api_gateway_integration.products_proxy_any.id,
      aws_api_gateway_integration.cart_any.id,
      aws_api_gateway_integration.cart_proxy_any.id,
      aws_api_gateway_integration.cart_options.id,
      aws_api_gateway_integration.cart_proxy_options.id,
      aws_api_gateway_integration.auth_proxy_any.id,
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

  # Enable throttling
  throttle_settings {
    rate_limit  = var.throttle_rate_limit
    burst_limit = var.throttle_burst_limit
  }

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
