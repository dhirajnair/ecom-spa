# DynamoDB Tables for E-commerce Application

# Products Table
resource "aws_dynamodb_table" "products" {
  name           = "${var.project_name}-${var.environment}-products"
  billing_mode   = var.billing_mode
  hash_key       = "id"

  # Pay-per-request mode doesn't require capacity settings
  dynamic "attribute" {
    for_each = [
      {
        name = "id"
        type = "S"
      },
      {
        name = "category"
        type = "S"
      }
    ]
    content {
      name = attribute.value.name
      type = attribute.value.type
    }
  }

  # Global Secondary Index for category filtering
  global_secondary_index {
    name     = "category-index"
    hash_key = "category"
    projection_type = "ALL"
  }

  # Enable point-in-time recovery
  point_in_time_recovery {
    enabled = var.enable_point_in_time_recovery
  }

  # Server-side encryption
  server_side_encryption {
    enabled = true
  }

  # Deletion protection for production
  deletion_protection_enabled = var.deletion_protection

  tags = {
    Name        = "${var.project_name}-${var.environment}-products"
    Environment = var.environment
    Service     = "product-service"
  }
}

# Carts Table
resource "aws_dynamodb_table" "carts" {
  name           = "${var.project_name}-${var.environment}-carts"
  billing_mode   = var.billing_mode
  hash_key       = "user_id"

  attribute {
    name = "user_id"
    type = "S"
  }

  # Enable point-in-time recovery
  point_in_time_recovery {
    enabled = var.enable_point_in_time_recovery
  }

  # Server-side encryption
  server_side_encryption {
    enabled = true
  }

  # Deletion protection for production
  deletion_protection_enabled = var.deletion_protection

  tags = {
    Name        = "${var.project_name}-${var.environment}-carts"
    Environment = var.environment
    Service     = "cart-service"
  }
}

# IAM Role for ECS tasks to access DynamoDB
resource "aws_iam_role" "dynamodb_access_role" {
  name = "${var.project_name}-${var.environment}-dynamodb-access"

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

  tags = {
    Name        = "${var.project_name}-${var.environment}-dynamodb-access"
    Environment = var.environment
  }
}

# IAM Policy for DynamoDB access
resource "aws_iam_policy" "dynamodb_access_policy" {
  name        = "${var.project_name}-${var.environment}-dynamodb-policy"
  description = "IAM policy for DynamoDB access"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:BatchGetItem",
          "dynamodb:BatchWriteItem",
          "dynamodb:DeleteItem",
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:Query",
          "dynamodb:Scan",
          "dynamodb:UpdateItem"
        ]
        Resource = [
          aws_dynamodb_table.products.arn,
          aws_dynamodb_table.carts.arn,
          "${aws_dynamodb_table.products.arn}/index/*",
          "${aws_dynamodb_table.carts.arn}/index/*"
        ]
      }
    ]
  })

  tags = {
    Name        = "${var.project_name}-${var.environment}-dynamodb-policy"
    Environment = var.environment
  }
}

# Attach policy to role
resource "aws_iam_role_policy_attachment" "dynamodb_access_attachment" {
  role       = aws_iam_role.dynamodb_access_role.name
  policy_arn = aws_iam_policy.dynamodb_access_policy.arn
}
