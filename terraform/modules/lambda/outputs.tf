# Lambda Function ARNs
output "product_service_function_arn" {
  description = "ARN of the product service Lambda function"
  value       = aws_lambda_function.product_service.arn
}

output "cart_service_function_arn" {
  description = "ARN of the cart service Lambda function"
  value       = aws_lambda_function.cart_service.arn
}

output "frontend_function_arn" {
  description = "ARN of the frontend Lambda function"
  value       = aws_lambda_function.frontend.arn
}

# Lambda Function Names
output "product_service_function_name" {
  description = "Name of the product service Lambda function"
  value       = aws_lambda_function.product_service.function_name
}

output "cart_service_function_name" {
  description = "Name of the cart service Lambda function"
  value       = aws_lambda_function.cart_service.function_name
}

# Lambda Function Invoke ARNs (for API Gateway)
output "product_service_invoke_arn" {
  description = "Invoke ARN of the product service Lambda function"
  value       = aws_lambda_function.product_service.invoke_arn
}

output "cart_service_invoke_arn" {
  description = "Invoke ARN of the cart service Lambda function"
  value       = aws_lambda_function.cart_service.invoke_arn
}

output "frontend_invoke_arn" {
  description = "Invoke ARN of the frontend Lambda function"
  value       = aws_lambda_function.frontend.invoke_arn
}

# Lambda Alias ARNs
output "product_service_alias_arn" {
  description = "ARN of the product service Lambda alias"
  value       = aws_lambda_alias.product_service_live.arn
}

output "cart_service_alias_arn" {
  description = "ARN of the cart service Lambda alias"
  value       = aws_lambda_alias.cart_service_live.arn
}

# Lambda Alias Invoke ARNs (for API Gateway)
output "product_service_alias_invoke_arn" {
  description = "Invoke ARN of the product service Lambda alias"
  value       = aws_lambda_alias.product_service_live.invoke_arn
}

output "cart_service_alias_invoke_arn" {
  description = "Invoke ARN of the cart service Lambda alias"
  value       = aws_lambda_alias.cart_service_live.invoke_arn
}

# Dead Letter Queue
output "lambda_dlq_arn" {
  description = "ARN of the Lambda dead letter queue"
  value       = aws_sqs_queue.lambda_dlq.arn
}

output "lambda_dlq_url" {
  description = "URL of the Lambda dead letter queue"
  value       = aws_sqs_queue.lambda_dlq.url
}

# IAM Role
output "lambda_execution_role_arn" {
  description = "ARN of the Lambda execution role"
  value       = aws_iam_role.lambda_execution_role.arn
}

# CloudWatch Log Groups
output "product_service_log_group_name" {
  description = "Name of the product service CloudWatch log group"
  value       = aws_cloudwatch_log_group.product_service.name
}

output "cart_service_log_group_name" {
  description = "Name of the cart service CloudWatch log group"
  value       = aws_cloudwatch_log_group.cart_service.name
}
