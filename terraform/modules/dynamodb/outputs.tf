output "products_table_name" {
  description = "Name of the products DynamoDB table"
  value       = aws_dynamodb_table.products.name
}

output "products_table_arn" {
  description = "ARN of the products DynamoDB table"
  value       = aws_dynamodb_table.products.arn
}

output "carts_table_name" {
  description = "Name of the carts DynamoDB table"
  value       = aws_dynamodb_table.carts.name
}

output "carts_table_arn" {
  description = "ARN of the carts DynamoDB table"
  value       = aws_dynamodb_table.carts.arn
}

output "dynamodb_access_role_arn" {
  description = "ARN of the DynamoDB access role"
  value       = aws_iam_role.dynamodb_access_role.arn
}

output "table_names" {
  description = "Map of all table names"
  value = {
    products = aws_dynamodb_table.products.name
    carts    = aws_dynamodb_table.carts.name
  }
}

output "table_arns" {
  description = "Map of all table ARNs"
  value = {
    products = aws_dynamodb_table.products.arn
    carts    = aws_dynamodb_table.carts.arn
  }
}
