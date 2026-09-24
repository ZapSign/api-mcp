output "github_actions_role_arn" {
  description = "Operator-bootstrap-owned role assumed by the production GitHub environment."
  value       = aws_iam_role.github_actions.arn
}

output "application_state_object_arn" {
  description = "Only state object the deployment role can access."
  value       = local.state_object_arn
}
