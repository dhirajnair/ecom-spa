output "product_service_repository_url" {
  description = "Product Service ECR repository URL"
  value       = aws_ecr_repository.product_service.repository_url
}

output "cart_service_repository_url" {
  description = "Cart Service ECR repository URL"
  value       = aws_ecr_repository.cart_service.repository_url
}

output "frontend_repository_url" {
  description = "Frontend ECR repository URL"
  value       = aws_ecr_repository.frontend.repository_url
}

output "repositories" {
  description = "All ECR repositories"
  value = {
    product_service = {
      name = aws_ecr_repository.product_service.name
      url  = aws_ecr_repository.product_service.repository_url
      arn  = aws_ecr_repository.product_service.arn
    }
    cart_service = {
      name = aws_ecr_repository.cart_service.name
      url  = aws_ecr_repository.cart_service.repository_url
      arn  = aws_ecr_repository.cart_service.arn
    }
    frontend = {
      name = aws_ecr_repository.frontend.name
      url  = aws_ecr_repository.frontend.repository_url
      arn  = aws_ecr_repository.frontend.arn
    }
  }
}