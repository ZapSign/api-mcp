output "ecr_repository_url" {
  description = "ECR repository URL. Use as the base for image pushes: <url>:<tag>"
  value       = aws_ecr_repository.this.repository_url
}

output "ecr_repository_name" {
  description = "ECR repository name."
  value       = aws_ecr_repository.this.name
}

output "alb_dns_name" {
  description = "ALB DNS name. Use for pre-cutover smoke tests before updating Route53."
  value       = aws_lb.this.dns_name
}

output "alb_zone_id" {
  description = "ALB hosted zone ID (for Route53 alias records)."
  value       = aws_lb.this.zone_id
}

output "ecs_cluster_name" {
  description = "ECS cluster name."
  value       = aws_ecs_cluster.this.name
}

output "ecs_service_name" {
  description = "ECS service name."
  value       = aws_ecs_service.this.name
}

output "dynamo_table_name" {
  description = "DynamoDB KV table name."
  value       = aws_dynamodb_table.kv.name
}

output "dynamo_table_arn" {
  description = "DynamoDB KV table ARN."
  value       = aws_dynamodb_table.kv.arn
}

output "cloudwatch_log_group" {
  description = "CloudWatch log group name for container stdout (telemetry events land here)."
  value       = aws_cloudwatch_log_group.this.name
}

output "task_role_arn" {
  description = "IAM task role ARN (runtime: DynamoDB)."
  value       = aws_iam_role.task.arn
}

output "task_execution_role_arn" {
  description = "IAM task execution role ARN (ECS agent: ECR pull + Secrets Manager)."
  value       = aws_iam_role.task_execution.arn
}

output "acm_certificate_arn" {
  description = "ACM certificate ARN covering both custom domains."
  value       = local.effective_cert_arn
}

output "route53_primary_fqdn" {
  description = "Route53 A record FQDN for the primary domain, or null when Route53 management is disabled."
  value       = try(aws_route53_record.primary[0].fqdn, null)
}

output "route53_secondary_fqdn" {
  description = "Route53 A record FQDN for the secondary domain, or null when Route53 management is disabled."
  value       = try(aws_route53_record.secondary[0].fqdn, null)
}

output "route53_primary_child_name_servers" {
  description = "NS records to delegate only mcp.zapsign.com.br from its existing Cloudflare parent."
  value       = try(aws_route53_zone.primary_child[0].name_servers, [])
}

output "route53_secondary_child_name_servers" {
  description = "NS records to delegate only mcp.zapsign.co from its existing Cloudflare parent."
  value       = try(aws_route53_zone.secondary_child[0].name_servers, [])
}

output "smoke_healthz_url" {
  description = "TLS-valid pre-cutover smoke URL. Resolve primary_domain to an ALB IP while preserving this hostname for SNI."
  value       = "https://${var.primary_domain}/healthz"
}

output "smoke_version_url" {
  description = "TLS-valid pre-cutover version URL. Resolve primary_domain to an ALB IP while preserving this hostname for SNI."
  value       = "https://${var.primary_domain}/version"
}
