# Data sources
data "aws_region" "current" {}

# IAM Role for ECS Task Execution
resource "aws_iam_role" "ecs_execution_role" {
  name = "${var.project_name}-${var.environment}-ecs-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_execution_role_policy" {
  role       = aws_iam_role.ecs_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# IAM Role for ECS Tasks
resource "aws_iam_role" "ecs_task_role" {
  name = "${var.project_name}-${var.environment}-ecs-task-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "product_service" {
  name              = "/ecs/${var.project_name}-${var.environment}-product-service"
  retention_in_days = 14

  tags = {
    Name = "${var.project_name}-${var.environment}-product-service-logs"
  }
}

resource "aws_cloudwatch_log_group" "cart_service" {
  name              = "/ecs/${var.project_name}-${var.environment}-cart-service"
  retention_in_days = 14

  tags = {
    Name = "${var.project_name}-${var.environment}-cart-service-logs"
  }
}

resource "aws_cloudwatch_log_group" "frontend" {
  name              = "/ecs/${var.project_name}-${var.environment}-frontend"
  retention_in_days = 14

  tags = {
    Name = "${var.project_name}-${var.environment}-frontend-logs"
  }
}

# Product Service Task Definition
resource "aws_ecs_task_definition" "product_service" {
  family                   = "${var.project_name}-${var.environment}-product-service"
  network_mode             = "awsvpc"
  requires_compatibility   = ["FARGATE"]
  cpu                      = 256
  memory                   = 512
  execution_role_arn       = aws_iam_role.ecs_execution_role.arn
  task_role_arn           = var.dynamodb_access_role_arn

  container_definitions = jsonencode([
    {
      name  = "product-service"
      image = var.product_service_image
      
      portMappings = [
        {
          containerPort = 8001
          protocol      = "tcp"
        }
      ]

      environment = [
        {
          name  = "AWS_REGION"
          value = var.aws_region
        },
        {
          name  = "PRODUCTS_TABLE_NAME"
          value = var.products_table_name
        },
        {
          name  = "PORT"
          value = "8001"
        },
        {
          name  = "JWT_SECRET_KEY"
          value = var.jwt_secret_key
        },
        {
          name  = "COGNITO_USER_POOL_ID"
          value = var.cognito_user_pool_id
        },
        {
          name  = "COGNITO_USER_POOL_REGION"
          value = var.aws_region
        },
        {
          name  = "COGNITO_WEB_CLIENT_ID"
          value = var.cognito_web_client_id
        },
        {
          name  = "COGNITO_API_CLIENT_ID"
          value = var.cognito_api_client_id
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.product_service.name
          awslogs-region        = data.aws_region.current.name
          awslogs-stream-prefix = "ecs"
        }
      }

      healthCheck = {
        command = ["CMD-SHELL", "curl -f http://localhost:8001/api/health || exit 1"]
        interval = 30
        timeout = 5
        retries = 3
        startPeriod = 60
      }
    }
  ])

  tags = {
    Name = "${var.project_name}-${var.environment}-product-service-task"
  }
}

# Cart Service Task Definition
resource "aws_ecs_task_definition" "cart_service" {
  family                   = "${var.project_name}-${var.environment}-cart-service"
  network_mode             = "awsvpc"
  requires_compatibility   = ["FARGATE"]
  cpu                      = 256
  memory                   = 512
  execution_role_arn       = aws_iam_role.ecs_execution_role.arn
  task_role_arn           = var.dynamodb_access_role_arn

  container_definitions = jsonencode([
    {
      name  = "cart-service"
      image = var.cart_service_image
      
      portMappings = [
        {
          containerPort = 8002
          protocol      = "tcp"
        }
      ]

      environment = [
        {
          name  = "AWS_REGION"
          value = var.aws_region
        },
        {
          name  = "CARTS_TABLE_NAME"
          value = var.carts_table_name
        },
        {
          name  = "PORT"
          value = "8002"
        },
        {
          name  = "JWT_SECRET_KEY"
          value = var.jwt_secret_key
        },
        {
          name  = "PRODUCT_SERVICE_URL"
          value = "http://localhost:8001/api"  # This will be updated with service discovery
        },
        {
          name  = "COGNITO_USER_POOL_ID"
          value = var.cognito_user_pool_id
        },
        {
          name  = "COGNITO_USER_POOL_REGION"
          value = var.aws_region
        },
        {
          name  = "COGNITO_WEB_CLIENT_ID"
          value = var.cognito_web_client_id
        },
        {
          name  = "COGNITO_API_CLIENT_ID"
          value = var.cognito_api_client_id
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.cart_service.name
          awslogs-region        = data.aws_region.current.name
          awslogs-stream-prefix = "ecs"
        }
      }

      healthCheck = {
        command = ["CMD-SHELL", "curl -f http://localhost:8002/api/health || exit 1"]
        interval = 30
        timeout = 5
        retries = 3
        startPeriod = 60
      }
    }
  ])

  tags = {
    Name = "${var.project_name}-${var.environment}-cart-service-task"
  }
}

# Frontend Task Definition
resource "aws_ecs_task_definition" "frontend" {
  family                   = "${var.project_name}-${var.environment}-frontend"
  network_mode             = "awsvpc"
  requires_compatibility   = ["FARGATE"]
  cpu                      = 256
  memory                   = 512
  execution_role_arn       = aws_iam_role.ecs_execution_role.arn
  task_role_arn           = aws_iam_role.ecs_task_role.arn

  container_definitions = jsonencode([
    {
      name  = "frontend"
      image = var.frontend_image
      
      portMappings = [
        {
          containerPort = 80
          protocol      = "tcp"
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.frontend.name
          awslogs-region        = data.aws_region.current.name
          awslogs-stream-prefix = "ecs"
        }
      }

      healthCheck = {
        command = ["CMD-SHELL", "wget --no-verbose --tries=1 --spider http://localhost/ || exit 1"]
        interval = 30
        timeout = 5
        retries = 3
        startPeriod = 30
      }
    }
  ])

  tags = {
    Name = "${var.project_name}-${var.environment}-frontend-task"
  }
}

# Product Service ECS Service
resource "aws_ecs_service" "product_service" {
  name            = "${var.project_name}-${var.environment}-product-service"
  cluster         = var.ecs_cluster_id
  task_definition = aws_ecs_task_definition.product_service.arn
  desired_count   = 2
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = var.private_subnet_ids
    security_groups  = [var.ecs_security_group_id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = var.alb_target_group_arns.product_service
    container_name   = "product-service"
    container_port   = 8001
  }

  depends_on = [var.alb_listener_arns]

  tags = {
    Name = "${var.project_name}-${var.environment}-product-service"
  }
}

# Cart Service ECS Service
resource "aws_ecs_service" "cart_service" {
  name            = "${var.project_name}-${var.environment}-cart-service"
  cluster         = var.ecs_cluster_id
  task_definition = aws_ecs_task_definition.cart_service.arn
  desired_count   = 2
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = var.private_subnet_ids
    security_groups  = [var.ecs_security_group_id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = var.alb_target_group_arns.cart_service
    container_name   = "cart-service"
    container_port   = 8002
  }

  depends_on = [var.alb_listener_arns, aws_ecs_service.product_service]

  tags = {
    Name = "${var.project_name}-${var.environment}-cart-service"
  }
}

# Frontend ECS Service
resource "aws_ecs_service" "frontend" {
  name            = "${var.project_name}-${var.environment}-frontend"
  cluster         = var.ecs_cluster_id
  task_definition = aws_ecs_task_definition.frontend.arn
  desired_count   = 2
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = var.private_subnet_ids
    security_groups  = [var.ecs_security_group_id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = var.alb_target_group_arns.frontend
    container_name   = "frontend"
    container_port   = 80
  }

  depends_on = [var.alb_listener_arns]

  tags = {
    Name = "${var.project_name}-${var.environment}-frontend"
  }
}