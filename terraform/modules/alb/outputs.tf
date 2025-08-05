output "alb_arn" {
  description = "ALB ARN"
  value       = aws_lb.main.arn
}

output "alb_dns_name" {
  description = "ALB DNS name"
  value       = aws_lb.main.dns_name
}

output "alb_zone_id" {
  description = "ALB zone ID"
  value       = aws_lb.main.zone_id
}

output "target_group_arns" {
  description = "Target group ARNs"
  value = {
    product_service = aws_lb_target_group.product_service.arn
    cart_service    = aws_lb_target_group.cart_service.arn
    frontend        = aws_lb_target_group.frontend.arn
  }
}

output "listener_arns" {
  description = "Listener ARNs"
  value = {
    http = aws_lb_listener.http.arn
  }
}