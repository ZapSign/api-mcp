data "aws_caller_identity" "current" {}

data "aws_partition" "current" {}

locals {
  account_id          = data.aws_caller_identity.current.account_id
  partition           = data.aws_partition.current.partition
  ecr_repository_arn  = "arn:${local.partition}:ecr:${var.aws_region}:${local.account_id}:repository/${var.app_name}"
  ecs_cluster_arn     = "arn:${local.partition}:ecs:${var.aws_region}:${local.account_id}:cluster/${var.app_name}"
  ecs_service_arn     = "arn:${local.partition}:ecs:${var.aws_region}:${local.account_id}:service/${var.app_name}/${var.app_name}"
  task_definition_arn = "arn:${local.partition}:ecs:${var.aws_region}:${local.account_id}:task-definition/${var.app_name}:*"
  task_role_arns = [
    "arn:${local.partition}:iam::${local.account_id}:role/${var.app_name}-task",
    "arn:${local.partition}:iam::${local.account_id}:role/${var.app_name}-task-execution",
  ]
  state_bucket_arn = "arn:${local.partition}:s3:::${var.tf_state_bucket}"
  state_object_arn = "${local.state_bucket_arn}/${var.tf_state_key}"
  state_lock_arn   = "arn:${local.partition}:dynamodb:${var.tf_state_region}:${local.account_id}:table/${var.tf_state_lock_table}"
  app_table_arn    = "arn:${local.partition}:dynamodb:${var.aws_region}:${local.account_id}:table/${var.dynamo_table_name}"
  log_group_arn    = "arn:${local.partition}:logs:${var.aws_region}:${local.account_id}:log-group:/api-mcp/prod"
  log_group_arns = [
    local.log_group_arn,
    "${local.log_group_arn}:*",
  ]
  secret_arns = [
    "arn:${local.partition}:secretsmanager:${var.aws_region}:${local.account_id}:secret:${var.secret_prefix}/COOKIE_ENCRYPTION_KEY-*",
    "arn:${local.partition}:secretsmanager:${var.aws_region}:${local.account_id}:secret:${var.secret_prefix}/ID_TOKEN_ENCRYPTION_KEY-*",
    "arn:${local.partition}:secretsmanager:${var.aws_region}:${local.account_id}:secret:${var.secret_prefix}/OPENAI_APPS_CHALLENGE_TOKEN-*",
  ]
  load_balancer_arns = [
    "arn:${local.partition}:elasticloadbalancing:${var.aws_region}:${local.account_id}:loadbalancer/app/${var.app_name}/*",
    "arn:${local.partition}:elasticloadbalancing:${var.aws_region}:${local.account_id}:listener/app/${var.app_name}/*/*",
    "arn:${local.partition}:elasticloadbalancing:${var.aws_region}:${local.account_id}:targetgroup/${var.app_name}/*",
  ]
}

data "aws_iam_policy_document" "github_actions_assume" {
  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [var.github_oidc_provider_arn]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:sub"
      values   = ["repo:ZapSign/api-mcp:environment:production"]
    }
  }
}

resource "aws_iam_role" "github_actions" {
  name               = "api-mcp-github-actions"
  assume_role_policy = data.aws_iam_policy_document.github_actions_assume.json
}

data "aws_iam_policy_document" "state_ecr" {
  statement {
    sid       = "StateBucketMetadata"
    actions   = ["s3:GetBucketLocation", "s3:GetBucketVersioning", "s3:ListBucket"]
    resources = [local.state_bucket_arn]
  }

  statement {
    sid       = "StateObject"
    actions   = ["s3:DeleteObject", "s3:GetObject", "s3:PutObject"]
    resources = [local.state_object_arn]
  }

  statement {
    sid       = "StateLockTable"
    actions   = ["dynamodb:DescribeTable"]
    resources = [local.state_lock_arn]
  }

  statement {
    sid       = "StateLockItems"
    actions   = ["dynamodb:DeleteItem", "dynamodb:GetItem", "dynamodb:PutItem"]
    resources = [local.state_lock_arn]

    condition {
      test     = "ForAnyValue:StringEquals"
      variable = "dynamodb:LeadingKeys"
      values = [
        "${var.tf_state_bucket}/${var.tf_state_key}",
        "${var.tf_state_bucket}/${var.tf_state_key}-md5",
      ]
    }
  }

  statement {
    sid       = "EcrAuthorization"
    actions   = ["ecr:GetAuthorizationToken"]
    resources = ["*"]
  }

  statement {
    sid = "EcrRepository"
    actions = [
      "ecr:BatchCheckLayerAvailability",
      "ecr:BatchGetImage",
      "ecr:CompleteLayerUpload",
      "ecr:CreateRepository",
      "ecr:DeleteLifecyclePolicy",
      "ecr:DeleteRepository",
      "ecr:DescribeImages",
      "ecr:DescribeRepositories",
      "ecr:GetDownloadUrlForLayer",
      "ecr:GetLifecyclePolicy",
      "ecr:InitiateLayerUpload",
      "ecr:ListImages",
      "ecr:ListTagsForResource",
      "ecr:PutImage",
      "ecr:PutImageScanningConfiguration",
      "ecr:PutImageTagMutability",
      "ecr:PutLifecyclePolicy",
      "ecr:TagResource",
      "ecr:UntagResource",
      "ecr:UploadLayerPart",
    ]
    resources = [local.ecr_repository_arn]
  }

  statement {
    sid       = "CertificateRead"
    actions   = ["acm:DescribeCertificate"]
    resources = [var.acm_certificate_arn]
  }
}

