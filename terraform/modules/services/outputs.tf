output "product_service_arn" {
  description = "Product service ARN"
  value       = aws_ecs_service.product_service.id
}

output "cart_service_arn" {
  description = "Cart service ARN"
  value       = aws_ecs_service.cart_service.id
}

output "frontend_arn" {
  description = "Frontend service ARN"
  value       = aws_ecs_service.frontend.id
}

output "ecs_execution_role_arn" {
  description = "ECS execution role ARN"
  value       = aws_iam_role.ecs_execution_role.arn
}

output "ecs_task_role_arn" {
  description = "ECS task role ARN"
  value       = aws_iam_role.ecs_task_role.arn
}