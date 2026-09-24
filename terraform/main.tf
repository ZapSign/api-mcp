locals {
  name = "api-mcp-${var.env_name}"

  common_tags = merge(
    {
      Name        = local.name
      Environment = var.env_name
    },
    var.tags,
  )

  effective_cert_arn = trimspace(var.acm_certificate_arn)
}

# ---------------------------------------------------------------------------
# Input validation
# ---------------------------------------------------------------------------

resource "terraform_data" "input_preconditions" {
  lifecycle {
    precondition {
      condition     = local.effective_cert_arn != ""
      error_message = "acm_certificate_arn must reference a pre-validated certificate in every deployment mode."
    }
  }
}

# ---------------------------------------------------------------------------
# Data sources
# ---------------------------------------------------------------------------

data "aws_vpc" "selected" {
  id      = var.vpc_id != "" ? var.vpc_id : null
  default = var.vpc_id == "" ? true : null
}

data "aws_subnets" "public" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.selected.id]
  }
  # Fall back to default-VPC subnets when caller provides none.
  dynamic "filter" {
    for_each = length(var.public_subnet_ids) == 0 ? [1] : []
    content {
      name   = "default-for-az"
      values = ["true"]
    }
  }
}

locals {
  subnet_ids = length(var.public_subnet_ids) > 0 ? var.public_subnet_ids : data.aws_subnets.public.ids
  subnet_azs = toset([
    for subnet in data.aws_subnet.selected : subnet.availability_zone
  ])
}

data "aws_subnet" "selected" {
  for_each = toset(local.subnet_ids)
  id       = each.value
}

# ---------------------------------------------------------------------------
# ECR repository
# ---------------------------------------------------------------------------

resource "aws_ecr_repository" "this" {
  name                 = local.name
  image_tag_mutability = "IMMUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = local.common_tags
}

resource "aws_ecr_lifecycle_policy" "this" {
  repository = aws_ecr_repository.this.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep the last 20 immutable release images."
        selection = {
          tagStatus     = "tagged"
          tagPrefixList = ["sha-"]
          countType     = "imageCountMoreThan"
          countNumber   = 20
        }
        action = { type = "expire" }
      },
      {
        rulePriority = 2
        description  = "Expire untagged images after 7 days."
        selection = {
          tagStatus   = "untagged"
          countType   = "sinceImagePushed"
          countUnit   = "days"
          countNumber = 7
        }
        action = { type = "expire" }
      },
    ]
  })
}

# ---------------------------------------------------------------------------
# DynamoDB KV table
# ---------------------------------------------------------------------------
# Schema matches src/store/dynamo-kv-store.ts:
#   PK  (S) — partition key: "NAMESPACE#sha256(key)"
#   value (S) — serialized string value
#   expiresAt (N) — Unix epoch seconds; app code checks this on every read.
#
# IMPORTANT: DynamoDB TTL is cleanup-only. AWS may take up to 48 h to delete
# expired items; GetItem can still return them during that window. The app
# MUST compare expiresAt against the current clock on every read (see
# DynamoKvStore.get() in src/store/dynamo-kv-store.ts). TTL is NOT an auth
# enforcement boundary.
# ---------------------------------------------------------------------------

resource "aws_dynamodb_table" "kv" {
  name         = var.dynamo_table_name
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "PK"

  attribute {
    name = "PK"
    type = "S"
  }

  ttl {
    attribute_name = "expiresAt"
    enabled        = true
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = local.common_tags
}

# ---------------------------------------------------------------------------
# CloudWatch log group
# ---------------------------------------------------------------------------

resource "aws_cloudwatch_log_group" "this" {
  name              = "/api-mcp/${var.env_name}"
  retention_in_days = var.log_retention_days
  tags              = local.common_tags
}

# ---------------------------------------------------------------------------
# IAM — task execution role (ECS agent: ECR pull + Secrets Manager)
# ---------------------------------------------------------------------------

data "aws_iam_policy_document" "ecs_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "task_execution" {
  name                 = "${local.name}-task-execution"
  assume_role_policy   = data.aws_iam_policy_document.ecs_assume.json
  permissions_boundary = var.task_role_permissions_boundary_arn
  tags                 = local.common_tags

  lifecycle {
    postcondition {
      condition     = self.permissions_boundary == var.task_role_permissions_boundary_arn
      error_message = "The ECS task execution role must retain the operator-managed permissions boundary."
    }
  }
}