resource "aws_iam_role_policy" "state_ecr" {
  name   = "api-mcp-state-ecr"
  role   = aws_iam_role.github_actions.id
  policy = data.aws_iam_policy_document.state_ecr.json
}

data "aws_iam_policy_document" "compute" {
  statement {
    sid = "EcsReadAndCreate"
    actions = [
      "ecs:CreateCluster",
      "ecs:CreateService",
      "ecs:DescribeTaskDefinition",
      "ecs:DescribeCapacityProviders",
      "ecs:ListAccountSettings",
      "ecs:ListTaskDefinitions",
      "ecs:RegisterTaskDefinition",
    ]
    resources = ["*"]
  }

  statement {
    sid = "EcsClusterAndService"
    actions = [
      "ecs:DeleteCluster",
      "ecs:DeleteService",
      "ecs:DescribeClusters",
      "ecs:DescribeServices",
      "ecs:ListTagsForResource",
      "ecs:PutClusterCapacityProviders",
      "ecs:TagResource",
      "ecs:UntagResource",
      "ecs:UpdateCluster",
      "ecs:UpdateClusterSettings",
      "ecs:UpdateService",
    ]
    resources = [local.ecs_cluster_arn, local.ecs_service_arn]
  }

  statement {
    sid = "EcsTaskDefinitions"
    actions = [
      "ecs:DeregisterTaskDefinition",
      "ecs:DescribeTaskDefinition",
      "ecs:ListTagsForResource",
      "ecs:TagResource",
      "ecs:UntagResource",
    ]
    resources = [local.task_definition_arn]
  }

  statement {
    sid = "Elbv2ReadAndCreate"
    actions = [
      "elasticloadbalancing:CreateListener",
      "elasticloadbalancing:CreateLoadBalancer",
      "elasticloadbalancing:CreateTargetGroup",
      "elasticloadbalancing:DescribeListeners",
      "elasticloadbalancing:DescribeListenerAttributes",
      "elasticloadbalancing:DescribeListenerCertificates",
      "elasticloadbalancing:DescribeLoadBalancerAttributes",
      "elasticloadbalancing:DescribeLoadBalancers",
      "elasticloadbalancing:DescribeSSLPolicies",
      "elasticloadbalancing:DescribeTags",
      "elasticloadbalancing:DescribeTargetGroupAttributes",
      "elasticloadbalancing:DescribeTargetGroups",
    ]
    resources = ["*"]
  }

  statement {
    sid = "Elbv2Manage"
    actions = [
      "elasticloadbalancing:AddTags",
      "elasticloadbalancing:DeleteListener",
      "elasticloadbalancing:DeleteLoadBalancer",
      "elasticloadbalancing:DeleteTargetGroup",
      "elasticloadbalancing:ModifyListener",
      "elasticloadbalancing:ModifyLoadBalancerAttributes",
      "elasticloadbalancing:ModifyTargetGroup",
      "elasticloadbalancing:ModifyTargetGroupAttributes",
      "elasticloadbalancing:RemoveTags",
      "elasticloadbalancing:SetSecurityGroups",
      "elasticloadbalancing:SetSubnets",
    ]
    resources = local.load_balancer_arns
  }

  statement {
    sid = "Ec2Read"
    actions = [
      "ec2:DescribeAccountAttributes",
      "ec2:DescribeAvailabilityZones",
      "ec2:DescribeSecurityGroups",
      "ec2:DescribeSecurityGroupRules",
      "ec2:DescribeSubnets",
      "ec2:DescribeVpcAttribute",
      "ec2:DescribeVpcs",
    ]
    resources = ["*"]
  }

  statement {
    sid       = "SecurityGroupCreate"
    actions   = ["ec2:CreateSecurityGroup"]
    resources = ["*"]
  }

  statement {
    sid = "SecurityGroupManage"
    actions = [
      "ec2:AuthorizeSecurityGroupEgress",
      "ec2:AuthorizeSecurityGroupIngress",
      "ec2:CreateTags",
      "ec2:DeleteSecurityGroup",
      "ec2:DeleteTags",
      "ec2:RevokeSecurityGroupEgress",
      "ec2:RevokeSecurityGroupIngress",
    ]
    resources = ["arn:${local.partition}:ec2:${var.aws_region}:${local.account_id}:security-group/*"]
  }
}