resource "aws_iam_role_policy_attachment" "task_execution_managed" {
  role       = aws_iam_role.task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

data "aws_iam_policy_document" "task_execution_secrets" {
  statement {
    sid    = "SecretsManagerReadAppSecrets"
    effect = "Allow"
    actions = [
      "secretsmanager:GetSecretValue",
    ]
    resources = [
      data.aws_secretsmanager_secret.cookie_key.arn,
      data.aws_secretsmanager_secret.id_token_key.arn,
      data.aws_secretsmanager_secret.openai_challenge.arn,
    ]
  }
}

resource "aws_iam_role_policy" "task_execution_secrets" {
  name   = "${local.name}-task-execution-secrets"
  role   = aws_iam_role.task_execution.id
  policy = data.aws_iam_policy_document.task_execution_secrets.json
}

# ---------------------------------------------------------------------------
# IAM — task role (runtime: DynamoDB)
# ---------------------------------------------------------------------------

resource "aws_iam_role" "task" {
  name                 = "${local.name}-task"
  assume_role_policy   = data.aws_iam_policy_document.ecs_assume.json
  permissions_boundary = var.task_role_permissions_boundary_arn
  tags                 = local.common_tags

  lifecycle {
    postcondition {
      condition     = self.permissions_boundary == var.task_role_permissions_boundary_arn
      error_message = "The ECS task role must retain the operator-managed permissions boundary."
    }
  }
}

data "aws_iam_policy_document" "task" {
  statement {
    sid    = "DynamoKvTable"
    effect = "Allow"
    actions = [
      "dynamodb:GetItem",
      "dynamodb:PutItem",
      "dynamodb:DeleteItem",
    ]
    resources = [aws_dynamodb_table.kv.arn]
  }

}

resource "aws_iam_role_policy" "task" {
  name   = "${local.name}-task"
  role   = aws_iam_role.task.id
  policy = data.aws_iam_policy_document.task.json
}

# ---------------------------------------------------------------------------
# Security groups
# ---------------------------------------------------------------------------

resource "aws_security_group" "alb" {
  name        = "${local.name}-alb"
  description = "Allow 80/443 inbound from internet to ALB."
  vpc_id      = data.aws_vpc.selected.id

  ingress {
    description = "HTTP (redirect to HTTPS)"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, { Name = "${local.name}-alb" })
}

resource "aws_security_group" "ecs" {
  name        = "${local.name}-ecs"
  description = "Allow container port inbound from ALB only."
  vpc_id      = data.aws_vpc.selected.id

  ingress {
    description     = "Container port from ALB"
    from_port       = var.container_port
    to_port         = var.container_port
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    description = "Allow all outbound (DynamoDB, Secrets Manager, ECR, ZapSign API)"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, { Name = "${local.name}-ecs" })
}

# ---------------------------------------------------------------------------
# ALB
# ---------------------------------------------------------------------------

resource "aws_lb" "this" {
  name               = local.name
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = local.subnet_ids

  # Raised for streamable HTTP (MCP over HTTP streaming / SSE).
  # Plan requirement: ≥ 300 s.
  idle_timeout = var.alb_idle_timeout

  drop_invalid_header_fields = true

  lifecycle {
    precondition {
      condition     = length(local.subnet_ids) >= 2
      error_message = "At least two public subnets are required for the ALB and ECS service."
    }

    precondition {
      condition     = length(local.subnet_azs) >= 2
      error_message = "The selected public subnets must span at least two distinct availability zones."
    }
  }

  tags = local.common_tags
}

resource "aws_lb_target_group" "this" {
  name        = local.name
  port        = var.container_port
  protocol    = "HTTP"
  vpc_id      = data.aws_vpc.selected.id
  target_type = "ip" # required for Fargate awsvpc networking

  health_check {
    path                = "/healthz"
    healthy_threshold   = 2
    unhealthy_threshold = 3
    interval            = 30
    timeout             = 10
    matcher             = "200"
  }

  deregistration_delay = 30

  tags = local.common_tags
}

# HTTP → HTTPS redirect.
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.this.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type = "redirect"
    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }
}

resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.this.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn   = local.effective_cert_arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.this.arn
  }

  depends_on = [terraform_data.input_preconditions]
}

# ---------------------------------------------------------------------------
# Secrets Manager — operator-created secrets (never managed by Terraform)
#
# Create these before first apply:
#   aws secretsmanager create-secret \
#     --name /api-mcp/prod/COOKIE_ENCRYPTION_KEY --secret-string '<value>'
#   aws secretsmanager create-secret \
#     --name /api-mcp/prod/ID_TOKEN_ENCRYPTION_KEY --secret-string '<value>'
#   aws secretsmanager create-secret \
#     --name /api-mcp/prod/OPENAI_APPS_CHALLENGE_TOKEN --secret-string '<value>'
# ---------------------------------------------------------------------------

data "aws_secretsmanager_secret" "cookie_key" {
  name = "${var.secret_prefix}/COOKIE_ENCRYPTION_KEY"
}

data "aws_secretsmanager_secret" "id_token_key" {
  name = "${var.secret_prefix}/ID_TOKEN_ENCRYPTION_KEY"
}

data "aws_secretsmanager_secret" "openai_challenge" {
  name = "${var.secret_prefix}/OPENAI_APPS_CHALLENGE_TOKEN"
}

# ---------------------------------------------------------------------------
# ECS cluster
# ---------------------------------------------------------------------------