resource "aws_iam_role_policy" "compute" {
  name   = "api-mcp-compute-network"
  role   = aws_iam_role.github_actions.id
  policy = data.aws_iam_policy_document.compute.json
}

data "aws_iam_policy_document" "data_observability" {
  statement {
    sid = "AppDynamoTable"
    actions = [
      "dynamodb:CreateTable",
      "dynamodb:DeleteTable",
      "dynamodb:DescribeContinuousBackups",
      "dynamodb:DescribeTable",
      "dynamodb:DescribeTimeToLive",
      "dynamodb:ListTagsOfResource",
      "dynamodb:TagResource",
      "dynamodb:UntagResource",
      "dynamodb:UpdateContinuousBackups",
      "dynamodb:UpdateTable",
      "dynamodb:UpdateTimeToLive",
    ]
    resources = [local.app_table_arn]
  }

  statement {
    sid       = "LogGroupDescribe"
    actions   = ["logs:DescribeLogGroups"]
    resources = ["*"]
  }

  statement {
    sid = "AppLogGroup"
    actions = [
      "logs:CreateLogGroup",
      "logs:DeleteLogGroup",
      "logs:ListTagsForResource",
      "logs:PutRetentionPolicy",
      "logs:TagResource",
      "logs:UntagResource",
    ]
    resources = local.log_group_arns
  }

  statement {
    sid = "SecretMetadata"
    actions = [
      "secretsmanager:DescribeSecret",
      "secretsmanager:GetResourcePolicy",
    ]
    resources = local.secret_arns
  }
}

resource "aws_iam_role_policy" "data_observability" {
  name   = "api-mcp-data-observability"
  role   = aws_iam_role.github_actions.id
  policy = data.aws_iam_policy_document.data_observability.json
}

data "aws_iam_policy_document" "identity_dns" {
  statement {
    sid = "CreateBoundedTaskRoles"
    actions = [
      "iam:CreateRole",
      "iam:PutRolePermissionsBoundary",
    ]
    resources = local.task_role_arns

    condition {
      test     = "StringEquals"
      variable = "iam:PermissionsBoundary"
      values   = [var.task_role_permissions_boundary_arn]
    }
  }

  statement {
    sid = "ManageBoundedTaskRoles"
    actions = [
      "iam:AttachRolePolicy",
      "iam:DeleteRole",
      "iam:DeleteRolePolicy",
      "iam:DetachRolePolicy",
      "iam:GetRole",
      "iam:GetRolePolicy",
      "iam:ListAttachedRolePolicies",
      "iam:ListRolePolicies",
      "iam:ListRoleTags",
      "iam:PutRolePolicy",
      "iam:TagRole",
      "iam:UntagRole",
      "iam:UpdateAssumeRolePolicy",
    ]
    resources = local.task_role_arns
  }

  statement {
    sid       = "PassTaskRoles"
    actions   = ["iam:PassRole"]
    resources = local.task_role_arns

    condition {
      test     = "StringEquals"
      variable = "iam:PassedToService"
      values   = ["ecs-tasks.amazonaws.com"]
    }
  }

  statement {
    sid       = "ServiceLinkedRoles"
    actions   = ["iam:CreateServiceLinkedRole"]
    resources = ["*"]

    condition {
      test     = "StringEquals"
      variable = "iam:AWSServiceName"
      values   = ["ecs.amazonaws.com", "elasticloadbalancing.amazonaws.com"]
    }
  }

  statement {
    sid = "Route53ChildZones"
    actions = [
      "route53:ChangeResourceRecordSets",
      "route53:ChangeTagsForResource",
      "route53:CreateHostedZone",
      "route53:DeleteHostedZone",
      "route53:GetChange",
      "route53:GetDNSSEC",
      "route53:GetHostedZone",
      "route53:GetHostedZoneCount",
      "route53:ListHostedZones",
      "route53:ListHostedZonesByName",
      "route53:ListResourceRecordSets",
      "route53:ListQueryLoggingConfigs",
      "route53:ListTagsForResource",
    ]
    resources = ["*"]
  }
}

resource "aws_iam_role_policy" "identity_dns" {
  name   = "api-mcp-identity-dns"
  role   = aws_iam_role.github_actions.id
  policy = data.aws_iam_policy_document.identity_dns.json
}