resource "aws_ecs_cluster" "this" {
  name = local.name

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = local.common_tags
}

resource "aws_ecs_cluster_capacity_providers" "this" {
  cluster_name       = aws_ecs_cluster.this.name
  capacity_providers = ["FARGATE", "FARGATE_SPOT"]

  default_capacity_provider_strategy {
    capacity_provider = "FARGATE"
    weight            = 1
  }
}

# ---------------------------------------------------------------------------
# ECS task definition
# ---------------------------------------------------------------------------

resource "aws_ecs_task_definition" "this" {
  family                   = local.name
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.task_cpu
  memory                   = var.task_memory
  execution_role_arn       = aws_iam_role.task_execution.arn
  task_role_arn            = aws_iam_role.task.arn

  container_definitions = jsonencode([
    {
      name      = "api-mcp"
      image     = "${aws_ecr_repository.this.repository_url}@${var.image_digest}"
      essential = true

      portMappings = [
        {
          containerPort = var.container_port
          protocol      = "tcp"
        }
      ]

      environment = [
        { name = "PORT", value = tostring(var.container_port) },
        { name = "ENVIRONMENT", value = var.env_name },
        { name = "ZAPSIGN_API_URL", value = "https://api.zapsign.com.br" },
        { name = "GA4_MEASUREMENT_ID", value = "G-GNJFSQFD50" },
        { name = "CLARITY_PROJECT_ID", value = "xq06022ata" },
        { name = "DYNAMO_TABLE_NAME", value = var.dynamo_table_name },
        { name = "AWS_REGION", value = var.aws_region },
        { name = "VERSION", value = var.image_tag },
      ]

      # Secrets injected at container startup by the ECS agent.
      # Values come from Secrets Manager; they never appear in Terraform
      # state or workflow logs.
      secrets = [
        {
          name      = "COOKIE_ENCRYPTION_KEY"
          valueFrom = data.aws_secretsmanager_secret.cookie_key.arn
        },
        {
          name      = "ID_TOKEN_ENCRYPTION_KEY"
          valueFrom = data.aws_secretsmanager_secret.id_token_key.arn
        },
        {
          name      = "OPENAI_APPS_CHALLENGE_TOKEN"
          valueFrom = data.aws_secretsmanager_secret.openai_challenge.arn
        },
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.this.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "ecs"
        }
      }

      healthCheck = {
        command     = ["CMD-SHELL", "node -e \"require('http').get('http://localhost:${var.container_port}/healthz', r => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))\""]
        interval    = 30
        timeout     = 10
        retries     = 3
        startPeriod = 60
      }
    }
  ])

  tags = local.common_tags
}

# ---------------------------------------------------------------------------
# ECS service — Fargate, min 2 tasks, spread across AZs
# ---------------------------------------------------------------------------

resource "aws_ecs_service" "this" {
  name            = local.name
  cluster         = aws_ecs_cluster.this.id
  task_definition = aws_ecs_task_definition.this.arn
  desired_count   = var.desired_count
  launch_type     = "FARGATE"

  deployment_minimum_healthy_percent = 100
  deployment_maximum_percent         = 200

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  network_configuration {
    subnets          = local.subnet_ids
    security_groups  = [aws_security_group.ecs.id]
    assign_public_ip = true # required for public subnets without NAT GW
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.this.arn
    container_name   = "api-mcp"
    container_port   = var.container_port
  }

  depends_on = [
    aws_lb_listener.https,
    aws_iam_role_policy.task,
    aws_iam_role_policy.task_execution_secrets,
  ]

  tags = local.common_tags
}

# ---------------------------------------------------------------------------
# Route53 — isolated child zones and ALB apex aliases
#
# Parent zones remain in Cloudflare. Todo 7 delegates only these child zones
# by adding their output NS records to the existing parent zones.
# ---------------------------------------------------------------------------

resource "aws_route53_zone" "primary_child" {
  count = var.manage_route53 ? 1 : 0

  name = var.primary_domain
  tags = local.common_tags
}

resource "aws_route53_zone" "secondary_child" {
  count = var.manage_route53 ? 1 : 0

  name = var.secondary_domain
  tags = local.common_tags
}

resource "aws_route53_record" "primary" {
  count = var.manage_route53 ? 1 : 0

  zone_id = aws_route53_zone.primary_child[0].zone_id
  name    = var.primary_domain
  type    = "A"

  alias {
    name                   = aws_lb.this.dns_name
    zone_id                = aws_lb.this.zone_id
    evaluate_target_health = true
  }
}

resource "aws_route53_record" "secondary" {
  count = var.manage_route53 ? 1 : 0

  zone_id = aws_route53_zone.secondary_child[0].zone_id
  name    = var.secondary_domain
  type    = "A"

  alias {
    name                   = aws_lb.this.dns_name
    zone_id                = aws_lb.this.zone_id
    evaluate_target_health = true
  }
}
